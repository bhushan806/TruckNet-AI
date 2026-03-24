import Groq from 'groq-sdk';
import OpenAI from 'openai';

// Initialize Groq (faster, free tier available)
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Or use OpenAI as fallback
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class AIService {
  async getResponse(message: string, context?: any): Promise<string> {
    try {
      // Try Groq first (recommended for speed)
      if (process.env.GROQ_API_KEY) {
        const completion = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `You are TruckNet Dost, an AI logistics assistant for Indian truck drivers and fleet owners.
              Speak in Hinglish (Hindi + English mix) naturally.
              Help with: load rates, routes, vehicle matching, delay predictions, and roadside assistance.
              Be friendly, helpful, and concise. Use emojis like 🚛, 📦, 🛣️ occasionally.`
            },
            {
              role: 'user',
              content: message
            }
          ],
          temperature: 0.7,
          max_tokens: 500,
        });

        return completion.choices[0]?.message?.content || "Sorry, I couldn't process that. Please try again.";
      }
      
      // Fallback to OpenAI if Groq not available
      if (process.env.OPENAI_API_KEY) {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are TruckNet Dost, an AI logistics assistant for Indian truck drivers and fleet owners.
              Speak in Hinglish (Hindi + English mix) naturally.
              Help with: load rates, routes, vehicle matching, delay predictions, and roadside assistance.
              Be friendly, helpful, and concise.`
            },
            {
              role: 'user',
              content: message
            }
          ],
          temperature: 0.7,
          max_tokens: 500,
        });

        return completion.choices[0]?.message?.content || "Sorry, I couldn't process that.";
      }
      
      // Fallback if no API keys
      return "Namaste! Main TruckNet Dost hoon. API key nahi mili, but full version mein intelligent responses dunga. Abhi demo mode mein hoon. 🚛";
      
    } catch (error) {
      console.error('LLM error:', error);
      return "Namaste! Main TruckNet Dost hoon. Abhi thoda busy hoon, thodi der mein dobara try karo. 🚛";
    }
  }
}
