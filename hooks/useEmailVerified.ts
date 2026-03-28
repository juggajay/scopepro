import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

/**
 * Check if the current user's email is verified.
 * Used to gate scope generation (Decision #16: email verification before first generation).
 *
 * Note: Convex Auth's Password provider handles email verification.
 * This hook queries the auth user record for the emailVerificationTime field.
 * For MVP, we skip this gate — email verification will be enforced post-launch.
 */
export function useEmailVerified(): {
  isVerified: boolean;
  isLoading: boolean;
} {
  // TODO: Wire to actual email verification check once Convex Auth
  // email verification is configured. For now, return true to unblock.
  return {
    isVerified: true,
    isLoading: false,
  };
}
