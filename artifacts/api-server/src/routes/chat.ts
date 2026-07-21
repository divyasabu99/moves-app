import { Router } from "express";

const router = Router();

// Parse a natural-language plan request into structured PlanInput
router.post("/chat/parse", async (req, res) => {
  const { message } = req.body as { message?: string };
  if (!message?.trim()) {
    res.status(400).json({ error: "message is required" });
    return;
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const systemPrompt = `You are a plan parser for a NYC outing planner app called MOVES. Today is ${today}.

Extract structured information from the user's message and return ONLY a JSON object with these fields:
- vibe: one of ["Dinner & Drinks", "Date Night", "Museum Day", "Brunch Run", "Night Out", "Foodie Crawl", "Cultural Day", "Low-Key Vibes"]
- date: ISO date string (YYYY-MM-DD) — infer from today if the user says "tonight", "tomorrow", "Friday", etc.
- startTime: time string like "7:00 PM". Default "7:00 PM".
- endTime: time string like "11:00 PM". Must be 1-5 hours after startTime. Default 2-3 hours after startTime.
- partySize: integer 1-12. Default 2.
- budgetLevel: integer 1-4 where 1=cheap, 2=moderate, 3=upscale, 4=splurge. Default 2.
- neighborhood: neighborhood name in NYC, or "Any" if not specified.

Rules:
- If user says "tonight" → today's date.
- If user says a weekday like "Friday" → the next upcoming Friday.
- If user mentions "brunch" or "lunch" → vibe "Brunch Run", startTime around "11:00 AM".
- If user mentions "museum" or "art" → vibe "Museum Day".
- If user mentions "bar" or "bars" or "drinks" → vibe "Dinner & Drinks" or "Night Out".
- If user says "date" → vibe "Date Night".
- If user says "cheap" or "budget" → budgetLevel 1.
- If user says "moderate" or "midrange" → budgetLevel 2.
- If user says "upscale" or "fancy" → budgetLevel 3.
- If user says "splurge" or "expensive" or "high-end" → budgetLevel 4.

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
      const errText = await apiRes.text();
      console.error("OpenAI error:", errText);
      res.status(502).json({ error: "AI parsing failed" });
      return;
    }

    const data = (await apiRes.json()) as {
      choices: { message: { content: string } }[];
    };
    const raw = data.choices[0]?.message?.content?.trim() ?? "{}";

    let parsed: Record<string, unknown>;
    try {
      // Strip markdown code fences if present
      const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
      parsed = JSON.parse(clean);
    } catch {
      res.status(422).json({ error: "Could not parse AI response", raw });
      return;
    }

    // Sanitize and fill defaults
    const vibes = [
      "Dinner & Drinks",
      "Date Night",
      "Museum Day",
      "Brunch Run",
      "Night Out",
      "Foodie Crawl",
      "Cultural Day",
      "Low-Key Vibes",
    ];

    const vibe = vibes.includes(parsed.vibe as string)
      ? (parsed.vibe as string)
      : "Dinner & Drinks";

    const partySize =
      typeof parsed.partySize === "number" &&
      parsed.partySize >= 1 &&
      parsed.partySize <= 12
        ? parsed.partySize
        : 2;

    const budgetLevel =
      typeof parsed.budgetLevel === "number" &&
      [1, 2, 3, 4].includes(parsed.budgetLevel as number)
        ? parsed.budgetLevel
        : 2;

    const neighborhood =
      typeof parsed.neighborhood === "string" && parsed.neighborhood
        ? parsed.neighborhood
        : "Any";

    // Validate/default date
    let date: string;
    const rawDate = parsed.date as string;
    if (rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
      date = rawDate;
    } else {
      date = new Date().toISOString().split("T")[0];
    }

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
