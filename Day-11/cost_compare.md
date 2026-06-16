# RAG vs. Full-Document: Cost & Performance Comparison

This document details a real-world cost and performance comparison between using a Retrieval-Augmented Generation (RAG) approach versus passing the entire document (Full-doc) as context.

## Cost Comparison Table

| Question | Approach | Input Tokens | Output Tokens | Cost | Response Time |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Blockchain characteristics | RAG | 721 | 154 | $0.0005 | 0.9s |
| Blockchain characteristics | Full-doc | 5,199 | 150 | $0.0032 | 1.4s |
| Centralized/decentralized/distributed | RAG | 847 | 162 | $0.0006 | 0.8s |
| Centralized/decentralized/distributed | Full-doc | 5,406 | 219 | $0.0034 | 1.4s |

---

## What the Data Shows

### 1. Input Tokens: RAG uses ~85% fewer tokens
RAG sent 721-847 input tokens (just the top-3 relevant chunks) versus full-doc's 5,199-5,406 tokens (the entire document every single time). This is the core efficiency gain of RAG — you're not re-sending the whole document on every question.

### 2. Cost: RAG is roughly 6x cheaper per query
*   **Query 1:** $0.0005 (RAG) vs $0.0032 (full-doc) → **6.4x cheaper**
*   **Query 2:** $0.0006 (RAG) vs $0.0034 (full-doc) → **5.7x cheaper**

### 3. Speed: RAG is noticeably faster
0.8-0.9s vs 1.4s — almost 2x faster, since less input means less processing time before generation starts.

### 4. Answer Quality: Roughly comparable, full-doc slightly more complete
Full-doc's second answer included the full comparison table verbatim, while RAG's answer described the table content in prose but didn't reproduce the table structure. For this document size, RAG retrieved enough context to answer well, but full-doc had access to everything and occasionally surfaced extra structured detail (like the table) that RAG's top-3 chunks may have just barely captured or paraphrased instead.

---

## The Real Insight: Scaling

This document is small enough (one page, ~5,400 tokens) that full-doc is still cheap in absolute terms (a third of a cent per query). The cost gap becomes dramatically more important as documents scale:

*   **Small Doc (this case, ~5K tokens):** Full-doc costs $0.003/query — trivial either way.
*   **Large Doc (50-page PDF, ~25K tokens):** Full-doc would cost ~$0.015/query just in input tokens, *every single question*, while RAG stays roughly flat around $0.0005-$0.0006 regardless of total document size, since it only ever sends the top-3 relevant chunks.
*   **At Scale (1000s of queries/day):** Full-doc costs scale linearly with `document size × query volume`; RAG costs stay nearly constant regardless of document size.
