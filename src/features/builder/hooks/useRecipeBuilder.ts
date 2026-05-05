import { useState, useCallback, useRef } from "react";
import { builderService } from "../services";
import type { BuilderMessage, GeneratedRecipe } from "../types";

interface UseRecipeBuilderReturn {
  messages: BuilderMessage[];
  isGenerating: boolean;
  error: string | null;
  sendPrompt: (prompt: string) => Promise<void>;
  regenerateRecipes: () => Promise<void>;
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
  const originalPrompt = useRef<string | null>(null);

  const sendPrompt = useCallback(
    async (prompt: string) => {
      const trimmedPrompt = prompt.trim();
      if (!trimmedPrompt || isGenerating) return;

      setError(null);
      if (!originalPrompt.current) {
        originalPrompt.current = trimmedPrompt;
      }

      // Add user message to UI
      const userMessage: BuilderMessage = {
        id: generateId(),
        role: "user",
        content: trimmedPrompt,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsGenerating(true);

      try {
        const response = await builderService.generateRecipes({
          prompt: trimmedPrompt,
          history: conversationHistory.current,
          preferences: preferences.length > 0 ? preferences : undefined,
        });

        // Add assistant message with recipes to UI
        const assistantMessage: BuilderMessage = {
          id: generateId(),
          role: "assistant",
          content: "",
          recipes: response.recipes,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Update conversation history for multi-turn
        conversationHistory.current.push(
          { role: "user", content: trimmedPrompt },
          { role: "assistant", content: response.assistantContent }
        );
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.error ||
          "Failed to generate recipes. Please try again.";
        setError(errorMessage);

        // Remove the user message on error so they can retry
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
        if (conversationHistory.current.length === 0) {
          originalPrompt.current = null;
        }
      } finally {
        setIsGenerating(false);
      }
    },
    [isGenerating, preferences]
  );

  const regenerateRecipes = useCallback(async () => {
    if (!originalPrompt.current || isGenerating) return;

    setError(null);
    setIsGenerating(true);

    try {
      const response = await builderService.generateRecipes({
        prompt: originalPrompt.current,
        preferences: preferences.length > 0 ? preferences : undefined,
      });

      const timestamp = Date.now();
      setMessages((prev) => {
        const next = [...prev];
        let latestRecipeMessageIndex = -1;

        for (let index = next.length - 1; index >= 0; index -= 1) {
          const message = next[index];
          if (
            message.role === "assistant" &&
            !!message.recipes &&
            message.recipes.length > 0
          ) {
            latestRecipeMessageIndex = index;
            break;
          }
        }

        if (latestRecipeMessageIndex === -1) {
          return [
            ...next,
            {
              id: generateId(),
              role: "assistant",
              content: "",
              recipes: response.recipes,
              timestamp,
            },
          ];
        }

        next[latestRecipeMessageIndex] = {
          ...next[latestRecipeMessageIndex],
          content: "",
          recipes: response.recipes,
          timestamp,
        };

        return next;
      });

      conversationHistory.current = [
        { role: "user", content: originalPrompt.current },
        { role: "assistant", content: response.assistantContent },
      ];
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error ||
        "Failed to generate recipes. Please try again.";
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, preferences]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    conversationHistory.current = [];
    originalPrompt.current = null;
  }, []);

  return {
    messages,
    isGenerating,
    error,
    sendPrompt,
    regenerateRecipes,
    clearChat,
    preferences,
    setPreferences,
  };
}
