import { useCallback, useState } from "react";
import { useFitness } from "@store/FitnessContext";
import type { Message } from "@features/ai-coach/types";

type UseAICoachOptions = {
  onReply?: (message: Message) => void;
};

export function useAICoach({ onReply }: UseAICoachOptions = {}) {
  const { userStats, userProfile, level, rank } = useFitness();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "0",
      role: "assistant",
      content: `Hey! I'm your AI fitness coach. You're at Level ${level} with a ${userStats.streak}-day streak — impressive discipline. What can I help you with today?`,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(
    async (text: string) => {
      const msg = text.trim();
      if (!msg) return;

      const userMsg: Message = { id: Date.now().toString(), role: "user", content: msg };
      setMessages((prev) => [userMsg, ...prev]);
      setIsLoading(true);

      try {
        const domain = process.env.EXPO_PUBLIC_DOMAIN;
        const apiUrl = process.env.EXPO_PUBLIC_API_URL;
        const baseUrl = apiUrl ?? (domain ? `https://${domain}` : "");
        const res = await fetch(`${baseUrl}/api/ai/coach`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: msg,
            context: {
              level,
              rank,
              streak: userStats.streak,
              totalWorkouts: userStats.totalWorkouts,
              fitnessGoal: userProfile.fitnessGoal,
              caloriesBurned: userStats.caloriesBurned,
            },
          }),
        });
        const data = (await res.json()) as { reply?: string };
        const reply: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.reply ?? "Keep grinding. Your consistency is building something great.",
        };
        setMessages((prev) => [reply, ...prev]);
        onReply?.(reply);
      } catch {
        const fallback: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Stay focused. Every rep, every set counts. What else can I help with?",
        };
        setMessages((prev) => [fallback, ...prev]);
        onReply?.(fallback);
      } finally {
        setIsLoading(false);
      }
    },
    [level, onReply, rank, userProfile.fitnessGoal, userStats.caloriesBurned, userStats.streak, userStats.totalWorkouts],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, sendMessage, isLoading, clearMessages };
}
