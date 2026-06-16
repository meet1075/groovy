import { Pinecone } from "@pinecone-database/pinecone";

let pinecone = null;
let index = null;

const INDEX_NAME = "doc-qa";

export async function initPinecone() {
  if (index) return index;

  pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

  const existingIndexes = await pinecone.listIndexes();
  const exists = existingIndexes.indexes?.some((i) => i.name === INDEX_NAME);

  if (!exists) {
    await pinecone.createIndex({
      name: INDEX_NAME,
      dimension: 3072,
      metric: "cosine",
      spec: { serverless: { cloud: "aws", region: "us-east-1" } },
    });
    // Wait for index to be ready
    await new Promise((r) => setTimeout(r, 5000));
  }

  index = pinecone.index(INDEX_NAME);
  return index;
}

export async function upsertChunks(namespace, chunks, embeddings) {
  const idx = await initPinecone();
  const vectors = chunks.map((chunk, i) => ({
    id: `${namespace}-chunk-${chunk.chunkIndex}`,
    values: embeddings[i],
    metadata: {
      pageNumber: chunk.pageNumber,
      chunkIndex: chunk.chunkIndex,
      text: chunk.text.slice(0, 1000),
    },
  }));

  // Upsert in batches of 100
  for (let i = 0; i < vectors.length; i += 100) {
    await idx.namespace(namespace).upsert({ records: vectors.slice(i, i + 100) });
  }
}

export async function queryChunks(namespace, queryEmbedding, topK = 3) {
  const idx = await initPinecone();
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
