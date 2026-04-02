import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import type { Plugin, Connect } from "vite";
import * as fs from "fs";
import * as path from "path";

// Load .env.development.local manually for the config
const envPath = path.resolve(process.cwd(), ".env.development.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      const value = valueParts.join("=").trim();
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value;
      }
    }
  });
}

function apiPlugin(): Plugin {
  return {
    name: "api-plugin",
    configureServer(server) {
      server.middlewares.use("/api/analyze", (async (
        req: Connect.IncomingMessage,
        res: any,
        next: Connect.NextFunction
      ) => {
        if (req.method !== "POST") {
          return next();
        }

        let body = "";
        req.on("data", (chunk: Buffer) => {
          body += chunk.toString();
        });

        req.on("end", async () => {
          try {
            const { mimeType, base64Data } = JSON.parse(body);

            if (!mimeType || !base64Data) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ ok: false, error: "Missing mimeType or base64Data" }));
              return;
            }

            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ ok: false, error: "GEMINI_API_KEY not configured" }));
              return;
            }

            // Dynamic imports to avoid config loading issues
            const { GoogleGenerativeAI } = await import("@google/generative-ai");
            const { parseGeminiJson, SYSTEM_PROMPT } = await import("./src/types/psl");

            const genAI = new GoogleGenerativeAI(apiKey);
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
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ ok: false, kind: "no_face", message: parsed.message }));
              return;
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: true, data: parsed }));
          } catch (error) {
            console.error("Analysis error:", error);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                ok: false,
                error: error instanceof Error ? error.message : "Unknown error",
              })
            );
          }
        });
      }) as Connect.NextHandleFunction);
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), apiPlugin()],
  server: {
    port: parseInt(process.env.VITE_PORT || "5173"),
  },
});
