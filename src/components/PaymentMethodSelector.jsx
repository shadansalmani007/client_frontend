import { PAYMENT_OPTIONS } from "../constants/payment-options.js";

export function PaymentMethodSelector({ register, error }) {
  return (
    <div>
      <label className="form-label">Payment Method</label>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {PAYMENT_OPTIONS.map((method) => (
          <label
            key={method.value}
            className="flex cursor-pointer items-start gap-3 rounded-[1.5rem] border border-slate-200 bg-white p-4 transition hover:border-brand-200"
          >
            <input
              type="radio"
              value={method.value}
              className="mt-1 h-4 w-4 accent-brand-500"
              {...register("paymentMethod", {
                required: "Please choose a payment method.",
              })}
            />
            <div>
              <p className="font-semibold text-slate-900">{method.label}</p>
              <p className="mt-1 text-sm text-slate-500">{method.description}</p>
            </div>
          </label>
        ))}
      </div>
      {error ? <p className="form-error">{error.message}</p> : null}
    </div>
  );
}
