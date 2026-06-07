const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function normalizeSeatNumber(value) {
  return String(value ?? "").trim();
}

function getLayoutSeats(layout) {
  if (Array.isArray(layout?.seats) && layout.seats.length) {
    return layout.seats;
  }

  if (Array.isArray(layout?.layoutStructure) && layout.layoutStructure.length) {
    return layout.layoutStructure;
  }

  if (Array.isArray(layout?.seat_layout) && layout.seat_layout.length) {
    return layout.seat_layout;
  }

  return [];
}

function getLayoutDimension(layout, keys, fallbackValue) {
  for (const key of keys) {
    const value = Number(layout?.[key]);
    if (Number.isFinite(value) && value > 0) {
      return value;
    }
  }

  return fallbackValue;
}

function getSeatNumber(seat) {
  return normalizeSeatNumber(
    seat?.seatNumber ??
      seat?.number ??
      seat?.label ??
      seat?.name ??
      seat?.code ??
      seat?.id,
  );
}

function getLayoutCellType(seat) {
  const rawType = String(seat?.type ?? seat?.kind ?? seat?.category ?? "").trim().toLowerCase();
  const rawSection = String(seat?.section ?? "").trim().toLowerCase();

  if (
    seat?.isAisle ||
    rawSection === "aisle" ||
    rawType === "aisle" ||
    rawType === "walkway" ||
    rawType === "walk way" ||
    rawType === "walk-way"
  ) {
    return "aisle";
  }

  if (!rawType || rawType === "seat") {
    return "seat";
  }

  if (rawType === "empty" || rawType === "blank" || rawType === "space") {
    return "empty";
  }

  return "facility";
}

function normalizeGridCell(seat) {
  const cellType = getLayoutCellType(seat);

  return {
    ...seat,
    seatNumber: getSeatNumber(seat),
    facilityType:
      cellType === "facility"
        ? String(seat?.type ?? seat?.kind ?? seat?.category ?? "").trim()
        : "",
    type: cellType,
  };
}

function createEmptyCell() {
  return {
    type: "empty",
    seatNumber: "",
  };
}

function isSeatCell(seat) {
  return getLayoutCellType(seat) === "seat" && Boolean(getSeatNumber(seat));
}

function sortSeatsByDisplayOrder(leftSeat, rightSeat) {
  const leftNumber = Number(getSeatNumber(leftSeat));
  const rightNumber = Number(getSeatNumber(rightSeat));

  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber) && leftNumber !== rightNumber) {
    return leftNumber - rightNumber;
  }

  const leftRow = Number(leftSeat?.row ?? 0);
  const rightRow = Number(rightSeat?.row ?? 0);
  if (leftRow !== rightRow) {
    return leftRow - rightRow;
  }

  const leftColumn = Number(leftSeat?.column ?? 0);
  const rightColumn = Number(rightSeat?.column ?? 0);
  if (leftColumn !== rightColumn) {
    return leftColumn - rightColumn;
  }

  return Number(leftSeat?.order ?? 0) - Number(rightSeat?.order ?? 0);
}

function resolvePositionFromSeatNumber(seatNumber) {
  const match = /^([A-Z]+)(\d+)$/i.exec(seatNumber);
  if (!match) {
    return null;
  }

  const rowLabel = match[1].toUpperCase();
  const column = Number(match[2]) - 1;
  const row = ALPHABET.indexOf(rowLabel);

  if (row < 0 || column < 0) {
    return null;
  }

  return { row, column };
}

function resolveSeatPosition(seat, fallbackIndex, columns) {
  const explicitRow = Number(
    seat?.rowIndex ?? seat?.row ?? seat?.y ?? seat?.positionRow,
  );
  const explicitColumn = Number(
    seat?.columnIndex ?? seat?.column ?? seat?.x ?? seat?.positionColumn,
  );

  if (!Number.isNaN(explicitRow) && !Number.isNaN(explicitColumn)) {
    return {
      row: Math.max(explicitRow - 1, 0),
      column: Math.max(explicitColumn - 1, 0),
    };
  }

  const fromSeatNumber = resolvePositionFromSeatNumber(getSeatNumber(seat));
  if (fromSeatNumber) {
    return fromSeatNumber;
  }

  return {
    row: Math.floor(fallbackIndex / columns),
    column: fallbackIndex % columns,
  };
}

function buildFallbackSeats(rows, columns) {
  return Array.from({ length: rows }, (_, rowIndex) =>
    Array.from({ length: columns }, (_, columnIndex) => ({
      type: "seat",
      seatNumber: `${ALPHABET[rowIndex] ?? `R${rowIndex + 1}`}${columnIndex + 1}`,
    })),
  );
}

