import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listFeatures = query({
  args: {},
  handler: async (ctx) => {
    const features = await ctx.db.query("features").collect();
    return features;
  },
});

export const getFeature = query({
  args: {
    featureId: v.id("features"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.featureId);
  },
});

export const getUserVotes = query({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.auth.getUserIdentity();

    if (!user) {
      return [];
    }

    const votes = await ctx.db
      .query("userFeatureVotes")
      .withIndex("by_user_and_feature", (q) => q.eq("userId", user.subject))
      .collect();

    return votes;
  },
});

export const getFeatureVoteCounts = query({
  args: {},
  handler: async (ctx) => {
    const allVotes = await ctx.db.query("userFeatureVotes").collect();

    const voteCounts = allVotes.reduce((acc, vote) => {
      if (!acc[vote.featureId]) {
        acc[vote.featureId] = { upvotes: 0, downvotes: 0 };
      }
      if (vote.vote === "up") {
        acc[vote.featureId].upvotes += 1;
      } else {
        acc[vote.featureId].downvotes += 1;
      }
      return acc;
    }, {} as Record<string, { upvotes: number; downvotes: number }>);

    return voteCounts;
  },
});

export const voteOnFeature = mutation({
  args: {
    featureId: v.id("features"),
    vote: v.union(v.literal("up"), v.literal("down")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();

    if (!user) {
      throw new Error("User must be authenticated to vote");
    }

    // Check if user already voted on this feature
    const existingVote = await ctx.db
      .query("userFeatureVotes")
      .withIndex("by_user_and_feature", (q) =>
        q.eq("userId", user.subject).eq("featureId", args.featureId)
      )
      .first();

    if (existingVote) {
      // Update existing vote
      await ctx.db.patch(existingVote._id, {
        vote: args.vote,
      });
      return existingVote._id;
    } else {
      // Create new vote
      return await ctx.db.insert("userFeatureVotes", {
        userId: user.subject,
        featureId: args.featureId,
        vote: args.vote,
      });
    }
  },
});

export const removeVote = mutation({
  args: {
    featureId: v.id("features"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();

    if (!user) {
      throw new Error("User must be authenticated to remove vote");
    }

    const existingVote = await ctx.db
      .query("userFeatureVotes")
      .withIndex("by_user_and_feature", (q) =>
        q.eq("userId", user.subject).eq("featureId", args.featureId)
      )
      .first();

    if (existingVote) {
      await ctx.db.delete(existingVote._id);
    }
  },
});

export const suggestFeature = mutation({
  args: {
    name: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();

    if (!user) {
      throw new Error("User must be authenticated to suggest features");
    }

    return await ctx.db.insert("usetSuggestedFeatures", {
      userId: user.subject,
      name: args.name,
      description: args.description,
      status: "suggested",
    });
  },
});

export const getUserSuggestedFeatures = query({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.auth.getUserIdentity();

    if (!user) {
      return [];
    }

    const suggestions = await ctx.db
      .query("usetSuggestedFeatures")
      .withIndex("by_user_and_name", (q) => q.eq("userId", user.subject))
      .collect();

    return suggestions;
  },
});
