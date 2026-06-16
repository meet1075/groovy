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
> Costs shown in **USD**. **Verified June 2026** from official provider dashboards.

### Anthropic — Claude

| Model | Context Window | Input /MTok | Output /MTok | Free Tier | Best For |
|---|---|---|---|---|---|
| **Claude Haiku 4.5** | 1M tokens | $1.00 | $5.00 | Via API trial | Fast, cheap — light coding, summaries |
| **Claude Sonnet 4.6** | 1M tokens | $3.00 | $15.00 | Via API trial | Best everyday workhorse — code + analysis |
| **Claude Opus 4.6 / 4.7 / 4.8** | 1M tokens | $5.00 | $25.00 | ❌ | Current flagship — hardest reasoning, critical code |
| **Claude Opus 4.1** *(legacy)* | 200K tokens | $15.00 | $75.00 | ❌ | Legacy high-power model |

**Batch API discounts:**
| Model | Batch Input /MTok | Batch Output /MTok |
|---|---|---|
| Opus 4.x | $2.50 | $12.50 |
| Sonnet 4.6 | $1.50 | $7.50 |
| Haiku 4.5 | $0.50 | $2.50 |

> **Token rule of thumb:** 1K tokens ≈ 750 words ≈ 3 pages of text.
> Opus 4.8 and Sonnet 4.6 support a **full 1M context window** at standard pricing.

---

### Google — Gemini

| Model | Context Window | Input /MTok | Output /MTok | Free Tier | Best For |
|---|---|---|---|---|---|
| **Gemini 2.5 Flash-Lite** | 1M tokens | $0.10 | $0.40 | ✅ Free quota | Ultra-cheap, high-volume simple tasks |
| **Gemini 2.5 Flash** | 1M tokens | $0.30 | $2.50 | ✅ Free quota | Speed + multimodal + large context |
| **Gemini 3.1 Flash-Lite** | 1M tokens | $0.25 | $1.50 | ✅ Free quota | Cheap next-gen flash model |
| **Gemini 3 Flash Preview** | 1M tokens | $0.50 | $3.00 | ✅ Limited | Next-gen flash, preview access |
| **Gemini 3.5 Flash** | 1M tokens | $1.50 | $9.00 | ❌ | Premium flash — fast + capable |
| **Gemini 2.5 Pro** | 1M tokens | $1.25 (≤200K) / — | $10.00 | ❌ (removed Apr 2026) | Precision multimodal + long documents |
| **Gemini 3.1 Pro** | 1M tokens | $2.00 (≤200K) / $4.00 (>200K) | $12.00 / $18.00 | ❌ | Latest Pro — complex multimodal + reasoning |

> **Free tier note:** As of **April 1, 2026**, Pro models are no longer on the free tier. Only Flash and Flash-Lite retain free access with reduced quotas.
> **Batch API:** 50% discount on all models. **Cache reads:** 10% of base input price.
> Gemini 1M context ≈ 750,000 words ≈ ~10 full novels or a large codebase.

---

### OpenAI — GPT

| Model | Context Window | Input /MTok | Output /MTok | Free Tier | Best For |
|---|---|---|---|---|---|
| **GPT-4.1 nano** | 128K tokens | $0.10 | $0.40 | Via ChatGPT | Ultra-cheap, simple queries |
| **GPT-4o mini** | 128K tokens | $0.15 | $0.60 | Via ChatGPT | High-volume queries, cheap RAG |
| **GPT-4.1 mini** | 128K tokens | $0.40 | $1.60 | Limited | Balanced speed + quality |
| **GPT-4.1** | 128K tokens | $2.00 | $8.00 | ❌ | General purpose, agents, function calling |
| **GPT-4o** *(legacy)* | 128K tokens | $2.50 | $10.00 | ❌ | Legacy flagship |
| **GPT-5.4** | 128K tokens | $2.50 | $15.00 | ❌ | GPT-5 series — strong reasoning |
| **GPT-5.5** *(current flagship)* | 128K tokens | $5.00 | $30.00 | ❌ | Best OpenAI model — frontier tasks |

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

*Sorted cheapest → most expensive (input price). Updated June 2026.*

