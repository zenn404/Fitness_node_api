import { HfInference } from "@huggingface/inference";

const hfKey = process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY;
const hfModel =
  process.env.EXPO_PUBLIC_HUGGINGFACE_MODEL || "Qwen/Qwen2.5-7B-Instruct";
const hfFallbackModels = [
  hfModel,
  "meta-llama/Llama-3.1-8B-Instruct",
  "mistralai/Mistral-7B-Instruct-v0.3",
];

if (!hfKey) {
  console.error("Hugging Face API key not found in environment variables");
}

const hf = new HfInference(hfKey);

const normalizeHfError = (error: any): string => {
  const message = error?.message || "Failed to get response from Hugging Face AI";
  const lower = String(message).toLowerCase();

  if (lower.includes("401") || lower.includes("unauthorized")) {
    return "Invalid Hugging Face API key. Update EXPO_PUBLIC_HUGGINGFACE_API_KEY.";
  }
  if (lower.includes("429") || lower.includes("rate") || lower.includes("quota")) {
    return "Hugging Face rate limit/quota reached. Try again later.";
  }
  if (lower.includes("model") && (lower.includes("not found") || lower.includes("does not exist"))) {
    return "Configured Hugging Face model is unavailable.";
  }
  return message;
};

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
  if (!hfKey) {
    return {
      message: "",
      error: "Hugging Face API key is missing. Set EXPO_PUBLIC_HUGGINGFACE_API_KEY in client/.env.",
    };
  }

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

    let response: Awaited<ReturnType<typeof hf.chatCompletion>> | null = null;
    let usedModel = hfModel;
    let lastError: any = null;

    for (const model of hfFallbackModels) {
      try {
        response = await hf.chatCompletion({
          model,
          messages: chatMessages,
          max_tokens: 1100,
          temperature: 0.7,
        });
        usedModel = model;
        break;
      } catch (error) {
        lastError = error;
      }
    }

    if (!response) {
      throw lastError || new Error("No response from Hugging Face");
    }

    const rawResponseMessage = response.choices[0]?.message?.content || "";
    const responseMessage = sanitizeAssistantReply(rawResponseMessage);
    const finishReason = response.choices[0]?.finish_reason;

    if (!rawResponseMessage || !responseMessage) {
      throw new Error("No response from Hugging Face");
    }

    if (finishReason === "length") {
      const continuation = await hf.chatCompletion({
        model: usedModel,
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
      error: normalizeHfError(error),
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
  gender?: "male" | "female" | "other";
  goals?: string;
  weeklyAvgCalories?: number;
  weeklyCalorieDelta?: number;
  weeklyCalorieStatus?: "surplus" | "deficit" | "on_track";
};

const toNumber = (value?: number | string): number | null => {
  if (value === undefined || value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const calculateMaintenanceCalories = (
  age?: number | string,
  weightKg?: number | string,
  heightCm?: number | string,
  gender?: "male" | "female" | "other",
): number | null => {
  const parsedAge = toNumber(age);
  const parsedWeight = toNumber(weightKg);
  const parsedHeight = toNumber(heightCm);

  if (!parsedAge || !parsedWeight || !parsedHeight) return null;

  // Mifflin-St Jeor with low-activity multiplier.
  const genderOffset =
    gender === "female" ? -161 : gender === "male" ? 5 : -78;
  const bmr = 10 * parsedWeight + 6.25 * parsedHeight - 5 * parsedAge + genderOffset;
  return Math.round(bmr * 1.2);
};

const calculateBmi = (
  weightKg?: number | string,
  heightCm?: number | string,
): number | null => {
  const parsedWeight = toNumber(weightKg);
  const parsedHeightCm = toNumber(heightCm);
  if (!parsedWeight || !parsedHeightCm) return null;
  const heightM = parsedHeightCm / 100;
  if (heightM <= 0) return null;
  return parsedWeight / (heightM * heightM);
};

export const getFitnessSystemPrompt = (user?: UserFitnessContext) => {
  const maintenanceCalories = calculateMaintenanceCalories(
    user?.age,
    user?.weight,
    user?.height,
    user?.gender,
  );
  const cutCalories = maintenanceCalories
    ? Math.max(1200, maintenanceCalories - 350)
    : null;
  const bulkCalories = maintenanceCalories
    ? Math.max(1200, maintenanceCalories + 250)
    : null;

  const bmi = calculateBmi(user?.weight, user?.height);
  const bmiCategory =
    bmi === null
      ? null
      : bmi < 18.5
        ? "underweight"
        : bmi < 25
          ? "normal"
          : bmi < 30
            ? "overweight"
            : "obese";

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
    if (user?.gender) prompt += `- Gender: ${user.gender}\n`;
    if (user?.goals) {
      prompt += `- Goal: ${user.goals.replace(/_/g, " ")}\n`;
    }
    if (bmi !== null && bmiCategory) {
      prompt += `- BMI: ${bmi.toFixed(1)} (${bmiCategory})\n`;
    }
    if (maintenanceCalories) {
      prompt += `- Estimated maintenance calories: ${maintenanceCalories} kcal/day\n`;
      prompt += `- Suggested fat-loss calories: ${cutCalories} kcal/day\n`;
      prompt += `- Suggested muscle-gain calories: ${bulkCalories} kcal/day\n`;
    }
    if (typeof user?.weeklyAvgCalories === "number") {
      prompt += `- Last 7-day average intake: ${user.weeklyAvgCalories} kcal/day\n`;
    }
    if (typeof user?.weeklyCalorieDelta === "number") {
      prompt += `- Last 7-day average delta vs maintenance: ${user.weeklyCalorieDelta} kcal/day\n`;
    }
    if (user?.weeklyCalorieStatus) {
      prompt += `- Last 7-day trend status: ${user.weeklyCalorieStatus}\n`;
    }
    prompt +=
      "Use this profile context for personalized meal plans, workout plans, and habit advice.\n";
    prompt +=
      "When enough profile data exists, include a short health assessment (e.g., underweight/healthy range/overweight/obese based on BMI) and clear DO and DON'T bullets tailored to the user.\n";
    prompt +=
      "If the profile looks healthy, provide maintenance-focused habits to stay healthy.\n";
    prompt +=
      "If the profile suggests risk, give practical safe corrections (diet, training, recovery) and what to avoid.\n";
    prompt +=
      "When user asks calories/diet, explicitly reference maintenance, cut, and bulk targets from this context.\n";
    prompt +=
      "If BMI is overweight or obese, prioritize safe fat-loss guidance with a moderate calorie deficit, high-protein meals, and progressive activity.\n";
    prompt +=
      "If BMI is underweight, prioritize healthy surplus guidance and strength training.\n";
    prompt +=
      "If BMI is normal, align recommendations with the user's stated goal.\n";
  } else {
    prompt +=
      "\n\nNo profile data is available yet. Ask for age, weight, height, and goal before giving detailed plans.";
  }

  return prompt;
};

export const getCurrentChatModel = () => hfModel;
