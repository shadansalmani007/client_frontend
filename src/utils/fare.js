function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function normalizeCity(value) {
  return String(value ?? "").trim().toLowerCase();
}

function toPositiveAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function getStopAmount(stop) {
  if (!stop || typeof stop !== "object") {
    return null;
  }

  return toPositiveAmount(
    firstDefined(
      stop.EXACT_PRICE,
      stop.exactPrice,
      stop.exact_price,
      stop.price,
      stop.fare,
      stop.amount,
      stop.basePrice,
      stop.baseFare,
    ),
  );
}

function findStopByCity(stops, city) {
  const targetCity = normalizeCity(city);
  if (!targetCity) {
    return null;
  }

  return (
    asArray(stops).find((stop) => normalizeCity(stop?.city || stop?.name) === targetCity) || null
  );
}

function getLastStop(stops) {
  const items = asArray(stops).filter(Boolean);
  return items.length ? items[items.length - 1] : null;
}

export function getSegmentFare(data) {
  const destination = data?.destination;
  const stopCandidates = [
    data?.destinationStop,
    findStopByCity(data?.segmentStops, destination),
    getLastStop(data?.segmentStops),
    findStopByCity(data?.routeTimeline, destination),
    findStopByCity(data?.routeStops, destination),
  ];

  for (const stop of stopCandidates) {
    const amount = getStopAmount(stop);
    if (amount !== null) {
      return amount;
    }
  }

  return null;
}

export function getBaseFare(data) {
  if (!data || typeof data !== "object") {
    return null;
  }

  return toPositiveAmount(
    firstDefined(
      data.EXACT_PRICE,
      data.exactPrice,
      data.exact_price,
      data.basePrice,
      data.baseFare,
      data.price,
      data.fare?.EXACT_PRICE,
      data.fare?.exactPrice,
      data.fare?.exact_price,
      data.fare?.basePrice,
      data.fare?.baseFare,
      data.fare?.price,
    ),
  );
}

export function getResolvedFare(data) {
  return getSegmentFare(data) ?? getBaseFare(data);
}
