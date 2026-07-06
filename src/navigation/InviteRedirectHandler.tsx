import { useEffect } from "react";
import { useAuth } from "@providers/AuthProvider/AuthContext";
import { getPendingInvite, clearPendingInvite } from "@features/invite/services";
import { navigationRef } from "./navigationRef";

/**
 * Consumes a pending invite deep link once the user is authenticated. A
 * logged-out user who opens `dishlist://invite/:token` has the token stashed by
 * AuthContext (InviteLanding lives in the authenticated stack only); when they
 * finish signing in this routes them to it. Renders nothing.
 */
export default function InviteRedirectHandler() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    void (async () => {
      const token = await getPendingInvite();
      if (!token || cancelled) return;
      // Clear before navigating so a failed/duplicate mount can't loop.
      await clearPendingInvite();
      if (!cancelled && navigationRef.isReady()) {
        navigationRef.navigate("InviteLanding", { token });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return null;
}
