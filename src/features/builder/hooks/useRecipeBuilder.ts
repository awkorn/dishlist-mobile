import { useState, useCallback, useRef } from "react";
import { builderService } from "../services";
import type { BuilderMessage, GeneratedRecipe } from "../types";

interface UseRecipeBuilderReturn {
  messages: BuilderMessage[];
  isGenerating: boolean;
  error: string | null;
  sendPrompt: (prompt: string) => Promise<void>;
  clearChat: () => void;
  preferences: string[];
  setPreferences: (prefs: string[]) => void;
}

let messageIdCounter = 0;
const generateId = () => `msg_${Date.now()}_${++messageIdCounter}`;

export function useRecipeBuilder(): UseRecipeBuilderReturn {
  const [messages, setMessages] = useState<BuilderMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<string[]>([]);

  // Keep a ref to conversation history for OpenAI context
  // This stores the raw content strings for the API, separate from UI messages
  const conversationHistory = useRef<
    { role: "user" | "assistant"; content: string }[]
  >([]);

  const sendPrompt = useCallback(
    async (prompt: string) => {
      if (!prompt.trim() || isGenerating) return;

      setError(null);

      // Add user message to UI
      const userMessage: BuilderMessage = {
        id: generateId(),
        role: "user",
        content: prompt.trim(),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsGenerating(true);

      try {
        const response = await builderService.generateRecipes({
          prompt: prompt.trim(),
          history: conversationHistory.current,
          preferences: preferences.length > 0 ? preferences : undefined,
        });

        // Add assistant message with recipes to UI
        const assistantMessage: BuilderMessage = {
          id: generateId(),
          role: "assistant",
          content: response.message,
          recipes: response.recipes,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Update conversation history for multi-turn
        conversationHistory.current.push(
          { role: "user", content: prompt.trim() },
          { role: "assistant", content: response.assistantContent }
        );
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.error ||
          "Failed to generate recipes. Please try again.";
        setError(errorMessage);

        // Remove the user message on error so they can retry
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      } finally {
        setIsGenerating(false);
      }
    },
    [isGenerating, preferences]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    conversationHistory.current = [];
  }, []);

  return {
    messages,
    isGenerating,
    error,
    sendPrompt,
    clearChat,
    preferences,
    setPreferences,
  };
}
