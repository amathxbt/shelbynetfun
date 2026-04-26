/**
 * Shelby storage integration.
 *
 * Uploads go through the API server (which holds the private key server-side).
 * The API server calls @shelby-protocol/sdk and returns the blob name + proof hash.
 */

export interface ShelbyUploadResult {
  objectId: string;
  proofHash: string;
  url: string;
}

const API_BASE = import.meta.env.VITE_API_URL || "";

/** Compute SHA-256 hex of a file for local proof hash (matches server-side). */
export async function computeProofHash(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Upload a file to Shelby decentralised storage via the API server.
 * Falls back to a mock if the API server is unreachable.
 */
export async function uploadToShelby(file: File): Promise<ShelbyUploadResult> {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const resp = await fetch(`${API_BASE}/api/shelby/upload`, {
      method: "POST",
      body: formData,
    });

    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}));
      const detail = (body as { detail?: string }).detail || resp.statusText;
      throw new Error(`Shelby upload failed (${resp.status}): ${detail}`);
    }

    const data = await resp.json() as {
      object_id: string;
      proof_hash: string;
      url: string;
      blob_name: string;
    };

    return {
      objectId: data.object_id,
      proofHash: data.proof_hash,
      url: data.url,
    };
  } catch (err) {
    console.error("uploadToShelby error:", err);
    throw err;
  }
}
