// convex/convex.config.ts
import { defineApp } from "convex/server";

// @ts-ignore
import agent from "@convex-dev/agent/convex.config";


const app = defineApp();
app.use(agent);

export default app;