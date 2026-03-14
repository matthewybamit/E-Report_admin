// src/utils/generateCertificate.js
// ─────────────────────────────────────────────────────────────────────────────
// Generates official Barangay Salvacion certificates as .docx files.
// Header layout exactly matches the official letterhead:
//   [ Left Seal Image ] | [ Center Text Block ] | [ Right Seal Image ]
// ─────────────────────────────────────────────────────────────────────────────
import {
  AlignmentType,
  BorderStyle,
  Document,
  ImageRun,
  Packer,
  PageOrientation,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  UnderlineType,
  VerticalAlign,
  WidthType,
} from "docx";

// ── Officials ─────────────────────────────────────────────────────────────────
const PUNONG    = "SARAH A. BERNARDINO";
const SECRETARY = "MARISSA M. NAAG";

// ── Fonts ─────────────────────────────────────────────────────────────────────
const CAMBRIA = "Cambria";
const TIMES   = "Times New Roman";
const ARIAL   = "Arial";

// ── Colors ────────────────────────────────────────────────────────────────────
const BLUE_DARK  = "1A3A6B";
const BLACK      = "000000";
const RED_CERT   = "CC0000";
const LINK_BLUE  = "1155CC";
const NAVY       = "1A3A8F";
const LIGHT_BLUE = "EEF2FF";

// ID card specific colors
const ID_NAVY        = "1A3A6B";   // header/footer band
const ID_NAVY_LIGHT  = "2B5297";   // accent
const ID_GOLD        = "C8A951";   // gold accent line
const ID_WHITE       = "FFFFFF";
const ID_LIGHT_GREY  = "F5F7FA";
const ID_MID_GREY    = "E2E8F0";
const ID_TEXT_DARK   = "1E293B";
const ID_TEXT_MID    = "475569";
const ID_TEXT_LIGHT  = "94A3B8";

// ── Unit helpers ──────────────────────────────────────────────────────────────
const twip = (pt) => Math.round(pt * 20);
const hp   = (pt) => Math.round(pt * 2);

// ── Border helpers ────────────────────────────────────────────────────────────
const NO_BORDER  = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const NO_BORDERS = {
  top: NO_BORDER, bottom: NO_BORDER,
  left: NO_BORDER, right: NO_BORDER,
  insideH: NO_BORDER, insideV: NO_BORDER,
};
const THIN_NAVY  = { style: BorderStyle.SINGLE, size: 6,  color: NAVY };
const MED_NAVY   = { style: BorderStyle.SINGLE, size: 12, color: NAVY };
const LIGHT_GREY = { style: BorderStyle.SINGLE, size: 4,  color: "D1D5DB" };

// ── Page setup (portrait letter) ──────────────────────────────────────────────
const PAGE = {
  size:   { width: twip(612), height: twip(792) },
  margin: { top: twip(45), right: twip(54), bottom: twip(45), left: twip(54) },
};
const PW = twip(504); // printable width in twips

// ── Data URL → Uint8Array ─────────────────────────────────────────────────────
function dataUrlToUint8Array(dataUrl) {
  if (!dataUrl) return null;
  try {
    const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
    const binary  = atob(base64);
    const bytes   = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

// ── Text run helpers ──────────────────────────────────────────────────────────
const run = (text, opts = {}) =>
  new TextRun({ text, font: CAMBRIA, size: hp(10), color: BLACK, ...opts });

const boldRun = (text, opts = {}) =>
  run(text, { bold: true, ...opts });

const spacer = (before = 6, after = 0) =>
  new Paragraph({ spacing: { before: twip(before), after: twip(after) }, children: [] });

const rule = () =>
  new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: BLACK, space: 1 } },
    spacing: { before: twip(3), after: twip(3) },
    children: [],
  });

// ─────────────────────────────────────────────────────────────────────────────
// OFFICIAL LETTERHEAD HEADER
// ─────────────────────────────────────────────────────────────────────────────
function buildHeader(leftDataUrl, rightDataUrl) {
  const IMG_COL_W = 1400;
  const TXT_COL_W = PW - IMG_COL_W * 2;

  const imgCell = (dataUrl, align) => {
    const bytes    = dataUrlToUint8Array(dataUrl);
    const children = bytes
      ? [new ImageRun({ data: bytes, transformation: { width: 78, height: 78 } })]
      : [];
    return new TableCell({
      width:         { size: IMG_COL_W, type: WidthType.DXA },
      verticalAlign: VerticalAlign.CENTER,
      borders:       NO_BORDERS,
      children: [new Paragraph({ alignment: align, spacing: { before: 0, after: 0 }, children })],
    });
  };

  const centerCell = new TableCell({
    width:         { size: TXT_COL_W, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    borders:       NO_BORDERS,
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 }, children: [new TextRun({ text: "REPUBLIC OF THE PHILIPPINES", bold: true, size: hp(9), font: TIMES, color: BLACK })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 }, children: [new TextRun({ text: "Area 6, District 1, Quezon City", size: hp(9), font: CAMBRIA, color: BLACK })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: twip(1), after: 0 }, children: [new TextRun({ text: "BARANGAY SALVACION", bold: true, size: hp(24), font: TIMES, color: BLUE_DARK })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 }, children: [new TextRun({ text: "Tanggapan ng Punong Barangay", bold: true, size: hp(12), font: CAMBRIA, color: BLACK })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 }, children: [new TextRun({ text: "74 Bulusan Street, La Loma, Quezon City", size: hp(9), font: CAMBRIA, color: BLACK })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 }, children: [new TextRun({ text: "Barangaysalvacion1114@gmail.com", size: hp(9), font: CAMBRIA, color: LINK_BLUE })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 }, children: [new TextRun({ text: "8-742-0944/0920-433-1754", size: hp(9), font: CAMBRIA, color: BLACK })] }),
    ],
  });

  return [
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: NO_BORDERS,
      rows: [new TableRow({ children: [imgCell(leftDataUrl, AlignmentType.LEFT), centerCell, imgCell(rightDataUrl, AlignmentType.RIGHT)] })],
    }),
    spacer(4),
    rule(),
    spacer(6),
  ];
}

