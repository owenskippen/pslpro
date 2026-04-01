import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { parseGeminiJson, SYSTEM_PROMPT } from "./src/types/psl.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb" }));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/api/analyze", async (req, res) => {
  try {
    const { mimeType, base64Data } = req.body;

    if (!mimeType || !base64Data) {
      return res.status(400).json({
        ok: false,
        error: "Missing mimeType or base64Data",
      });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
      { text: "Analyze this image. Respond with JSON only as instructed." },
    ]);

    const text = result.response.text();
    const parsed = parseGeminiJson(text);

    if ("error" in parsed) {
      return res.json({
        ok: false,
        kind: "no_face",
        message: parsed.message,
      });
    }

    res.json({
      ok: true,
      data: parsed,
    });
  } catch (error) {
    console.error("Analysis error:", error);
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 API server running at http://localhost:${PORT}`);
  console.log(`📊 POST /api/analyze - Analyze face images\n`);
});
