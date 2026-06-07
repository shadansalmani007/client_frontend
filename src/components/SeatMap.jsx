import { buildSeatGrid, getSeatStatus } from "../utils/seat-map.js";

const seatClassMap = {
  available: "seat-available",
  selected: "seat-selected",
  booked: "seat-booked",
  blocked: "seat-blocked",
};

function getFacilityKind(value) {
  const normalized = String(value ?? "").trim().toLowerCase();

  if (normalized.includes("luggage") || normalized.includes("baggage") || normalized.includes("bag")) {
    return "luggage";
  }

  return "utility";
}

function formatFacilityLabel(value) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return "Facility";
  }

  if (getFacilityKind(normalized) === "luggage") {
    return "Luggage";
  }

  return normalized
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function SeatMap({
  layout,
  availableSeats,
  bookedSeats,
  blockedSeats,
  selectedSeats,
  onToggleSeat,
}) {
  const grid = buildSeatGrid(layout);
  const columnCount = grid.reduce((max, row) => Math.max(max, row.length), 0);

  if (!grid.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
        Seat layout is not available for this trip yet.
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-4 sm:p-6">
      <div className="space-y-3">
        {grid.map((row, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
          >
            {row.map((seat, columnIndex) => {
              if (seat.type === "empty") {
                return <div key={`empty-${rowIndex}-${columnIndex}`} />;
              }

              if (seat.type === "aisle") {
                return <div key={`aisle-${rowIndex}-${columnIndex}`} />;
              }

              if (seat.type === "facility") {
                const facilityLabel = formatFacilityLabel(seat.facilityType);
                const facilityKind = getFacilityKind(seat.facilityType);

                return (
                  <div
                    key={`${
                      seat.positionId || seat.seatNumber || seat.facilityType || "facility"
                    }-${rowIndex}-${columnIndex}`}
                    className={`seat-facility seat-facility--${facilityKind}`}
                    title={facilityLabel}
                    aria-label={facilityLabel}
                  >
                    {facilityKind === "luggage" ? (
                      <div className="seat-facility__bag" aria-hidden="true">
                        <span className="seat-facility__bag-handle" />
                      </div>
                    ) : (
                      <span className="seat-facility__label">{facilityLabel}</span>
                    )}
                  </div>
                );
              }

              const seatNumber = seat.seatNumber;
              const seatStatus = getSeatStatus({
                seatNumber,
                availableSeats,
                bookedSeats,
                blockedSeats,
                selectedSeats,
              });

              const isInteractive = seatStatus === "available" || seatStatus === "selected";

              return (
                <button
                  key={seatNumber}
                  type="button"
                  onClick={() => {
                    if (isInteractive) {
                      onToggleSeat(seatNumber);
                    }
                  }}
                  className={`seat-button ${seatClassMap[seatStatus]}`}
                  disabled={!isInteractive}
                >
                  {seatNumber}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
