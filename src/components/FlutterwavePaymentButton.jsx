import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, ShieldCheck, Smartphone, WalletCards } from "lucide-react";
import { closePaymentModal, useFlutterwave } from "flutterwave-react-v3";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { verifyFlutterwavePayment } from "../api/payment.api.js";
import likiliMarkUrl from "../assets/likili-mark.svg";
import { useUiStore } from "../store/ui.store.js";
import { getBookingNumber, getBookingNumberValue } from "../utils/booking.js";
import { queryKeys } from "../utils/queryKeys.js";

const MOBILE_MONEY_NETWORKS = [
  {
    code: "AIRTEL",
    id: "airtel-money",
    label: "Airtel Money",
    description: "Pay from your Airtel Zambia mobile money wallet.",
  },
  {
    code: "MTN",
    id: "mtn-money",
    label: "MTN Money",
    description: "Use your MTN mobile money number for checkout.",
  },
  {
    code: "ZAMTEL",
    id: "zamtel-money",
    label: "Zamtel Money",
    description: "Complete payment with your Zamtel mobile money wallet.",
  },
];

function getPendingNetworkStorageKey(bookingId) {
  return `flw-selected-network-${bookingId}`;
}

function getRedirectBaseUrl() {
  if (typeof window === "undefined") {
    return "";
  }

  return `${window.location.origin}${window.location.pathname}`;
}

function getVerificationData(payload) {
  return payload?.data ?? payload ?? {};
}

function getResolvedBookingId(payload, fallbackBookingId) {
  const data = getVerificationData(payload);

  return (
    data?.booking?._id ||
    data?.booking?.id ||
    data?.ticket?.booking?._id ||
    data?.ticket?.booking?.id ||
    data?.bookingId ||
    fallbackBookingId
  );
}

function normalizeVerifiedBookingDetails(payload) {
  const data = getVerificationData(payload);
  const ticket = data?.ticket && typeof data.ticket === "object" ? data.ticket : null;
  const bookingSource = data?.booking || data?.ticket?.booking || ticket;
  const booking =
    ticket && bookingSource && ticket !== bookingSource
      ? { ...bookingSource, ticket }
      : bookingSource;
  const payments = Array.isArray(data?.payments)
    ? data.payments
    : Array.isArray(booking?.payments)
      ? booking.payments
      : data?.payment
        ? [data.payment]
        : data?.ticket?.payment
          ? [data.ticket.payment]
          : [];

  if (!booking && !payments.length) {
    return null;
  }

  return {
    booking: booking || {},
    payments,
    seatAvailability: data?.seatAvailability ?? null,
    meta: data?.meta ?? payload?.meta ?? {},
    message: payload?.message ?? data?.message ?? "",
  };
}

