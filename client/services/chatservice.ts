import { HfInference } from "@huggingface/inference";

const hfKey = process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY;

if (!hfKey) {
  console.error("Hugging Face API key not found in environment variables");
}

const hf = new HfInference(hfKey);

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
    const chatMessages: { role: string; content: string }[] = [];

    if (systemPrompt) {
      chatMessages.push({
        role: "user",
        content: systemPrompt,
      });
    }

    messages.forEach((msg) => {
      chatMessages.push({
        role: "user",
        content: msg.content,
      });
    });

    const response = await hf.chatCompletion({
      model: "deepseek-ai/DeepSeek-R1",
      messages: chatMessages,
      max_tokens: 500,
      temperature: 0.7,
    });

    const responseMessage = response.choices[0]?.message?.content;

    if (!responseMessage) {
      throw new Error("No response from Hugging Face");
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
export const FITNESS_SYSTEM_PROMPT = `You are a helpful and knowledgeable fitness coach and nutritionist. 
Your role is to provide personalized fitness advice, workout recommendations, nutrition guidance, and motivation.
Keep your responses concise, practical, and encouraging. Focus on:
- Safe and effective exercise techniques
- Personalized workout plans
- Nutrition and diet advice
- Injury prevention
- Motivation and mental wellness
Always prioritize safety and recommend consulting healthcare professionals for medical concerns.`;