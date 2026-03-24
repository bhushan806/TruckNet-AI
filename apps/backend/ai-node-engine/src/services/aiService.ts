export class AIService {
  async getResponse(message: string, context?: any): Promise<string> {
    try {
      const response = await fetch(
        'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.HF_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: `[INST] You are TruckNet Dost, an AI logistics assistant for Indian truck drivers. Speak in Hinglish (Hindi+English). Help with load rates, routes, vehicle matching, delays. Be friendly and concise. User: ${message} [/INST]`,
            parameters: {
              max_new_tokens: 500,
              temperature: 0.7,
              top_p: 0.95
            }
          })
        }
      );
      
      const data = await response.json();
      return data[0]?.generated_text || "Namaste! Thoda aur details do, main help karunga. 🚛";
      
    } catch (error) {
      console.error('HuggingFace error:', error);
      return "Abhi thoda busy hoon, thodi der mein try karo. 🙏";
    }
  }
}
