import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get user's default plan
export const getDefaultPlan = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const plan = await ctx.db
      .query("coursePlans")
      .withIndex("by_user_and_default", (q) =>
        q.eq("userId", identity.subject).eq("isDefault", true)
      )
      .first();

    return plan;
  },
});

// Get all plans for a user
export const getUserPlans = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const plans = await ctx.db
      .query("coursePlans")
      .withIndex("by_user_id", (q) => q.eq("userId", identity.subject))
      .collect();

    return plans;
  },
});

// Create new plan
export const createPlan = mutation({
  args: {
    name: v.optional(v.string()),
    isDefault: v.boolean(),
    terms: v.any(),
    plansByTerm: v.any(),
    activeTermIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // If this is set as default, unset other defaults
    if (args.isDefault) {
      const existingPlans = await ctx.db
        .query("coursePlans")
        .withIndex("by_user_id", (q) => q.eq("userId", identity.subject))
        .collect();

      for (const plan of existingPlans) {
        if (plan.isDefault) {
          await ctx.db.patch(plan._id, { isDefault: false });
        }
      }
    }

    const now = Date.now();
    const planId = await ctx.db.insert("coursePlans", {
      userId: identity.subject,
      name: args.name ?? "My Course Plan",
      isDefault: args.isDefault,
      terms: args.terms,
      plansByTerm: args.plansByTerm,
      activeTermIds: args.activeTermIds,
      createdAt: now,
      updatedAt: now,
      version: 1,
    });

    return planId;
  },
});

// Update existing plan
export const updatePlan = mutation({
  args: {
    planId: v.id("coursePlans"),
    terms: v.optional(v.any()),
    plansByTerm: v.optional(v.any()),
    activeTermIds: v.optional(v.array(v.string())),
    version: v.number(), // For optimistic concurrency control
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existingPlan = await ctx.db.get(args.planId);
    if (!existingPlan) throw new Error("Plan not found");
    if (existingPlan.userId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    // Version check for conflict detection
    if (existingPlan.version !== args.version) {
      throw new Error("Plan has been modified by another device");
    }

    const updates: any = {
      updatedAt: Date.now(),
      version: existingPlan.version + 1,
    };

    if (args.terms !== undefined) updates.terms = args.terms;
    if (args.plansByTerm !== undefined) updates.plansByTerm = args.plansByTerm;
    if (args.activeTermIds !== undefined) updates.activeTermIds = args.activeTermIds;

    await ctx.db.patch(args.planId, updates);

    return { success: true, version: updates.version };
  },
});

// Delete plan
export const deletePlan = mutation({
  args: {
    planId: v.id("coursePlans"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const plan = await ctx.db.get(args.planId);
    if (!plan) throw new Error("Plan not found");
    if (plan.userId !== identity.subject) throw new Error("Unauthorized");

    await ctx.db.delete(args.planId);
    return { success: true };
  },
});

// Set active terms (marks which quarters are "current enrollment")
export const setActiveTerms = mutation({
  args: {
    planId: v.id("coursePlans"),
    activeTermIds: v.array(v.string()),
    version: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const plan = await ctx.db.get(args.planId);
    if (!plan) throw new Error("Plan not found");
    if (plan.userId !== identity.subject) throw new Error("Unauthorized");
    if (plan.version !== args.version) {
      throw new Error("Plan has been modified");
    }

    await ctx.db.patch(args.planId, {
      activeTermIds: args.activeTermIds,
      updatedAt: Date.now(),
      version: plan.version + 1,
    });

    return { success: true, version: plan.version + 1 };
  },
});
