import { HfInference } from "@huggingface/inference";

const hfKey = process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY;
const hfModel =
  process.env.EXPO_PUBLIC_HUGGINGFACE_MODEL || "Qwen/Qwen2.5-72B-Instruct";

if (!hfKey) {
  console.error("Hugging Face API key not found in environment variables");
}

const hf = new HfInference(hfKey);

function sanitizeAssistantReply(text: string): string {
  const withoutThinkBlocks = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
  const withoutThinkTags = withoutThinkBlocks.replace(/<\/?think>/gi, "");
  return withoutThinkTags.trim();
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: Date;
}

export interface ChatResponse {
  message: string;
  error?: string;
}

export async function sendChatMessage(
  messages: ChatMessage[],
  systemPrompt?: string,
): Promise<ChatResponse> {
  try {
    const chatMessages: { role: "system" | "user" | "assistant"; content: string }[] = [];

    if (systemPrompt) {
      chatMessages.push({
        role: "system",
        content: systemPrompt,
      });
    }

    messages.forEach((msg) => {
      chatMessages.push({
        role:
          msg.role === "assistant"
            ? "assistant"
            : msg.role === "system"
              ? "system"
              : "user",
        content: msg.content,
      });
    });

    const response = await hf.chatCompletion({
      model: hfModel,
      messages: chatMessages,
      max_tokens: 1100,
      temperature: 0.7,
    });

    const rawResponseMessage = response.choices[0]?.message?.content || "";
    const responseMessage = sanitizeAssistantReply(rawResponseMessage);
    const finishReason = response.choices[0]?.finish_reason;

    if (!rawResponseMessage || !responseMessage) {
      throw new Error("No response from Hugging Face");
    }

    if (finishReason === "length") {
      const continuation = await hf.chatCompletion({
        model: hfModel,
        messages: [
          ...chatMessages,
          { role: "assistant", content: responseMessage },
          {
            role: "user",
            content:
              "Continue exactly from where you stopped. Do not repeat previous lines.",
          },
        ],
        max_tokens: 700,
        temperature: 0.7,
      });

      const continuationMessage = sanitizeAssistantReply(
        continuation.choices[0]?.message?.content || "",
      );
      return {
        message: `${responseMessage}${continuationMessage ? `\n${continuationMessage}` : ""}`,
      };
    }

    return {
      message: responseMessage,
    };
  } catch (error: any) {
    console.error("Hugging Face API Error:", error);
    return {
      message: "",
      error: error.message || "Failed to get response from Hugging Face AI",
    };
  }
}

/**
 * Default system prompt for fitness assistant
 */
type UserFitnessContext = {
  name?: string;
  weight?: number | string;
  height?: number | string;
  age?: number | string;
  goals?: string;
};

export const getFitnessSystemPrompt = (user?: UserFitnessContext) => {
  let prompt = `You are a helpful and knowledgeable fitness coach and nutritionist. 
Your role is to provide personalized fitness advice, workout recommendations, nutrition guidance, and motivation.
Keep your responses concise, practical, and encouraging. Focus on:
- Safe and effective exercise techniques
- Personalized workout plans
- Nutrition and diet advice
- Injury prevention
- Motivation and mental wellness
Always prioritize safety and recommend consulting healthcare professionals for medical concerns.
Never reveal chain-of-thought or reasoning traces. Do not output tags like <think> or </think>.`;

  if (user?.name || user?.weight || user?.height || user?.age || user?.goals) {
  prompt += `\n\nUser Context:\n`;
    if (user?.name) prompt += `- Name: ${user.name}\n`;
    if (user?.weight) prompt += `- Weight: ${user.weight} kg\n`;
    if (user?.height) prompt += `- Height: ${user.height} cm\n`;
    if (user?.age) prompt += `- Age: ${user.age}\n`;
    if (user?.goals) {
      prompt += `- Goal: ${user.goals.replace(/_/g, " ")}\n`;
    }
    prompt +=
      "Use this profile context for personalized meal plans, workout plans, and habit advice.\n";
  } else {
    prompt +=
      "\n\nNo profile data is available yet. Ask for age, weight, height, and goal before giving detailed plans.";
  }

  return prompt;
};

export const getCurrentChatModel = () => hfModel;
