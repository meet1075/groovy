import { Pinecone } from "@pinecone-database/pinecone";

let pinecone = null;
const indexes = {};

const INDEX_GEMINI = "retrieval-lab";
const INDEX_GROQ = "retrieval-lab-groq";

const INDEXES = {
  gemini: { name: INDEX_GEMINI, dimension: 3072 },
  groq: { name: INDEX_GROQ, dimension: 768 },
};

export async function initPinecone() {
  if (pinecone) return;

  pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

  const existingIndexes = await pinecone.listIndexes();
  const existingNames = new Set(existingIndexes.indexes?.map((i) => i.name) || []);

  for (const [provider, config] of Object.entries(INDEXES)) {
    if (!existingNames.has(config.name)) {
      console.log(`Creating Pinecone index "${config.name}" (${config.dimension}d)...`);
      await pinecone.createIndex({
        name: config.name,
        dimension: config.dimension,
        metric: "cosine",
        spec: { serverless: { cloud: "aws", region: "us-east-1" } },
      });
      await new Promise((r) => setTimeout(r, 5000));
    }
    indexes[provider] = pinecone.index(config.name);
  }
}

function getIndex(provider = "gemini") {
  return indexes[provider] || indexes.gemini;
}

export async function upsertChunks(namespace, chunks, embeddings, provider = "gemini") {
  await initPinecone();
  const idx = getIndex(provider);

  const vectors = chunks.map((chunk, i) => ({
    id: `${namespace}-chunk-${chunk.chunkIndex}`,
    values: embeddings[i],
    metadata: {
      pageNumber: chunk.pageNumber,
      chunkIndex: chunk.chunkIndex,
      strategy: chunk.strategy,
      text: chunk.text.slice(0, 1000),
    },
  }));

  for (let i = 0; i < vectors.length; i += 100) {
    await idx.namespace(namespace).upsert({ records: vectors.slice(i, i + 100) });
  }
}

export async function queryChunks(namespace, queryEmbedding, topK = 3, provider = "gemini") {
  await initPinecone();
  const idx = getIndex(provider);

  const results = await idx.namespace(namespace).query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
  });

  return results.matches.map((match) => ({
    id: match.id,
    score: match.score,
    pageNumber: match.metadata.pageNumber,
    text: match.metadata.text,
  }));
}
