// ── AI Provider Service ──
// SECURITY: No API keys are hardcoded. All keys come from environment variables.
// Provider priority: Groq (Cloud) → Ollama (Local) → HuggingFace (Free Fallback)
// Gemini has been removed from the provider chain.

import axios from 'axios';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';
dotenv.config();

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export const callGrokAPI = async (messages: ChatMessage[]) => {
    
    // Priority 1: Gemini (Google Cloud)
    if (process.env.GEMINI_API_KEY) {
        try {
            // Convert messages to Gemini format
            let systemInstruction = "";
            const geminiContents = messages.map(m => {
                if (m.role === 'system') {
                    systemInstruction = m.content;
                    return null;
                }
                return {
                    role: m.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: m.content }]
                };
            }).filter(Boolean);

            const payload: any = { contents: geminiContents };
            if (systemInstruction) {
                payload.systemInstruction = { parts: [{ text: systemInstruction }] };
            }

            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
                payload,
                { headers: { 'Content-Type': 'application/json' }, timeout: 60000 }
            );
            
            if (response.data.candidates && response.data.candidates.length > 0) {
                return response.data.candidates[0].content.parts[0].text;
            }
        } catch (error: any) {
            logger.warn('Gemini failed, falling back...', { error: error.message });
        }
    }

    // Priority 2: Groq Cloud
    if (process.env.GROQ_API_KEY) {
        try {
            const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                model: 'llama3-70b-8192',
                messages: messages,
            }, {
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });
            if (response.data.choices && response.data.choices.length > 0) {
                return response.data.choices[0].message.content;
            }
        } catch (error: any) {
            logger.warn('Groq failed, falling back...', { error: error.message });
        }
    }

    // Priority 3: Ollama (Local Free)
    const ollamaHost = process.env.OLLAMA_HOST;
    if (ollamaHost) {
        try {
            const response = await axios.post(`${ollamaHost}/api/chat`, {
                model: "llama3",
                messages: messages,
                stream: false
            }, { timeout: 60000 });
            return response.data.message.content;
        } catch {
            // Ollama not available, fallthrough
        }
    }

    // Priority 3: HuggingFace (Authenticated Fallback)
    try {
        const systemMessage = messages.find(m => m.role === 'system')?.content || "";
        const userMessage = messages.find(m => m.role === 'user')?.content || "";

        // Format prompt using Mistral [INST] template
        const prompt = `<s>[INST] <<SYS>>\n${systemMessage}\n<</SYS>>\n\n${userMessage} [/INST]`;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };

        // Add Authorization header if HF token is available
        if (process.env.HF_API_TOKEN) {
            headers['Authorization'] = `Bearer ${process.env.HF_API_TOKEN}`;
        }

        const response = await axios.post(
            'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
            { inputs: prompt },
            {
                headers,
                timeout: 60000,
            }
        );

        if (Array.isArray(response.data) && response.data.length > 0) {
            let text = response.data[0].generated_text;
            if (text.startsWith(prompt)) text = text.substring(prompt.length);
            return text.trim();
        }
    } catch (error: any) {
        const status = error.response?.status;

        if (status === 401) {
            logger.error('HuggingFace error: HF token invalid or missing');
        } else if (status === 503) {
            logger.error('HuggingFace error: HF model loading, retry in 20s');
        } else {
            logger.error('HuggingFace API error', {
                status,
                message: error.response?.data?.error || error.message
            });
        }
        // Fall through — all 3 providers failed
    }

    // All 3 providers failed — return Hindi fallback message
    return "TruckNet Dost abhi available nahi hai.\nThodi der baad try karo. 🙏";
};