| Model | Provider | Input /MTok | Output /MTok | Context | Speed | Strength |
|---|---|---|---|---|---|---|
| Llama 3.1 8B (Groq) | Groq | $0.05 | $0.08 | 128K | ⚡⚡⚡ | Ultra-cheap open model |
| Gemini 2.5 Flash-Lite | Google | $0.10 | $0.40 | 1M | ⚡⚡⚡ | Cheapest Gemini + 1M context |
| GPT-4.1 nano | OpenAI | $0.10 | $0.40 | 128K | ⚡⚡⚡ | Cheapest OpenAI |
| GPT-4o mini | OpenAI | $0.15 | $0.60 | 128K | ⚡⚡⚡ | Cheap + capable |
| Command R | Cohere | $0.15 | $0.60 | 128K | ⚡⚡ | Cheap RAG |
| Gemini 3.1 Flash-Lite | Google | $0.25 | $1.50 | 1M | ⚡⚡⚡ | Next-gen cheap flash |
| Llama 3.3 70B (Groq) | Groq | $0.59 | $0.79 | 128K | ⚡⚡⚡ | Fast open model |
| Gemini 2.5 Flash | Google | $0.30 | $2.50 | 1M | ⚡⚡⚡ | Multimodal + huge context |
| GPT-4.1 mini | OpenAI | $0.40 | $1.60 | 128K | ⚡⚡⚡ | Balanced budget option |
| Gemini 3 Flash Preview | Google | $0.50 | $3.00 | 1M | ⚡⚡⚡ | Preview next-gen flash |
| Claude Haiku 4.5 | Anthropic | $1.00 | $5.00 | 1M | ⚡⚡⚡ | Fast Claude, light coding |
| GPT-4.1 | OpenAI | $2.00 | $8.00 | 128K | ⚡⚡ | Agents, function calling |
| Gemini 2.5 Pro | Google | $1.25 | $10.00 | 1M | ⚡⚡ | Complex multimodal |
| GPT-4o *(legacy)* | OpenAI | $2.50 | $10.00 | 128K | ⚡⚡ | Legacy flagship |
| GPT-5.4 | OpenAI | $2.50 | $15.00 | 128K | ⚡⚡ | GPT-5 strong reasoning |
| Command R+ | Cohere | $2.50 | $10.00 | 128K | ⚡⚡ | Advanced RAG |
| Command A | Cohere | $2.50 | $10.00 | 256K | ⚡⚡ | Cohere flagship |
| Claude Sonnet 4.6 | Anthropic | $3.00 | $15.00 | 1M | ⚡⚡ | Best everyday coding |
| Gemini 3.1 Pro | Google | $2.00–$4.00 | $12–$18 | 1M | ⚡⚡ | Latest Pro multimodal |
| Gemini 3.5 Flash | Google | $1.50 | $9.00 | 1M | ⚡⚡ | Premium fast model |
| Claude Opus 4.6–4.8 | Anthropic | $5.00 | $25.00 | 1M | ⚡ | Current flagship — hardest tasks |
| GPT-5.5 | OpenAI | $5.00 | $30.00 | 128K | ⚡ | OpenAI current flagship |
| Claude Opus 4.1 *(legacy)* | Anthropic | $15.00 | $75.00 | 200K | ⚡ | Legacy max power |

---

## Token Cost Calculator

Quick estimate: **how much does 1 conversation cost?**

| Scenario | Tokens Used | GPT-4o mini | GPT-4.1 | Claude Sonnet 4.6 | Gemini 2.5 Flash |
|---|---|---|---|---|---|
| Short Q&A (1 exchange) | ~500 | $0.0001 | $0.001 | $0.003 | $0.0001 |
| Medium chat (10 turns) | ~5,000 | $0.001 | $0.01 | $0.03 | $0.001 |
| Long analysis (50 pages doc) | ~40,000 | $0.009 | $0.10 | $0.24 | $0.012 |
| Full codebase review (200K tokens) | ~200,000 | $0.045 | $0.50 | $1.20 | $0.06 |

> **Rule:** Output tokens cost 4–5× more than input tokens for most models — keep your outputs concise when cost matters.
