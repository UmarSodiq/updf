import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for large extracted PDF text
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Add a health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Gemini Endpoints
  // 1. AI Summary
  app.post("/api/gemini/summary", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) return res.status(400).json({ error: "No text provided" });

      const prompt = `Tolong buatkan rangkuman dari dokumen berikut. Berikan rangkuman eksekutif singkat dan poin-poin (bullet points) penting.\n\nDokumen:\n${text}`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ result: response.text });
    } catch (error: any) {
      console.error("Gemini summary error:", error);
      res.status(500).json({ error: error.message || "Failed to generate summary" });
    }
  });

  // 2. AI Translate
  app.post("/api/gemini/translate", async (req, res) => {
    try {
      const { text, targetLanguage } = req.body;
      if (!text) return res.status(400).json({ error: "No text provided" });

      const lang = targetLanguage || 'Indonesia';
      const prompt = `Tolong terjemahkan dokumen berikut ke dalam bahasa ${lang}. Perhatikan konteks agar bahasanya natural.\n\nDokumen:\n${text}`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ result: response.text });
    } catch (error: any) {
      console.error("Gemini translate error:", error);
      res.status(500).json({ error: error.message || "Failed to translate" });
    }
  });

  // 3. AI Chat (Q&A)
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { text, question } = req.body;
      if (!text || !question) return res.status(400).json({ error: "Text and question are required" });

      const prompt = `Gunakan dokumen berikut sebagai konteks untuk menjawab pertanyaan pengguna.\n\nDokumen:\n${text}\n\nPertanyaan: ${question}`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
            systemInstruction: "Anda adalah asisten AI yang cerdas dan membantu untuk menjawab pertanyaan terkait dengan dokumen yang diberikan.",
        }
      });

      res.json({ result: response.text });
    } catch (error: any) {
      console.error("Gemini chat error:", error);
      res.status(500).json({ error: error.message || "Failed to answer question" });
    }
  });


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
    // Serve index.html for all non-file requests to support SPA routing properly
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
