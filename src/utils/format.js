const dateFormatter = new Intl.DateTimeFormat("en-ZM", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function toDateInputValue(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

export function formatDate(value) {
  if (!value) {
    return "TBD";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return dateFormatter.format(date);
}

export function formatCurrency(amount, currency = "ZMW") {
  const value = Number(amount ?? 0);

  try {
    return new Intl.NumberFormat("en-ZM", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString()}`;
  }
}

export function formatRoute(source, destination) {
  return `${source || "Unknown"} to ${destination || "Unknown"}`;
}

export function getTodayDateValue() {
  return toDateInputValue(new Date());
}

export function formatBackendDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return toDateInputValue(date);
}

export function isPastDate(value, today = getTodayDateValue()) {
  return Boolean(value) && value < today;
}

export function parseTimeToMinutes(value) {
  if (!value) {
    return Number.NaN;
  }

  const normalizedValue = String(value).trim().toUpperCase();
  const match = normalizedValue.match(/^(\d{1,2}):(\d{2})\s*([AP]M)?$/);

  if (!match) {
    return Number.NaN;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3];

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return Number.NaN;
  }

  if (meridiem) {
    if (hours === 12) {
      hours = 0;
    }

    if (meridiem === "PM") {
      hours += 12;
    }
  }

  return hours * 60 + minutes;
}

export function calculateDuration(departureTime, arrivalTime) {
  if (!departureTime || !arrivalTime) {
    return "";
  }

  const departureMinutes = parseTimeToMinutes(departureTime);
  const arrivalMinutes = parseTimeToMinutes(arrivalTime);

  if ([departureMinutes, arrivalMinutes].some(Number.isNaN)) {
    return "";
  }

  let minutes = arrivalMinutes - departureMinutes;
  if (minutes < 0) {
    minutes += 24 * 60;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}
