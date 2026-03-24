import { Router } from 'express';
import { AIService } from '../services/aiService';

const router = Router();
const aiService = new AIService();

router.post('/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    
    if (!message) {
      return res.status(400).json({ 
        status: 'error', 
        response: 'Kuch likho bhai! Main kya help kar sakta hoon? 📝' 
      });
    }
    
    const response = await aiService.getResponse(message, context);
    
    res.json({
      status: 'success',
      response: response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      status: 'error',
      response: 'Kuch gadbad hui, thodi der mein try karo. 🙏'
    });
  }
});

export default router;
