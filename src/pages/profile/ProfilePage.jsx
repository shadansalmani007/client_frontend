import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { getProfile, updateProfile } from "../../api/customer.api.js";
import { ErrorAlert } from "../../components/ErrorAlert.jsx";
import { LoadingState } from "../../components/LoadingState.jsx";
import { useAuthStore } from "../../store/auth.store.js";
import { useUiStore } from "../../store/ui.store.js";
import { queryKeys } from "../../utils/queryKeys.js";

export function ProfilePage() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  const addToast = useUiStore((state) => state.addToast);

  const profileQuery = useQuery({
    queryKey: queryKeys.profile,
    queryFn: getProfile,
  });

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (profileQuery.data) {
      reset({
        name: profileQuery.data.name || "",
        email: profileQuery.data.email || "",
        phone: profileQuery.data.phone || "",
      });
    }
  }, [profileQuery.data, reset]);

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: async (data) => {
      setUser(data);
      addToast({
        type: "success",
        title: "Profile updated",
        message: "Your profile details were saved successfully.",
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.profile }),
        queryClient.invalidateQueries({ queryKey: queryKeys.authUser }),
      ]);
    },
  });

  if (profileQuery.isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <LoadingState label="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-500">
          Profile
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Your customer profile</h1>
        <p className="mt-2 text-sm text-slate-500">
          View your saved account details and keep your contact information up to date.
        </p>

        <form
          onSubmit={handleSubmit((values) =>
            updateMutation.mutate({
              name: values.name,
              phone: values.phone,
            }),
          )}
          className="mt-8 space-y-5"
        >
          {profileQuery.error ? <ErrorAlert error={profileQuery.error} /> : null}
          {updateMutation.error ? <ErrorAlert error={updateMutation.error} /> : null}

          <div>
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              {...register("name", {
                required: "Full name is required.",
              })}
            />
            {errors.name ? <p className="form-error">{errors.name.message}</p> : null}
          </div>

          <div>
            <label className="form-label">Email</label>
            <input type="email" className="form-input bg-slate-50" disabled {...register("email")} />
          </div>

          <div>
            <label className="form-label">Phone</label>
            <input
              type="tel"
              className="form-input"
              {...register("phone", {
                required: "Phone number is required.",
                pattern: {
                  value: /^[0-9+\s-]{8,15}$/,
                  message: "Please enter a valid phone number.",
                },
              })}
            />
            {errors.phone ? <p className="form-error">{errors.phone.message}</p> : null}
          </div>

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="inline-flex w-full items-center justify-center rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {updateMutation.isPending ? "Saving..." : "Save profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
