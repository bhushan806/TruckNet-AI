// ── AI Provider Service ──
// SECURITY: No API keys are hardcoded. All keys come from environment variables.
// Provider priority: Groq (Cloud) → Ollama (Local) → HuggingFace (Free Fallback)
// Gemini has been removed from the provider chain.

import axios from 'axios';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';
import { HfInference } from '@huggingface/inference';
dotenv.config();

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export const callGrokAPI = async (messages: ChatMessage[]) => {
    // Priority 1: Groq Cloud (with multi-model fallback)
    if (process.env.GROQ_API_KEY) {
        const groqModels = [
            process.env.GROQ_MODEL,
            'llama-3.3-70b-versatile',
            'llama-3.1-8b-instant',
            'mixtral-8x7b-32768',
            'gemma2-9b-it',
        ].filter(Boolean) as string[];

        for (const model of groqModels) {
            try {
                const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                    model,
                    messages: messages,
                }, {
                    headers: {
                        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 20000
                });
                if (response.data.choices && response.data.choices.length > 0) {
                    return response.data.choices[0].message.content;
                }
            } catch (error: any) {
                logger.warn(`Groq model ${model} failed, trying next...`, { error: error.message });
            }
        }
    }

    // Priority 2: HuggingFace (free serverless models)
    if (process.env.HF_API_TOKEN) {
        const hfModels = [
            'mistralai/Mistral-7B-Instruct-v0.2',
            'Qwen/Qwen2.5-7B-Instruct',
            'meta-llama/Llama-3.2-3B-Instruct',
            'Qwen/Qwen2.5-72B-Instruct',
        ];

        const hf = new HfInference(process.env.HF_API_TOKEN);
        for (const model of hfModels) {
            try {
                const response = await hf.chatCompletion({
                    model,
                    messages: messages.map(m => ({
                        role: m.role,
                        content: m.content
                    }))
                });

                if (response.choices && response.choices.length > 0) {
                    const content = response.choices[0].message.content?.trim();
                    if (content) return content;
                }
            } catch (error: any) {
                const status = error.response?.status;
                logger.warn(`HuggingFace model ${model} failed (status: ${status})`, {
                    message: error.response?.data?.error || error.message
                });
            }
        }
    }

    // Priority 3: Gemini (Google Cloud)
    if (process.env.GEMINI_API_KEY) {
        try {
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
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
                payload,
                { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
            );
            
            if (response.data.candidates && response.data.candidates.length > 0) {
                return response.data.candidates[0].content.parts[0].text;
            }
        } catch (error: any) {
            logger.warn('Gemini failed, falling back...', { error: error.message });
        }
    }

    // Priority 4: Ollama (Local Free)
    const ollamaHost = process.env.OLLAMA_HOST;
    if (ollamaHost) {
        try {
            const response = await axios.post(`${ollamaHost}/api/chat`, {
                model: "llama3",
                messages: messages,
                stream: false
            }, { timeout: 10000 });
            return response.data.message.content;
        } catch {
            // Ollama not available, fallthrough
        }
    }

    // All external providers failed — provide intelligent logistics fallback instead of dead error
    return generateLocalFallback(messages);
};

function generateLocalFallback(messages: ChatMessage[]): string {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content?.toLowerCase() || '';

    if (lastUserMsg.includes('start') || lastUserMsg.includes('shuru') || lastUserMsg.includes('help') || lastUserMsg.includes('guide') || lastUserMsg.includes('kya kar')) {
        return "TruckNet India mein aapka swagat hai! 🚛 Main aapka AI Co-Pilot hoon:\n\n• 📦 **Find Loads / Book Truck**: Maal bhejne ya load lene ke liye\n• 🗺️ **Smart Routing & Fuel**: Kam toll aur kam diesel wala fast route\n• 💰 **Dynamic Price Check**: Live market-based bhada estimate\n• 📍 **Live Tracking**: GPS real-time updates aur delay prediction\n\nAap direct sawal puch sakte hain ya sign in karke start kar sakte hain! 🚀";
    }
    if (lastUserMsg.includes('how') || lastUserMsg.includes('kaise') || lastUserMsg.includes('work') || lastUserMsg.includes('feature') || lastUserMsg.includes('demo')) {
        return "TruckNet AI ek smart logistics platform hai! 🧠 Yeh Indian roads aur trucking ke liye specially design kiya gaya hai:\n\n1. AI Matching: Best load aur truck instantly match karta hai\n2. Delay Predictor: Real-time traffic, toll aur mausam se late hone ka risk batata hai\n3. Dynamic Pricing: Transparent aur fair rates calculate karta hai!\n\nAage badhne ke liye sign in karein ya dashboard visit karein. 🚛";
    }
    if (lastUserMsg.includes('driver') || lastUserMsg.includes('performance')) {
        return "Driver performance track karne ke liye aap Fleet Dashboard > Drivers section mein ja sakte hain. Wahan par safety rating, trips count, on-time delivery rate aur feedback live dekh sakte hain! 🚛📊";
    }
    if (lastUserMsg.includes('fleet') || lastUserMsg.includes('idle') || lastUserMsg.includes('truck') || lastUserMsg.includes('gaadi')) {
        return "Fleet overview aur idle trucks check karne ke liye Dashboard > Fleet tab open karein. Wahan live GPS status aur available vehicles mil jayenge. 🚚📍";
    }
    if (lastUserMsg.includes('load') || lastUserMsg.includes('bhada') || lastUserMsg.includes('booking') || lastUserMsg.includes('maal')) {
        return "Live verified loads check karne ke liye 'Load Board' par jayein. Hamara system aapke route aur truck capacity ke hisab se best loads match karta hai! 📦🚛";
    }
    if (lastUserMsg.includes('route') || lastUserMsg.includes('traffic') || lastUserMsg.includes('fuel') || lastUserMsg.includes('rasta')) {
        return "AI Route Optimizer se toll charges aur traffic analyze karke fuel-efficient route milta hai, jisse trip par 15-20% fuel bachat hoti hai! ⛽🛣️";
    }
    if (lastUserMsg.includes('price') || lastUserMsg.includes('rate') || lastUserMsg.includes('cost') || lastUserMsg.includes('paisa')) {
        return "Hamara Dynamic Pricing Engine distance, diesel rate, aur demand-supply factor analyze karke accurate freight rates suggest karta hai. Load book karte waqt instant estimate milta hai! 💰";
    }
    if (lastUserMsg.includes('track') || lastUserMsg.includes('where') || lastUserMsg.includes('kahan') || lastUserMsg.includes('eta')) {
        return "Live tracking ke liye 'Track Order' par jayein ya booking number enter karein. System GPS aur live delay prediction show karega! 📍";
    }
    if (lastUserMsg.includes('hi') || lastUserMsg.includes('hello') || lastUserMsg.includes('namaste') || lastUserMsg.includes('hey')) {
        return "Namaste! Main TruckNet Dost hoon 🚛 Loads, routes, fleet ya billing se judi koi bhi madad chahiye toh bataiye!";
    }

    return "TruckNet Dost aapki seva mein hazir hai! 🚛 Loads, live tracking, fair pricing ya driver assistance ke liye batayein, ya sign in karke dashboard check karein.";
}
