import { Router, type IRouter } from "express";
import multer from "multer";
import { Account, AccountAddress, Ed25519PrivateKey, Network } from "@aptos-labs/ts-sdk";
import { ShelbyNodeClient, getShelbyBlobExplorerUrl } from "@shelby-protocol/sdk/node";
import { requireSession } from "../middlewares/requireSession.js";
import { walletRateLimit } from "../middlewares/rateLimit.js";
import { generateUploadToken, recordUpload } from "../uploadTokens.js";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const SHELBY_API_KEY = process.env.SHELBY_API_KEY || "";
const SHELBY_PRIVATE_KEY = process.env.SHELBY_DEPLOYER_PRIVATE_KEY || "";
const SHELBY_ACCOUNT_ADDRESS =
  process.env.SHELBY_ACCOUNT_ADDRESS ||
  process.env.VITE_MODULE_ADDR ||
  "0xa57871e9081ed8f5a92c445c3941d16e3ad05a1f6549b3a6bfba32ec390f28fe";

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
]);

/**
 * In-memory cache: blobName → { buffer, mimeType }
 * Populated on upload so images are immediately serveable without needing to re-fetch from Shelbynet.
 */
interface CachedBlob { buffer: Buffer; mimeType: string }
const blobCache = new Map<string, CachedBlob>();

function getShelbyClient() {
  if (!SHELBY_PRIVATE_KEY) throw new Error("SHELBY_DEPLOYER_PRIVATE_KEY not set");
  if (!SHELBY_API_KEY) throw new Error("SHELBY_API_KEY not set");

  const client = new ShelbyNodeClient({
    network: Network.SHELBYNET,
    apiKey: SHELBY_API_KEY,
  });

  const signer = Account.fromPrivateKey({
    privateKey: new Ed25519PrivateKey(SHELBY_PRIVATE_KEY),
  });

  return { client, signer };
}

/**
 * Download a blob from Shelbynet via the SDK (used as fallback when not in local cache).
 * Creates a read-only client (API key not required for downloads on public blobs).
 */
