const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const LEGACY_LAYOUT_FIELDS = ["seats", "layoutStructure", "seat_layout"];
const GENERIC_ROW_KEYS = ["cells", "columns", "items", "positions", "slots", "boxes", "seats"];
const LEFT_ROW_KEYS = ["left", "leftBoxes", "leftSeats", "leftSide", "leftColumns"];
const RIGHT_ROW_KEYS = ["right", "rightBoxes", "rightSeats", "rightSide", "rightColumns"];
const BACK_ROW_KEYS = ["back", "backBoxes", "backSeats", "rear", "rearBoxes", "rearSeats"];
const LUGGAGE_ROW_KEYS = ["luggage", "luggageBoxes", "luggageSeats", "bags", "bagBoxes"];

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeSeatNumber(value) {
  return String(value ?? "").trim();
}

function toPositiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function getSeatNumber(seat) {
  return normalizeSeatNumber(
    firstDefined(
      seat?.seatNumber,
      seat?.seatNo,
      seat?.number,
      seat?.label,
      seat?.name,
      seat?.code,
      seat?.seat,
      seat?.id,
    ),
  );
}

function getSeatAvailabilitySeatNumbers(seats) {
  return asArray(seats)
    .map((seat) => (typeof seat === "string" ? seat : getSeatNumber(seat)))
    .map(normalizeSeatNumber)
    .filter(Boolean);
}

