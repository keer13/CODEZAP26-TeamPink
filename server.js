const express = require("express");
const connectDB = require("./db");

const app = express();

const { GoogleGenAI } = require("@google/genai");

// Middleware to parse JSON
app.use(express.json());

async function start() {
    const db = await connectDB();
    
    // Initialize Gemini
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    app.get("/", async (req, res) => {
        res.send("MongoDB Connected!");
    });

    // New Endpoint: Get Government Details
    app.post("/api/gov-details", async (req, res) => {
        try {
            const userQuery = req.body.query || "What are the government approved health websites?";
            
            // 1. Fetch dataset context from MongoDB
            const collection = db.collection("gov_websites");
            const dbData = await collection.find({}).limit(10).toArray();
            
            const contextString = dbData.length > 0 
                ? dbData.map(doc => JSON.stringify(doc)).join("\n") 
                : "No local dataset found.";

            // 2. Query the Gemini API using the dataset as context
            const prompt = `You are a helpful assistant. Use the following dataset of government approved websites to answer the user's query.\n\nDataset:\n${contextString}\n\nUser Query: ${userQuery}`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: prompt,
            });

            // 3. Return the AI generated details
            res.json({
                success: true,
                details: response.text,
                datasetUsed: dbData.length
            });
            
        } catch (error) {
            console.error("Error fetching gov details:", error);
            res.status(500).json({ success: false, error: "Failed to process request." });
        }
    });

    app.listen(3000, () => {
        console.log("Server Running on Port 3000");
    });
}

start();