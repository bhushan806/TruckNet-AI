export class AIService {
    async getResponse(message: string, context?: any): Promise<string> {
        try {
            const hfToken = process.env.HF_API_TOKEN;
            if (!hfToken) {
                return 'TruckNet Dost is temporarily unavailable. Please try again.';
            }

            const response = await fetch(
                'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${hfToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        inputs: message,
                        parameters: {
                            max_new_tokens: 500,
                            temperature: 0.7,
                            top_p: 0.95
                        }
                    })
                }
            );

            if (!response.ok) {
                return 'TruckNet Dost is temporarily unavailable. Please try again.';
            }

            const data = await response.json();
            const full = data[0]?.generated_text || '';
            const reply = full.split('[/INST]').pop()?.trim() 
                || 'TruckNet Dost is temporarily unavailable. Please try again.';
            return reply;

        } catch (error) {
            console.error('HuggingFace error:', error);
            return 'TruckNet Dost is temporarily unavailable. Please try again.';
        }
    }
}
