"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";

type Props = {
  children: React.ReactNode;
};

/**
 * Wraps the app when NEXT_PUBLIC_GOOGLE_CLIENT_ID is set.
 * OAuth client secrets must never use NEXT_PUBLIC_* — only the client ID belongs in the browser.
 */
export function GoogleProviders({ children }: Props) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
  if (!clientId) {
    return <>{children}</>;
  }
  return <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>;
}
