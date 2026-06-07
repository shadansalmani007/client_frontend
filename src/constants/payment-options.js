export const PAYMENT_OPTIONS = [
  {
    value: "airtel_money",
    label: "Airtel Money",
    description: "Pay from your Airtel Money wallet with a mobile prompt.",
    providerType: "mobilemoney",
    highlight: "Popular",
  },
  {
    value: "mtn_money",
    label: "MTN Money",
    description: "Use your MTN wallet for a quick mobile money checkout.",
    providerType: "mobilemoney",
    highlight: "Fast",
  },
  {
    value: "zamtel",
    label: "Zamtel Money",
    description: "Complete ticket payment with your Zamtel wallet.",
    providerType: "mobilemoney",
    highlight: "Local",
  },
];

export function getPaymentOption(value) {
  return PAYMENT_OPTIONS.find((option) => option.value === value) || PAYMENT_OPTIONS[0];
}

export function getFlutterwavePaymentOptions(value) {
  const option = getPaymentOption(value);
  return option.providerType === "mobilemoney" ? "mobilemoney" : "mobilemoney";
}
