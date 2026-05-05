"use client";

import FacebookLogin from "@greatsumini/react-facebook-login";

type FacebookLoginButtonProps = {
  disabled?: boolean;
  onAccessToken: (accessToken: string) => void;
  onError?: () => void;
};

export function FacebookLoginButton({
  disabled,
  onAccessToken,
  onError,
}: FacebookLoginButtonProps) {
  const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
  if (!appId) {
    return null;
  }

  return (
    <FacebookLogin
      appId={appId}
      language="en_US"
      scope="public_profile,email"
      onSuccess={(res) => onAccessToken(res.accessToken)}
      onFail={() => onError?.()}
      initParams={{ version: "v21.0", cookie: true, xfbml: false }}
      render={({ onClick }) => (
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className="w-full rounded-md border border-zinc-700 bg-zinc-900 py-2.5 text-sm font-medium text-zinc-50 transition hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-50"
        >
          Continue with Facebook
        </button>
      )}
    />
  );
}
