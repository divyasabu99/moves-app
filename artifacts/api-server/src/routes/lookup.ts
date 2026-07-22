import { Router } from "express";

const router = Router();

const OPENAI_BASE = process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"] ?? "https://api.openai.com/v1";
const OPENAI_KEY  = process.env["AI_INTEGRATIONS_OPENAI_API_KEY"]  ?? "";

/**
 * POST /api/lookup-place
 * Body: { name: string }
 * Returns place details inferred by AI for a given NYC spot name.
 */
router.post("/lookup-place", async (req, res) => {
  const { name } = req.body as { name?: string };
  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  try {
    const response = await fetch(`${OPENAI_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-5.6-luna",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are an expert on NYC restaurants, bars, cafes, and cultural spots.
Given a place name, return what you know about it as JSON.

Respond ONLY with valid JSON matching this shape exactly:
{
  "found": true | false,
  "category": "restaurant" | "bar" | "cafe" | "museum" | "park" | "shop" | "activity",
  "neighborhood": "<NYC neighborhood name, e.g. West Village>",
  "priceLevel": 1 | 2 | 3 | 4,
  "address": "<full street address or empty string>",
  "vibes": ["<vibe1>", "<vibe2>", "<vibe3>"]
}

Rules:
- Set found=false if you don't recognise this as a specific real NYC place.
- priceLevel: 1=$, 2=$$, 3=$$$, 4=$$$$
- vibes: up to 3 short descriptors like "cozy", "date night", "trendy", "loud", "outdoor", "late night", "brunch spot"
- If found=false still try to fill category/neighborhood/priceLevel with reasonable guesses based on the name.`,
          },
          {
            role: "user",
            content: `Place name: "${name.trim()}"`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI ${response.status}: ${err.slice(0, 200)}`);
    }

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content);

    res.json({
      found: parsed.found ?? false,
      category: parsed.category ?? "restaurant",
      neighborhood: parsed.neighborhood ?? "",
      priceLevel: parsed.priceLevel ?? 2,
      address: parsed.address ?? "",
      vibes: Array.isArray(parsed.vibes) ? parsed.vibes.slice(0, 3) : [],
    });
  } catch (err: any) {
    res.status(502).json({ error: err?.message ?? "Lookup failed" });
  }
});

export default router;
