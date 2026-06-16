# Embeddings Exercise

A standalone Node.js script that demonstrates generating text embeddings with Google Gemini, storing them in JSON, and searching using cosine similarity — optionally powered by Groq for answer generation.

## What This Teaches

- How text embeddings work (converting text → vector of numbers)
- How cosine similarity measures semantic closeness between vectors
- The retrieval pattern: embed → search → retrieve → generate

## Setup

```bash
npm install
cp .env.example .env
# Add your API keys to .env
```

### Required API Keys

| Key | Source | Purpose |
|-----|--------|---------|
| `GEMINI_API_KEY` | Google AI Studio | Generate embeddings (free) |
| `GROQ_API_KEY` | Groq | Generate answers (optional) |

## Usage

### Step 1: Generate Embeddings

```bash
node generate-embeddings.js
```

This calls the Gemini `gemini-embedding-001` model for each sample text snippet and saves the results to `embeddings.json`.

Output:
```
Generating embeddings for 8 snippets...

  [1/8] Embedding: "Python is a versatile programming language known for its si..." ✓ (3072 dimensions)
  [2/8] Embedding: "JavaScript is the most popular language for web developmen..." ✓ (3072 dimensions)
  ...

Saved 8 embeddings to embeddings.json
```

### Step 2: Search with Cosine Similarity

```bash
node search.js "What is the topic about cooking?"
```

This generates an embedding for your query, computes cosine similarity against all stored snippets, and prints ranked results.

Output:
```
Loaded 8 embeddings from embeddings.json

Generating embedding for query... ✓ (3072 dimensions)

──────────────────────────────────────────────────────────────────────
COSINE SIMILARITY RESULTS
──────────────────────────────────────────────────────────────────────
Query: "What is the topic about cooking?"

  0.8312  ██████████████████████████
        "Cooking pasta requires boiling salted water and cooking the..."

  0.4521  ██████████████
        "Regular exercise improves cardiovascular health, strengthens..."

  0.2103  ██████
        "The stock market can be volatile and unpredictable..."
  ...

──────────────────────────────────────────────────────────────────────
GROQ ANSWER (using most similar snippet as context)
──────────────────────────────────────────────────────────────────────

Answer: To cook pasta, boil salted water and cook until al dente...
```

## How Cosine Similarity Works

The formula: `cos(A, B) = (A · B) / (||A|| × ||B||)`

```
1. Dot product:    sum of A[i] * B[i] for all dimensions
2. Magnitude A:    sqrt(sum of A[i]^2)
3. Magnitude B:    sqrt(sum of B[i]^2)
4. Cosine score:   dot_product / (magnitude_A * magnitude_B)
```

- **1.0** = identical direction (same meaning)
- **0.0** = orthogonal (unrelated)
- **-1.0** = opposite direction

The search script prints the full math breakdown for the top result so you can see the numbers.

## Sample Dataset

The 8 snippets cover these topics:
1. Python programming
2. JavaScript programming
3. Cooking pasta
4. The Eiffel Tower
5. Machine learning / AI
6. Amazon rainforest
7. Exercise and health
8. Stock market investing

Related topics (Python, JavaScript, ML) cluster together. Unrelated topics (cooking, Eiffel Tower) score lower against tech queries.

## Files

| File | Description |
|------|-------------|
| `generate-embeddings.js` | Creates `embeddings.json` from sample data |
| `search.js` | Queries embeddings using cosine similarity |
| `embeddings.json` | Generated output (created by step 1) |
| `.env` | API keys (not committed) |
