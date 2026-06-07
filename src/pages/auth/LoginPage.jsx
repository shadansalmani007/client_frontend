import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LockKeyhole, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getCurrentUser, googleLogin, loginCustomer } from "../../api/auth.api.js";
import { GoogleSignInButton } from "../../components/GoogleSignInButton.jsx";
import { ErrorAlert } from "../../components/ErrorAlert.jsx";
import { useAuthStore } from "../../store/auth.store.js";
import { useUiStore } from "../../store/ui.store.js";
import { queryKeys } from "../../utils/queryKeys.js";

export function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const addToast = useUiStore((state) => state.addToast);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function finishLogin(data, redirectOverride) {
    const token = data?.accessToken ?? data?.token ?? data?.data?.token ?? null;
    let user = data?.user ?? data?.customer ?? data?.data?.user ?? null;

    if (!token) {
      throw new Error("Login succeeded but no access token was returned.");
    }

    setAuth({ token, user });

    if (!user) {
      try {
        const currentUser = await queryClient.fetchQuery({
          queryFn: getCurrentUser,
          queryKey: queryKeys.authUser,
        });
        user = currentUser?.user ?? currentUser ?? null;
      } catch {
        user = null;
      }
    }

    setAuth({ token, user });

    addToast({
      type: "success",
      title: "Welcome back",
      message: data?.message || "Login successful.",
    });

    await queryClient.invalidateQueries({ queryKey: queryKeys.authUser });

    navigate(redirectOverride || searchParams.get("redirectTo") || "/search", {
      replace: true,
    });
  }

  const loginMutation = useMutation({
    mutationFn: loginCustomer,
    onSuccess: (data) => finishLogin(data),
  });

  const googleLoginMutation = useMutation({
    mutationFn: googleLogin,
    onSuccess: (data) => finishLogin(data),
  });

  function handleGoogleSuccess(response) {
    if (!response?.credential) {
      addToast({
        type: "error",
        title: "Google sign-in failed",
        message: "Google did not return a valid sign-in credential.",
      });
      return;
    }

    googleLoginMutation.mutate(response.credential);
  }

  function handleGoogleError() {
    addToast({
      type: "error",
      title: "Google sign-in failed",
      message: "Google authentication could not be completed. Please try again.",
    });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-xl lg:grid-cols-[0.95fr_1.05fr]">
        <div className="bg-[linear-gradient(135deg,#922233_0%,#cf3d4f_55%,#f9738b_100%)] p-8 text-white sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/75">
            Customer Login
          </p>
          <h1 className="mt-6 text-4xl font-black tracking-tight">
            Continue your booking journey.
          </h1>
          <p className="mt-4 max-w-md text-base leading-8 text-white/85">
            Sign in with your email and password to manage bookings, checkout,
            verify payments, and update your profile.
          </p>
        </div>

        <div className="p-8 sm:p-10">
          <div className="mx-auto max-w-md">
            <h2 className="text-3xl font-bold text-slate-900">Login</h2>
            <p className="mt-2 text-sm text-slate-500">
              Use your registered customer account.
            </p>

            <form onSubmit={handleSubmit((values) => loginMutation.mutate(values))} className="mt-8 space-y-5">
              <div>
                <label className="form-label">Email</label>
                <div className="input-shell">
                  <Mail className="input-icon" />
                  <input
                    type="email"
                    className="form-input form-input-with-icon"
                    {...register("email", {
                      required: "Email is required.",
                      pattern: {
                        value: /\S+@\S+\.\S+/,
                        message: "Please enter a valid email.",
                      },
                    })}
                  />
                </div>
                {errors.email ? <p className="form-error">{errors.email.message}</p> : null}
              </div>

              <div>
                <label className="form-label">Password</label>
                <div className="input-shell">
                  <LockKeyhole className="input-icon" />
                  <input
                    type="password"
                    className="form-input form-input-with-icon"
                    {...register("password", {
                      required: "Password is required.",
                      minLength: {
                        value: 8,
                        message: "Password must be at least 8 characters.",
                      },
                    })}
                  />
                </div>
                {errors.password ? (
                  <p className="form-error">{errors.password.message}</p>
                ) : null}
              </div>

              {loginMutation.error ? <ErrorAlert error={loginMutation.error} /> : null}

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="inline-flex w-full items-center justify-center rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loginMutation.isPending ? "Signing in..." : "Login"}
              </button>
            </form>

            {googleClientId ? (
              <>
                <div className="my-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                    or
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <GoogleSignInButton
                  isLoading={googleLoginMutation.isPending}
                  onError={handleGoogleError}
                  onSuccess={handleGoogleSuccess}
                />

                {googleLoginMutation.error ? (
                  <div className="mt-4">
                    <ErrorAlert
                      error={googleLoginMutation.error}
                      title="Google sign-in failed"
                    />
                  </div>
                ) : null}
              </>
            ) : import.meta.env.DEV ? (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Google sign-in is hidden because <code>VITE_GOOGLE_CLIENT_ID</code> is not
                loaded at runtime. Putting it in <code>.env.example</code> is not enough.
                Add it to <code>.env</code> or <code>.env.local</code>, then restart the
                Vite dev server.
              </div>
            ) : null}

            <p className="mt-6 text-sm text-slate-500">
              New customer?{" "}
              <Link to="/signup" className="font-semibold text-brand-500">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
