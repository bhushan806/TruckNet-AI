const axios = require('axios');

async function testHF() {
    try {
        const prompt = `<s>[INST] <<SYS>>\nYou are an AI.\n<</SYS>>\n\nHello [/INST]`;
        const headers = { 'Content-Type': 'application/json' };
        
        console.log('Sending request to HF...');
        const response = await axios.post(
            'https://router.huggingface.co/hf-inference/models/mistralai/Mistral-7B-Instruct-v0.2/v1/chat/completions',
            {
                model: "mistralai/Mistral-7B-Instruct-v0.2",
                messages: [{ role: 'user', content: 'Hello' }]
            },
            { headers, timeout: 10000 }
        );
        console.log('Success:', response.data);
    } catch (err) {
        console.error('Error:', err.response ? err.response.status : err.message);
        if (err.response) {
            console.error(err.response.data);
        }
    }
}

testHF();