export function FlutterwavePaymentButton({
  bookingId,
  amount,
  currency = "ZMW",
  customerEmail,
  customerName,
  customerPhone,
  paymentId,
  onVerificationStateChange,
}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const addToast = useUiStore((state) => state.addToast);
  const hasHandledRedirectRef = useRef(false);
  const publicKey = import.meta.env.VITE_FLW_PUBLIC_KEY?.trim();
  const [selectedNetwork, setSelectedNetwork] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return sessionStorage.getItem(getPendingNetworkStorageKey(bookingId)) || "";
  });
  const [phoneNumber, setPhoneNumber] = useState(customerPhone || "");
  const [selectionError, setSelectionError] = useState("");
  const [verificationNotice, setVerificationNotice] = useState(null);
  const redirectStatus = String(searchParams.get("status") || "").toLowerCase();
  const redirectTransactionId = searchParams.get("transaction_id");
  const redirectTxRef = searchParams.get("tx_ref");

  useEffect(() => {
    setPhoneNumber(customerPhone || "");
  }, [customerPhone]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storageKey = getPendingNetworkStorageKey(bookingId);

    if (selectedNetwork) {
      sessionStorage.setItem(storageKey, selectedNetwork);
      return;
    }

    sessionStorage.removeItem(storageKey);
  }, [bookingId, selectedNetwork]);

  useEffect(() => {
    hasHandledRedirectRef.current = false;
  }, [redirectStatus, redirectTransactionId, redirectTxRef]);

  const verifyMutation = useMutation({
    mutationFn: ({ transactionId, txRef }) =>
      verifyFlutterwavePayment(
        {
          transaction_id: transactionId,
          tx_ref: txRef,
          bookingId,
          amount: Number(amount) || 0,
          currency: currency || "ZMW",
        },
        {
          meta: {
            suppressGlobalErrorToast: true,
          },
        },
      ),
    onMutate: () => {
      setVerificationNotice(null);
    },
    onSuccess: async (payload, variables) => {
      const resolvedBookingId = getResolvedBookingId(payload, bookingId);
      const normalizedBookingDetails = normalizeVerifiedBookingDetails(payload);
      const verificationData = getVerificationData(payload);
      const resolvedBooking = normalizedBookingDetails?.booking || verificationData?.booking || {};
      const ticketNumber = getBookingNumberValue(resolvedBooking);
      const verifiedPayment =
        normalizedBookingDetails?.payments?.[0] || verificationData?.payment || null;
      const verifiedPaymentId =
        verifiedPayment?._id || verifiedPayment?.paymentId || paymentId || null;

      if (normalizedBookingDetails && resolvedBookingId) {
        queryClient.setQueryData(queryKeys.booking(resolvedBookingId), normalizedBookingDetails);
      }

      if (verifiedPaymentId && verifiedPayment) {
        queryClient.setQueryData(queryKeys.payment(verifiedPaymentId), verifiedPayment);
      }

      addToast({
        type: "success",
        title: "Payment verified",
        message: ticketNumber
          ? `${payload?.message || "Your Flutterwave payment was verified successfully."} Ticket No: ${getBookingNumber(resolvedBooking)}.`
          : payload?.message || "Your Flutterwave payment was verified successfully.",
      });

      if (typeof window !== "undefined") {
        sessionStorage.removeItem(getPendingNetworkStorageKey(bookingId));
      }

      await Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: queryKeys.booking(resolvedBookingId) }),
        queryClient.invalidateQueries({
          queryKey: verifiedPaymentId ? queryKeys.payment(verifiedPaymentId) : ["payment"],
        }),
        queryClient.invalidateQueries({ queryKey: ["my-bookings"] }),
      ]);

      navigate(`/bookings/${resolvedBookingId}`, {
        replace: true,
        state: {
          paymentSuccessful: true,
          ticketNumber: ticketNumber ? getBookingNumber(resolvedBooking) : "",
          transactionId: variables?.transactionId || null,
          txRef: variables?.txRef || null,
          verificationData,
        },
      });
    },
    onError: (error, variables) => {
      const txRef = variables?.txRef || "Unavailable";

      if (error?.status === null || error?.status === undefined) {
        const message =
          "Payment successful, but we could not verify it right now. Please contact support with your transaction reference.";

        setVerificationNotice({
          type: "warning",
          title: "Verification pending",
          message,
          txRef,
        });

        addToast({
          type: "error",
          title: "Verification pending",
          message: `${message} Reference: ${txRef}.`,
        });
        return;
      }

      const message =
        "Payment was received but verification failed. Please contact support.";
      setVerificationNotice({
        type: "error",
        title: "Verification failed",
        message,
        txRef,
      });

      addToast({
        type: "error",
        title: "Verification failed",
        message,
      });
    },
  });

  useEffect(() => {
    onVerificationStateChange?.(verifyMutation.isPending);
  }, [onVerificationStateChange, verifyMutation.isPending]);

  useEffect(
    () => () => {
      onVerificationStateChange?.(false);
    },
    [onVerificationStateChange],
  );

  useEffect(() => {
    if (!redirectStatus || hasHandledRedirectRef.current) {
      return;
    }

    if (redirectStatus === "successful" && redirectTransactionId && redirectTxRef) {
      hasHandledRedirectRef.current = true;
      verifyMutation.mutate({
        transactionId: redirectTransactionId,
        txRef: redirectTxRef,
      });
      setSearchParams({}, { replace: true });
      return;
    }

    if (redirectStatus === "cancelled" || redirectStatus === "failed") {
      hasHandledRedirectRef.current = true;
      addToast({
        type: "error",
        title: redirectStatus === "cancelled" ? "Payment cancelled" : "Payment failed",
        message:
          redirectStatus === "cancelled"
            ? "The Flutterwave payment was cancelled before completion."
            : "Flutterwave returned a failed payment status.",
      });
      setSearchParams({}, { replace: true });
    }
  }, [
    addToast,
    redirectStatus,
    redirectTransactionId,
    redirectTxRef,
    setSearchParams,
    verifyMutation,
  ]);

  const flutterwaveConfig = useMemo(
    () => ({
      amount: Number(amount) || 0,
      currency: currency || "ZMW",
      customer: {
        email: customerEmail || "",
        name: customerName || "",
        phone_number: phoneNumber || "",
      },
      customizations: {
        description: "Bus booking payment",
        logo: likiliMarkUrl,
        title: "Likili Motorways",
      },
      meta: {
        bookingId,
        selectedNetwork,
      },
      payment_options: "mobilemoneyzambia",
      public_key: publicKey || "",
      redirect_url: getRedirectBaseUrl(),
      tx_ref: `BUS-${bookingId}-${Date.now()}`,
    }),
    [amount, bookingId, currency, customerEmail, customerName, phoneNumber, publicKey, selectedNetwork],
  );

  const handleFlutterPayment = useFlutterwave(flutterwaveConfig);

  const handlePayNow = () => {
    if (!selectedNetwork) {
      const message = "Please select Airtel Money, MTN Money, or Zamtel Money first.";
      setSelectionError(message);
      addToast({
        type: "error",
        title: "Select mobile money",
        message,
      });
      return;
    }

    if (!publicKey) {
      addToast({
        type: "error",
        title: "Flutterwave key missing",
        message: "Add VITE_FLW_PUBLIC_KEY to your environment before testing checkout.",
      });
      return;
    }

    if (!amount || Number(amount) <= 0) {
      addToast({
        type: "error",
        title: "Invalid payment amount",
        message: "Flutterwave cannot start because this booking amount is missing.",
      });
      return;
    }

    if (!customerEmail || !customerName || !phoneNumber) {
      addToast({
        type: "error",
        title: "Customer details missing",
        message: "Customer name, email, and phone are required before payment can begin.",
      });
      return;
    }

    setSelectionError("");
    handleFlutterPayment({
      callback: (response) => {
        closePaymentModal();

        const responseStatus = String(response?.status || "").toLowerCase();

        if (responseStatus === "successful" || responseStatus === "completed") {
          const transactionId = response?.transaction_id || response?.id;

          if (!transactionId || !response?.tx_ref) {
            addToast({
              type: "error",
              title: "Verification data missing",
              message: "Flutterwave did not return enough data to verify this payment.",
            });
            return;
          }

          hasHandledRedirectRef.current = true;
          verifyMutation.mutate({
            transactionId,
            txRef: response.tx_ref,
          });
          return;
        }

        if (responseStatus === "cancelled") {
          addToast({
            type: "error",
            title: "Payment cancelled",
            message: "The Flutterwave payment was cancelled before completion.",
          });
          return;
        }

        addToast({
          type: "error",
          title: "Payment failed",
          message:
            response?.message || "Flutterwave did not return a successful payment response.",
        });
      },
      onClose: () => {
        // Keep the current checkout screen in place until backend verification succeeds.
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3">
        {MOBILE_MONEY_NETWORKS.map((network) => {
          const isActive = selectedNetwork === network.code;

          return (
            <button
              key={network.code}
              type="button"
              disabled={verifyMutation.isPending}
              onClick={() => {
                setSelectedNetwork(network.code);
                setSelectionError("");
              }}
              className={`flex items-start gap-4 rounded-[1.5rem] border p-4 text-left transition ${
                isActive
                  ? "border-brand-300 bg-brand-50 shadow-[0_12px_28px_rgba(207,61,79,0.12)]"
                  : "border-slate-200 bg-white hover:border-brand-200"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] bg-[#fff8dc] text-amber-700">
                <Smartphone className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">{network.label}</p>
                  {isActive ? (
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 ring-1 ring-slate-200">
                      Selected
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-500">{network.description}</p>
              </div>
              {isActive ? (
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
                  <Check className="h-4 w-4" />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {selectionError ? <p className="form-error">{selectionError}</p> : null}

      {verifyMutation.isPending ? (
        <div className="rounded-[1.5rem] border border-brand-200 bg-brand-50 p-4 text-sm text-brand-700">
          <p className="font-semibold">Verifying payment...</p>
          <p className="mt-2">
            Please wait while we confirm this payment with our server before showing your ticket.
          </p>
        </div>
      ) : null}

      {verificationNotice ? (
        <div
          className={`rounded-[1.5rem] border p-4 text-sm ${
            verificationNotice.type === "warning"
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <p className="font-semibold">{verificationNotice.title}</p>
          <p className="mt-2">{verificationNotice.message}</p>
          {verificationNotice.txRef ? (
            <p className="mt-2">
              Transaction reference: <span className="font-semibold">{verificationNotice.txRef}</span>
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
        <label className="form-label">Mobile money number</label>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(event) => setPhoneNumber(event.target.value)}
          disabled={verifyMutation.isPending}
          className="form-input"
          placeholder="e.g. 0971234567"
        />
        <p className="mt-2 text-sm text-slate-500">
          Flutterwave will use this number for the selected Zambia mobile money network.
        </p>
      </div>

      <div className="rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(135deg,#fffaf0_0%,#fff4c4_100%)] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
              Ready to pay
            </p>
            <p className="mt-3 text-3xl font-black text-slate-950">
              {currency} {Number(amount || 0).toFixed(2)}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 ring-1 ring-emerald-200">
            <ShieldCheck className="h-4 w-4" />
            Flutterwave inline
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handlePayNow}
        disabled={verifyMutation.isPending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#fde68a_0%,#fbbf24_100%)] px-5 py-3 text-sm font-bold text-slate-950 shadow-[0_16px_40px_rgba(251,191,36,0.28)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <WalletCards className="h-4 w-4" />
        {verifyMutation.isPending ? "Verifying payment..." : "Pay Now"}
      </button>
    </div>
  );
}
