/**
 * Shelby SDK integration layer.
 *
 * In production, swap the placeholder functions for real
 * @shelby-protocol/sdk calls once the package is available.
 *
 * Upload flow:
 *  1. uploadToShelby(file)      → { objectId, proofHash }
 *  2. Pass objectId + proofHash to the Move mint_meme entry function.
 */

export interface ShelbyUploadResult {
  objectId: string;
  proofHash: string;
  url: string;
}

const SHELBY_API_KEY = import.meta.env.VITE_SHELBY_API_KEY || "";
const SHELBY_API_URL =
  import.meta.env.VITE_SHELBY_API_URL || "https://api.shelby.network";

/**
 * Upload a file (image) to Shelby decentralised storage.
 * Returns the object ID and its SHA-256 proof hash.
 */
export async function uploadToShelby(file: File): Promise<ShelbyUploadResult> {
  if (!SHELBY_API_KEY) {
    return mockUpload(file);
  }

  const formData = new FormData();
  formData.append("file", file);

  const resp = await fetch(`${SHELBY_API_URL}/v1/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${SHELBY_API_KEY}` },
    body: formData,
  });

  if (!resp.ok) {
    throw new Error(`Shelby upload failed: ${resp.statusText}`);
  }

  const data = await resp.json();
  return {
    objectId: data.object_id,
    proofHash: data.proof_hash,
    url: data.url,
  };
}

/** Compute a deterministic SHA-256 hex string for provenance. */
export async function computeProofHash(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function mockUpload(file: File): Promise<ShelbyUploadResult> {
  await new Promise((r) => setTimeout(r, 800));
  const hash = await computeProofHash(file);
  const objectId = `shelby_${hash.slice(0, 16)}`;
  const url = URL.createObjectURL(file);
  return { objectId, proofHash: hash, url };
}
