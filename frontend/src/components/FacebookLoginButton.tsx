"use client";

import FacebookLogin from "@greatsumini/react-facebook-login";

import { oauthButtonClass, oauthProviderRowClass } from "./oauthButtonStyles";

function FacebookIcon() {
  return (
    <svg
      className="h-[18px] w-[18px] shrink-0"
      viewBox="0 0 24 24"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#1877F2"
        d="M9.101 23.691v-9.294H6.917v-3.377h2.184v-2.018c0-2.026 1.194-4.249 4.24-4.249 1.223 0 2.129.118 2.129.118l-.071 3.15s-.964-.031-2.016-.031c-1.096 0-1.274.509-1.274 1.352v1.678h3.42l-.136 3.377h-3.284v9.294H9.101z"
      />
    </svg>
  );
}

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
    <div className={oauthProviderRowClass}>
      <div className="flex w-full justify-center">
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
              className={oauthButtonClass}
            >
              <FacebookIcon />
              <span>Continue with Facebook</span>
            </button>
          )}
        />
      </div>
    </div>
  );
}
