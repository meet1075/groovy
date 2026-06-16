import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const GROQ_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

const SKIP_DIRS = new Set([
  "node_modules", ".git", "__pycache__", ".next", ".nuxt", "dist", "build",
  ".cache", ".parcel-cache", "coverage", ".idea", ".vscode", "vendor",
  ".venv", "venv", "env", ".tox", ".mypy_cache", ".pytest_cache",
  "target", "bin", "obj", ".gradle", ".mvn",
]);

const CODE_EXTENSIONS = new Set([
  ".js", ".ts", ".jsx", ".tsx", ".py", ".java", ".go", ".rb", ".php",
  ".json", ".md", ".css", ".html", ".c", ".cpp", ".cs", ".rs", ".swift",
  ".kt", ".sh", ".sql", ".yaml", ".yml", ".toml", ".xml", ".vue", ".svelte",
  ".env", ".gitignore", ".prettierrc", ".eslintrc", ".prisma", ".graphql",
  ".proto", ".dart", ".lua", ".r", ".scala", ".ex", ".exs", ".erl",
]);

const SKIP_FILES = new Set([
  "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "composer.lock",
  "Gemfile.lock", "Cargo.lock", "go.sum", "poetry.lock",
]);

const DEPTH_PROMPTS = {
  quick: "Give a quick 2-3 sentence summary of what this project does.",
  detailed: "Provide a detailed walkthrough of this project. Explain the overall purpose, project structure, key files, how they connect, data flow, dependencies, and any notable patterns. Use headings and bullet points. Reference specific files when relevant.",
  line: "Go through each file in this project and explain what it does in detail. For each file, describe its purpose, key functions/classes, and how it relates to other files. Use code blocks where helpful.",
};

const MAX_CHARS = 28000; // ~7000 tokens, safe under Groq limit
const MAX_FILES = 50;

function readCodeFiles(dirPath, basePath, state = { chars: 0, count: 0 }) {
  const results = [];
  if (state.count >= MAX_FILES || state.chars >= MAX_CHARS) return results;

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    entries.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

    for (const entry of entries) {
      if (state.count >= MAX_FILES || state.chars >= MAX_CHARS) break;
      const fullPath = path.join(dirPath, entry.name);
      const relPath = path.relative(basePath, fullPath);

      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        results.push(...readCodeFiles(fullPath, basePath, state));
      } else {
        if (SKIP_FILES.has(entry.name)) continue;
        const ext = path.extname(entry.name).toLowerCase();
        if (!CODE_EXTENSIONS.has(ext)) continue;
        const stat = fs.statSync(fullPath);
        if (stat.size === 0 || stat.size > 100 * 1024) continue;
        try {
          let content = fs.readFileSync(fullPath, "utf-8");
          if (state.chars + content.length > MAX_CHARS) {
            const remaining = MAX_CHARS - state.chars;
            if (remaining < 200) break;
            content = content.slice(0, remaining) + "\n// ... truncated";
          }
          state.chars += content.length;
          state.count++;
          results.push({ path: relPath, content });
        } catch {}
      }
    }
  } catch {}

  return results;
}

function buildUserMsg({ code, files, path: dirPath, depth }) {
  const prompt = DEPTH_PROMPTS[depth] || DEPTH_PROMPTS.detailed;

  if (dirPath) {
    const files = readCodeFiles(dirPath, dirPath);
    if (files.length === 0) {
      return `No readable code files found in "${dirPath}". Make sure the path is correct and contains code files.`;
    }
    const fileList = files.map((f) => `### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``).join("\n\n");
    return `${prompt}\n\nProject path: ${dirPath}\nContains ${files.length} file(s):\n${files.map((f) => `- ${f.path}`).join("\n")}\n\n${fileList}`;
  }

  if (files && files.length > 0) {
    const fileList = files.map((f) => `### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``).join("\n\n");
    return `${prompt}\n\nThe codebase contains ${files.length} file(s):\n${files.map((f) => `- ${f.path}`).join("\n")}\n\n${fileList}`;
  }

  return `${prompt}\n\n\`\`\`\n${code}\n\`\`\``;
}

// ─── Streaming endpoint ──────────────────────────────────────────────────────
app.post("/api/explain", async (req, res) => {
  const { code, files, path: dirPath, depth = "detailed" } = req.body;

  const hasCode = code && code.trim().length > 0;
  const hasFiles = files && files.length > 0;
  const hasPath = dirPath && dirPath.trim().length > 0;

  if (!hasCode && !hasFiles && !hasPath) {
    return res.status(400).json({ error: "No code or path provided." });
  }
  if (!GROQ_KEY) {
    return res.status(500).json({ error: "GROQ_API_KEY not set on server." });
  }

  if (hasPath && !fs.existsSync(dirPath)) {
    return res.status(400).json({ error: `Path not found: ${dirPath}` });
  }

  const systemMsg = "You are an expert code explainer and software architect. Explain the provided codebase clearly and thoroughly. Use markdown formatting with headings, bullet points, and fenced code blocks where appropriate. When explaining a codebase, describe the architecture, how files relate to each other, and the overall data flow.";

  const userMsg = buildUserMsg({ code, files, path: dirPath, depth });

  if (userMsg.startsWith("No readable code files")) {
    return res.status(400).json({ error: userMsg });
  }

  const body = {
    model: MODEL,
    messages: [
      { role: "system", content: systemMsg },
      { role: "user", content: userMsg },
    ],
    stream: true,
    stream_options: { include_usage: true },
  };

  try {
    const start = Date.now();
    const groqRes = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!groqRes.ok) {
      const errBody = await groqRes.text();
      console.error("Groq API error:", groqRes.status, errBody);
      return res.status(groqRes.status).json({ error: `Groq API error: ${groqRes.status}` });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const reader = groqRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let inputTokens = 0;
    let outputTokens = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") break;
        try {
          const chunk = JSON.parse(data);
          const delta = chunk.choices?.[0]?.delta?.content;
          if (delta) {
            res.write(`data: ${JSON.stringify({ text: delta })}\n\n`);
          }
          if (chunk.usage) {
            inputTokens = chunk.usage.prompt_tokens || 0;
            outputTokens = chunk.usage.completion_tokens || 0;
          }
        } catch {}
      }
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    res.write(`data: ${JSON.stringify({ done: true, inputTokens, outputTokens, elapsed })}\n\n`);
    res.end();
  } catch (err) {
    console.error("Server error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }
});

// ─── Path validation endpoint ────────────────────────────────────────────────
app.post("/api/validate-path", (req, res) => {
  const { path: dirPath } = req.body;
  if (!dirPath) return res.status(400).json({ error: "No path provided." });

  if (!fs.existsSync(dirPath)) {
    return res.json({ valid: false, error: "Path does not exist." });
  }
  if (!fs.statSync(dirPath).isDirectory()) {
    return res.json({ valid: false, error: "Path is not a directory." });
  }

  const files = readCodeFiles(dirPath, dirPath);
  res.json({ valid: true, fileCount: files.length, files: files.map((f) => f.path) });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API key: ${GROQ_KEY ? "loaded" : "MISSING — set GROQ_API_KEY in .env"}`);
});
