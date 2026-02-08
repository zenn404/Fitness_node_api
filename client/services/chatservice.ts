import { HfInference } from '@huggingface/inference';
const hfKey = process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY;
if(!hfKey) {
    console.error('HUGGINGFACE_API_KEY is not set');
}
const hf = new HfInference(hfKey);
export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: Date;
}
export interface ChatResponse {
    message: string;
    error?: string;
}
export async function sendChatMessage(messages: ChatMessage[],systemPrompt: string): Promise<ChatResponse> {
    try {
        const chatMessages : {role: string;content: string}[] = [];
        if(systemPrompt) {
            chatMessages.push({role: 'user', content: systemPrompt});
        }
        messages.forEach(message => {
            chatMessages.push({role: 'user', content: message.content});
        });

        const response = await hf.chatCompletion({
            model: 'deepseek-ai/DeepSeek-R1',
            messages: chatMessages,
            max_tokens: 1000,
            temperature: 0.7,
        });
    
        const responseMessage = response.choices[0].message?.content;
        if (!responseMessage) {
            throw new Error('No response from the model');
        }
        return {
            message: responseMessage,
            
        };

    }catch (error) {
        return {
            message: '',
            error: 'An error occurred while sending the message',
        };
    }
}
export const FITNESS_SYSTEM_PROMPT = `You are a helpful and knowledgeable fitness coach and nutritionist. 
Your role is to provide personalized fitness advice, workout recommendations, nutrition guidance, and motivation.
Keep your responses concise, practical, and encouraging. Focus on:
- Safe and effective exercise techniques
- Personalized workout plans
- Nutrition and diet advice
- Injury prevention
- Motivation and mental wellness
- Provide workout plans based on the user's weight and height
- Provide nutrition advice based on the user's weight and height
Always prioritize safety and recommend consulting healthcare professionals for medical concerns.`;