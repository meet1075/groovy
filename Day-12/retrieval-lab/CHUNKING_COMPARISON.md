# Chunking Strategy Comparison Report

**Project:** Day 12 — Retrieval Lab
**Date:** June 17, 2026
**Documents tested:** `23DCE115.pdf` (11 pages), `Chapter7_CodeOptimization_CodeGeneration.pdf` (19 pages)

---

## 1. Setup

Four chunking strategies were tested against the same source document(s), each ingested into its own Pinecone namespace, then queried with identical test questions. Cohere reranking (top-15 → top-3) was enabled for all runs in this report.

| Strategy | Configuration |
|---|---|
| Fixed | 1500 characters per chunk, 200-character overlap |
| Small | 500 characters per chunk, 100-character overlap |
| Large | 3000 characters per chunk, 100-character overlap |
| Semantic | Paragraph/sentence-boundary splitting, no fixed overlap |

---

## 2. Test Run 1 — `23DCE115.pdf`

**Question:** "what is in task 3"
**Reranking:** Enabled

### Per-Strategy Results

| Strategy | Input Tokens | Output Tokens | Cost | Response Time | Cited Pages |
|---|---|---|---|---|---|
| Fixed | 703 | 78 | $0.0005 | 0.5s | p. 7 |
| Small | 463 | 61 | $0.0003 | 0.4s | p. 7 |
| Large | 703 | 116 | $0.0005 | 0.6s | p. 7, p. 10 |
| Semantic | 446 | 75 | $0.0003 | 0.4s | p. 7 |

### Comparison Summary (from dashboard)

| Strategy | Avg Score | Avg Cohere | Cost | Time | Cited Pages |
|---|---|---|---|---|---|
| Fixed | 0.512 | 0.000 | $0.0005 | 0.5s | 7 |
| Small | 0.538 | 0.002 | $0.0003 | 0.4s | 7 |
| Large | 0.512 | 0.000 | $0.0005 | 0.6s | 7, 10 |
| Semantic | 0.543 | 0.031 | $0.0003 | 0.4s | 7 |

**Agreement:** All 4 strategies agree on page 7 as the primary source. Large chunking additionally surfaced page 10 (a related `declareWinner` function), giving slightly broader context at the cost of a longer, less focused answer.

**Observations:**
- Semantic chunking had the highest average score (0.543) and highest average Cohere relevance (0.031) on this question, while also being among the cheapest ($0.0003) and fastest (0.4s)
- Small chunking was a close second on score (0.538) at the same cost/speed tier as Semantic
- Fixed and Large scored identically on average score (0.512) and Cohere score (0.000), but Large used noticeably more output tokens (116 vs 78) to produce a longer answer, increasing cost without a clear quality gain for this question
- Cohere relevance scores were very low across all strategies on this run (0.000–0.031), suggesting the reranker found limited additional value to add over the existing retrieval order for this particular question

---

## 3. Test Run 2 — `Chapter7_CodeOptimization_CodeGeneration.pdf`

**Question:** "What is a Basic Block?"
**Reranking:** Enabled
**Note:** Ingestion was incomplete at time of capture — Fixed strategy showed "Not ingested" (3/4 strategies completed: Small, Large, Semantic)

### Per-Strategy Results

| Strategy | Input Tokens | Output Tokens | Cost | Response Time | Cited Pages |
|---|---|---|---|---|---|
| Fixed | — | — | $0.0000 | 0.0s | Not ingested |
| Small | 581 | 56 | $0.0004 | 0.4s | p. 3 |
| Large | 981 | 65 | $0.0006 | 0.5s | p. 3 |
| Semantic | 784 | 57 | $0.0005 | 0.4s | p. 3 |

### Comparison Summary (from dashboard)

| Strategy | Avg Score | Avg Cohere | Cost | Time | Cited Pages |
|---|---|---|---|---|---|
| Fixed | — | — | $0.0000 | 0.0s | — |
| Small | 0.722 | 0.992 | $0.0004 | 0.4s | 3 |
| Large | 0.687 | 0.961 | $0.0006 | 0.5s | 3 |
| Semantic | 0.728 | 0.987 | $0.0005 | 0.4s | 3 |

**Observations:**
- Semantic chunking again scored highest on average score (0.728), narrowly ahead of Small (0.722)
- Cohere relevance scores were very high across all three completed strategies (0.961–0.992) for this question, in sharp contrast to Test Run 1 — indicating reranking added strong confirming signal here, likely because "Basic Block" is a precise technical term with a clearly matching definition in the source text
- Large chunking used the most input tokens (981) for the lowest score (0.687), the least token-efficient result in this run
- Small chunking was the cheapest ($0.0004) while still scoring competitively, making it the best cost-to-quality result for this question

---

## 4. Cross-Run Findings

1. **Semantic chunking performed best or tied-best on average score in both test runs**, while remaining among the cheapest and fastest options. This suggests respecting natural paragraph/sentence boundaries produces chunks that align well with how questions are phrased, rather than cutting mid-thought at arbitrary character counts.

2. **Large chunking was consistently the most expensive and slowest**, without a corresponding quality advantage in either run. It also produced longer, more verbose answers (more output tokens) without a meaningfully better score — in Test Run 1 it tied Fixed on score while costing more in output tokens.

3. **Small chunking was a strong, cheap performer in both runs** — competitive scores at the lowest or near-lowest cost. This makes sense given its smaller, more targeted chunks are more likely to closely match a specific question.

4. **Cohere reranking's added value varied significantly by question.** On Test Run 1's broader/structural question ("what is in task 3"), Cohere scores were near zero, suggesting limited reranking benefit. On Test Run 2's precise definitional question ("What is a Basic Block?"), Cohere scores were very high (0.96+), suggesting reranking strongly confirmed retrieval quality. This implies reranking is most valuable for specific, well-defined factual questions, and less impactful for broader/multi-part questions.

5. **All strategies that completed ingestion agreed on the primary cited page** in both test runs (page 7 in Run 1, page 3 in Run 2), which is a good sign that the underlying retrieval pipeline is consistent regardless of chunking approach — the differences show up in answer completeness, cost, and confidence scores rather than in finding fundamentally different source material.

---

## 5. Recommendation

For this document type (structured technical/educational PDFs), **Semantic chunking** is the recommended default — it delivered the best or near-best retrieval scores in both tests while keeping cost and response time low. **Small chunking** is a strong, cheaper alternative when ingestion speed/cost matters more than squeezing out the last bit of retrieval quality. **Large chunking** is not recommended as a default — it consistently cost more without a clear quality benefit in these tests.

**On reranking:** Keep Cohere reranking enabled by default, since it added negligible cost and, on at least one test question, provided strong confirming signal on retrieval quality. Its value appears highest for precise, factual questions and lower for broad or multi-part questions — but it never appeared to hurt result quality in either run.

---

## 6. Notes / Limitations

- Test Run 2 was captured with ingestion incomplete (Fixed strategy not yet processed) — a full 4-way comparison for this document should be re-run once ingestion finishes, and this report updated accordingly
- Only one question was tested per document in the captured data; a more statistically reliable comparison would test 5-10 questions per document, as originally planned, and average results across all of them
- Sample size (2 questions across 2 documents) is small — findings here are directional, not conclusive, and should be validated with a larger test question set before drawing firm production recommendations