// ── Signature helpers ─────────────────────────────────────────────────────────
function rightSig(name = PUNONG, title = "Punong Barangay") {
  return [
    new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: twip(2), after: 0 }, children: [new TextRun({ text: name, bold: true, size: hp(11), font: CAMBRIA, underline: { type: UnderlineType.SINGLE } })] }),
    new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 0, after: twip(4) }, children: [new TextRun({ text: title, italics: true, size: hp(10), font: CAMBRIA })] }),
  ];
}

function leftSig(name = SECRETARY, title = "Barangay Secretary") {
  return [
    new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: name, bold: true, size: hp(11), font: CAMBRIA, underline: { type: UnderlineType.SINGLE } })] }),
    new Paragraph({ spacing: { before: 0, after: twip(4) }, children: [new TextRun({ text: title, italics: true, size: hp(10), font: CAMBRIA })] }),
  ];
}

function twoColSig() {
  return [
    new Paragraph({
      tabStops: [{ type: "right", position: PW }],
      spacing: { before: twip(2), after: 0 },
      children: [
        new TextRun({ text: SECRETARY, bold: true, size: hp(11), font: CAMBRIA, underline: { type: UnderlineType.SINGLE } }),
        new TextRun({ text: "\t" }),
        new TextRun({ text: PUNONG, bold: true, size: hp(11), font: CAMBRIA, underline: { type: UnderlineType.SINGLE } }),
      ],
    }),
    new Paragraph({
      tabStops: [{ type: "right", position: PW }],
      spacing: { before: 0, after: twip(2) },
      children: [
        new TextRun({ text: "Brgy. Secretary", italics: true, size: hp(10), font: CAMBRIA }),
        new TextRun({ text: "\t" }),
        new TextRun({ text: "Punong Barangay", italics: true, size: hp(10), font: CAMBRIA }),
      ],
    }),
  ];
}

function footerNote() {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: twip(3), after: 0 },
    children: [new TextRun({ text: "*Not valid without dry seal", italics: true, size: hp(8), font: CAMBRIA })],
  });
}

