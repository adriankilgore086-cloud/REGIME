import { Router } from "express";

const router = Router();

router.post("/coach", async (req, res) => {
  const { message, context } = req.body as { message: string; context: Record<string, unknown> };

  if (!message) {
    res.status(400).json({ error: "message is required" });
    return;
  }

  const baseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;

  if (!baseUrl || !apiKey) {
    res.json({ reply: "Stay focused and keep pushing — every rep counts towards your goals!" });
    return;
  }

  const systemPrompt = `You are an elite AI fitness coach named FitAI. You provide personalized, science-based, and highly motivating fitness advice. 
Be concise (2-4 sentences max), direct, energizing, and action-oriented. 
Focus on practical, immediately actionable advice. Never be vague.
Adapt your tone to be encouraging but not over-the-top — like a world-class personal trainer.

User context:
- Level: ${context.level ?? "unknown"}
- Rank: ${context.rank ?? "unknown"}
- Current streak: ${context.streak ?? 0} days
- Total workouts: ${context.totalWorkouts ?? 0}
- Fitness goal: ${context.fitnessGoal ?? "general health"}
- Calories burned total: ${context.caloriesBurned ?? 0}

Always respond in the context of their current fitness level and goals.`;

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5.4",
        max_completion_tokens: 512,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = (await response.json()) as { choices: Array<{ message: { content: string } }> };
    const reply = data.choices?.[0]?.message?.content ?? "Keep grinding. Your consistency is building something great.";
    res.json({ reply });
  } catch (error) {
    req.log.error({ error }, "AI coach error");
    res.json({ reply: "Train hard, recover well, stay consistent. That's the formula for progress." });
  }
});

export default router;
