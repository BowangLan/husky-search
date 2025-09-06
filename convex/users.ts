import { query } from "./_generated/server";

export const getProfile = query({
  args: {},
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();

    console.log("user", user)

    if (!user) {
      return null;
    }

    return user;
  },
});