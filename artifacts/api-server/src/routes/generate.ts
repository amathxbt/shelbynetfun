import { Router, type IRouter } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || "placeholder",
});

/**
 * POST /api/generate-image
 * Body: { prompt: string }
 * Returns: { b64_json: string }  — base64 PNG image
 */
router.post("/generate-image", async (req, res) => {
  try {
    const { prompt } = req.body as { prompt: string };
    if (!prompt?.trim()) {
      res.status(400).json({ error: "prompt is required" });
      return;
    }

    const memePrompt = `Meme image, internet humor style: ${prompt.trim()}. Vibrant, high contrast, funny, suitable for a meme. No text overlays.`;

    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt: memePrompt,
      n: 1,
      size: "1024x1024",
    });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) throw new Error("No image returned from API");

    res.json({ b64_json: b64 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("generate-image error:", msg);
    res.status(500).json({ error: msg });
  }
});

export default router;
