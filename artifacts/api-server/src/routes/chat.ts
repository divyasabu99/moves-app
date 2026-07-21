import { Router } from "express";

const router = Router();

router.post("/chat/parse", async (req, res) => {
  const { message } = req.body as { message?: string };
  if (!message?.trim()) {
    res.status(400).json({ error: "message is required" });
    return;
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const systemPrompt = `You are a plan parser for a NYC outing planner app called MOVES. Today is ${today}.

Extract structured information from the user's message and return ONLY a JSON object with these fields:
- vibe: one of ["Dinner & Drinks", "Date Night", "Museum Day", "Brunch Run", "Night Out", "Foodie Crawl", "Cultural Day", "Low-Key Vibes"]
- date: ISO date string (YYYY-MM-DD). Infer from today if user says "tonight", "tomorrow", a weekday, etc.
- startTime: time string like "7:00 PM". Default "7:00 PM".
- endTime: time string like "11:00 PM". Must be 1–5 hours after startTime. Default 3 hours after startTime.
- partySize: integer 1–12. Default 2.
- budgetLevel: ARRAY of integers from [1,2,3,4]. 1=cheap, 2=moderate, 3=upscale, 4=splurge. Can contain multiple values if the user is flexible. Default [2].
- neighborhood: ARRAY of NYC neighborhood name strings. Empty array if not specified.

Rules:
- "tonight" → today's date. "tomorrow" → tomorrow. A weekday → next upcoming occurrence.
- "brunch"/"lunch" → vibe "Brunch Run", startTime ~"11:00 AM".
- "museum"/"art" → "Museum Day". "bars"/"drinks" only → "Night Out". "dinner and drinks" → "Dinner & Drinks". "date" → "Date Night".
- "cheap"/"budget" → [1]. "moderate"/"midrange" → [2]. "around $50" → [2]. "fancy"/"upscale" → [3]. "splurge"/"high-end" → [4].
- "moderate to upscale"/"flexible on budget" → [2,3]. "any budget" → [1,2,3,4].
- Neighborhoods: extract any NYC neighborhoods mentioned. If user says "West Village and SoHo" → ["West Village","SoHo"].
- If no neighborhood mentioned → [].

Return ONLY valid JSON. No markdown, no explanation.`;

  try {
    const apiRes = await fetch(
      `${process.env.AI_INTEGRATIONS_OPENAI_BASE_URL}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.AI_INTEGRATIONS_OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-5.6-luna",
          max_completion_tokens: 512,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message.trim() },
          ],
        }),
      }
    );

    if (!apiRes.ok) {
      console.error("OpenAI error:", await apiRes.text());
      res.status(502).json({ error: "AI parsing failed" });
      return;
    }

    const data = (await apiRes.json()) as {
      choices: { message: { content: string } }[];
    };
    const raw = data.choices[0]?.message?.content?.trim() ?? "{}";

    let parsed: Record<string, unknown>;
    try {
      const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
      parsed = JSON.parse(clean);
    } catch {
      res.status(422).json({ error: "Could not parse AI response", raw });
      return;
    }

    const vibes = [
      "Dinner & Drinks","Date Night","Museum Day","Brunch Run",
      "Night Out","Foodie Crawl","Cultural Day","Low-Key Vibes",
    ];

    const vibe = vibes.includes(parsed.vibe as string) ? (parsed.vibe as string) : "Dinner & Drinks";
    const partySize = typeof parsed.partySize === "number" && parsed.partySize >= 1 && parsed.partySize <= 12
      ? parsed.partySize : 2;

    // budgetLevel — normalise to array
    let budgetLevel: number[];
    if (Array.isArray(parsed.budgetLevel)) {
      budgetLevel = (parsed.budgetLevel as number[]).filter(n => [1,2,3,4].includes(n));
    } else if (typeof parsed.budgetLevel === "number" && [1,2,3,4].includes(parsed.budgetLevel)) {
      budgetLevel = [parsed.budgetLevel];
    } else {
      budgetLevel = [2];
    }
    if (budgetLevel.length === 0) budgetLevel = [2];

    // neighborhood — normalise to array
    let neighborhood: string[];
    if (Array.isArray(parsed.neighborhood)) {
      neighborhood = (parsed.neighborhood as string[]).filter(s => typeof s === "string" && s.trim());
    } else if (typeof parsed.neighborhood === "string" && parsed.neighborhood && parsed.neighborhood !== "Any") {
      neighborhood = [parsed.neighborhood];
    } else {
      neighborhood = [];
    }

    let date: string;
    const rawDate = parsed.date as string;
    date = rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
      ? rawDate
      : new Date().toISOString().split("T")[0];

    res.json({
      vibe,
      date,
      startTime: parsed.startTime ?? "7:00 PM",
      endTime: parsed.endTime ?? "10:00 PM",
      partySize,
      budgetLevel,
      neighborhood,
    });
  } catch (err) {
    console.error("Chat parse error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

export default router;
