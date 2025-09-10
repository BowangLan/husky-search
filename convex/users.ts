import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { userFields } from "./schema";

export const getProfile = query({
  args: {},
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();

    if (!user) {
      return null;
    }

    return user;
  },
});

export const upsertUser = internalMutation({
  args: {
    ...userFields,
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.query("users").withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId)).first();
    if (user) {
      await ctx.db.patch(user._id, args);
    } else {
      await ctx.db.insert("users", args);
    }
    return args;
  },
});

export const deleteUser = internalMutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.query("users").withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId)).first();
    if (user) {
      await ctx.db.delete(user._id);
    }
  },
});

export const getUserByClerkId = internalQuery({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.query("users").withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId)).first();
  },
});

export const getUserByEmail = internalQuery({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", args.email)).first();
  },
});