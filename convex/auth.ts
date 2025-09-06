import { MutationCtx, query, QueryCtx } from "./_generated/server";

const ValidEmailDomains = [
  "u.washington.edu",
  "uw.edu",
  "cs.washington.edu",
]

export const isStudentHelper = async (ctx: MutationCtx | QueryCtx) => {
  const user = await ctx.auth.getUserIdentity();

  if (!user) {
    return false;
  }

  return ValidEmailDomains.some(domain => user.email?.endsWith(domain));
}

export const isStudent = query({
  args: {},
  handler: async (ctx, args) => {
    return await isStudentHelper(ctx);
  }
})