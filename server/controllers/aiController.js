import { GoogleGenerativeAI } from '@google/generative-ai';

export const generateContent = async (req, res) => {
    try {
        const { prompt } = req.body;
        
        if (!prompt) {
            return res.json({ success: false, message: 'Prompt is required' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.json({ success: false, message: 'Gemini API key is not configured' });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ success: true, text });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};
