function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

export function normalizeRouteStop(stop) {
  if (!stop) {
    return null;
  }

  if (typeof stop === "string") {
    const value = normalizeText(stop);
    return value ? { city: value, name: value } : null;
  }

  const city = normalizeText(
    firstDefined(stop.city, stop.stopCity, stop.locationCity, stop.name),
  );
  const name = normalizeText(
    firstDefined(stop.name, stop.stopName, stop.locationName, stop.city),
  );
  const arrivalTime = normalizeText(firstDefined(stop.arrivalTime, stop.time));
  const departureTime = normalizeText(firstDefined(stop.departureTime, stop.time));

  if (!city && !name && !arrivalTime && !departureTime) {
    return null;
  }

  return {
    ...stop,
    city,
    name,
    arrivalTime,
    departureTime,
  };
}

export function normalizeIntermediateStops(stops) {
  return asArray(stops).map(normalizeRouteStop).filter(Boolean);
}

export function getStopDisplayName(stop) {
  const normalized = normalizeRouteStop(stop);
  if (!normalized) {
    return "";
  }

  return firstDefined(normalized.city, normalized.name, "");
}

export function normalizeLocationPoint(point) {
  if (!point) {
    return null;
  }

  if (typeof point === "string") {
    const value = normalizeText(point);
    return value
      ? {
          city: "",
          name: value,
          address: "",
          landmark: "",
          timeOffsetMinutes: 0,
        }
      : null;
  }

  const city = normalizeText(
    firstDefined(point.city, point.stopCity, point.locationCity),
  );
  const name = normalizeText(
    firstDefined(point.name, point.stopName, point.label, point.title),
  );
  const address = normalizeText(firstDefined(point.address, point.location, point.street));
  const landmark = normalizeText(firstDefined(point.landmark, point.reference));
  const timeOffsetMinutes = Number(
    firstDefined(point.timeOffsetMinutes, point.offsetMinutes, point.timeOffset, 0),
  );

  if (!city && !name && !address && !landmark && Number.isNaN(timeOffsetMinutes)) {
    return null;
  }

  return {
    ...point,
    city,
    name,
    address,
    landmark,
    timeOffsetMinutes: Number.isNaN(timeOffsetMinutes) ? 0 : timeOffsetMinutes,
  };
}

export function normalizeLocationPoints(points) {
  return asArray(points).map(normalizeLocationPoint).filter(Boolean);
}

export function formatLocationPoint(point) {
  const normalized = normalizeLocationPoint(point);
  if (!normalized) {
    return "";
  }

  const parts = [];

  if (normalized.name) {
    parts.push(normalized.name);
  }

  if (normalized.city && normalized.city !== normalized.name) {
    parts.push(normalized.city);
  }

  if (normalized.address) {
    parts.push(normalized.address);
  }

  return parts.join(", ");
}

export function getLocationPointDescription(point) {
  const normalized = normalizeLocationPoint(point);
  if (!normalized) {
    return "";
  }

  return [normalized.landmark, normalized.timeOffsetMinutes ? `${normalized.timeOffsetMinutes} min offset` : ""]
    .filter(Boolean)
    .join(" - ");
}

export function getLocationPointKey(point) {
  const normalized = normalizeLocationPoint(point);
  if (!normalized) {
    return "";
  }

  return JSON.stringify({
    city: normalized.city,
    name: normalized.name,
    address: normalized.address,
    landmark: normalized.landmark,
    timeOffsetMinutes: normalized.timeOffsetMinutes,
  });
}

export function findLocationPoint(points, key) {
  return normalizeLocationPoints(points).find((point) => getLocationPointKey(point) === key) || null;
}

export function getPointCity(point) {
  return normalizeLocationPoint(point)?.city || "";
}

export function toBookingPoint(point, fallbackCity = "") {
  const normalized = normalizeLocationPoint(point);

  if (!normalized) {
    return null;
  }

  return {
    name: normalized.name || "",
    address: normalized.address || "",
    landmark: normalized.landmark || "",
    timeOffsetMinutes: Number(normalized.timeOffsetMinutes || 0),
    city: normalized.city || normalizeText(fallbackCity),
  };
}
