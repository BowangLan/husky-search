"use node"

import { components } from "./_generated/api";
import { Agent, createThread } from "@convex-dev/agent";
import { google } from "@ai-sdk/google";
import { action } from "./_generated/server";
import { v } from "convex/values";

const agent = new Agent(components.agent, {
  name: "Course Agent",
  languageModel: google.chat("gemini-2.5-flash"),
});

export const helloWorld = action({
  args: { prompt: v.string() },
  handler: async (ctx, { prompt }) => {
    const threadId = await createThread(ctx, components.agent);
    const result = await agent.generateText(ctx, { threadId }, { prompt });
    return result.text;
  },
});

import weaviate, { WeaviateClient } from 'weaviate-client';

const weaviateURL = process.env.WEAVIATE_URL as string;
const weaviateApiKey = process.env.WEAVIATE_API_KEY as string;


export const weaviateHealthCheck = action({
  handler: async (ctx) => {
    const client: WeaviateClient = await weaviate.connectToWeaviateCloud(weaviateURL, {
      authCredentials: new weaviate.ApiKey(weaviateApiKey),
    }
    )
    const isReady = await client.isReady()
    console.log("Weaviate is ready?", isReady)

    await client.close()
  },
})


export const wvIngestCourse = action({
  args: {
    course: v.object({
      courseCode: v.string(),
      courseName: v.string(),
      courseDescription: v.string(),
    }),
  },
  handler: async (ctx, args) => {
  },
})