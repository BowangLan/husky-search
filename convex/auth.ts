import { MutationCtx, QueryCtx } from "./_generated/server";

const ValidEmailDomains = [
  "u.washington.edu",
  "uw.edu",
  "cs.washington.edu",
]

export const isStudent = async (ctx: MutationCtx | QueryCtx) => {
  const user = await ctx.auth.getUserIdentity();

  if (!user) {
    return false;
  }

  return ValidEmailDomains.some(domain => user.email?.endsWith(domain));
}