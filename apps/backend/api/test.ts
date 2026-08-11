import { callGrokAPI } from './src/services/aiService'; callGrokAPI([{role: 'user', content: 'hello'}]).then(console.log).catch(console.error);