function getLayoutSeats(layout) {
  for (const field of LEGACY_LAYOUT_FIELDS) {
    if (Array.isArray(layout?.[field]) && layout[field].length) {
      return layout[field];
    }
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

function getLayoutCellType(seat) {
  const rawType = normalizeText(firstDefined(seat?.type, seat?.kind, seat?.category));
  const rawSection = normalizeText(seat?.section);

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

function normalizeLegacyGridCell(seat) {
  const cellType = getLayoutCellType(seat);

  return {
    ...seat,
    seatNumber: getSeatNumber(seat),
    facilityType:
      cellType === "facility"
        ? String(firstDefined(seat?.type, seat?.kind, seat?.category) ?? "").trim()
        : "",
    type: cellType,
    section: normalizeSection(firstDefined(seat?.section, seat?.seatSection, seat?.zone)),
    isWindowSeat: Boolean(seat?.isWindowSeat || seat?.isWindow || seat?.windowSeat),
  };
}

function createEmptyCell() {
  return {
    type: "empty",
    seatNumber: "",
    section: "unknown",
    isWindowSeat: false,
  };
}

function createAisleCell(key = "") {
  return {
    type: "aisle",
    seatNumber: "",
    section: "aisle",
    positionId: key,
    isWindowSeat: false,
  };
}

function createInactiveCell(key = "") {
  return {
    type: "inactive",
    seatNumber: "",
    section: "unknown",
    positionId: key,
    isWindowSeat: false,
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
      section: "unknown",
      isWindowSeat: columnIndex === 0 || columnIndex === columns - 1,
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

    grid[position.row][position.column] = normalizeLegacyGridCell(seat);
  });

  return grid.map((row) => row.map((cell) => cell ?? createEmptyCell()));
}

function buildBalancedSideRow(leftSeats, rightSeats, leftCapacity, rightCapacity) {
  const row = [];

  for (let index = 0; index < leftCapacity; index += 1) {
    row.push(leftSeats[index] ?? createEmptyCell());
  }

  row.push(createAisleCell(`legacy-aisle-${leftCapacity}-${rightCapacity}`));

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
  const hasDedicatedBackSection = seats.some(
    (seat) => normalizeSection(firstDefined(seat?.section, seat?.seatSection, seat?.zone)) === "back",
  );

  if (
    !leftCapacity ||
    !rightCapacity ||
    !rightRows ||
    hasDedicatedBackSection ||
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
    .map(normalizeLegacyGridCell);

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

function buildSeatGrid(layout) {
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

function normalizeSection(value) {
  const section = normalizeText(value);

  if (!section) {
    return "unknown";
  }

  if (section.includes("luggage") || section.includes("baggage") || section.includes("bag")) {
    return "luggage";
  }

  if (section.includes("back") || section.includes("rear")) {
    return "back";
  }

  if (section.includes("left")) {
    return "left";
  }

  if (section.includes("right")) {
    return "right";
  }

  if (section.includes("aisle") || section.includes("walk")) {
    return "aisle";
  }

  return section;
}

function getClientLayoutRawType(box) {
  return normalizeText(
    firstDefined(
      box?.type,
      box?.kind,
      box?.category,
      box?.boxType,
      box?.itemType,
      box?.cellType,
      box?.slotType,
      box?.seatType,
    ),
  );
}

function getClientLayoutSection(box) {
  return normalizeSection(
    firstDefined(
      box?.section,
      box?.seatSection,
      box?.zone,
      box?.area,
      box?.placement,
      box?.group,
      box?.side,
      box?.location,
      box?.previewSection,
    ),
  );
}

function getClientLayoutDescriptorText(box) {
  return normalizeText(
    [
      box?.label,
      box?.name,
      box?.title,
      box?.text,
      box?.description,
      box?.section,
      box?.seatSection,
      box?.zone,
      box?.area,
      box?.placement,
      box?.location,
    ]
      .filter((value) => value !== undefined && value !== null && value !== "")
      .join(" "),
  );
}

function getClientBoxIdentity(box, index) {
  return normalizeSeatNumber(
    firstDefined(
      box?.positionId,
      box?.boxId,
      box?.id,
      box?._id,
      box?.key,
      box?.uuid,
      box?.boxIndex,
      box?.seatIndex,
      box?.sourceSeatNumber,
      getSeatNumber(box),
      `client-box-${index}`,
    ),
  );
}

function isClientAisleBox(box, rawType, section) {
  return (
    box?.isAisle ||
    section === "aisle" ||
    rawType === "aisle" ||
    rawType === "walkway" ||
    rawType === "walk way" ||
    rawType === "walk-way"
  );
}

function isClientLuggageBox(box, rawType, section) {
  const descriptorText = getClientLayoutDescriptorText(box);

  return (
    box?.isLuggage ||
    section === "luggage" ||
    rawType.includes("luggage") ||
    rawType.includes("baggage") ||
    rawType.includes("bag") ||
    descriptorText.includes("luggage") ||
    descriptorText.includes("baggage") ||
    descriptorText.includes("bag")
  );
}

function isClientInactiveBox(box, rawType) {
  return (
    box?.isInactive ||
    box?.active === false ||
    box?.enabled === false ||
    box?.disabled === true ||
    rawType.includes("inactive") ||
    rawType.includes("disabled")
  );
}

function isClientEmptyBox(rawType) {
  return rawType === "empty" || rawType === "blank" || rawType === "space";
}

function shouldHideClientInactiveBox(box) {
  return !getSeatNumber(box);
}

function getClientCellType(box) {
  const rawType = getClientLayoutRawType(box);
  const section = getClientLayoutSection(box);

  if (isClientAisleBox(box, rawType, section)) {
    return "aisle";
  }

  if (isClientLuggageBox(box, rawType, section)) {
    return "facility";
  }

  if (isClientInactiveBox(box, rawType)) {
    return shouldHideClientInactiveBox(box) ? "empty" : "inactive";
  }

  if (isClientEmptyBox(rawType)) {
    return "empty";
  }

  if (getSeatNumber(box) || !rawType || rawType.includes("seat")) {
    return "seat";
  }

  return "facility";
}

function normalizeClientBox(box, index, overrides = {}) {
  const cellType = getClientCellType(box);
  const section = normalizeSection(
    firstDefined(
      overrides.section,
      box?.section,
      box?.seatSection,
      box?.zone,
      box?.placement,
      box?.side,
      box?.location,
    ),
  );

  return {
    ...box,
    type: cellType,
    seatNumber: getSeatNumber(box),
    facilityType:
      cellType === "facility"
        ? String(
            firstDefined(
              box?.type,
              box?.kind,
              box?.category,
              box?.boxType,
              box?.itemType,
              box?.cellType,
            ) ?? "",
          ).trim()
        : "",
    positionId: getClientBoxIdentity(box, index),
    sourceBoxKey: getClientBoxIdentity(box, index),
    section,
    isWindowSeat: Boolean(
      firstDefined(
        overrides.isWindowSeat,
        box?.isWindowSeat,
        box?.isWindow,
        box?.windowSeat,
        box?.window,
      ),
    ),
  };
}

function indexClientBoxes(boxes) {
  const boxMap = new Map();

  boxes.forEach((box, index) => {
    const keys = [
      normalizeSeatNumber(box?.boxIndex),
      normalizeSeatNumber(box?.seatIndex),
      normalizeSeatNumber(index + 1),
      getClientBoxIdentity(box, index),
      normalizeSeatNumber(box?.boxId),
      normalizeSeatNumber(box?.positionId),
      normalizeSeatNumber(box?.id),
      normalizeSeatNumber(box?._id),
      getSeatNumber(box),
    ].filter(Boolean);

    keys.forEach((key) => {
      boxMap.set(key, box);
    });
  });

  return boxMap;
}

function getFirstArrayValue(source, keys) {
  for (const key of keys) {
    if (Array.isArray(source?.[key])) {
      return source[key];
    }
  }

  return [];
}

function resolveRowReference(reference, boxMap) {
  if (reference === null || reference === undefined) {
    return null;
  }

  if (typeof reference === "string" || typeof reference === "number") {
    return boxMap.get(normalizeSeatNumber(reference)) ?? null;
  }

  const nestedBox = firstDefined(reference?.box, reference?.seat, reference?.cell);
  if (nestedBox && typeof nestedBox === "object") {
    return nestedBox;
  }

  const lookupKey = normalizeSeatNumber(
    firstDefined(reference?.boxId, reference?.positionId, reference?.id, reference?._id),
  );
  if (lookupKey && boxMap.has(lookupKey)) {
    return boxMap.get(lookupKey) ?? null;
  }

  return reference;
}

function markCellUsed(cell, usedBoxKeys) {
  if (cell?.sourceBoxKey) {
    usedBoxKeys.add(cell.sourceBoxKey);
  }
}

function normalizeClientRowCells(rowValues, boxMap, usedBoxKeys, overrides = {}) {
  return asArray(rowValues)
    .map((value, index) => {
      if (value === null || value === undefined || value === false) {
        return createEmptyCell();
      }

      if (typeof value === "string" && normalizeText(value) === "aisle") {
        return createAisleCell(
          normalizeSeatNumber(firstDefined(overrides.rowId, "aisle")) || `aisle-${index}`,
        );
      }

      const resolvedBox = resolveRowReference(value, boxMap);

      if (!resolvedBox) {
        return createInactiveCell(
          normalizeSeatNumber(firstDefined(value?.positionId, value?.boxId, value?.id, value)),
        );
      }

      const normalizedCell = normalizeClientBox(resolvedBox, index, {
        section: firstDefined(overrides.section, value?.section),
        isWindowSeat: firstDefined(value?.isWindowSeat, value?.isWindow, value?.windowSeat),
      });

      if (overrides.skipUsedBoxes && normalizedCell.sourceBoxKey && usedBoxKeys.has(normalizedCell.sourceBoxKey)) {
        return createEmptyCell();
      }

      markCellUsed(normalizedCell, usedBoxKeys);
      return normalizedCell;
    })
    .filter(Boolean);
}

function inferRowKind(cells) {
  if (!cells.length) {
    return "mixed";
  }

  const filledCells = cells.filter((cell) => cell.type !== "empty");
  if (!filledCells.length) {
    return "mixed";
  }

  const sections = new Set(filledCells.map((cell) => cell.section).filter(Boolean));
  const seatSections = new Set(
    filledCells
      .filter((cell) => cell.type === "seat")
      .map((cell) => cell.section)
      .filter(Boolean),
  );

  if (seatSections.size === 1 && seatSections.has("back")) {
    return "back";
  }

  if (sections.size === 1 && sections.has("luggage")) {
    return "luggage";
  }

  if (sections.has("left") || sections.has("right")) {
    return "side";
  }

  return "mixed";
}

function finalizeClientRow(row, rowIndex) {
  const seatIndexes = row.cells.reduce((indexes, cell, index) => {
    if (cell.type === "seat") {
      indexes.push(index);
    }
    return indexes;
  }, []);

  const firstSeatIndex = seatIndexes[0];
  const lastSeatIndex = seatIndexes[seatIndexes.length - 1];

  const cells = row.cells.map((cell, index) => {
    if (cell.type !== "seat" || cell.isWindowSeat) {
      return cell;
    }

    if (cell.section === "left") {
      return { ...cell, isWindowSeat: index === firstSeatIndex };
    }

    if (cell.section === "right") {
      return { ...cell, isWindowSeat: index === lastSeatIndex };
    }

    return cell;
  });

  return {
    id: row.id || `client-row-${rowIndex}`,
    kind: row.kind || inferRowKind(cells),
    cells,
  };
}

function buildNamedClientRow(id, kind, cells, rowIndex) {
  if (!cells.length) {
    return null;
  }

  const hasVisibleCells = cells.some((cell) => cell.type !== "empty");
  if (!hasVisibleCells) {
    return null;
  }

  return finalizeClientRow(
    {
      id,
      kind,
      cells,
    },
    rowIndex,
  );
}

function padClientSideCells(cells, capacity) {
  if (!capacity || cells.length >= capacity) {
    return cells;
  }

  return [
    ...cells,
    ...Array.from({ length: capacity - cells.length }, () => createEmptyCell()),
  ];
}

function normalizeClientRowInput(row) {
  if (Array.isArray(row)) {
    return { boxes: row };
  }

  if (row && typeof row === "object") {
    return row;
  }

  return { boxes: asArray(row) };
}

function buildClientRowsFromEditorRow(row, rowIndex, boxMap, usedBoxKeys, overrides = {}) {
  const normalizedRow = normalizeClientRowInput(row);
  const genericCells = getFirstArrayValue(normalizedRow, GENERIC_ROW_KEYS);
  if (genericCells.length) {
    const genericRow = buildNamedClientRow(
      normalizeSeatNumber(
        firstDefined(
          normalizedRow?.id,
          normalizedRow?._id,
          normalizedRow?.rowId,
          normalizedRow?.key,
          `editor-row-${rowIndex}`,
        ),
      ),
      normalizeSection(
        firstDefined(
          normalizedRow?.kind,
          normalizedRow?.type,
          normalizedRow?.section,
          overrides.kind,
        ),
      ),
      normalizeClientRowCells(genericCells, boxMap, usedBoxKeys, {
        rowId: normalizedRow?.id || normalizedRow?.rowId,
        section: firstDefined(normalizedRow?.section, overrides.section),
        skipUsedBoxes: overrides.skipUsedBoxes,
      }),
      rowIndex,
    );

    return genericRow ? [genericRow] : [];
  }

  const leftCells = normalizeClientRowCells(
    getFirstArrayValue(normalizedRow, LEFT_ROW_KEYS),
    boxMap,
    usedBoxKeys,
    { rowId: `left-${rowIndex}`, section: "left", skipUsedBoxes: overrides.skipUsedBoxes },
  );
  const rightCells = normalizeClientRowCells(
    getFirstArrayValue(normalizedRow, RIGHT_ROW_KEYS),
    boxMap,
    usedBoxKeys,
    { rowId: `right-${rowIndex}`, section: "right", skipUsedBoxes: overrides.skipUsedBoxes },
  );
  const backCells = normalizeClientRowCells(
    getFirstArrayValue(normalizedRow, BACK_ROW_KEYS),
    boxMap,
    usedBoxKeys,
    { rowId: `back-${rowIndex}`, section: "back", skipUsedBoxes: overrides.skipUsedBoxes },
  );
  const luggageCells = normalizeClientRowCells(
    getFirstArrayValue(normalizedRow, LUGGAGE_ROW_KEYS),
    boxMap,
    usedBoxKeys,
    { rowId: `luggage-${rowIndex}`, section: "luggage", skipUsedBoxes: overrides.skipUsedBoxes },
  );
  const leftSeatCapacity = toPositiveNumber(overrides.leftSeatsPerRow);
  const rightSeatCapacity = toPositiveNumber(overrides.rightSeatsPerRow);
  const paddedLeftCells = padClientSideCells(leftCells, leftSeatCapacity);
  const paddedRightCells = padClientSideCells(rightCells, rightSeatCapacity);
  const shouldShowSideAisle =
    Boolean(leftSeatCapacity || rightSeatCapacity) || Boolean(leftCells.length && rightCells.length);

  const rows = [];

  const sideRow = buildNamedClientRow(
    normalizeSeatNumber(
      firstDefined(normalizedRow?.id, normalizedRow?.rowId, `side-row-${rowIndex}`),
    ),
    "side",
    [
      ...paddedLeftCells,
      ...(shouldShowSideAisle ? [createAisleCell(`editor-aisle-${rowIndex}`)] : []),
      ...paddedRightCells,
    ],
    rowIndex,
  );
  if (sideRow) {
    rows.push(sideRow);
  }

  const backRow = buildNamedClientRow(
    normalizeSeatNumber(
      firstDefined(normalizedRow?.id, normalizedRow?.rowId, `back-row-${rowIndex}`),
    ),
    "back",
    backCells,
    rowIndex,
  );
  if (backRow) {
    rows.push(backRow);
  }

  const luggageRow = buildNamedClientRow(
    normalizeSeatNumber(
      firstDefined(normalizedRow?.id, normalizedRow?.rowId, `luggage-row-${rowIndex}`),
    ),
    "luggage",
    luggageCells,
    rowIndex,
  );
  if (luggageRow) {
    rows.push(luggageRow);
  }

  return rows;
}

function getPreviewRowDefinitions(clientLayout) {
  const preview = clientLayout?.preview ?? {};

  return [
    ...asArray(preview.sideRows).map((row, index) => ({
      key: `preview-side-${index}`,
      kind: "side",
      row,
    })),
    ...asArray(preview.backRows).map((row, index) => ({
      key: `preview-back-${index}`,
      kind: "back",
      row,
    })),
    ...asArray(preview.luggageRows).map((row, index) => ({
      key: `preview-luggage-${index}`,
      kind: "luggage",
      row,
    })),
  ];
}

function buildClientRowFromPreview(definition, rowIndex, boxMap, usedBoxKeys, sideConfig = {}) {
  const normalizedRows = buildClientRowsFromEditorRow(
    normalizeClientRowInput(definition.row),
    rowIndex,
    boxMap,
    usedBoxKeys,
    {
      kind: definition.kind,
      section: definition.kind,
      skipUsedBoxes: false,
      leftSeatsPerRow: sideConfig.leftSeatsPerRow,
      rightSeatsPerRow: sideConfig.rightSeatsPerRow,
    },
  );

  if (!normalizedRows.length) {
    return [];
  }

  return normalizedRows.map((normalized, index) => ({
    ...normalized,
    id: normalized.id || `${definition.key}-${index}`,
    kind: normalized.kind === "mixed" ? definition.kind : normalized.kind,
  }));
}

function buildClientRowsFromLooseBoxes(clientLayout, boxes, usedBoxKeys) {
  const leftPerRow = toPositiveNumber(
    firstDefined(clientLayout?.leftSeatsPerRow, clientLayout?.left_seats_per_row),
  );
  const rightPerRow = toPositiveNumber(
    firstDefined(clientLayout?.rightSeatsPerRow, clientLayout?.right_seats_per_row),
  );
  const totalBoxes = toPositiveNumber(
    firstDefined(clientLayout?.totalBoxes, clientLayout?.total_boxes),
  );

  const looseCells = boxes
    .map((box, index) => normalizeClientBox(box, index))
    .filter((cell) => !usedBoxKeys.has(cell.sourceBoxKey));

  if (!looseCells.length) {
    return [];
  }

  const groupedRows = new Map();

  looseCells.forEach((cell, index) => {
    const rowValue = firstDefined(
      cell?.editorRow,
      cell?.editorRowIndex,
      cell?.rowIndex,
      cell?.row,
      cell?.y,
      cell?.positionRow,
    );
    const columnValue = firstDefined(
      cell?.editorColumn,
      cell?.editorColumnIndex,
      cell?.columnIndex,
      cell?.column,
      cell?.x,
      cell?.positionColumn,
    );
    const normalizedRow = Number.isFinite(Number(rowValue)) ? Number(rowValue) : index + 1;
    const normalizedColumn = Number.isFinite(Number(columnValue))
      ? Number(columnValue)
      : index + 1;
    const key = `${cell.section}:${normalizedRow}`;

    if (!groupedRows.has(key)) {
      groupedRows.set(key, []);
    }

    groupedRows.get(key).push({
      ...cell,
      __sortColumn: normalizedColumn,
      __sortOrder: index,
    });
  });

  return Array.from(groupedRows.entries())
    .sort(([leftKey], [rightKey]) => {
      const [, leftRow] = leftKey.split(":");
      const [, rightRow] = rightKey.split(":");
      return Number(leftRow) - Number(rightRow);
    })
    .map(([key, cells], index) => {
      const [section] = key.split(":");
      const sortedCells = cells
        .slice()
        .sort((leftCell, rightCell) => {
          if (leftCell.__sortColumn !== rightCell.__sortColumn) {
            return leftCell.__sortColumn - rightCell.__sortColumn;
          }

          return leftCell.__sortOrder - rightCell.__sortOrder;
        })
        .map(({ __sortColumn, __sortOrder, ...cell }) => cell);

      markRowsUsed(sortedCells, usedBoxKeys);

      if (section === "left" || section === "right") {
        const sideCapacity = section === "left" ? leftPerRow : rightPerRow;
        const paddedCells =
          sideCapacity && sortedCells.length < sideCapacity
            ? [
                ...sortedCells,
                ...Array.from({ length: sideCapacity - sortedCells.length }, () => createEmptyCell()),
              ]
            : sortedCells;

        return finalizeClientRow(
          {
            id: `loose-side-${index}`,
            kind: "side",
            cells:
              section === "left"
                ? [...paddedCells, createAisleCell(`loose-aisle-left-${index}`)]
                : [createAisleCell(`loose-aisle-right-${index}`), ...paddedCells],
          },
          index,
        );
      }

      const paddedCells =
        totalBoxes && sortedCells.length < totalBoxes
          ? [
              ...sortedCells,
              ...Array.from({ length: totalBoxes - sortedCells.length }, () => createEmptyCell()),
            ]
          : sortedCells;

      return finalizeClientRow(
        {
          id: `loose-${section}-${index}`,
          kind: section === "back" ? "back" : section === "luggage" ? "luggage" : "mixed",
          cells: paddedCells,
        },
        index,
      );
    });
}

function markRowsUsed(cells, usedBoxKeys) {
  cells.forEach((cell) => {
    markCellUsed(cell, usedBoxKeys);
  });
}

function normalizeClientRows(clientLayout) {
  const boxes = asArray(clientLayout?.boxes);
  const boxMap = indexClientBoxes(boxes);
  const previewDefinitions = getPreviewRowDefinitions(clientLayout);
  const sideConfig = {
    leftSeatsPerRow: toPositiveNumber(
      firstDefined(clientLayout?.leftSeatsPerRow, clientLayout?.left_seats_per_row),
    ),
    rightSeatsPerRow: toPositiveNumber(
      firstDefined(clientLayout?.rightSeatsPerRow, clientLayout?.right_seats_per_row),
    ),
  };

  if (previewDefinitions.length) {
    const previewUsedBoxKeys = new Set();
    const previewRows = previewDefinitions
      .flatMap((definition, rowIndex) =>
        buildClientRowFromPreview(definition, rowIndex, boxMap, previewUsedBoxKeys, sideConfig),
      )
      .filter(Boolean);

    // When preview metadata exists, treat it as the full admin-authored layout.
    // Do not synthesize extra rows from loose boxes below the preview output.
    if (previewRows.length) {
      return previewRows;
    }
  }

  const editorUsedBoxKeys = new Set();
  const editorRows = asArray(clientLayout?.editorRows)
    .flatMap((row, rowIndex) =>
      buildClientRowsFromEditorRow(row, rowIndex, boxMap, editorUsedBoxKeys, sideConfig),
    )
    .filter(Boolean);
  const looseRows = buildClientRowsFromLooseBoxes(clientLayout, boxes, editorUsedBoxKeys);

  return [...editorRows, ...looseRows];
}

function createRenderModel(rows, options = {}) {
  const normalizedRows = normalizeDuplicateSeatPlaceholders(
    rows.filter((row) => Array.isArray(row?.cells) && row.cells.length),
  );
  const columnCount = normalizedRows.reduce((max, row) => Math.max(max, row.cells.length), 0);
  const seatNumbers = Array.from(
    new Set(
      normalizedRows.flatMap((row) =>
        row.cells
          .filter((cell) => cell.type === "seat" && cell.seatNumber)
          .map((cell) => cell.seatNumber),
      ),
    ),
  );

  return {
    source: options.source || "legacy",
    totalBoxes: options.totalBoxes || columnCount,
    leftSeatsPerRow: options.leftSeatsPerRow || 0,
    rightSeatsPerRow: options.rightSeatsPerRow || 0,
    columnCount,
    seatNumbers,
    rows: normalizedRows,
  };
}

function normalizeDuplicateSeatPlaceholders(rows) {
  const realSeatNumbers = new Set(
    rows.flatMap((row) =>
      row.cells
        .filter((cell) => cell.type === "seat" && cell.seatNumber)
        .map((cell) => cell.seatNumber),
    ),
  );

  return rows.map((row) => ({
    ...row,
    cells: row.cells.map((cell) => {
      if (
        cell.type === "inactive" &&
        cell.seatNumber &&
        realSeatNumbers.has(cell.seatNumber)
      ) {
        return {
          ...cell,
          type: "facility",
          facilityType: "luggage",
          seatNumber: "",
          section: "luggage",
        };
      }

      return cell;
    }),
  }));
}

function buildLegacySeatRenderModel(layout) {
  const rows = buildSeatGrid(layout).map((cells, rowIndex) => ({
    id: `legacy-row-${rowIndex}`,
    kind: inferRowKind(cells),
    cells,
  }));

  return createRenderModel(rows, {
    source: "legacy",
    totalBoxes: rows.reduce((max, row) => Math.max(max, row.cells.length), 0),
    leftSeatsPerRow: toPositiveNumber(
      firstDefined(layout?.leftSeatsPerRow, layout?.left_seats_per_row),
    ),
    rightSeatsPerRow: toPositiveNumber(
      firstDefined(layout?.rightSeatsPerRow, layout?.right_seats_per_row),
    ),
  });
}

function buildClientSeatRenderModel(clientLayout) {
  const rows = normalizeClientRows(clientLayout);

  return createRenderModel(rows, {
    source: "client",
    totalBoxes: toPositiveNumber(firstDefined(clientLayout?.totalBoxes, clientLayout?.total_boxes)),
    leftSeatsPerRow: toPositiveNumber(
      firstDefined(clientLayout?.leftSeatsPerRow, clientLayout?.left_seats_per_row),
    ),
    rightSeatsPerRow: toPositiveNumber(
      firstDefined(clientLayout?.rightSeatsPerRow, clientLayout?.right_seats_per_row),
    ),
  });
}

export function buildSeatRenderModel(layout) {
  const clientLayout = layout?.clientSeatLayout || layout?.client_seat_layout || null;

  if (clientLayout) {
    const clientRenderModel = buildClientSeatRenderModel(clientLayout);
    if (clientRenderModel.rows.length) {
      return clientRenderModel;
    }
  }

  return buildLegacySeatRenderModel(layout);
}

export function normalizeSeatLayoutResponse(apiData) {
  const data = apiData && typeof apiData === "object" ? apiData : {};
  const layout = data.layout && typeof data.layout === "object" ? data.layout : {};
  const clientLayout = layout.clientSeatLayout || layout.client_seat_layout || null;
  const normalizedLayout = {
    ...layout,
    clientSeatLayout: clientLayout,
    client_seat_layout: clientLayout ?? null,
  };

  return {
    ...data,
    basePrice: firstDefined(
      data.basePrice,
      data.price,
      data.fare?.basePrice,
      data.fare?.price,
    ),
    currency: firstDefined(data.currency, data.fare?.currency),
    layout: normalizedLayout,
    renderModel: buildSeatRenderModel(normalizedLayout),
    seatState: {
      available: getSeatAvailabilitySeatNumbers(data.availableSeats),
      booked: getSeatAvailabilitySeatNumbers(data.bookedSeats),
      blocked: getSeatAvailabilitySeatNumbers(data.blockedSeats),
    },
  };
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
