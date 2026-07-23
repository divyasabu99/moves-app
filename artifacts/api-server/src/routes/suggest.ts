import { Router } from "express";

const router = Router();

const OPENAI_BASE = process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"] ?? "https://api.openai.com/v1";
const OPENAI_KEY  = process.env["AI_INTEGRATIONS_OPENAI_API_KEY"]  ?? "";

/**
 * POST /api/suggest-places
 * Body: { vibe, neighborhoods, budgetLevel, categories, excludeNames }
 * Returns AI-suggested real NYC places that supplement the user's saved library.
 */
router.post("/suggest-places", async (req, res) => {
  const { vibe, neighborhoods, budgetLevel, categories, excludeNames, preferences } = req.body as {
    vibe?: string;
    neighborhoods?: string[];
    budgetLevel?: number[];
    categories?: string[];
    excludeNames?: string[];
    preferences?: { music?: string[]; events?: string[]; food?: string[] };
  };

  if (!vibe || !categories?.length) {
    res.status(400).json({ error: "vibe and categories are required" });
    return;
  }

  const neighborhoodStr =
    neighborhoods && neighborhoods.length > 0
      ? neighborhoods.join(", ")
      : "anywhere in NYC (Manhattan, Brooklyn, Queens — pick what fits the vibe)";

  const budgetStr =
    budgetLevel && budgetLevel.length > 0
      ? budgetLevel.map((l) => "$".repeat(l)).join(" or ")
      : "$$ or $$$";

  const excludeStr =
    excludeNames && excludeNames.length > 0
      ? `Do NOT suggest any of these (user already saved them): ${excludeNames.slice(0, 40).join(", ")}.`
      : "";

  const categoriesStr = [...new Set(categories)].join(", ");

  const prefStr = preferences && (
    (preferences.music?.length || preferences.events?.length || preferences.food?.length)
  ) ? `User taste profile: ${[
      preferences.music?.length ? `music — ${preferences.music.join(', ')}` : '',
      preferences.events?.length ? `events — ${preferences.events.join(', ')}` : '',
      preferences.food?.length ? `food — ${preferences.food.join(', ')}` : '',
    ].filter(Boolean).join('; ')}. Lean toward suggestions that match this profile.` : '';

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
            content: `You are a NYC local expert. Suggest real, well-known places for an outing.
Return ONLY valid JSON matching this shape:
{
  "places": [
    {
      "name": "exact place name",
      "category": "restaurant" | "bar" | "cafe" | "museum" | "activity" | "park" | "shop",
      "neighborhood": "NYC neighborhood name",
      "priceLevel": 1 | 2 | 3 | 4,
      "address": "full street address",
      "vibeDescription": "one punchy sentence capturing the feel"
    }
  ]
}
Rules:
- Only suggest places you are highly confident are real and currently open in NYC.
- Suggest 2-3 places per requested category, covering the categories listed.
- Match the vibe, neighborhood, and budget constraints.
- priceLevel: 1=$, 2=$$, 3=$$$, 4=$$$$
- vibeDescription: e.g. "romantic rooftop bar with lower Manhattan views" or "no-frills ramen spot beloved by locals"
${excludeStr}
${prefStr}`,
          },
          {
            role: "user",
            content: `Vibe: "${vibe}"
Neighborhoods: ${neighborhoodStr}
Budget: ${budgetStr}
Categories needed: ${categoriesStr}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI ${response.status}: ${err.slice(0, 200)}`);
    }

    const data = (await response.json()) as any;
    const content = data.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content);

    const places = Array.isArray(parsed.places)
      ? parsed.places
          .filter((p: any) => p?.name && p?.category && p?.neighborhood)
          .map((p: any) => ({
            id: "ai_" + Math.random().toString(36).slice(2, 10),
            name: String(p.name),
            category: p.category,
            neighborhood: String(p.neighborhood),
            priceLevel: Number(p.priceLevel) || 2,
            source: "ai_suggested",
            vibes: [],
            vibeDescription: p.vibeDescription ?? "",
            address: p.address ?? "",
            createdAt: new Date().toISOString(),
          }))
      : [];

    res.json({ places });
  } catch (err: any) {
    res.status(502).json({ error: err?.message ?? "Suggestion failed" });
  }
});

export default router;
