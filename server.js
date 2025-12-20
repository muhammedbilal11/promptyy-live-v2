require('dotenv').config();
const express = require('express');
const cors = require('cors'); 
const { OpenAI } = require('openai'); 

const app = express();
const port = 3000; 

// --- 1. CONFIGURE GROQ CLIENT ---
const groq = new OpenAI({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY, 
});

// --- 2. MIDDLEWARE ---
app.use(cors()); // Allows cross-origin requests (essential for local testing)
app.use(express.json()); 

// *** CRITICAL FOR LOCAL TESTING ***
// This line tells the server to render your 'index.html' when you visit localhost:3000
app.use(express.static(__dirname)); 

// --- 3. API ROUTE ---
app.post('/generate', async (req, res) => {
    try {
        const { category, userNeed } = req.body; 

        if (!userNeed || !category) {
            return res.status(400).json({ error: 'category and userNeed are required' });
        }

        // AI Persona Logic
        let expertPersona = "";
        switch (category) {
            case "student":
                expertPersona = "You are an expert professor and learning coach focused on clarity, structure, and academic rigor.";
                break;
            case "creative":
                expertPersona = "You are an award-winning art director and creative strategist, specializing in visual language and tone.";
                break;
            case "business":
                expertPersona = "You are a top-tier marketing executive and business consultant, specializing in ROI and clear objectives.";
                break;
            case "developer":
                expertPersona = "You are a 10x principal software engineer and system architect, specializing in logic, efficiency, and specific language syntax.";
                break;
            case "general":
            default:
                expertPersona = "You are a helpful and highly skilled general assistant. Maintain a friendly yet professional tone.";
                break;
        }
        
        // Final Prompt Construction
        const masterPrompt = `
            ${expertPersona}
            
            A user has a simple need: "${userNeed}".
            
            Your task is to generate a single, highly detailed, and professional prompt
            that the user can copy and paste into another AI tool (like a large language model or image generator).
            
            The generated prompt must be highly effective for the user's selected role.
            
            Return ONLY the generated prompt.
        `;

        // GROQ API Call
        const response = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant", 
            messages: [{ role: "user", content: masterPrompt }],
            temperature: 0.7, 
        });
        
        const generatedPromptText = response.choices[0].message.content;
        res.json({ generatedPrompt: generatedPromptText });

    } catch (error) {
        console.error('Error generating prompt:', error);
        res.status(500).json({ error: 'Failed to generate prompt. Check Groq API key.' });
    }
});

// --- 4. START SERVER (Hybrid Mode) ---
// This allows the file to work on Vercel (export) AND Local (listen)

module.exports = app; // Required for Vercel

// Only listen on port 3000 if running locally
if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server running locally at http://localhost:${port}`);
    });
}