function controlBlock(data) {
  return [
    rule(),
    spacer(2),
    new Paragraph({ spacing: { before: 0, after: twip(1) }, children: [boldRun(`Control Number: ${data.control_number || "—"}`, { size: hp(9) })] }),
    new Paragraph({ spacing: { before: 0, after: twip(1) }, children: [boldRun("Official Receipt No.: ", { size: hp(9) }), boldRun(data.or_no || "—", { size: hp(9), underline: { type: UnderlineType.SINGLE } })] }),
    new Paragraph({ spacing: { before: 0, after: twip(2) }, children: [boldRun(`Amount: ${data.amount || "—"}`, { size: hp(9) })] }),
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENT 0 — BARANGAY ID CARD
// Landscape page, credit-card style, front face only.
// Dimensions: ~3.375" × 2.125" (standard CR80) scaled up on the page.
// We render TWO cards per page (front + print instructions) for easy cutting.
// ─────────────────────────────────────────────────────────────────────────────
function buildBarangayID(data, leftDataUrl, rightDataUrl) {
  // Landscape: width=11", height=8.5"
  // Content width (0.75" margins each side) = 9.5" = 13680 DXA
  // Card width: 5.5" = 7920 DXA    Card height: 3.5" = 5040 DXA
  // We center a single card on the page with print instructions below.

  const CARD_W   = 7920;  // 5.5"
  const PHOTO_W  = 1800;  // 1.25" — photo column
  const INFO_W   = CARD_W - PHOTO_W; // 4.25"
  const PAGE_W   = 13680; // printable width in landscape with 0.75" margins

  const CELL_MARGIN = { top: 80, bottom: 80, left: 120, right: 120 };
  const ZERO_MARGIN = { top: 0, bottom: 0, left: 0, right: 0 };

  // ── Date helpers ────────────────────────────────────────────────────────────
  const formatDate = (d) => {
    if (!d) return "—";
    const dt = typeof d === "string" ? new Date(d) : d;
    return dt.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" });
  };

  const issuedDate = data.processed_at ? formatDate(data.processed_at) : "—";
  const expiryDate = (() => {
    if (!data.processed_at) return "—";
    const d = new Date(data.processed_at);
    d.setFullYear(d.getFullYear() + 3); // ID valid for 3 years
    return formatDate(d);
  })();

  // ── Photo bytes ─────────────────────────────────────────────────────────────
  const photoBytes = dataUrlToUint8Array(data.photo_2x2_url);
  const leftBytes  = dataUrlToUint8Array(leftDataUrl);
  const rightBytes = dataUrlToUint8Array(rightDataUrl);

  // ── Card border helper ──────────────────────────────────────────────────────
  const CARD_BORDER = { style: BorderStyle.SINGLE, size: 8, color: ID_NAVY };
  const cardBorders = { top: CARD_BORDER, bottom: CARD_BORDER, left: CARD_BORDER, right: CARD_BORDER };

  // ── Helper: text cell ───────────────────────────────────────────────────────
  const infoCell = (children, opts = {}) =>
    new TableCell({
      width:         { size: INFO_W, type: WidthType.DXA },
      verticalAlign: opts.vAlign || VerticalAlign.TOP,
      borders:       NO_BORDERS,
      margins:       opts.margins || CELL_MARGIN,
      shading:       { type: ShadingType.CLEAR, fill: opts.fill || ID_WHITE, color: "auto" },
      columnSpan:    opts.span,
      children,
    });

  // ── Helper: photo cell (spans rows) ─────────────────────────────────────────
  const photoCell = () =>
    new TableCell({
      width:         { size: PHOTO_W, type: WidthType.DXA },
      verticalAlign: VerticalAlign.CENTER,
      borders:       NO_BORDERS,
      margins:       { top: 100, bottom: 100, left: 100, right: 80 },
      shading:       { type: ShadingType.CLEAR, fill: ID_LIGHT_GREY, color: "auto" },
      rowSpan:       6,
      children: [
        photoBytes
          ? new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 0 },
              children: [new ImageRun({ data: photoBytes, transformation: { width: 80, height: 100 }, type: "jpg" })],
            })
          : new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: twip(8), after: 0 },
              children: [new TextRun({ text: "2×2", bold: true, size: hp(10), font: ARIAL, color: ID_TEXT_LIGHT })],
            }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: twip(3), after: 0 },
          children: [new TextRun({ text: "PHOTO", size: hp(7), font: ARIAL, color: ID_TEXT_LIGHT })],
        }),
      ],
    });

  // ── Helper: label + value paragraph pair ────────────────────────────────────
  const fieldLabel = (label) =>
    new Paragraph({
      spacing: { before: twip(2), after: 0 },
      children: [new TextRun({ text: label.toUpperCase(), size: hp(6.5), font: ARIAL, color: ID_TEXT_LIGHT, bold: true })],
    });

  const fieldValue = (value, opts = {}) =>
    new Paragraph({
      spacing: { before: 0, after: twip(2) },
      children: [new TextRun({ text: value || "—", size: opts.large ? hp(11) : hp(9), font: ARIAL, color: opts.color || ID_TEXT_DARK, bold: opts.bold || false })],
    });

  // ─────────────────────────────────────────────────────────────────────────
  // HEADER ROW — navy band with seals and barangay name
  // ─────────────────────────────────────────────────────────────────────────
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      // Left seal
      new TableCell({
        width: { size: PHOTO_W, type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER,
        borders: NO_BORDERS,
        margins: { top: 60, bottom: 60, left: 100, right: 60 },
        shading: { type: ShadingType.CLEAR, fill: ID_NAVY, color: "auto" },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 0 },
            children: leftBytes
              ? [new ImageRun({ data: leftBytes, transformation: { width: 40, height: 40 }, type: "png" })]
              : [new TextRun({ text: "🏛", size: hp(16), font: ARIAL })],
          }),
        ],
      }),
      // Center text
      new TableCell({
        width: { size: INFO_W, type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER,
        borders: NO_BORDERS,
        margins: { top: 60, bottom: 60, left: 120, right: 120 },
        shading: { type: ShadingType.CLEAR, fill: ID_NAVY, color: "auto" },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 0 },
            children: [new TextRun({ text: "REPUBLIC OF THE PHILIPPINES", size: hp(7), font: ARIAL, color: ID_WHITE, bold: true })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 0 },
            children: [new TextRun({ text: "Barangay Salvacion, La Loma, Quezon City", size: hp(7), font: ARIAL, color: "BAC8E8" })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: twip(2), after: 0 },
            children: [new TextRun({ text: "BARANGAY SALVACION", size: hp(13), font: TIMES, color: ID_WHITE, bold: true })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 0 },
            children: [new TextRun({ text: "BARANGAY IDENTIFICATION CARD", size: hp(7.5), font: ARIAL, color: ID_GOLD, bold: true })],
          }),
        ],
      }),
    ],
  });

  // ─────────────────────────────────────────────────────────────────────────
  // DATA ROWS — photo column (rowSpan) + info cells
  // ─────────────────────────────────────────────────────────────────────────

  // Row 1: photo + Name
  const row1 = new TableRow({
    children: [
      photoCell(),
      infoCell([
        fieldLabel("Name"),
        fieldValue(data.full_name, { large: true, bold: true, color: ID_NAVY }),
      ], { fill: ID_WHITE, margins: { top: 80, bottom: 0, left: 120, right: 120 } }),
    ],
  });

  // Row 2: Address
  const row2 = new TableRow({
    children: [
      infoCell([
        fieldLabel("Address"),
        fieldValue(data.address, { color: ID_TEXT_MID }),
      ], { fill: ID_WHITE, margins: { top: 0, bottom: 0, left: 120, right: 120 } }),
    ],
  });

  // Row 3: DOB + Gender side by side using nested table
  const splitRow = (label1, val1, label2, val2) => {
    const HALF = Math.floor(INFO_W / 2);
    return infoCell([
      new Table({
        width: { size: INFO_W - 240, type: WidthType.DXA },
        columnWidths: [HALF - 120, HALF - 120],
        borders: NO_BORDERS,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: HALF - 120, type: WidthType.DXA },
                borders: NO_BORDERS,
                margins: ZERO_MARGIN,
                children: [fieldLabel(label1), fieldValue(val1)],
              }),
              new TableCell({
                width: { size: HALF - 120, type: WidthType.DXA },
                borders: NO_BORDERS,
                margins: ZERO_MARGIN,
                children: [fieldLabel(label2), fieldValue(val2)],
              }),
            ],
          }),
        ],
      }),
    ], { fill: ID_WHITE, margins: { top: 0, bottom: 0, left: 120, right: 120 } });
  };

  const row3 = new TableRow({
    children: [
      splitRow(
        "Date of Birth",
        data.date_of_birth ? formatDate(data.date_of_birth) : "—",
        "Gender",
        data.gender || "—"
      ),
    ],
  });

  // Row 4: Civil Status + Blood Type (blood type not in schema, show civil status + contact)
  const row4 = new TableRow({
    children: [
      splitRow(
        "Civil Status",
        data.civil_status || "—",
        "Contact No.",
        data.contact_number || "—"
      ),
    ],
  });

  // Row 5: Control number
  const row5 = new TableRow({
    children: [
      infoCell([
        fieldLabel("ID / Control No."),
        fieldValue(data.control_number || "—", { bold: true, color: ID_NAVY_LIGHT }),
      ], { fill: ID_LIGHT_GREY, margins: { top: 0, bottom: 0, left: 120, right: 120 } }),
    ],
  });

  // Row 6: Validity
  const row6 = new TableRow({
    children: [
      splitRow("Date Issued", issuedDate, "Valid Until", expiryDate),
    ],
  });

  // ─────────────────────────────────────────────────────────────────────────
  // FOOTER ROW — navy band with signatures
  // ─────────────────────────────────────────────────────────────────────────
  const FOOT_HALF = Math.floor(CARD_W / 2);
  const footerRow = new TableRow({
    children: [
      new TableCell({
        width: { size: CARD_W, type: WidthType.DXA },
        columnSpan: 2,
        borders: NO_BORDERS,
        margins: { top: 60, bottom: 60, left: 140, right: 140 },
        shading: { type: ShadingType.CLEAR, fill: ID_NAVY, color: "auto" },
        children: [
          new Table({
            width: { size: CARD_W - 280, type: WidthType.DXA },
            columnWidths: [FOOT_HALF - 140, FOOT_HALF - 140],
            borders: NO_BORDERS,
            rows: [
              new TableRow({
                children: [
                  // Left: holder's signature line
                  new TableCell({
                    width: { size: FOOT_HALF - 140, type: WidthType.DXA },
                    borders: NO_BORDERS,
                    margins: ZERO_MARGIN,
                    children: [
                      new Paragraph({
                        spacing: { before: 0, after: twip(1) },
                        children: [new TextRun({ text: "_".repeat(28), size: hp(9), font: ARIAL, color: "BAC8E8" })],
                      }),
                      new Paragraph({
                        spacing: { before: 0, after: 0 },
                        children: [new TextRun({ text: "Signature of Holder", size: hp(7), font: ARIAL, color: "BAC8E8" })],
                      }),
                    ],
                  }),
                  // Right: Punong signature
                  new TableCell({
                    width: { size: FOOT_HALF - 140, type: WidthType.DXA },
                    borders: NO_BORDERS,
                    margins: ZERO_MARGIN,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        spacing: { before: 0, after: twip(1) },
                        children: [new TextRun({ text: PUNONG, size: hp(8), font: ARIAL, color: ID_WHITE, bold: true, underline: { type: UnderlineType.SINGLE } })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        spacing: { before: 0, after: 0 },
                        children: [new TextRun({ text: "Punong Barangay", size: hp(7), font: ARIAL, color: "BAC8E8", italics: true })],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // ── Assemble the card table ────────────────────────────────────────────────
  const cardTable = new Table({
    width:        { size: CARD_W, type: WidthType.DXA },
    columnWidths: [PHOTO_W, INFO_W],
    borders: {
      top:     CARD_BORDER,
      bottom:  CARD_BORDER,
      left:    CARD_BORDER,
      right:   CARD_BORDER,
      insideH: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideV: { style: BorderStyle.SINGLE, size: 2, color: ID_MID_GREY },
    },
    rows: [headerRow, row1, row2, row3, row4, row5, row6, footerRow],
  });

  // ── Gold accent rule ───────────────────────────────────────────────────────
  const goldRule = new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: ID_GOLD, space: 1 } },
    spacing: { before: 0, after: 0 },
    children: [],
  });

  // ── Centering wrapper: push card to center of landscape page ──────────────
  // Left margin = (PAGE_W - CARD_W) / 2
  const leftPad = Math.floor((PAGE_W - CARD_W) / 2);

  const centeredCard = new Paragraph({
    indent: { left: leftPad },
    spacing: { before: twip(24), after: twip(12) },
    children: [],
  });

  // ── Print instructions below card ─────────────────────────────────────────
  const instructions = [
    spacer(18),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: twip(3) },
      children: [new TextRun({ text: "PRINT INSTRUCTIONS", bold: true, size: hp(9), font: ARIAL, color: ID_TEXT_MID })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: twip(2) },
      children: [new TextRun({ text: "Print on thick cardstock (200–250 gsm) in landscape orientation. Cut along the card border.", size: hp(8), font: ARIAL, color: ID_TEXT_LIGHT })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: twip(2) },
      children: [new TextRun({ text: "Laminate after affixing the official dry seal. Not valid without dry seal.", italics: true, size: hp(8), font: ARIAL, color: ID_TEXT_LIGHT })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 0 },
      children: [new TextRun({ text: `Control No.: ${data.control_number || "—"}   ·   Valid: 3 years from issue date`, size: hp(8), font: ARIAL, color: ID_TEXT_LIGHT })],
    }),
  ];

  const children = [
    // Center the card horizontally
    new Table({
      width:        { size: PAGE_W, type: WidthType.DXA },
      columnWidths: [leftPad, CARD_W, PAGE_W - leftPad - CARD_W],
      borders:      NO_BORDERS,
      rows: [
        new TableRow({
          children: [
            // Left padding cell
            new TableCell({
              width: { size: leftPad, type: WidthType.DXA },
              borders: NO_BORDERS,
              children: [new Paragraph({ children: [] })],
            }),
            // Card cell
            new TableCell({
              width: { size: CARD_W, type: WidthType.DXA },
              borders: NO_BORDERS,
              margins: ZERO_MARGIN,
              children: [cardTable],
            }),
            // Right padding cell
            new TableCell({
              width: { size: PAGE_W - leftPad - CARD_W, type: WidthType.DXA },
              borders: NO_BORDERS,
              children: [new Paragraph({ children: [] })],
            }),
          ],
        }),
      ],
    }),
    ...instructions,
  ];

  return new Document({
    sections: [{
      properties: {
        page: {
          size: {
            // Landscape: pass portrait dims + orientation flag
            width:       twip(792),
            height:      twip(612),
            orientation: PageOrientation.LANDSCAPE,
          },
          margin: { top: twip(36), right: twip(54), bottom: twip(36), left: twip(54) },
        },
      },
      children,
    }],
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENT 1 — BARANGAY CLEARANCE
// ─────────────────────────────────────────────────────────────────────────────
function buildBarangayClearance(data, left, right) {
  const dateIssued = data.processed_at
    ? new Date(data.processed_at).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })
    : "—";
  const validUntil = data.processed_at
    ? (() => {
        const d = new Date(data.processed_at);
        d.setMonth(d.getMonth() + 6);
        return d.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" });
      })()
    : "6 MONTHS FROM DATE OF ISSUE";

  const fieldRows = [
    ["NAME",                data.full_name         || "—"],
    ["ADDRESS",             data.address           || "—"],
    ["DATE OF BIRTH",       data.date_of_birth     || "—"],
    ["PLACE OF BIRTH",      data.place_of_birth    || "—"],
    ["DATE OF RESIDENCY",   data.date_of_residency || "—"],
    ["GENDER",              data.gender            || "—"],
    ["CIVIL STATUS",        data.civil_status      || "—"],
    ["STATUS OF RESIDENCY", data.residency_status  || "—"],
    ["PURPOSE",             data.purpose           || "—"],
    ["CTC NO.",             data.ctc_no            || "-"],
    ["ISSUED AT",           "Barangay Salvacion, La Loma, Quezon City"],
    ["ISSUED ON",           dateIssued],
    ["O.R. NO.",            data.or_no             || "-"],
    ["CONTROL NO.",         data.control_number    || "—"],
    ["DATE ISSUED",         dateIssued],
    ["VALID UP TO",         validUntil],
  ].map(([label, value]) =>
    new TableRow({
      children: [
        new TableCell({ width: { size: 2200, type: WidthType.DXA }, borders: NO_BORDERS, children: [new Paragraph({ spacing: { before: twip(1.5), after: twip(1.5) }, children: [boldRun(label, { size: hp(10) })] })] }),
        new TableCell({ width: { size: 300,  type: WidthType.DXA }, borders: NO_BORDERS, children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: twip(1.5), after: twip(1.5) }, children: [boldRun(":", { size: hp(10) })] })] }),
        new TableCell({ width: { size: 5580, type: WidthType.DXA }, borders: NO_BORDERS, children: [new Paragraph({ spacing: { before: twip(1.5), after: twip(1.5) }, children: [new TextRun({ text: `"${value}"`, bold: true, italics: true, size: hp(10), font: CAMBRIA, color: label === "VALID UP TO" ? BLACK : RED_CERT })] })] }),
      ],
    })
  );

  fieldRows.push(new TableRow({
    children: [
      new TableCell({ width: { size: 2200, type: WidthType.DXA }, borders: NO_BORDERS, children: [new Paragraph({ spacing: { before: twip(5), after: twip(1.5) }, children: [boldRun("PREPARED BY", { size: hp(10), color: RED_CERT })] })] }),
      new TableCell({ width: { size: 300,  type: WidthType.DXA }, borders: NO_BORDERS, children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: twip(5), after: twip(1.5) }, children: [boldRun(":", { size: hp(10), color: RED_CERT })] })] }),
      new TableCell({ width: { size: 5580, type: WidthType.DXA }, borders: NO_BORDERS, children: [new Paragraph({ spacing: { before: twip(5), after: twip(1.5) }, children: [new TextRun({ text: data.processed_by || "NAME OF OPERATOR", bold: true, italics: true, size: hp(10), font: CAMBRIA, color: RED_CERT })] })] }),
    ],
  }));

  const children = [
    ...buildHeader(left, right),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: twip(8), after: twip(10) }, children: [new TextRun({ text: "BARANGAY CLEARANCE", bold: true, size: hp(20), font: TIMES })] }),
    new Paragraph({ spacing: { before: 0, after: twip(3) }, children: [boldRun("TO WHOM IT MAY CONCERN:", { size: hp(12) })] }),
    new Paragraph({ alignment: AlignmentType.JUSTIFY, spacing: { before: 0, after: twip(6) }, indent: { firstLine: twip(36) }, children: [run("This is to certify that the person whose name , thumb mark and picture appear here on has request for a "), boldRun("RECORD AND BARANGAY CLEARANCE", { italics: true }), run(" from this Office and the result are listed below :")] }),
    spacer(4),
    new Table({ width: { size: PW, type: WidthType.DXA }, borders: NO_BORDERS, rows: fieldRows }),
    spacer(12),
    rule(),
    spacer(14),
    ...twoColSig(),
    spacer(4),
    footerNote(),
  ];

  return new Document({ sections: [{ properties: { page: PAGE }, children }] });
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENT 2 — CERTIFICATE OF INDIGENCY
// ─────────────────────────────────────────────────────────────────────────────
function buildCertificateIndigency(data, left, right) {
  const givenDate = data.processed_at ? new Date(data.processed_at).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" }) : "—";
  const sex       = (data.gender || "").toLowerCase() === "female" ? "Female" : "Male";
  const pronoun   = (data.gender || "").toLowerCase() === "female" ? "She" : "He";
  const hisHer    = (data.gender || "").toLowerCase() === "female" ? "her" : "his";

  const children = [
    ...buildHeader(left, right),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: twip(8), after: twip(10) }, children: [new TextRun({ text: "CERTIFICATE OF INDIGENCY", bold: true, size: hp(20), font: TIMES })] }),
    new Paragraph({ alignment: AlignmentType.JUSTIFY, spacing: { before: 0, after: twip(5) }, indent: { firstLine: twip(36) }, children: [run("This is to certify that "), new TextRun({ text: `"${data.full_name || "—"}", "${data.age || "—"}", "${sex}",`, bold: true, size: hp(10), font: CAMBRIA, color: RED_CERT }), run(" Filipino is a bona fide resident of "), new TextRun({ text: `"${data.address || "—"}"`, bold: true, size: hp(10), font: CAMBRIA, color: RED_CERT }), run(" and one of the indigents in our Barangay.")] }),
    new Paragraph({ alignment: AlignmentType.JUSTIFY, spacing: { before: 0, after: twip(5) }, indent: { firstLine: twip(36) }, children: [run(`${pronoun} is financially hard -up to pay ${hisHer} ${data.assistance_type || "medication"}.`)] }),
    new Paragraph({ alignment: AlignmentType.JUSTIFY, spacing: { before: 0, after: twip(5) }, indent: { firstLine: twip(36) }, children: [run("This certification is being issued upon the request of "), new TextRun({ text: `"${data.full_name || "—"}"`, bold: true, italics: true, size: hp(10), font: CAMBRIA, color: RED_CERT }), run(" for "), new TextRun({ text: `"${data.purpose || "—"}".`, bold: true, italics: true, size: hp(10), font: CAMBRIA, color: RED_CERT })] }),
    new Paragraph({ alignment: AlignmentType.JUSTIFY, spacing: { before: 0, after: twip(14) }, indent: { firstLine: twip(36) }, children: [run("Issued this "), new TextRun({ text: `"${givenDate}"`, bold: true, size: hp(10), font: CAMBRIA, color: RED_CERT }), run(" Quezon City, Philippines.")] }),
    spacer(14),
    ...rightSig(PUNONG, "Punong Barangay"),
    spacer(10),
    new Paragraph({ spacing: { before: 0, after: twip(1) }, children: [run("Prepared by:")] }),
    spacer(4),
    ...leftSig(SECRETARY, "Barangay Secretary"),
    spacer(10),
    new Paragraph({ spacing: { before: 0, after: 0 }, children: [run("Applicant's Signature: " + "_".repeat(32))] }),
  ];

  return new Document({ sections: [{ properties: { page: PAGE }, children }] });
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENT 3 — BUSINESS CLEARANCE
// ─────────────────────────────────────────────────────────────────────────────
function buildBusinessClearance(data, left, right) {
  const givenDate = data.processed_at ? new Date(data.processed_at).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" }) : "—";
  const expiry = data.processed_at
    ? (() => { const d = new Date(data.processed_at); d.setFullYear(d.getFullYear() + 1); return d.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" }); })()
    : "—";

  const children = [
    ...buildHeader(left, right),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: twip(8), after: twip(10) }, children: [new TextRun({ text: "BARANGAY BUSINESS CLEARANCE", bold: true, size: hp(20), font: TIMES })] }),
    new Paragraph({ spacing: { before: 0, after: twip(3) }, children: [boldRun("TO WHOM IT MAY CONCERN:", { size: hp(11) })] }),
    new Paragraph({ alignment: AlignmentType.JUSTIFY, spacing: { before: 0, after: twip(3) }, indent: { firstLine: twip(36) }, children: [run("This is to certify that the Sangguniang Barangay of Barangay Salvacion interposes no objection to the "), boldRun("RENEWAL", { italics: true }), run(" of  business clearance of :")] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: twip(3), after: twip(1) }, children: [new TextRun({ text: `"${data.business_name || "Name of Business"}"`, bold: true, italics: true, size: hp(18), font: TIMES, color: RED_CERT })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: twip(1) }, children: [new TextRun({ text: `"${data.business_address || "ADDRESS OF BUSINESS"}"`, bold: true, italics: true, size: hp(10), font: CAMBRIA, color: RED_CERT })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: twip(5) }, children: [boldRun("BARANGAY SALVACION, LA LOMA, QUEZON CITY")] }),
    new Paragraph({ alignment: AlignmentType.JUSTIFY, spacing: { before: 0, after: twip(3) }, children: [run("It is further certified that the subject business establishment is not nuisance to public safety and order. Moreover, the above-named applicant pledge to abide with the existing laws, appertaining to said business; that the business is within Barangay territorial jurisdiction and does not occupy any Government property and sidewalk or street.")] }),
    new Paragraph({ alignment: AlignmentType.JUSTIFY, spacing: { before: 0, after: twip(2) }, children: [run("This Barangay business clearance is being issued upon the request of:")] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: twip(2), after: twip(5) }, children: [new TextRun({ text: `"${data.full_name || "Name of Owner"}"`, bold: true, italics: true, size: hp(18), font: TIMES, color: RED_CERT })] }),
    new Paragraph({ alignment: AlignmentType.JUSTIFY, spacing: { before: 0, after: twip(3) }, children: [run("For presentation to the Business Permit & Licensing Office, this City, prior to the issuance of any license for said business activity pursuant to Sec. 152 par. C, of the 1991 Local Government Code.")] }),
    new Paragraph({ alignment: AlignmentType.JUSTIFY, spacing: { before: 0, after: twip(4) }, children: [boldRun("This certification is subject for CANCELLATION for any cause that violates the existing rules and regulation/ordinances of the City and Barangay.")] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: twip(1) }, children: [boldRun("This permit will expire on "), new TextRun({ text: `"${expiry}"`, bold: true, size: hp(10), font: CAMBRIA, color: RED_CERT })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: twip(10) }, children: [boldRun("Given this "), new TextRun({ text: `"${givenDate}"`, bold: true, size: hp(10), font: CAMBRIA, color: RED_CERT })] }),
    rule(),
    spacer(4),
    ...rightSig(PUNONG, "Punong Barangay"),
    spacer(2),
    new Paragraph({ spacing: { before: 0, after: twip(1) }, children: [run("Records verified by")] }),
    spacer(4),
    ...leftSig(SECRETARY, "Barangay Secretary"),
    ...controlBlock(data),
    footerNote(),
  ];

  return new Document({ sections: [{ properties: { page: PAGE }, children }] });
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENT 4 — BARANGAY PERMIT CLEARANCE
// ─────────────────────────────────────────────────────────────────────────────
function buildBarangayPermitClearance(data, left, right) {
  const fmt = (d, addYears = 0) => {
    if (!d) return "___________________";
    const dt = new Date(d);
    if (addYears) dt.setFullYear(dt.getFullYear() + addYears);
    return dt.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" });
  };

  const givenDate = fmt(data.processed_at);
  const expiry    = fmt(data.processed_at, 1);
  const op        = data.processed_by || "Operator";

  const stripCellStyle = {
    borders: { top: THIN_NAVY, bottom: THIN_NAVY, left: THIN_NAVY, right: THIN_NAVY },
    shading: { type: ShadingType.CLEAR, fill: LIGHT_BLUE, color: "auto" },
    verticalAlign: VerticalAlign.CENTER,
  };

  const stripCell = (labelText, valueText) =>
    new TableCell({
      ...stripCellStyle,
      width: { size: Math.round(PW / 3), type: WidthType.DXA },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: twip(3), after: 0 }, children: [new TextRun({ text: labelText.toUpperCase(), bold: true, size: hp(8), font: CAMBRIA, color: NAVY })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: twip(1), after: twip(3) }, children: [new TextRun({ text: valueText, bold: true, size: hp(10), font: CAMBRIA, color: BLACK })] }),
      ],
    });

  const infoStrip = new Table({
    width: { size: PW, type: WidthType.DXA },
    rows: [new TableRow({ children: [stripCell("Control No.", data.control_number || "—"), stripCell("O.R. No.", data.or_no || "—"), stripCell("Date Issued", givenDate)] })],
  });

  const highlightBox = (titleText, subtitleText = "") =>
    new Table({
      width: { size: PW, type: WidthType.DXA },
      rows: [new TableRow({
        children: [new TableCell({
          borders: { top: MED_NAVY, bottom: MED_NAVY, left: { style: BorderStyle.SINGLE, size: 24, color: NAVY }, right: MED_NAVY },
          shading: { type: ShadingType.CLEAR, fill: LIGHT_BLUE, color: "auto" },
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: twip(5), after: subtitleText ? 0 : twip(5) }, children: [new TextRun({ text: titleText.toUpperCase(), bold: true, size: hp(14), font: TIMES, color: NAVY })] }),
            ...(subtitleText ? [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: twip(2), after: twip(5) }, children: [new TextRun({ text: subtitleText, italics: true, size: hp(10), font: CAMBRIA, color: BLACK })] })] : []),
          ],
        })],
      })],
    });

  const infoRows = [
    ["Applicant Name",               data.full_name        || "—"],
    ["Address",                      data.address          || data.business_address || "—"],
    ["Contact Number",               data.contact_number   || "—"],
    ["Business / Establishment",     data.business_name    || "—"],
    ["Business Address",             data.business_address || "—"],
    ["Nature of Business / Activity",data.business_type    || "—"],
    ["Purpose",                      data.purpose          || "—"],
    ["Date Issued",                  givenDate],
    ["Valid Until",                  expiry],
    ["O.R. No.",                     data.or_no            || "—"],
    ["Control No.",                  data.control_number   || "—"],
    ["Prepared By",                  data.processed_by     || SECRETARY],
  ];

  const detailsTable = new Table({
    width: { size: PW, type: WidthType.DXA },
    borders: { top: LIGHT_GREY, bottom: LIGHT_GREY, left: LIGHT_GREY, right: LIGHT_GREY, insideH: LIGHT_GREY, insideV: LIGHT_GREY },
    rows: infoRows.map(([label, value], i) =>
      new TableRow({
        children: [
          new TableCell({ width: { size: 2600, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, fill: i % 2 === 0 ? "F8FAFF" : "FFFFFF", color: "auto" }, borders: { top: LIGHT_GREY, bottom: LIGHT_GREY, left: LIGHT_GREY, right: LIGHT_GREY }, children: [new Paragraph({ spacing: { before: twip(4), after: twip(4) }, children: [new TextRun({ text: label.toUpperCase(), bold: true, size: hp(8.5), font: CAMBRIA, color: "374151" })] })] }),
          new TableCell({ width: { size: 200,  type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, fill: i % 2 === 0 ? "F8FAFF" : "FFFFFF", color: "auto" }, borders: { top: LIGHT_GREY, bottom: LIGHT_GREY, left: LIGHT_GREY, right: LIGHT_GREY }, children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: twip(4), after: twip(4) }, children: [boldRun(":", { size: hp(9) })] })] }),
          new TableCell({ width: { size: PW - 2800, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, fill: i % 2 === 0 ? "F8FAFF" : "FFFFFF", color: "auto" }, borders: { top: LIGHT_GREY, bottom: LIGHT_GREY, left: LIGHT_GREY, right: LIGHT_GREY }, children: [new Paragraph({ spacing: { before: twip(4), after: twip(4) }, children: [new TextRun({ text: value, bold: true, size: hp(9.5), font: CAMBRIA, color: BLACK })] })] }),
        ],
      })
    ),
  });

  const CONDITIONS = [
    "The applicant/operator shall comply with all existing laws, ordinances, and regulations of the City and this Barangay.",
    "The activity or business establishment shall not be a nuisance to public safety, peace, and order in the community.",
    "This clearance does not authorize the violation of any provision of law, ordinance, or regulation.",
    "Any violation of the conditions stated herein shall be a ground for the immediate REVOCATION of this clearance.",
  ];

  const validityBox = new Table({
    width: { size: Math.round(PW * 0.6), type: WidthType.DXA },
    rows: [new TableRow({
      children: [new TableCell({
        borders: { top: MED_NAVY, bottom: MED_NAVY, left: MED_NAVY, right: MED_NAVY },
        shading: { type: ShadingType.CLEAR, fill: LIGHT_BLUE, color: "auto" },
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: twip(4), after: 0 }, children: [new TextRun({ text: "VALID UNTIL", bold: true, size: hp(9), font: CAMBRIA, color: NAVY, characterSpacing: 120 })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: twip(2), after: 0 }, children: [new TextRun({ text: expiry, bold: true, size: hp(14), font: TIMES, color: BLACK, underline: { type: UnderlineType.SINGLE } })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: twip(3), after: twip(4) }, children: [new TextRun({ text: "Pursuant to Sec. 152, par. C of the 1991 Local Government Code", italics: true, size: hp(8), font: CAMBRIA, color: "6B7280" })] }),
        ],
      })],
    })],
  });

  const children = [
    ...buildHeader(left, right),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: twip(8), after: twip(8) }, children: [new TextRun({ text: "BARANGAY PERMIT CLEARANCE", bold: true, size: hp(20), font: TIMES })] }),
    infoStrip,
    spacer(8),
    new Paragraph({ spacing: { before: 0, after: twip(3) }, children: [boldRun("TO WHOM IT MAY CONCERN:", { size: hp(12) })] }),
    new Paragraph({ alignment: AlignmentType.JUSTIFY, spacing: { before: 0, after: twip(4) }, indent: { firstLine: twip(36) }, children: [run("This is to certify that the Sangguniang Barangay of "), boldRun("Barangay Salvacion, La Loma, Quezon City", { italics: true }), run(" interposes "), boldRun("NO OBJECTION", { underline: { type: UnderlineType.SINGLE } }), run(" and hereby grants this "), boldRun("BARANGAY PERMIT CLEARANCE", { italics: true }), run(" to:")] }),
    highlightBox(data.full_name || "APPLICANT NAME", data.address || data.business_address || ""),
    spacer(4),
    new Paragraph({ alignment: AlignmentType.JUSTIFY, spacing: { before: 0, after: twip(4) }, indent: { firstLine: twip(36) }, children: [run("For the operation / conduct of:")] }),
    highlightBox(data.business_name || "BUSINESS / ESTABLISHMENT NAME", [data.business_type, data.business_address].filter(Boolean).join(" · ") || ""),
    spacer(8),
    detailsTable,
    spacer(8),
    new Paragraph({ spacing: { before: 0, after: twip(3) }, children: [boldRun("This clearance is issued subject to the following conditions:", { size: hp(10) })] }),
    ...CONDITIONS.map((text, i) =>
      new Paragraph({ spacing: { before: twip(3), after: twip(1) }, indent: { left: twip(36), hanging: twip(18) }, children: [new TextRun({ text: `${i + 1}.\t`, bold: true, size: hp(10), font: CAMBRIA, color: NAVY }), run(text)] })
    ),
    spacer(6),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: twip(4) }, children: [] }),
    validityBox,
    spacer(4),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: twip(8) }, children: [boldRun("Given this "), new TextRun({ text: `"${givenDate}"`, bold: true, size: hp(10), font: CAMBRIA, color: RED_CERT }), run(` (${op}) at Barangay Salvacion, La Loma, Quezon City.`)] }),
    rule(),
    spacer(4),
    new Paragraph({ tabStops: [{ type: "right", position: PW }], spacing: { before: twip(2), after: 0 }, children: [run("Records verified by:", { italics: true }), new TextRun({ text: "\t" })] }),
    spacer(14),
    new Paragraph({ tabStops: [{ type: "right", position: PW }], spacing: { before: 0, after: 0 }, children: [new TextRun({ text: SECRETARY, bold: true, size: hp(11), font: CAMBRIA, underline: { type: UnderlineType.SINGLE } }), new TextRun({ text: "\t" }), new TextRun({ text: PUNONG, bold: true, size: hp(11), font: CAMBRIA, underline: { type: UnderlineType.SINGLE } })] }),
    new Paragraph({ tabStops: [{ type: "right", position: PW }], spacing: { before: 0, after: twip(4) }, children: [new TextRun({ text: "Barangay Secretary", italics: true, size: hp(10), font: CAMBRIA }), new TextRun({ text: "\t" }), new TextRun({ text: "Punong Barangay", italics: true, size: hp(10), font: CAMBRIA })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: twip(6), after: 0 }, children: [new TextRun({ text: "*Not valid without official dry seal", italics: true, size: hp(8), font: CAMBRIA })] }),
  ];

  return new Document({ sections: [{ properties: { page: PAGE }, children }] });
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * generateCertificate(request, images)
 * Builds the correct certificate DOCX and triggers a browser download.
 */
