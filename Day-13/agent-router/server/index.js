import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import { tavily } from "@tavily/core";
import * as math from "mathjs";
import axios from "axios";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const tvly = process.env.TAVILY_API_KEY ? tavily({ apiKey: process.env.TAVILY_API_KEY }) : null;
const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL;

// --- Config Endpoint (for Sidebar) ---
app.get("/api/config", (req, res) => {
  res.json({
    search: { configured: !!process.env.TAVILY_API_KEY },
    calculator: { configured: true },
    slack: { configured: !!process.env.SLACK_WEBHOOK_URL },
  });
});

const SYSTEM_PROMPT = `You are the Agent Router. You must route the user's request to exactly ONE of the provided tools. 
Respond with ONLY a valid JSON object matching this schema:
{
  "tool": "web_search" | "calculator" | "send_slack",
  "reason": "Brief 1-line reason why this tool was chosen",
  "parameters": {
    // If web_search: {"query": "The search query string"}
    // If calculator: {"expression": "The mathematical expression to evaluate"}
    // If send_slack: {"message": "The message content to send"}
  }
}

Definitions:
- web_search: Search the web for current events, facts, or information.
- calculator: Perform mathematical calculations or evaluate numeric expressions.
- send_slack: Send a message to a Slack channel.`;

// --- Main Routing Endpoint (SSE) ---
app.post("/api/route", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required." });

  // Setup SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendEvent = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);
  const startTime = Date.now();

  try {
    // 1. Analyzing
    sendEvent({ status: "analyzing" });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message }
      ],
      response_format: { type: "json_object" },
    });

    const responseContent = completion.choices[0]?.message?.content;
    
    if (!responseContent) {
      sendEvent({ status: "error", error: "Failed to generate a routing decision." });
      return res.end();
    }

    const decision = JSON.parse(responseContent);
    const toolName = decision.tool;
    const args = decision.parameters;

    // 2. Detected
    sendEvent({ 
      status: "detected", 
      tool: toolName, 
      reason: decision.reason || `Matched pattern for ${toolName}`
    });

    // 3. Executing
    sendEvent({ status: "executing" });

    let toolResult = null;
    let cost = 0; // Conceptual cost tracking

    if (toolName === "web_search") {
      if (!tvly) throw new Error("Tavily API key is not configured.");
      const searchRes = await tvly.search(args.query, { searchDepth: "basic", includeImages: false });
      toolResult = {
        query: args.query,
        results: searchRes.results.slice(0, 3).map(r => ({ title: r.title, content: r.content, url: r.url }))
      };
      cost = 0.005; // 1 Tavily credit
    } 
    else if (toolName === "calculator") {
      try {
        // Sanitize and evaluate expression safely
        let expr = args.expression.replace(/% of/g, '/100 *').replace(/%/g, '/100');
        const calculated = math.evaluate(expr);
        toolResult = {
          expression: args.expression,
          parsed: expr,
          result: calculated
        };
      } catch (err) {
        throw new Error(`Failed to evaluate expression: ${args.expression}`);
      }
    } 
    else if (toolName === "send_slack") {
      if (!SLACK_WEBHOOK) throw new Error("Slack Webhook URL is not configured.");
      try {
        await axios.post(SLACK_WEBHOOK, { text: args.message });
        toolResult = {
          message: args.message,
          target: "Configured Webhook",
          success: true
        };
      } catch (err) {
        throw new Error("Failed to send Slack message. Check webhook URL.");
      }
    }

    // 4. Complete
    const duration = Date.now() - startTime;
    sendEvent({ 
      status: "complete", 
      result: toolResult, 
      metadata: { duration, cost } 
    });

  } catch (error) {
    console.error("Router Error:", error);
    sendEvent({ status: "error", error: error.message || "An unexpected error occurred." });
  } finally {
    res.end();
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Agent Router Backend running on port ${PORT}`));
