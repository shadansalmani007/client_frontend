import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { MapPin, Route, CalendarDays, Search, ArrowLeftRight } from "lucide-react";
import { getTodayDateValue, isPastDate } from "../utils/format.js";

function normalizeFormValues(values) {
  const today = getTodayDateValue();
  const date = isPastDate(values?.date, today) ? today : values?.date || "";
  const returnDate =
    values?.tripType === "return" && values?.returnDate && values.returnDate >= (date || today)
      ? values.returnDate
      : "";

  return {
    source: "",
    destination: "",
    date: "",
    returnDate: "",
    tripType: "one-way",
    ...values,
    date,
    returnDate,
  };
}

export function SearchForm({
  defaultValues,
  onSubmit,
  submitLabel = "Search buses",
  compact = false,
  hero = false,
  resultsPage = false,
  showTripType = true,
  forceOneWay = false,
}) {
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: normalizeFormValues(defaultValues),
  });

  const today = getTodayDateValue();
  const tripType = forceOneWay ? "one-way" : watch("tripType");
  const showReturnDate = tripType === "return";

  useEffect(() => {
    reset(normalizeFormValues(defaultValues));
  }, [defaultValues, reset]);

  useEffect(() => {
    if (tripType !== "return") {
      setValue("returnDate", "", { shouldDirty: true, shouldValidate: true });
    }
  }, [setValue, tripType]);

  useEffect(() => {
    if (forceOneWay) {
      setValue("tripType", "one-way", { shouldDirty: false, shouldValidate: false });
      setValue("returnDate", "", { shouldDirty: false, shouldValidate: false });
    }
  }, [forceOneWay, setValue]);

  const shellClass = compact
    ? "rounded-[1.75rem] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#fff8f8_100%)] p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
    : resultsPage
      ? "rounded-[1.7rem] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)] sm:p-6"
    : hero
      ? "rounded-[1.45rem] border border-white/45 bg-white/40 p-3 shadow-[0_20px_55px_rgba(15,23,42,0.14)] backdrop-blur-2xl sm:p-3.5"
      : "rounded-[2rem] border border-white/70 bg-white/95 p-5 shadow-2xl shadow-slate-900/10 backdrop-blur sm:p-6";
  const gridClass = compact
    ? "grid gap-3"
    : resultsPage
      ? showReturnDate
        ? "grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] xl:items-end"
        : "grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_minmax(0,1fr)] xl:items-end"
    : hero
      ? "grid gap-3"
      : showReturnDate
        ? "grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        : "grid gap-4 md:grid-cols-3";
  const fieldClass = compact
    ? "rounded-[1.35rem] border border-slate-200/80 bg-white p-4 shadow-sm"
    : resultsPage
      ? "rounded-[1.35rem] border border-slate-200/80 bg-white p-4 shadow-sm"
      : "";
  const inputShellClass = compact
    ? "input-shell border border-slate-200 bg-slate-50 shadow-none transition focus-within:border-brand-200 focus-within:bg-white"
    : resultsPage
      ? "input-shell border border-slate-200 bg-slate-50 shadow-none transition focus-within:border-brand-200 focus-within:bg-white"
    : hero
      ? "input-shell border border-white/55 bg-white/72 shadow-none backdrop-blur-sm transition focus-within:border-brand-200 focus-within:bg-white/88"
      : "input-shell";
  const labelClass = compact
    ? "mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500"
    : resultsPage
      ? "mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500"
    : hero
      ? "mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-600"
      : "form-label";
  const submitClass = compact
    ? "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[1.2rem] bg-brand-500 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
    : resultsPage
      ? "inline-flex min-w-[12rem] items-center justify-center gap-2 rounded-full bg-brand-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
    : hero
      ? "inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#b92e41_0%,#cf3d4f_58%,#e85d6f_100%)] px-4 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(207,61,79,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(207,61,79,0.24)] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:min-w-[10rem]"
      : "mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70";
  const submitWrapClass = resultsPage
    ? "mt-5 flex items-center justify-center"
    : hero
      ? "flex translate-y-[10px] items-center justify-center lg:h-full"
      : "";
  const showSwapButton = resultsPage;

  function handleSwapRoute() {
    const source = getValues("source");
    const destination = getValues("destination");

    setValue("source", destination, {
      shouldDirty: true,
      shouldTouch: true,
    });
    setValue("destination", source, {
      shouldDirty: true,
      shouldTouch: true,
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={shellClass}>
      {showTripType ? (
        <div className="mb-4 flex flex-wrap gap-2">
          <TripTypeButton
            active={tripType === "one-way"}
            onClick={() =>
              setValue("tripType", "one-way", {
                shouldDirty: true,
                shouldTouch: true,
              })
            }
          >
            One-way
          </TripTypeButton>
          <TripTypeButton
            active={tripType === "return"}
            onClick={() =>
              setValue("tripType", "return", {
                shouldDirty: true,
                shouldTouch: true,
              })
            }
          >
            Return trip
          </TripTypeButton>
        </div>
      ) : null}

      <div className={gridClass}>
        <div className={fieldClass}>
          <label className={labelClass}>Pickup / Source</label>
          <div className={inputShellClass}>
            <MapPin className="input-icon" />
            <input
              type="text"
              placeholder="e.g. Lusaka or Kabwe"
              className="form-input form-input-with-icon"
              {...register("source", {
                required: "Source is required.",
                setValueAs: (value) => String(value ?? "").trim(),
              })}
            />
          </div>
          {!compact && !hero && !resultsPage ? (
            <p className="mt-2 text-xs text-slate-500">
              Enter the pickup city or any supported route stop.
            </p>
          ) : null}
          {errors.source ? (
            <p className="form-error">{errors.source.message}</p>
          ) : null}
        </div>

        {showSwapButton ? (
          <div className="flex items-center justify-center md:pb-3">
            <button
              type="button"
              onClick={handleSwapRoute}
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:text-brand-600"
              aria-label="Swap source and destination"
              title="Swap source and destination"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        <div className={fieldClass}>
          <label className={labelClass}>Drop / Destination</label>
          <div className={inputShellClass}>
            <Route className="input-icon" />
            <input
              type="text"
              placeholder="e.g. Ndola or Kapiri"
              className="form-input form-input-with-icon"
              {...register("destination", {
                required: "Destination is required.",
                setValueAs: (value) => String(value ?? "").trim(),
              })}
            />
          </div>
          {!compact && !hero && !resultsPage ? (
            <p className="mt-2 text-xs text-slate-500">
              Enter the drop city or any supported route stop.
            </p>
          ) : null}
          {errors.destination ? (
            <p className="form-error">{errors.destination.message}</p>
          ) : null}
        </div>

        <div className={fieldClass}>
          <label className={labelClass}>Travel Date</label>
          <div className={inputShellClass}>
            <CalendarDays className="input-icon" />
            <input
              type="date"
              min={today}
              className="form-input form-input-with-icon"
              {...register("date", {
                required: "Travel date is required.",
                validate: (value) =>
                  value >= today || "Please choose today or a future date.",
              })}
            />
          </div>
          {errors.date ? <p className="form-error">{errors.date.message}</p> : null}
        </div>

        {showReturnDate ? (
          <div className={fieldClass}>
            <label className={labelClass}>Return Date</label>
            <div className={inputShellClass}>
              <CalendarDays className="input-icon" />
              <input
                type="date"
                min={watch("date") || today}
                className="form-input form-input-with-icon"
                {...register("returnDate", {
                  validate: (value) => {
                    if (tripType !== "return") {
                      return true;
                    }

                    if (!value) {
                      return "Return date is required.";
                    }

                    if (value < (watch("date") || today)) {
                      return "Return date must be the same day or after departure.";
                    }

                    return true;
                  },
                })}
              />
            </div>
            {errors.returnDate ? <p className="form-error">{errors.returnDate.message}</p> : null}
          </div>
        ) : null}
      </div>

      <div className={submitWrapClass}>
        <button
          type="submit"
          disabled={isSubmitting}
          className={submitClass}
        >
          <Search className="h-4 w-4" />
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function TripTypeButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20"
          : "border border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:text-brand-600"
      }`}
    >
      {children}
    </button>
  );
}
