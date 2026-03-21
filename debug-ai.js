const axios = require('axios');

async function testPublicChat() {
    try {
        const response = await axios.post('http://localhost:5000/api/dost/chat', {
            message: 'What is TruckNet AI?',
            conversationHistory: [{ role: 'assistant', content: 'Namaste! 🚛 Aapki kya madad kar sakta hoon?' }]
        });
        console.log('API SUCCESS:', response.data);
    } catch (error) {
        console.log('API REQUEST FAILED:');
        console.dir(error.response?.data || error.message);
    }
}

testPublicChat();
