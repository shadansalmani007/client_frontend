function sanitizePdfText(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapePdfText(value) {
  return sanitizePdfText(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapText(text, maxChars = 88) {
  const normalized = sanitizePdfText(text);

  if (!normalized) {
    return [""];
  }

  const words = normalized.split(" ");
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (nextLine.length <= maxChars) {
      currentLine = nextLine;
      return;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    if (word.length <= maxChars) {
      currentLine = word;
      return;
    }

    let sliceStart = 0;
    while (sliceStart < word.length) {
      const slice = word.slice(sliceStart, sliceStart + maxChars);
      if (slice.length === maxChars) {
        lines.push(slice);
      } else {
        currentLine = slice;
      }
      sliceStart += maxChars;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length ? lines : [""];
}

function formatRgb(color) {
  return color.map((value) => Number(value).toFixed(3)).join(" ");
}

function createTextCommand({ text, x, y, size, color }) {
  return `BT ${formatRgb(color)} rg /F1 ${size} Tf 1 0 0 1 ${x} ${y} Tm (${escapePdfText(
    text,
  )}) Tj ET`;
}

function createRuleCommand(y) {
  return `0.886 0.910 0.941 RG 48 ${y} m 547 ${y} l S`;
}

function createPdfBlob(pages) {
  const objects = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  const pageRefs = [];
  let nextId = 4;

  pages.forEach((content) => {
    const contentId = nextId;
    const pageId = nextId + 1;
    nextId += 2;

    const stream = content.join("\n");
    objects[contentId] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    objects[pageId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] ` +
      `/Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`;
    pageRefs.push(`${pageId} 0 R`);
  });

  objects[2] = `<< /Type /Pages /Count ${pageRefs.length} /Kids [${pageRefs.join(" ")}] >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (let index = 1; index < objects.length; index += 1) {
    offsets[index] = pdf.length;
    pdf += `${index} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;

  for (let index = 1; index < objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }

  pdf +=
    `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\n` +
    `startxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

export function downloadTripDetailsPdf({
  filename = "trip-details.pdf",
  title,
  subtitle,
  sections = [],
  footer,
}) {
  const pageWidth = 595;
  const pageHeight = 842;
  const left = 48;
  const right = pageWidth - 48;
  const top = pageHeight - 52;
  const bottom = 52;
  const pages = [[]];
  let y = top;

  const currentPage = () => pages[pages.length - 1];

  const startNewPage = () => {
    pages.push([]);
    y = top;
  };

  const ensureSpace = (requiredHeight) => {
    if (y - requiredHeight < bottom) {
      startNewPage();
    }
  };

  const addWrappedText = ({
    text,
    size = 11,
    color = [0, 0, 0],
    leading = 15,
    maxChars = 88,
    gapAfter = 0,
  }) => {
    wrapText(text, maxChars).forEach((line) => {
      ensureSpace(leading);
      currentPage().push(
        createTextCommand({
          text: line,
          x: left,
          y,
          size,
          color,
        }),
      );
      y -= leading;
    });

    y -= gapAfter;
  };

  const addRule = () => {
    ensureSpace(10);
    currentPage().push(createRuleCommand(y));
    y -= 14;
  };

  addWrappedText({
    text: title,
    size: 20,
    color: [0.561, 0.133, 0.196],
    leading: 24,
    maxChars: 42,
  });

  if (subtitle) {
    addWrappedText({
      text: subtitle,
      size: 10,
      color: [0.388, 0.455, 0.533],
      leading: 14,
      maxChars: 92,
      gapAfter: 2,
    });
  }

  addRule();

  sections.forEach((section) => {
    addWrappedText({
      text: section.title,
      size: 14,
      color: [0.173, 0.243, 0.314],
      leading: 20,
      maxChars: 60,
      gapAfter: 2,
    });

    section.lines.forEach((line) => {
      addWrappedText({
        text: line,
        size: 11,
        color: [0.102, 0.141, 0.192],
        leading: 15,
        maxChars: 88,
      });
    });

    y -= 8;
  });

  if (footer) {
    addRule();
    addWrappedText({
      text: footer,
      size: 9,
      color: [0.388, 0.455, 0.533],
      leading: 12,
      maxChars: 96,
    });
  }

  const blob = createPdfBlob(pages);
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = filename;
  downloadLink.click();
  URL.revokeObjectURL(url);
}
