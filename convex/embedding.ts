import { OpenAI } from "openai";

export const createEmbedding = async (text: string | string[]) => {
  const openai = new OpenAI();
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    encoding_format: "float",
  });
  return embedding.data;
}