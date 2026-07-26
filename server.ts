import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API routes FIRST
app.post("/api/ask-ai", async (req: any, res: any) => {
  try {
    const { message, listingName, listingDescription, listingLocation, listingPrice, listingType } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Gemini API Key is not configured." });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const systemInstruction = `You are an AI assistant for a premium real estate marketplace called Fedmax. 
Your job is to answer the user's questions about a specific property listing.
Here is the property context:
- Name: ${listingName || "Unknown"}
- Type: ${listingType || "Property"}
- Price: €${listingPrice || "N/A"}/month
- Location: ${listingLocation || "Unknown"}
- Description: ${listingDescription || "No description provided."}

Be friendly, helpful, and concise. Only answer based on the property details provided, or general rental info if helpful. Do not make up facts that are not in the description. If you don't know, say so.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: message,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: error.message || "An error occurred with Gemini API" });
  }
});

app.post("/api/chat-landlord", async (req: any, res: any) => {
  try {
    const { messageHistory, listingTitle, landlordName, guestName } = req.body;
    if (!messageHistory || !Array.isArray(messageHistory)) {
      return res.status(400).json({ error: "messageHistory is required and must be an array" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Gemini API Key is not configured." });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const messagesFormatted = messageHistory
      .map((m: any) => `${m.senderName}: ${m.text}`)
      .join("\n");

    const systemInstruction = `You are ${landlordName || "Carlos"}, the friendly but professional landlord of the property: "${listingTitle || "Fedmax Premium Listing"}".
You are chatting with your prospective tenant ${guestName || "Moses Archibong"} regarding their housing request.
Here is the text message history:
${messagesFormatted}

Your task is to reply to their latest message. Keep your reply extremely natural, friendly, and concise (1-3 sentences), as if writing a quick WhatsApp message. Do not use corporate speak; write like a real person living in Spain.
If they ask about utility bills, parking, cleaning, or keys, answer reasonably and welcomingly. Keep in character as ${landlordName || "Carlos"}.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Generate the landlord reply to the thread.",
      config: {
        systemInstruction,
        temperature: 0.8,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini chat-landlord error:", error);
    res.status(500).json({ error: error.message || "An error occurred with Gemini API" });
  }
});

app.post("/api/neighborhood-report", async (req: any, res: any) => {
  try {
    const { location, listingName } = req.body;
    if (!location) {
      return res.status(400).json({ error: "Location is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Gemini API Key is not configured." });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const systemInstruction = `You are a highly knowledgeable local real estate expert in Spain.
Analyze the following property address or listing description:
Address: ${location}
Listing Name: ${listingName || "Premium Rental"}

Generate a detailed, objective neighborhood scorecard and local area report.
Your output must be a valid JSON object matching the requested schema. Ensure transitScore, safetyScore, amenitiesScore, and nightlifeScore are realistic integer ratings from 1 to 10 (where 10 is outstanding). Give detailed descriptions explaining what makes the transit, safety, and general vibe unique for this neighborhood in Madrid/Barcelona. Add 2-3 specific "localSecrets" (e.g., hidden parks, best tapas bars, quiet spots).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Produce the JSON neighborhood scorecard report.",
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            neighborhoodName: { type: Type.STRING },
            transitScore: { type: Type.INTEGER },
            safetyScore: { type: Type.INTEGER },
            amenitiesScore: { type: Type.INTEGER },
            nightlifeScore: { type: Type.INTEGER },
            transitDescription: { type: Type.STRING },
            safetyDescription: { type: Type.STRING },
            vibeDescription: { type: Type.STRING },
            localSecrets: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: [
            "neighborhoodName", "transitScore", "safetyScore", "amenitiesScore", "nightlifeScore",
            "transitDescription", "safetyDescription", "vibeDescription", "localSecrets"
          ]
        },
        temperature: 0.2,
      },
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Gemini neighborhood-report error:", error);
    res.status(500).json({ error: error.message || "An error occurred with Gemini API" });
  }
});

app.post("/api/optimize-listing", async (req: any, res: any) => {
  try {
    const { title, type, location, price, size, amenities } = req.body;
    if (!title || !price || !location) {
      return res.status(400).json({ error: "Title, Price, and Location are required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Gemini API Key is not configured." });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const systemInstruction = `You are an expert real estate pricing analyst and marketing specialist for Spanish properties.
Analyze the following listing details:
- Title: "${title}"
- Type: ${type}
- Location: "${location}"
- Current Price: €${price}/month
- Size: ${size} sqm
- Amenities: ${amenities ? amenities.join(", ") : "None"}

Generate a highly detailed optimization report in Spanish or English (mix is fine, but make UI-facing fields English since the app is English).
Your output must be a valid JSON object matching the requested schema. Provide a suggested competitive price range (min and max values), a demand score (1-100), detailed feedback on pricing, 3 actionable upgrade tips to justify higher rent, an optimized title, and an optimized, high-converting description.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Analyze this listing and output the optimization JSON scorecard.",
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedPriceRange: {
              type: Type.OBJECT,
              properties: {
                min: { type: Type.INTEGER },
                max: { type: Type.INTEGER }
              },
              required: ["min", "max"]
            },
            demandScore: { type: Type.INTEGER },
            pricingVerdict: { type: Type.STRING },
            suggestedUpgrades: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            optimizedTitle: { type: Type.STRING },
            optimizedDescription: { type: Type.STRING }
          },
          required: [
            "suggestedPriceRange", "demandScore", "pricingVerdict", "suggestedUpgrades",
            "optimizedTitle", "optimizedDescription"
          ]
        },
        temperature: 0.3,
      },
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Gemini optimize-listing error:", error);
    res.status(500).json({ error: error.message || "An error occurred with Gemini API" });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: any, res: any) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Error starting server:", err);
});
