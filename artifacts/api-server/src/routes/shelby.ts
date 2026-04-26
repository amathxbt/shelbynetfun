import { Router, type IRouter } from "express";
import multer from "multer";
import { Account, Ed25519PrivateKey, Network } from "@aptos-labs/ts-sdk";
import { ShelbyNodeClient } from "@shelby-protocol/sdk/node";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const SHELBY_API_KEY = process.env.SHELBY_API_KEY || "AG-MR5SFEFY8BSVMEMVG9YETVQBZJJ2QYEPF";
const SHELBY_PRIVATE_KEY = process.env.SHELBY_DEPLOYER_PRIVATE_KEY || "";
const SHELBY_ACCOUNT_ADDRESS = process.env.SHELBY_ACCOUNT_ADDRESS || "";

function getShelbyClient() {
  if (!SHELBY_PRIVATE_KEY) throw new Error("SHELBY_DEPLOYER_PRIVATE_KEY not set");

  const client = new ShelbyNodeClient({
    network: Network.SHELBYNET,
    apiKey: SHELBY_API_KEY,
  });

  const signer = Account.fromPrivateKey({
    privateKey: new Ed25519PrivateKey(SHELBY_PRIVATE_KEY),
  });

  return { client, signer };
}

async function sha256Hex(data: Buffer): Promise<string> {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(data).digest("hex");
}

router.post("/shelby/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file provided" });
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
      ? `https://explorer.shelbynet.shelby.xyz/blobs/${SHELBY_ACCOUNT_ADDRESS}/${blobName}`
      : `shelby://${blobName}`;

    res.json({
      object_id: objectId,
      proof_hash: proofHash,
      url: storageUrl,
      blob_name: blobName,
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

export default router;
