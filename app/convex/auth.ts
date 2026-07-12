import type { UserIdentity } from "convex/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";

export type AuthenticatedCtx = Pick<QueryCtx | MutationCtx, "auth" | "db">;

const localDevelopmentIdentity: UserIdentity = {
  tokenIdentifier: "local-development|cerno",
  subject: "cerno-local-development",
  issuer: "local-development",
  name: "Local developer",
  email: "local@cerno.dev",
  emailVerified: true,
};

export async function requireIdentity(ctx: Pick<AuthenticatedCtx, "auth">) {
  const identity = await ctx.auth.getUserIdentity();
  if (identity) return identity;
  if (process.env.AUTH_DISABLED === "true") return localDevelopmentIdentity;
  throw new Error("Authentication required.");
}

export async function currentWorkspace(ctx: AuthenticatedCtx) {
  const identity = await requireIdentity(ctx);
  const workspace = await ctx.db
    .query("workspaces")
    .withIndex("by_key", (q) => q.eq("key", identity.tokenIdentifier))
    .unique();
  return { identity, workspace };
}

export async function requireWorkspace(ctx: AuthenticatedCtx) {
  const { identity, workspace } = await currentWorkspace(ctx);
  if (!workspace) throw new Error("Your workspace is not initialized.");
  return { identity, workspace };
}
