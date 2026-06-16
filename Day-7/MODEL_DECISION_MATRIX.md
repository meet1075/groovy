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
