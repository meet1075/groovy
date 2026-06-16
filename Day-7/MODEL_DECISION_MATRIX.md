# When to Choose Which Model — Decision Matrix

A quick-reference guide to pick the right AI provider/model for any task.

---

## Decision Matrix

| Task Type | Recommended Model | Why | Use a Higher Tier If |
|---|---|---|---|
| **Writing new code / building features** | Claude Sonnet 4.6 | Best code generation quality with strong reasoning | Task involves multi-file architecture or complex system design → Claude Opus |
| **Debugging existing code** | Claude Sonnet 4.6 | Excels at reading context, tracing logic, finding root causes | Bug is deeply nested or involves race conditions/performance → Claude Opus |
| **Code review** | Claude Sonnet 4.6 | Thorough analysis with nuanced suggestions | Reviewing security-critical code → Claude Opus |
| **Complex reasoning / multi-step problems** | Claude Opus | Top-tier reasoning for ambiguous, multi-step logic | — |
| **Image analysis** | Gemini 2.5 Flash | Native multimodal, fast, free tier available | Need precise medical/legal image analysis → Gemini 2.5 Pro |
| **Image generation** | Gemini 2.5 Flash (Imagen) | Integrated image generation in Gemini ecosystem | High-fidelity commercial art → GPT-4o with DALL-E |
| **Video/audio understanding** | Gemini 2.5 Flash | Only provider with native video & audio input | Long-form video analysis (30+ min) → Gemini 2.5 Pro |
| **Long document summarization (50+ pages)** | Gemini 2.5 Flash | 1M token context window handles massive docs | Need extremely precise extraction → Claude Opus |
| **Quick factual lookups** | GPT-4o-mini | Fast, cheap, broad knowledge | — |
| **Creative writing (stories, copy)** | Claude Sonnet 4.6 | Natural, engaging prose with style control | Novel-length or highly stylized work → Claude Opus |
| **Function calling / AI agents / tool use** | GPT-4o | Best tool-use reliability and structured output | Complex agent orchestration → Claude Opus |
| **High-volume simple queries (cost-sensitive)** | GPT-4o-mini or Gemini 2.5 Flash | Cheapest options with decent quality | Task needs slight reasoning → Claude Haiku |
| **Translation** | Gemini 2.5 Flash | Strong multilingual support with large context | Literary/legal translation → Claude Sonnet 4.6 |
| **Data analysis / spreadsheets** | Claude Sonnet 4.6 | Strong at structured data reasoning and code generation | Large datasets with complex transformations → Claude Opus |

---

## Provider Strengths at a Glance

| Provider | Sweet Spot | Models (Fast → Strong) |
|---|---|---|
| **Anthropic (Claude)** | Coding, reasoning, long-form writing | Haiku → Sonnet → Opus |
| **Google (Gemini)** | Multimodal (image/video/audio), huge context | Flash → Pro |
| **OpenAI (ChatGPT)** | General knowledge, agents, function calling | GPT-4o-mini → GPT-4o → o1 |
| **Groq (hosted open models)** | Speed, cost-effective inference | Llama 3.3 70B, Mixtral |
| **Cohere** | Enterprise RAG, embeddings, grounded generation | Command R → Command A |

---

## Quick Rules of Thumb

1. **If it touches code → start with Claude** (Sonnet for everyday, Opus for hard problems)
2. **If it involves an image/video/audio → use Gemini** (Flash for speed, Pro for precision)
3. **If you just need a fast factual answer → use the cheapest/fastest model** (GPT-4o-mini, Gemini Flash, or Groq-hosted Llama)
4. **If the task is genuinely hard (multi-step, high-stakes, ambiguous) → use the top-tier model regardless of provider** (Claude Opus, GPT-4o, or Gemini Pro)
5. **If cost matters more than quality → always pick the smallest/cheapest model that can plausibly handle it**

---

## Cost vs Quality Ladder

```
Cheap & Fast                          Expensive & Powerful
──────────────────────────────────────────────────────────
GPT-4o-mini ─┐
Gemini Flash ─┤── High-volume, simple tasks
Groq/Llama  ─┘
              │
Claude Haiku ─── Quick coding, light reasoning
              │
GPT-4o ──────── General purpose, agents
Claude Sonnet ── Everyday coding, writing, reasoning
              │
Gemini Pro ──── Complex multimodal
Claude Opus ──── Hardest reasoning, critical code
GPT-4o + o1 ──── Multi-step problem solving
```

---

## Model Pricing & Token Limits Reference

> Prices are per **1 million tokens (MTok)**. 1 token ≈ 4 characters or ¾ of a word.
> Costs shown in **USD**. Verified June 2025 — check provider dashboards for latest.

### Anthropic — Claude

| Model | Context Window | Input Price /MTok | Output Price /MTok | Free Tier | Best For |
|---|---|---|---|---|---|
| **Claude Haiku 3.5** | 200K tokens | $0.80 | $4.00 | Via API trial | Fast, cheap tasks — light coding, summaries |
| **Claude Sonnet 4.5** | 200K tokens | $3.00 | $15.00 | Via API trial | Everyday coding, writing, reasoning |
| **Claude Sonnet 4.6** | 200K tokens | $3.00 | $15.00 | Via API trial | Best everyday workhorse — code + analysis |
| **Claude Opus 4** | 200K tokens | $15.00 | $75.00 | ❌ | Hardest reasoning, critical code, complex plans |

> **Token rule of thumb:** 1K tokens ≈ 750 words ≈ 3 pages of text.
> Claude 200K context ≈ ~150,000 words ≈ a full novel.

---

### Google — Gemini

