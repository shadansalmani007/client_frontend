import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LockKeyhole, Mail, Phone, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { registerCustomer } from "../../api/auth.api.js";
import { ErrorAlert } from "../../components/ErrorAlert.jsx";
import { useAuthStore } from "../../store/auth.store.js";
import { useUiStore } from "../../store/ui.store.js";
import { queryKeys } from "../../utils/queryKeys.js";

export function SignupPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);
  const addToast = useUiStore((state) => state.addToast);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const signupMutation = useMutation({
    mutationFn: registerCustomer,
    onSuccess: async (data) => {
      const user = data?.user ?? data;
      const token = data?.accessToken ?? data?.token;

      setAuth({ user, token });
      addToast({
        type: "success",
        title: "Account created",
        message: data?.message || "You are now signed in.",
      });

      await queryClient.invalidateQueries({ queryKey: queryKeys.authUser });
      navigate("/search", { replace: true });
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-xl lg:grid-cols-[0.95fr_1.05fr]">
        <div className="bg-slate-950 p-8 text-white sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/70">
            Customer Registration
          </p>
          <h1 className="mt-6 text-4xl font-black tracking-tight">
            Create your customer account.
          </h1>
          <p className="mt-4 max-w-md text-base leading-8 text-white/80">
            Register with your email and password to search trips, hold seats,
            pay for bookings, and view your tickets.
          </p>
        </div>

        <div className="p-8 sm:p-10">
          <div className="mx-auto max-w-md">
            <h2 className="text-3xl font-bold text-slate-900">Sign up</h2>
            <p className="mt-2 text-sm text-slate-500">
              Fill in your details to create a customer account.
            </p>

            <form
              onSubmit={handleSubmit(({ confirmPassword, ...values }) =>
                signupMutation.mutate(values),
              )}
              className="mt-8 space-y-5"
            >
              <InputField
                label="Full Name"
                icon={User}
                error={errors.name?.message}
                registration={register("name", {
                  required: "Full name is required.",
                })}
              />

              <InputField
                label="Email"
                icon={Mail}
                type="email"
                error={errors.email?.message}
                registration={register("email", {
                  required: "Email is required.",
                  pattern: {
                    value: /\S+@\S+\.\S+/,
                    message: "Please enter a valid email.",
                  },
                })}
              />

              <InputField
                label="Phone"
                icon={Phone}
                error={errors.phone?.message}
                registration={register("phone", {
                  required: "Phone number is required.",
                  pattern: {
                    value: /^[0-9+\s-]{8,15}$/,
                    message: "Please enter a valid phone number.",
                  },
                })}
              />

              <InputField
                label="Password"
                icon={LockKeyhole}
                type="password"
                error={errors.password?.message}
                registration={register("password", {
                  required: "Password is required.",
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters.",
                  },
                })}
              />

              <InputField
                label="Confirm Password"
                icon={LockKeyhole}
                type="password"
                error={errors.confirmPassword?.message}
                registration={register("confirmPassword", {
                  required: "Please confirm your password.",
                  validate: (value) =>
                    value === watch("password") || "Passwords do not match.",
                })}
              />

              {signupMutation.error ? <ErrorAlert error={signupMutation.error} /> : null}

              <button
                type="submit"
                disabled={signupMutation.isPending}
                className="inline-flex w-full items-center justify-center rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {signupMutation.isPending ? "Creating account..." : "Create account"}
              </button>
            </form>

            <p className="mt-6 text-sm text-slate-500">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-brand-500">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, icon: Icon, registration, error, type = "text" }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <div className="input-shell">
        <Icon className="input-icon" />
        <input type={type} className="form-input form-input-with-icon" {...registration} />
      </div>
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}
