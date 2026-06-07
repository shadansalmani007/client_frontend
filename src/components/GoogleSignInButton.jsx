import { GoogleLogin } from "@react-oauth/google";
import { useEffect, useRef, useState } from "react";

function GoogleIcon({ className }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M21.805 10.023H12.18v3.955h5.514c-.238 1.273-.955 2.35-2.028 3.068v2.55h3.286c1.924-1.771 3.033-4.38 3.033-7.487 0-.696-.062-1.367-.18-2.086Z"
        fill="#4285F4"
      />
      <path
        d="M12.18 22c2.76 0 5.075-.914 6.766-2.473l-3.286-2.55c-.914.613-2.08.976-3.48.976-2.67 0-4.934-1.8-5.74-4.223H3.043v2.63A10.22 10.22 0 0 0 12.18 22Z"
        fill="#34A853"
      />
      <path
        d="M6.44 13.73a6.134 6.134 0 0 1-.322-1.955c0-.68.117-1.34.322-1.955v-2.63H3.043A10.217 10.217 0 0 0 2 11.775c0 1.647.395 3.205 1.043 4.585l3.398-2.63Z"
        fill="#FBBC05"
      />
      <path
        d="M12.18 5.598c1.5 0 2.85.516 3.91 1.53l2.93-2.93C17.25 2.55 14.94 1.55 12.18 1.55A10.22 10.22 0 0 0 3.043 7.19l3.398 2.63c.805-2.424 3.07-4.223 5.74-4.223Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function GoogleSignInButton({ isLoading = false, onError, onSuccess }) {
  const containerRef = useRef(null);
  const [buttonWidth, setButtonWidth] = useState(0);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

  useEffect(() => {
    const node = containerRef.current;

    if (!node) {
      return undefined;
    }

    const updateWidth = () => {
      setButtonWidth(Math.floor(node.getBoundingClientRect().width));
    };

    updateWidth();

    if (typeof ResizeObserver !== "function") {
      window.addEventListener("resize", updateWidth);
      return () => window.removeEventListener("resize", updateWidth);
    }

    const observer = new ResizeObserver(() => updateWidth());
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  if (!clientId) {
    return null;
  }

  return (
    <div className="rounded-[1.15rem] border border-slate-200 bg-white p-2.5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
      <div className="mb-2 flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-50 ring-1 ring-slate-200">
          <GoogleIcon className="h-4 w-4" />
        </div>
        <p className="text-xs font-medium text-slate-500">
          Continue with your Google account
        </p>
      </div>

      <div
        ref={containerRef}
        className="overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm"
      >
        {isLoading ? (
          <button
            type="button"
            disabled
            className="inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700"
          >
            <GoogleIcon className="h-4 w-4" />
            Signing you in...
          </button>
        ) : (
          <GoogleLogin
            auto_select
            logo_alignment="left"
            onError={onError}
            onSuccess={onSuccess}
            shape="pill"
            size="large"
            text="continue_with"
            theme="outline"
            width={String(buttonWidth || 320)}
          />
        )}
      </div>
    </div>
  );
}