| Model | Context Window | Input Price /MTok | Output Price /MTok | Free Tier | Best For |
|---|---|---|---|---|---|
| **Gemini 2.5 Flash** | 1M tokens | $0.15 (text) | $0.60 | ✅ Generous free quota | Speed + multimodal + huge context |
| **Gemini 2.5 Flash (thinking)** | 1M tokens | $0.15 | $3.50 | ✅ | Complex reasoning with thinking mode |
| **Gemini 2.5 Pro** | 1M tokens | $1.25 (≤200K) / $2.50 (>200K) | $10.00 | Limited free | Precision multimodal + long documents |

> **Context comparison:** Gemini 1M context ≈ 750,000 words ≈ ~10 full novels or a large codebase.

---

### OpenAI — GPT

| Model | Context Window | Input Price /MTok | Output Price /MTok | Free Tier | Best For |
|---|---|---|---|---|---|
| **GPT-4o-mini** | 128K tokens | $0.15 | $0.60 | Via ChatGPT free | High-volume simple queries, cheap RAG |
| **GPT-4o** | 128K tokens | $2.50 | $10.00 | Limited | General purpose, agents, function calling |
| **o1-mini** | 128K tokens | $3.00 | $12.00 | ❌ | Science, math, code reasoning |
| **o1** | 200K tokens | $15.00 | $60.00 | ❌ | Multi-step reasoning, research-level problems |
| **o3** | 200K tokens | $10.00 | $40.00 | ❌ | Frontier reasoning (latest OpenAI model) |

---

### Cohere — Command

| Model | Context Window | Input Price /MTok | Output Price /MTok | Free Tier | Best For |
|---|---|---|---|---|---|
| **Command R (command-r-08-2024)** | 128K tokens | $0.15 | $0.60 | ✅ Trial credits | RAG pipelines, cost-sensitive enterprise |
| **Command R+ (command-r-plus-08-2024)** | 128K tokens | $2.50 | $10.00 | ✅ Trial credits | Advanced RAG, grounded generation |
| **Command A (command-a-03-2025)** | 256K tokens | $2.50 | $10.00 | ✅ Trial credits | Latest Cohere flagship — coding + reasoning |

---

### Groq — Open Model Hosting (Ultra-fast inference)

| Model | Context Window | Input Price /MTok | Output Price /MTok | Free Tier | Best For |
|---|---|---|---|---|---|
| **Llama 3.3 70B Versatile** | 128K tokens | $0.59 | $0.79 | ✅ Free tier | Fast general inference, cheap at scale |
| **Llama 3.1 8B Instant** | 128K tokens | $0.05 | $0.08 | ✅ Free tier | Ultra-cheap, high-throughput simple tasks |
| **Mixtral 8x7B** | 32K tokens | $0.24 | $0.24 | ✅ Free tier | Multilingual, instruction following |
| **Gemma 2 9B** | 8K tokens | $0.20 | $0.20 | ✅ Free tier | Lightweight tasks, on-device style |

> Groq charges for **tokens processed**, not per request. Their hardware (LPUs) makes inference 5–10× faster than GPU-based providers.

---

## All-Models Comparison Snapshot

| Model | Provider | Input /MTok | Output /MTok | Context | Speed | Strength |
|---|---|---|---|---|---|---|
| Llama 3.1 8B (Groq) | Groq | $0.05 | $0.08 | 128K | ⚡⚡⚡ | Ultra-cheap, fast |
| GPT-4o-mini | OpenAI | $0.15 | $0.60 | 128K | ⚡⚡⚡ | Cheap + capable |
| Gemini 2.5 Flash | Google | $0.15 | $0.60 | 1M | ⚡⚡⚡ | Multimodal + huge context |
| Command R | Cohere | $0.15 | $0.60 | 128K | ⚡⚡ | RAG + enterprise |
| Claude Haiku 3.5 | Anthropic | $0.80 | $4.00 | 200K | ⚡⚡⚡ | Fast Claude, light coding |
| Llama 3.3 70B (Groq) | Groq | $0.59 | $0.79 | 128K | ⚡⚡⚡ | Fast open model |
| GPT-4o | OpenAI | $2.50 | $10.00 | 128K | ⚡⚡ | Agents, function calling |
| Command R+ | Cohere | $2.50 | $10.00 | 128K | ⚡⚡ | Advanced RAG |
| Command A | Cohere | $2.50 | $10.00 | 256K | ⚡⚡ | Cohere flagship |
| Claude Sonnet 4.6 | Anthropic | $3.00 | $15.00 | 200K | ⚡⚡ | Best everyday coding |
| Gemini 2.5 Pro | Google | $1.25–$2.50 | $10.00 | 1M | ⚡⚡ | Complex multimodal |
| o1-mini | OpenAI | $3.00 | $12.00 | 128K | ⚡ | Math + science reasoning |
| o3 | OpenAI | $10.00 | $40.00 | 200K | ⚡ | Frontier reasoning |
| Claude Opus 4 | Anthropic | $15.00 | $75.00 | 200K | ⚡ | Hardest problems |
| o1 | OpenAI | $15.00 | $60.00 | 200K | ⚡ | Research-level reasoning |

---

## Token Cost Calculator

Quick estimate: **how much does 1 conversation cost?**

| Scenario | Tokens Used | GPT-4o-mini cost | GPT-4o cost | Claude Sonnet cost |
|---|---|---|---|---|
| Short Q&A (1 exchange) | ~500 | $0.0001 | $0.002 | $0.003 |
| Medium chat (10 turns) | ~5,000 | $0.001 | $0.02 | $0.03 |
| Long analysis (50 pages doc) | ~40,000 | $0.008 | $0.15 | $0.24 |
| Full codebase review (200K tokens) | ~200,000 | $0.045 | $0.70 | $1.20 |

> **Rule:** Output tokens cost 4–5× more than input tokens for most models — keep your outputs concise when cost matters.

