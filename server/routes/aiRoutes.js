import express from 'express';
import { generateContent } from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js'; // Ensure only logged in owners can use this

const aiRouter = express.Router();

aiRouter.post('/prompt', protect, generateContent);

export default aiRouter;