async function downloadFromShelby(blobName: string): Promise<Buffer | null> {
  try {
    const client = new ShelbyNodeClient({
      network: Network.SHELBYNET,
      apiKey: SHELBY_API_KEY || "public",
    });
    const blob = await client.download({
      account: AccountAddress.fromString(SHELBY_ACCOUNT_ADDRESS),
      blobName,
    });
    const chunks: Uint8Array[] = [];
    const reader = blob.readable.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    const total = chunks.reduce((n, c) => n + c.length, 0);
    const merged = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.length; }
    return Buffer.from(merged);
  } catch (err) {
    console.error("[shelby] downloadFromShelby failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

async function sha256Hex(data: Buffer): Promise<string> {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(data).digest("hex");
}

const uploadLimit = walletRateLimit({
  id: "shelby-upload",
  maxRequests: 10,
  windowMs: 60 * 1000,
});

router.post(
  "/shelby/upload",
  requireSession,
  uploadLimit,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file provided" });
        return;
      }

      const mimeType = req.file.mimetype;
      if (!ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) {
        res.status(415).json({
          error: "Unsupported file type. Only image uploads are allowed.",
        });
        return;
      }

      const fileBuffer = req.file.buffer;
      const blobName = `meme_${Date.now()}_${req.file.originalname.replace(/[^a-z0-9._-]/gi, "_")}`;
      const proofHash = await sha256Hex(fileBuffer);

      const { client, signer } = getShelbyClient();

      const ONE_YEAR_MICROS = 365 * 24 * 60 * 60 * 1_000_000;

      await client.upload({
        blobData: fileBuffer,
        signer,
        blobName,
        expirationMicros: Date.now() * 1000 + ONE_YEAR_MICROS,
      });

      const objectId = blobName;
      const storageUrl = SHELBY_ACCOUNT_ADDRESS
        ? getShelbyBlobExplorerUrl("shelbynet", SHELBY_ACCOUNT_ADDRESS, blobName)
        : `shelby://${blobName}`;

      // Cache the uploaded image buffer so the blob proxy can serve it immediately
      // without needing to re-fetch from Shelbynet.
      blobCache.set(blobName, { buffer: fileBuffer, mimeType });

      const walletAddress = req.walletAddress ?? "";
      const uploadToken = generateUploadToken();
      recordUpload(uploadToken, walletAddress, objectId, proofHash);

      res.json({
        object_id: objectId,
        proof_hash: proofHash,
        url: storageUrl,
        blob_name: blobName,
        upload_token: uploadToken,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Shelby upload error:", msg);

      if (msg.includes("EBLOB_WRITE_CHUNKSET_ALREADY_EXISTS")) {
        res.status(409).json({ error: "Blob already exists", detail: msg });
        return;
      }
      if (msg.includes("INSUFFICIENT_BALANCE") || msg.includes("E_INSUFFICIENT_FUNDS")) {
        res.status(402).json({ error: "Insufficient ShelbyUSD or APT balance", detail: msg });
        return;
      }
      if (msg.includes("429")) {
        res.status(429).json({ error: "Rate limit exceeded", detail: msg });
        return;
      }

      res.status(500).json({ error: "Upload failed", detail: msg });
    }
  }
);

/**
 * GET /api/shelby/blob/:blobName
 * Public proxy — serves meme images.
 * 1. Checks the in-memory upload cache (populated on upload, fastest path).
 * 2. Falls back to fetching from Shelbynet via the SDK for older/pre-cached blobs.
 */
router.get("/shelby/blob/:blobName", async (req, res) => {
  try {
    const { blobName } = req.params;
    if (!blobName || !/^[\w.\-]+$/.test(blobName)) {
      res.status(400).json({ error: "Invalid blob name" });
      return;
    }

    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    // 1. Serve from local upload cache (instant, works for newly uploaded blobs)
    const cached = blobCache.get(blobName);
    if (cached) {
      res.setHeader("Content-Type", cached.mimeType);
      res.send(cached.buffer);
      return;
    }

    // 2. Fetch from Shelbynet via SDK (for blobs uploaded before this server started)
    const buf = await downloadFromShelby(blobName);
    if (buf) {
      // Detect mime type from magic bytes
      let mimeType = "image/png";
      if (buf[0] === 0xff && buf[1] === 0xd8) mimeType = "image/jpeg";
      else if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) mimeType = "image/gif";
      else if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) mimeType = "image/webp";
      blobCache.set(blobName, { buffer: buf, mimeType }); // warm cache for next request
      res.setHeader("Content-Type", mimeType);
      res.send(buf);
      return;
    }

    res.status(404).json({ error: "Blob not found" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("shelby/blob proxy error:", msg);
    res.status(502).json({ error: "Failed to fetch blob" });
  }
});

router.get("/shelby/blobs", async (_req, res) => {
  try {
    const { client } = getShelbyClient();
    const { AccountAddress } = await import("@aptos-labs/ts-sdk");
    const blobs = await client.coordination.getAccountBlobs({
      account: AccountAddress.fromString(SHELBY_ACCOUNT_ADDRESS),
    });
    res.json({ blobs });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to list blobs", detail: msg });
  }
});

/**
 * Warmup: download all on-chain meme blobs in the background at server start.
 * This populates blobCache so the first user request finds images in cache.
 */
export async function warmupBlobCache(): Promise<void> {
  const NODE_URL = process.env.APTOS_NODE_URL || "https://api.shelbynet.shelby.xyz/v1";
  const MODULE = SHELBY_ACCOUNT_ADDRESS;

  try {
    // 1. Get total meme count
    const countRes = await fetch(`${NODE_URL}/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        function: `${MODULE}::meme_dao_royale::get_meme_count`,
        type_arguments: [],
        arguments: [MODULE],
      }),
    });
    if (!countRes.ok) return;
    const [countStr] = (await countRes.json()) as [string];
    const total = parseInt(countStr, 10);
    if (!total || isNaN(total)) return;
    console.log(`[shelby warmup] Found ${total} memes, pre-caching blobs…`);

    // 2. Fetch each meme's image_url and download if not already cached
    const hexToStr = (h: string) => {
      if (!h || h === "0x") return "";
      try { return Buffer.from(h.slice(2), "hex").toString("utf8"); } catch { return ""; }
    };
    const safeBlob = /^[\w][\w.\-]*$/;
    const downloads: Promise<void>[] = [];

    for (let i = 0; i < total; i++) {
      const memeRes = await fetch(`${NODE_URL}/view`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          function: `${MODULE}::meme_dao_royale::get_meme_by_index`,
          type_arguments: [],
          arguments: [MODULE, i.toString()],
        }),
      }).catch(() => null);
      if (!memeRes?.ok) continue;
      const memeData = (await memeRes.json()) as string[];
      const imageUrlHex = memeData[3];
      if (!imageUrlHex) continue;
      const blobName = hexToStr(imageUrlHex);
      if (!blobName || !safeBlob.test(blobName) || blobName.includes("..")) continue;
      if (blobCache.has(blobName)) continue;

      downloads.push(
        downloadFromShelby(blobName).then((buf) => {
          if (!buf) return;
          let mimeType = "image/png";
          if (buf[0] === 0xff && buf[1] === 0xd8) mimeType = "image/jpeg";
          else if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) mimeType = "image/gif";
          else if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) mimeType = "image/webp";
          blobCache.set(blobName, { buffer: buf, mimeType });
          console.log(`[shelby warmup] Cached blob: ${blobName}`);
        })
      );
    }

    await Promise.allSettled(downloads);
    console.log(`[shelby warmup] Pre-cache complete`);
  } catch (err) {
    console.error("[shelby warmup] Error:", err instanceof Error ? err.message : err);
  }
}

export default router;
