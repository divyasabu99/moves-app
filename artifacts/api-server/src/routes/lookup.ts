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
  "vibes": ["<vibe1>", "<vibe2>", "<vibe3>"],
  "vibeDescription": "<single punchy sentence capturing the feel>",
  "cuisine": "<primary cuisine or drink style, e.g. Italian, Japanese, Cocktails, Wine Bar — restaurants/bars/cafes only, empty string otherwise>",
  "tags": ["<tag1>", "<tag2>", "<tag3>"],
  "website": "<official website URL, e.g. https://example.com, or empty string if unknown>"
}

Rules:
- Set found=false if you don't recognise this as a specific real NYC place.
- priceLevel: 1=$, 2=$$, 3=$$$, 4=$$$$
- vibes: up to 3 short mood descriptors like "cozy", "date night", "trendy", "loud", "outdoor", "late night", "brunch spot"
- vibeDescription: a single punchy sentence, e.g. "rustic Italian tavern with candlelit charm" or "loud frat-friendly dive bar" or "sleek upscale cocktail lounge" — always include this, never leave it empty
- cuisine: the primary cuisine or concept for restaurants/cafes/bars (e.g. "Italian", "Ramen", "Cocktail Bar", "Wine Bar", "Brunch", "Korean BBQ"). Leave empty string for non-food venues.
- tags: 3-6 short searchable descriptors capturing what makes this place special, e.g. ["rooftop", "outdoor seating", "late night", "cash only", "brunch", "tasting menu", "live music", "dive bar", "speakeasy", "happy hour", "BYOB", "omakase", "pet-friendly", "views"]. Pick tags that are genuinely useful for discovery. Never overlap with vibes exactly.
- If found=false still try to fill all fields with reasonable guesses based on the name.`,
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
      vibeDescription: parsed.vibeDescription ?? "",
      cuisine: typeof parsed.cuisine === "string" ? parsed.cuisine : "",
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 8) : [],
      website: typeof parsed.website === "string" ? parsed.website : "",
    });
  } catch (err: any) {
    res.status(502).json({ error: err?.message ?? "Lookup failed" });
  }
});


/**
 * POST /api/places/autocomplete
 * Body: { query: string, lat?: number, lng?: number }
 * Returns up to 5 real NYC place suggestions matching the partial name.
 */
router.post("/places/autocomplete", async (req, res) => {
  const { query, lat, lng } = req.body as { query?: string; lat?: number; lng?: number };
  if (!query || typeof query !== "string" || query.trim().length < 2) {
    res.json({ suggestions: [] });
    return;
  }

  // Build a location hint from coordinates when available
  let locationHint = "in or around NYC";
  if (lat && lng) {
    locationHint = `within 10 miles of coordinates ${lat.toFixed(4)}, ${lng.toFixed(4)} (include all boroughs, nearby NJ, and surrounding areas)`;
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
            content: `You are a local places expert for the NYC metro area. Given a partial place name, return up to 5 real places that match within the search area.
Respond ONLY with JSON: { "suggestions": [ { "name", "category", "neighborhood", "priceLevel", "address", "vibeDescription", "vibes" }, ... ] }
- category: "restaurant"|"bar"|"cafe"|"museum"|"park"|"shop"|"activity"
- priceLevel: 1-4
- vibes: array of up to 3 short strings
- vibeDescription: a single punchy sentence capturing the feel, e.g. "rustic Italian tavern with candlelit charm" or "loud frat-friendly dive bar" or "sleek upscale cocktail lounge"
- Search area covers all NYC boroughs plus surrounding areas within 10 miles (Jersey City, Hoboken, Astoria, Long Island City, etc.)
- Only include places you are confident are real — never invent places
- If fewer than 5 match, return fewer`,
          },
          {
            role: "user",
            content: `Partial name: "${query.trim()}" ${locationHint}`,
          },
        ],
      }),
    });

    if (!response.ok) throw new Error(`OpenAI ${response.status}`);
    const data = await response.json() as any;
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
    // Ensure each suggestion has vibeDescription
    const suggestions = Array.isArray(parsed.suggestions)
      ? parsed.suggestions.map((s: any) => ({ ...s, vibeDescription: s.vibeDescription ?? "" }))
      : [];
    res.json({ suggestions });
  } catch (err: any) {
    res.json({ suggestions: [] }); // fail silently — dropdown just stays empty
  }
});

export default router;
