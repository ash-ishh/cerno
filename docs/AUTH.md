# Cerno authentication

Cerno uses Firebase Google authentication in the browser and lets Convex verify the resulting Firebase ID token. There is no email or domain allowlist: any Google account can create its own isolated Cerno workspace.

## Flow

1. `FirebaseConvexProvider` observes Firebase ID-token state.
2. `ConvexProviderWithAuth` attaches the current Firebase token to every Convex request and realtime subscription.
3. `convex/auth.config.ts` verifies the token issuer and audience against `FIREBASE_PROJECT_ID`.
4. Public Convex functions require `ctx.auth.getUserIdentity()`.
5. `identity.tokenIdentifier` is the private workspace key. All reads and mutations verify that the requested record belongs to that workspace.

There is no email or domain allowlist. Any Google account can create its own isolated Cerno workspace.

## Local development without sign-in

Local development can use an explicit two-sided bypass:

```bash
# app/.env.local
VITE_AUTH_DISABLED=true

# Local Convex deployment
cd app
npx convex env set AUTH_DISABLED true
```

The browser bypass is also guarded by `import.meta.env.DEV`, so Vite removes it from production behavior. The backend bypass uses a fixed local-development identity and therefore still exercises normal workspace ownership checks.

Never set `AUTH_DISABLED` in a staging or production Convex deployment. Production builds always render the Firebase sign-in gate.

## Configuration

Copy `app/.env.example` to `app/.env.local` and provide the Firebase Web app values. Then set the Firebase project ID in each Convex deployment:

```bash
cd app
npx convex env set FIREBASE_PROJECT_ID your-firebase-project-id
```

The deployed Cerno hostname must also be listed in Firebase Authentication's authorized domains. Google must be enabled as a sign-in provider in the Firebase project.

## Existing pre-auth data

Workspaces created before authentication used a shared development key. They are intentionally not claimed automatically because doing so would let the first signed-in user take shared data. Every authenticated identity starts with a new private TasteDoc and archive seed. Migrate old development data explicitly if it must be retained.
