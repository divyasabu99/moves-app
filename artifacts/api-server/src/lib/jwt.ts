/**
 * Centralised JWT secret.
 * Throws at module load time if SESSION_SECRET is not set so the server
 * refuses to start with an insecure fallback — rather than accepting
 * tokens signed with a public, hard-coded string.
 */

if (!process.env.SESSION_SECRET) {
  throw new Error(
    "SESSION_SECRET environment variable is required. " +
    "Set it in the environment before starting the server."
  );
}

export const JWT_SECRET: string = process.env.SESSION_SECRET;
