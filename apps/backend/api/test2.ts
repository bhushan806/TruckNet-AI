import { callGrokAPI } from './src/services/aiService'; callGrokAPI([{role: 'system', content: 'you are helpful'}, {role: 'user', content: 'hello'}]).then(console.log).catch(console.error);
