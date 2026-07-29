import { buildSeatRenderModel, getSeatStatus } from "../utils/seat-map.js";

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

function getSeatCellClassNames(seat, seatStatus, rowKind) {
  return [
    "seat-button",
    "seat-map-seat",
    seatClassMap[seatStatus],
    seat.section ? `seat-map-seat--${seat.section}` : "",
    rowKind ? `seat-map-seat-row--${rowKind}` : "",
    seat.isWindowSeat ? "seat-map-seat--window" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function getSeatLabel(seat) {
  const descriptors = [];

  if (seat.isWindowSeat) {
    descriptors.push("window");
  }

  if (seat.section && !["unknown", "aisle"].includes(seat.section)) {
    descriptors.push(seat.section);
  }

  return descriptors.length ? `${seat.seatNumber} - ${descriptors.join(" - ")}` : seat.seatNumber;
}

function getSeatDisplayNumber(seat) {
  const seatNumber = String(seat?.seatNumber ?? "").trim();

  if (!seat.isWindowSeat || !seatNumber || /w$/i.test(seatNumber)) {
    return seatNumber;
  }

  return `${seatNumber} W`;
}

function getRowLabel(rowKind) {
  if (rowKind === "back") {
    return "Back seats";
  }

  if (rowKind === "luggage") {
    return "Luggage";
  }

  return "";
}

export function SeatMap({
  layout,
  renderModel,
  availableSeats,
  bookedSeats,
  blockedSeats,
  selectedSeats,
  onToggleSeat,
}) {
  const hasClientLayout = Boolean(layout?.clientSeatLayout || layout?.client_seat_layout);
  const model = hasClientLayout ? buildSeatRenderModel(layout) : renderModel ?? buildSeatRenderModel(layout);
  const rows = Array.isArray(model?.rows) ? model.rows : [];
  const columnCount = model?.columnCount ?? rows.reduce((max, row) => Math.max(max, row.cells.length), 0);

  if (!rows.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
        Seat layout is not available for this trip yet.
      </div>
    );
  }

  const minGridWidth = Math.max(columnCount * 56, 280);

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-4 sm:p-6">
      <div className="overflow-x-auto">
        <div className="space-y-3" style={{ minWidth: `${minGridWidth}px` }}>
          {rows.map((row, rowIndex) => {
            const rowLabel = getRowLabel(row.kind);
            const previousRowLabel = rowIndex > 0 ? getRowLabel(rows[rowIndex - 1]?.kind) : "";
            const shouldRenderRowLabel = Boolean(rowLabel) && rowLabel !== previousRowLabel;

            return (
              <div key={row.id || `row-${rowIndex}`} className="space-y-2">
                {shouldRenderRowLabel ? (
                  <div className="seat-map-row-label">{rowLabel}</div>
                ) : null}

                <div
                  className={`grid gap-3 ${row.kind === "back" ? "justify-center" : ""}`}
                  style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
                >
                  {row.cells.map((seat, columnIndex) => {
                    if (seat.type === "empty") {
                      return <div key={`empty-${rowIndex}-${columnIndex}`} className="seat-map-placeholder" />;
                    }

                    if (seat.type === "aisle") {
                      return <div key={`aisle-${rowIndex}-${columnIndex}`} className="seat-map-aisle" />;
                    }

                    if (seat.type === "inactive") {
                      return (
                        <div
                          key={`inactive-${seat.positionId || rowIndex}-${columnIndex}`}
                          className="seat-inactive"
                          aria-hidden="true"
                        >
                          <span className="seat-inactive__pattern" />
                        </div>
                      );
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
                        key={seat.positionId || seatNumber}
                        type="button"
                        onClick={() => {
                          if (isInteractive) {
                            onToggleSeat(seatNumber);
                          }
                        }}
                        className={getSeatCellClassNames(seat, seatStatus, row.kind)}
                        disabled={!isInteractive}
                        title={getSeatLabel(seat)}
                        aria-label={getSeatLabel(seat)}
                      >
                        <span className="seat-map-seat__number">{getSeatDisplayNumber(seat)}</span>
                        {seat.isWindowSeat ? <span className="seat-map-seat__window" aria-hidden="true" /> : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
