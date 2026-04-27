import app from "./app";
import { logger } from "./lib/logger";
import { warmupBlobCache } from "./routes/shelby.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Pre-cache all on-chain meme blobs in the background so first-load images
  // are served instantly from memory without waiting for SDK downloads.
  warmupBlobCache().catch((e) => logger.warn({ err: e }, "blob cache warmup failed"));
});
