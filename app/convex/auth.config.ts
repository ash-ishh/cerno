import type { AuthConfig } from "convex/server";

const projectId = process.env.FIREBASE_PROJECT_ID;

if (!projectId) {
  throw new Error("FIREBASE_PROJECT_ID must be configured in the Convex environment.");
}

export default {
  providers: [
    {
      domain: `https://securetoken.google.com/${projectId}`,
      applicationID: projectId,
    },
  ],
} satisfies AuthConfig;