export async function generateCertificate(request, images = {}) {
  const leftDataUrl  = images.left  ?? images.leftHeader  ?? null;
  const rightDataUrl = images.right ?? images.rightHeader ?? null;

  let doc;
  switch (request.service_type) {
    case "barangay_id":
      doc = buildBarangayID(request, leftDataUrl, rightDataUrl);
      break;
    case "barangay_clearance":
      doc = buildBarangayClearance(request, leftDataUrl, rightDataUrl);
      break;
    case "certificate_indigency":
      doc = buildCertificateIndigency(request, leftDataUrl, rightDataUrl);
      break;
    case "business_clearance":
      doc = buildBusinessClearance(request, leftDataUrl, rightDataUrl);
      break;
    case "permit_to_roast":
      doc = buildBarangayPermitClearance(request, leftDataUrl, rightDataUrl);
      break;
    default:
      throw new Error(`No DOCX template for service type: ${request.service_type}`);
  }

  const blob    = await Packer.toBlob(doc);
  const url     = URL.createObjectURL(blob);
  const anchor  = document.createElement("a");
  anchor.href   = url;
  const safeName = (request.full_name || "Applicant").replace(/\s+/g, "_");
  anchor.download = `${request.control_number || request.service_type}_${safeName}.docx`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * hasDocxTemplate(serviceType)
 * Returns true for all service types that have a DOCX template.
 * barangay_id now included — generates a printable ID card.
 */
export function hasDocxTemplate(serviceType) {
  return [
    "barangay_id",
    "barangay_clearance",
    "certificate_indigency",
    "business_clearance",
    "permit_to_roast",
  ].includes(serviceType);
}