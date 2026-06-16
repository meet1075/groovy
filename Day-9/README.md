# Day 9 — Multi-Provider CLI Chatbot & "Explain this Codebase" Web App

Welcome to **Day 9**. This milestone contains two major tools built to elevate how you interact with LLMs in your daily workflow:

1. **Part 1:** A production-grade **CLI Chatbot** with persistent CSV telemetry, cost calculation, and a reporting dashboard.
2. **Part 2:** A full-stack **"Explain this Codebase" Web Application** that recursively reads a local directory and uses Groq (Llama 3.3 70B) to explain your code architecture.

---

## 📂 Project Structure

```
Day-9/
├── .env                 ← API keys for the CLI chatbot
├── chatbot.js           ← The main CLI chatbot application
├── dashboard.js         ← Visual usage reporting tool for the CLI
├── usage_log.csv        ← Auto-generated telemetry file from the CLI
│
├── client/              ← Frontend for the "Explain this Codebase" tool
│   ├── package.json     ← Vite + React config
│   ├── index.html       
│   └── src/             ← React source code
│
└── server/              ← Backend for the "Explain this Codebase" tool
    ├── .env             ← API keys for the web app backend
    ├── package.json     ← Express server config
    └── index.js         ← Express server logic (file reading & Groq streaming)
```

---

# Part 1: Production CLI Chatbot with Cost Tracking

We've added robust features to our terminal chatbot: **persistent CSV logging** (telemetry), a **beautiful CLI dashboard**, **real-time provider switching**, and **automated cost calculation**.

### 🌟 Key Features
- **Multi-Provider:** Seamlessly query Groq, Google Gemini, and Cohere.
- **Provider Switching:** Press `PageUp` or `PageDown` to instantly switch the active LLM mid-conversation.
- **Persistent Telemetry:** Every single turn is logged locally to `usage_log.csv`.
- **Automated Cost Calculation:** Extracts exact `input` and `output` token counts from the provider and calculates fractional costs based on official June 2026 pricing.
- **Interactive Dashboard:** `dashboard.js` generates a beautiful CLI report from your CSV.

### 🚀 Usage

```bash
# Start the chatbot
node chatbot.js --provider groq

# View your usage & cost metrics
node dashboard.js
```

---

# Part 2: "Explain this Codebase" Full-Stack App

A powerful developer tool that analyzes an entire local project directory and streams a highly detailed architectural explanation using Groq's high-speed inference.

### 🌟 Key Features
- **Local Directory Reading:** The backend recursively reads your local files, automatically skipping junk directories (`node_modules`, `.git`, `dist`, etc.) and non-code files.
- **Token Optimization (Max 10K / 28K Chars):** To safely stay under the context limit, the backend truncates the payload to a maximum of 28,000 characters (~7,000 tokens), preventing 400 Bad Request errors.
- **Adjustable Depth:** Choose between a quick summary, a detailed architectural walkthrough, or a line-by-line file analysis.
- **Real-Time Streaming Response:** The frontend streams the Groq API response using Server-Sent Events (SSE) so you don't have to wait for the entire explanation to generate.
- **Token Metrics:** Displays the exact input/output tokens used and the elapsed inference time.

### 🚀 Setup & Usage

**1. Start the Backend Server:**
```bash
cd Day-9/server
cp .env.example .env   # Add your GROQ_API_KEY
npm install
npm start              # Runs on http://localhost:3001
```

**2. Start the Frontend App:**
```bash
cd Day-9/client
npm install
npm run dev            # Runs on http://localhost:5173
```

**3. Analyze Code:**
- Open `http://localhost:5173` in your browser.
- Paste an absolute path to a local directory (e.g., `/home/user/my-project`).
- Select your analysis depth (Quick, Detailed, or Line-by-Line).
- Click **Analyze** and watch the explanation stream in!

### 🛠️ Technical Implementation Details
- **Server-Sent Events (SSE):** The Express backend (`server/index.js`) streams the `data: ...` chunks directly to the React frontend as they arrive from Groq.
- **Smart Filtering:** The backend uses `SKIP_DIRS` and `CODE_EXTENSIONS` `Set` objects to intelligently ignore binary files, lockfiles, and build artifacts, only sending the actual source code to the LLM.
- **Safety Limits:** The backend hard-caps the request at 50 files and 28,000 characters. If a single file pushes the payload over the limit, the file is automatically truncated with `// ... truncated`.