function buildExplicitGrid(rows, columns, seats) {
  const grid = Array.from({ length: rows }, () => Array(columns).fill(null));

  seats.forEach((seat, index) => {
    const position = resolveSeatPosition(seat, index, columns);
    if (!grid[position.row] || position.column >= columns) {
      return;
    }

    grid[position.row][position.column] = normalizeGridCell(seat);
  });

  return grid.map((row) => row.map((cell) => cell ?? createEmptyCell()));
}

function buildBalancedSideRow(leftSeats, rightSeats, leftCapacity, rightCapacity) {
  const row = [];

  for (let index = 0; index < leftCapacity; index += 1) {
    row.push(leftSeats[index] ?? createEmptyCell());
  }

  row.push({ type: "aisle", seatNumber: "" });

  for (let index = 0; index < rightCapacity; index += 1) {
    row.push(rightSeats[index] ?? createEmptyCell());
  }

  return row;
}

function buildFlatSeatRow(seats, columns) {
  const row = Array.from({ length: columns }, () => createEmptyCell());

  seats.forEach((seat, index) => {
    if (index < columns) {
      row[index] = seat;
    }
  });

  return row;
}

function buildCustomBalancedGrid(layout, seats, rows, columns) {
  const leftCapacity = Number(layout?.leftSeatsPerRow ?? layout?.left_seats_per_row ?? 0);
  const rightCapacity = Number(layout?.rightSeatsPerRow ?? layout?.right_seats_per_row ?? 0);
  const rightRows = Number(layout?.rightRows ?? layout?.right_rows ?? 0);
  const seatSectionCount = seats.filter((seat) => isSeatCell(seat)).length;
  const compactSideRowCapacity = leftCapacity + rightCapacity;

  if (
    !leftCapacity ||
    !rightCapacity ||
    !rightRows ||
    columns !== leftCapacity + rightCapacity + 1 ||
    seatSectionCount <= rightRows * (leftCapacity + rightCapacity)
  ) {
    return null;
  }

  const explicitGrid = buildExplicitGrid(rows, columns, seats);
  const frontRows = explicitGrid.slice(0, rightRows);
  const remainingSeats = seats
    .filter((seat) => {
      const row = Number(seat?.row ?? 0);
      return isSeatCell(seat) && row > rightRows;
    })
    .sort(sortSeatsByDisplayOrder)
    .map(normalizeGridCell);

  if (!remainingSeats.length) {
    return null;
  }

  const compactRows = [];
  while (remainingSeats.length > columns) {
    const sideRowSeats = remainingSeats.splice(0, compactSideRowCapacity);
    const leftSeats = sideRowSeats.slice(0, leftCapacity);
    const rightSeats = sideRowSeats.slice(leftCapacity, leftCapacity + rightCapacity);
    compactRows.push(
      buildBalancedSideRow(leftSeats, rightSeats, leftCapacity, rightCapacity),
    );
  }

  if (remainingSeats.length) {
    compactRows.push(buildFlatSeatRow(remainingSeats.splice(0, columns), columns));
  }

  return [...frontRows, ...compactRows];
}

export function buildSeatGrid(layout) {
  const seats = getLayoutSeats(layout);
  const fallbackRows = seats.reduce((max, seat) => Math.max(max, Number(seat?.row ?? 0)), 0);
  const fallbackColumns = seats.reduce(
    (max, seat) => Math.max(max, Number(seat?.column ?? 0)),
    0,
  );
  const rows = getLayoutDimension(layout, ["rows", "leftRows", "rightRows"], fallbackRows);
  const columns = getLayoutDimension(layout, ["columns"], fallbackColumns);

  if (!rows || !columns) {
    return [];
  }

  if (!seats.length) {
    return buildFallbackSeats(rows, columns);
  }

  const customBalancedGrid = buildCustomBalancedGrid(layout, seats, rows, columns);
  if (customBalancedGrid) {
    return customBalancedGrid;
  }

  return buildExplicitGrid(rows, columns, seats);
}

export function getSeatStatus({
  seatNumber,
  availableSeats = [],
  bookedSeats = [],
  blockedSeats = [],
  selectedSeats = [],
}) {
  if (blockedSeats.includes(seatNumber)) {
    return "blocked";
  }

  if (bookedSeats.includes(seatNumber)) {
    return "booked";
  }

  const isExplicitlyAvailable =
    availableSeats.length === 0 || availableSeats.includes(seatNumber);

  if (selectedSeats.includes(seatNumber) && isExplicitlyAvailable) {
    return "selected";
  }

  if (availableSeats.length > 0) {
    return isExplicitlyAvailable ? "available" : "blocked";
  }

  return "available";
}
