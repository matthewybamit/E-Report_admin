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

// ── Colors ────────────────────────────────────────────────────────────────────
const BLUE_DARK  = "1A3A6B";   // BARANGAY SALVACION header text
const BLACK      = "000000";
const RED_CERT   = "CC0000";   // placeholder values shown in red
const LINK_BLUE  = "1155CC";   // email link color
const NAVY       = "1A3A8F";   // accent borders / permit headings
const LIGHT_BLUE = "EEF2FF";   // highlight box fill

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
const THIN_NAVY = { style: BorderStyle.SINGLE, size: 6,  color: NAVY };
const MED_NAVY  = { style: BorderStyle.SINGLE, size: 12, color: NAVY };
const LIGHT_GREY = { style: BorderStyle.SINGLE, size: 4, color: "D1D5DB" };

// ── Page setup ────────────────────────────────────────────────────────────────
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
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0 },
        children: [new TextRun({ text: "REPUBLIC OF THE PHILIPPINES", bold: true, size: hp(9), font: TIMES, color: BLACK })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0 },
        children: [new TextRun({ text: "Area 6, District 1, Quezon City", size: hp(9), font: CAMBRIA, color: BLACK })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: twip(1), after: 0 },
        children: [new TextRun({ text: "BARANGAY SALVACION", bold: true, size: hp(24), font: TIMES, color: BLUE_DARK })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0 },
        children: [new TextRun({ text: "Tanggapan ng Punong Barangay", bold: true, size: hp(12), font: CAMBRIA, color: BLACK })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0 },
        children: [new TextRun({ text: "74 Bulusan Street, La Loma, Quezon City", size: hp(9), font: CAMBRIA, color: BLACK })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0 },
        children: [new TextRun({ text: "Barangaysalvacion1114@gmail.com", size: hp(9), font: CAMBRIA, color: LINK_BLUE })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0 },
        children: [new TextRun({ text: "8-742-0944/0920-433-1754", size: hp(9), font: CAMBRIA, color: BLACK })],
      }),
    ],
  });

  return [
    new Table({
      width:   { size: 100, type: WidthType.PERCENTAGE },
      borders: NO_BORDERS,
      rows: [
        new TableRow({
          children: [
            imgCell(leftDataUrl, AlignmentType.LEFT),
            centerCell,
            imgCell(rightDataUrl, AlignmentType.RIGHT),
          ],
        }),
      ],
    }),
    spacer(4),
    rule(),
    spacer(6),
  ];
}

// ── Signature helpers ─────────────────────────────────────────────────────────
function rightSig(name = PUNONG, title = "Punong Barangay") {
  return [
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: twip(2), after: 0 },
      children: [new TextRun({ text: name, bold: true, size: hp(11), font: CAMBRIA, underline: { type: UnderlineType.SINGLE } })],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 0, after: twip(4) },
      children: [new TextRun({ text: title, italics: true, size: hp(10), font: CAMBRIA })],
    }),
  ];
}

function leftSig(name = SECRETARY, title = "Barangay Secretary") {
  return [
    new Paragraph({
      spacing: { before: 0, after: 0 },
      children: [new TextRun({ text: name, bold: true, size: hp(11), font: CAMBRIA, underline: { type: UnderlineType.SINGLE } })],
    }),
    new Paragraph({
      spacing: { before: 0, after: twip(4) },
      children: [new TextRun({ text: title, italics: true, size: hp(10), font: CAMBRIA })],
    }),
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
        new TextRun({ text: "Brgy. Secretary",  italics: true, size: hp(10), font: CAMBRIA }),
        new TextRun({ text: "\t" }),
        new TextRun({ text: "Punong Barangay",  italics: true, size: hp(10), font: CAMBRIA }),
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
    new Paragraph({
      spacing: { before: 0, after: twip(1) },
      children: [boldRun(`Control Number: ${data.control_number || "—"}`, { size: hp(9) })],
    }),
    new Paragraph({
      spacing: { before: 0, after: twip(1) },
      children: [
        boldRun("Official Receipt No.: ", { size: hp(9) }),
        boldRun(data.or_no || "—", { size: hp(9), underline: { type: UnderlineType.SINGLE } }),
      ],
    }),
    new Paragraph({
      spacing: { before: 0, after: twip(2) },
      children: [boldRun(`Amount: ${data.amount || "—"}`, { size: hp(9) })],
    }),
  ];
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
        new TableCell({
          width: { size: 2200, type: WidthType.DXA }, borders: NO_BORDERS,
          children: [new Paragraph({
            spacing: { before: twip(1.5), after: twip(1.5) },
            children: [boldRun(label, { size: hp(10) })],
          })],
        }),
        new TableCell({
          width: { size: 300, type: WidthType.DXA }, borders: NO_BORDERS,
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: twip(1.5), after: twip(1.5) },
            children: [boldRun(":", { size: hp(10) })],
          })],
        }),
        new TableCell({
          width: { size: 5580, type: WidthType.DXA }, borders: NO_BORDERS,
          children: [new Paragraph({
            spacing: { before: twip(1.5), after: twip(1.5) },
            children: [new TextRun({
              text: `"${value}"`,
              bold: true, italics: true, size: hp(10), font: CAMBRIA,
              color: label === "VALID UP TO" ? BLACK : RED_CERT,
            })],
          })],
        }),
      ],
    })
  );

  // PREPARED BY row
  fieldRows.push(
    new TableRow({
      children: [
        new TableCell({
          width: { size: 2200, type: WidthType.DXA }, borders: NO_BORDERS,
          children: [new Paragraph({
            spacing: { before: twip(5), after: twip(1.5) },
            children: [boldRun("PREPARED BY", { size: hp(10), color: RED_CERT })],
          })],
        }),
        new TableCell({
          width: { size: 300, type: WidthType.DXA }, borders: NO_BORDERS,
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: twip(5), after: twip(1.5) },
            children: [boldRun(":", { size: hp(10), color: RED_CERT })],
          })],
        }),
        new TableCell({
          width: { size: 5580, type: WidthType.DXA }, borders: NO_BORDERS,
          children: [new Paragraph({
            spacing: { before: twip(5), after: twip(1.5) },
            children: [new TextRun({
              text: data.processed_by || "NAME OF OPERATOR",
              bold: true, italics: true, size: hp(10), font: CAMBRIA, color: RED_CERT,
            })],
          })],
        }),
      ],
    })
  );

  const children = [
    ...buildHeader(left, right),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: twip(8), after: twip(10) },
      children: [new TextRun({ text: "BARANGAY CLEARANCE", bold: true, size: hp(20), font: TIMES })],
    }),
    new Paragraph({
      spacing: { before: 0, after: twip(3) },
      children: [boldRun("TO WHOM IT MAY CONCERN:", { size: hp(12) })],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFY,
      spacing: { before: 0, after: twip(6) },
      indent: { firstLine: twip(36) },
      children: [
        run("This is to certify that the person whose name , thumb mark and picture appear here on has request for a "),
        boldRun("RECORD AND BARANGAY CLEARANCE", { italics: true }),
        run(" from this Office and the result are listed below :"),
      ],
    }),
    spacer(4),
    new Table({
      width: { size: PW, type: WidthType.DXA },
      borders: NO_BORDERS,
      rows: fieldRows,
    }),
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
  const givenDate = data.processed_at
    ? new Date(data.processed_at).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })
    : "—";
  const sex     = (data.gender || "").toLowerCase() === "female" ? "Female" : "Male";
  const pronoun = (data.gender || "").toLowerCase() === "female" ? "She" : "He";
  const hisHer  = (data.gender || "").toLowerCase() === "female" ? "her" : "his";

  const children = [
    ...buildHeader(left, right),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: twip(8), after: twip(10) },
      children: [new TextRun({ text: "CERTIFICATE OF INDIGENCY", bold: true, size: hp(20), font: TIMES })],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFY,
      spacing: { before: 0, after: twip(5) },
      indent: { firstLine: twip(36) },
      children: [
        run("This is to certify that "),
        new TextRun({ text: `"${data.full_name || "—"}", "${data.age || "—"}", "${sex}",`, bold: true, size: hp(10), font: CAMBRIA, color: RED_CERT }),
        run(" Filipino is a bona fide resident of "),
        new TextRun({ text: `"${data.address || "—"}"`, bold: true, size: hp(10), font: CAMBRIA, color: RED_CERT }),
        run(" and one of the indigents in our Barangay."),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFY,
      spacing: { before: 0, after: twip(5) },
      indent: { firstLine: twip(36) },
      children: [run(`${pronoun} is financially hard -up to pay ${hisHer} ${data.assistance_type || "medication"}.`)],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFY,
      spacing: { before: 0, after: twip(5) },
      indent: { firstLine: twip(36) },
      children: [
        run("This certification is being issued upon the request of "),
        new TextRun({ text: `"${data.full_name || "—"}"`, bold: true, italics: true, size: hp(10), font: CAMBRIA, color: RED_CERT }),
        run(" for "),
        new TextRun({ text: `"${data.purpose || "—"}".`, bold: true, italics: true, size: hp(10), font: CAMBRIA, color: RED_CERT }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFY,
      spacing: { before: 0, after: twip(14) },
      indent: { firstLine: twip(36) },
      children: [
        run("Issued this "),
        new TextRun({ text: `"${givenDate}"`, bold: true, size: hp(10), font: CAMBRIA, color: RED_CERT }),
        run(" Quezon City, Philippines."),
      ],
    }),
    spacer(14),
    ...rightSig(PUNONG, "Punong Barangay"),
    spacer(10),
    new Paragraph({ spacing: { before: 0, after: twip(1) }, children: [run("Prepared by:")] }),
    spacer(4),
    ...leftSig(SECRETARY, "Barangay Secretary"),
    spacer(10),
    new Paragraph({
      spacing: { before: 0, after: 0 },
      children: [run("Applicant's Signature: " + "_".repeat(32))],
    }),
  ];

  return new Document({ sections: [{ properties: { page: PAGE }, children }] });
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENT 3 — BUSINESS CLEARANCE
// ─────────────────────────────────────────────────────────────────────────────
function buildBusinessClearance(data, left, right) {
  const givenDate = data.processed_at
    ? new Date(data.processed_at).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })
    : "—";
  const expiry = data.processed_at
    ? (() => {
        const d = new Date(data.processed_at);
        d.setFullYear(d.getFullYear() + 1);
        return d.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" });
      })()
    : "—";

  const children = [
    ...buildHeader(left, right),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: twip(8), after: twip(10) },
      children: [new TextRun({ text: "BARANGAY BUSINESS CLEARANCE", bold: true, size: hp(20), font: TIMES })],
    }),
    new Paragraph({ spacing: { before: 0, after: twip(3) }, children: [boldRun("TO WHOM IT MAY CONCERN:", { size: hp(11) })] }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFY,
      spacing: { before: 0, after: twip(3) },
      indent: { firstLine: twip(36) },
      children: [
        run("This is to certify that the Sangguniang Barangay of Barangay Salvacion interposes no objection to the "),
        boldRun("RENEWAL", { italics: true }),
        run(" of  business clearance of :"),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: twip(3), after: twip(1) },
      children: [new TextRun({ text: `"${data.business_name || "Name of Business"}"`, bold: true, italics: true, size: hp(18), font: TIMES, color: RED_CERT })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: twip(1) },
      children: [new TextRun({ text: `"${data.business_address || "ADDRESS OF BUSINESS"}"`, bold: true, italics: true, size: hp(10), font: CAMBRIA, color: RED_CERT })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: twip(5) },
      children: [boldRun("BARANGAY SALVACION, LA LOMA, QUEZON CITY")],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFY,
      spacing: { before: 0, after: twip(3) },
      children: [run("It is further certified that the subject business establishment is not nuisance to public safety and order. Moreover, the above-named applicant pledge to abide with the existing laws, appertaining to said business; that the business is within Barangay territorial jurisdiction and does not occupy any Government property and sidewalk or street.")],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFY,
      spacing: { before: 0, after: twip(2) },
      children: [run("This Barangay business clearance is being issued upon the request of:")],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: twip(2), after: twip(5) },
      children: [new TextRun({ text: `"${data.full_name || "Name of Owner"}"`, bold: true, italics: true, size: hp(18), font: TIMES, color: RED_CERT })],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFY,
      spacing: { before: 0, after: twip(3) },
      children: [run("For presentation to the Business Permit & Licensing Office, this City, prior to the issuance of any license for said business activity pursuant to Sec. 152 par. C, of the 1991 Local Government Code.")],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFY,
      spacing: { before: 0, after: twip(4) },
      children: [boldRun("This certification is subject for CANCELLATION for any cause that violates the existing rules and regulation/ordinances of the City and Barangay.")],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: twip(1) },
      children: [
        boldRun("This permit will expire on "),
        new TextRun({ text: `"${expiry}"`, bold: true, size: hp(10), font: CAMBRIA, color: RED_CERT }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: twip(10) },
      children: [
        boldRun("Given this "),
        new TextRun({ text: `"${givenDate}"`, bold: true, size: hp(10), font: CAMBRIA, color: RED_CERT }),
      ],
    }),
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
// (DB key: "permit_to_roast" — display: "Barangay Permit Clearance")
// Layout: Info strip → opening → applicant box → business box →
//         details table → conditions → validity box → signatures
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

  // ── 1. Info strip — Control No | OR No | Date Issued ──────────────────────
  const stripCellStyle = {
    borders: {
      top:    THIN_NAVY,
      bottom: THIN_NAVY,
      left:   THIN_NAVY,
      right:  THIN_NAVY,
    },
    shading: { type: ShadingType.CLEAR, fill: LIGHT_BLUE, color: "auto" },
    verticalAlign: VerticalAlign.CENTER,
  };

  const stripCell = (labelText, valueText) =>
    new TableCell({
      ...stripCellStyle,
      width: { size: Math.round(PW / 3), type: WidthType.DXA },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: twip(3), after: 0 },
          children: [new TextRun({ text: labelText.toUpperCase(), bold: true, size: hp(8), font: CAMBRIA, color: NAVY })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: twip(1), after: twip(3) },
          children: [new TextRun({ text: valueText, bold: true, size: hp(10), font: CAMBRIA, color: BLACK })],
        }),
      ],
    });

  const infoStrip = new Table({
    width: { size: PW, type: WidthType.DXA },
    rows: [
      new TableRow({
        children: [
          stripCell("Control No.", data.control_number || "—"),
          stripCell("O.R. No.",    data.or_no          || "—"),
          stripCell("Date Issued", givenDate),
        ],
      }),
    ],
  });

  // ── 2. Highlight box helper (applicant / business) ─────────────────────────
  const highlightBox = (titleText, subtitleText = "") =>
    new Table({
      width: { size: PW, type: WidthType.DXA },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: {
                top:    MED_NAVY,
                bottom: MED_NAVY,
                left:   { style: BorderStyle.SINGLE, size: 24, color: NAVY }, // thick left accent
                right:  MED_NAVY,
              },
              shading: { type: ShadingType.CLEAR, fill: LIGHT_BLUE, color: "auto" },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: twip(5), after: subtitleText ? 0 : twip(5) },
                  children: [
                    new TextRun({ text: titleText.toUpperCase(), bold: true, size: hp(14), font: TIMES, color: NAVY }),
                  ],
                }),
                ...(subtitleText
                  ? [new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: twip(2), after: twip(5) },
                      children: [new TextRun({ text: subtitleText, italics: true, size: hp(10), font: CAMBRIA, color: BLACK })],
                    })]
                  : []),
              ],
            }),
          ],
        }),
      ],
    });

  // ── 3. Details info table ──────────────────────────────────────────────────
  const infoRows = [
    ["Applicant Name",              data.full_name        || "—"],
    ["Address",                     data.address          || data.business_address || "—"],
    ["Contact Number",              data.contact_number   || "—"],
    ["Business / Establishment",    data.business_name    || "—"],
    ["Business Address",            data.business_address || "—"],
    ["Nature of Business / Activity", data.business_type  || "—"],
    ["Purpose",                     data.purpose          || "—"],
    ["Date Issued",                 givenDate],
    ["Valid Until",                 expiry],
    ["O.R. No.",                    data.or_no            || "—"],
    ["Control No.",                 data.control_number   || "—"],
    ["Prepared By",                 data.processed_by     || SECRETARY],
  ];

  const detailsTable = new Table({
    width: { size: PW, type: WidthType.DXA },
    borders: {
      top:     LIGHT_GREY,
      bottom:  LIGHT_GREY,
      left:    LIGHT_GREY,
      right:   LIGHT_GREY,
      insideH: LIGHT_GREY,
      insideV: LIGHT_GREY,
    },
    rows: infoRows.map(([label, value], i) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2600, type: WidthType.DXA },
            shading: i % 2 === 0
              ? { type: ShadingType.CLEAR, fill: "F8FAFF", color: "auto" }
              : { type: ShadingType.CLEAR, fill: "FFFFFF", color: "auto" },
            borders: { top: LIGHT_GREY, bottom: LIGHT_GREY, left: LIGHT_GREY, right: LIGHT_GREY },
            children: [new Paragraph({
              spacing: { before: twip(4), after: twip(4) },
              children: [new TextRun({ text: label.toUpperCase(), bold: true, size: hp(8.5), font: CAMBRIA, color: "374151" })],
            })],
          }),
          new TableCell({
            width: { size: 200, type: WidthType.DXA },
            shading: i % 2 === 0
              ? { type: ShadingType.CLEAR, fill: "F8FAFF", color: "auto" }
              : { type: ShadingType.CLEAR, fill: "FFFFFF", color: "auto" },
            borders: { top: LIGHT_GREY, bottom: LIGHT_GREY, left: LIGHT_GREY, right: LIGHT_GREY },
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: twip(4), after: twip(4) },
              children: [boldRun(":", { size: hp(9) })],
            })],
          }),
          new TableCell({
            width: { size: PW - 2800, type: WidthType.DXA },
            shading: i % 2 === 0
              ? { type: ShadingType.CLEAR, fill: "F8FAFF", color: "auto" }
              : { type: ShadingType.CLEAR, fill: "FFFFFF", color: "auto" },
            borders: { top: LIGHT_GREY, bottom: LIGHT_GREY, left: LIGHT_GREY, right: LIGHT_GREY },
            children: [new Paragraph({
              spacing: { before: twip(4), after: twip(4) },
              children: [new TextRun({ text: value, bold: true, size: hp(9.5), font: CAMBRIA, color: BLACK })],
            })],
          }),
        ],
      })
    ),
  });

  // ── 4. Conditions ──────────────────────────────────────────────────────────
  const CONDITIONS = [
    "The applicant/operator shall comply with all existing laws, ordinances, and regulations of the City and this Barangay.",
    "The activity or business establishment shall not be a nuisance to public safety, peace, and order in the community.",
    "This clearance does not authorize the violation of any provision of law, ordinance, or regulation.",
    "Any violation of the conditions stated herein shall be a ground for the immediate REVOCATION of this clearance.",
  ];

  const conditionParagraphs = CONDITIONS.map((text, i) =>
    new Paragraph({
      spacing: { before: twip(3), after: twip(1) },
      indent: { left: twip(36), hanging: twip(18) },
      children: [
        new TextRun({ text: `${i + 1}.\t`, bold: true, size: hp(10), font: CAMBRIA, color: NAVY }),
        run(text),
      ],
    })
  );

  // ── 5. Validity box ────────────────────────────────────────────────────────
  const validityBox = new Table({
    width: { size: Math.round(PW * 0.6), type: WidthType.DXA },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: {
              top:    MED_NAVY,
              bottom: MED_NAVY,
              left:   MED_NAVY,
              right:  MED_NAVY,
            },
            shading: { type: ShadingType.CLEAR, fill: LIGHT_BLUE, color: "auto" },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: twip(4), after: 0 },
                children: [new TextRun({ text: "VALID UNTIL", bold: true, size: hp(9), font: CAMBRIA, color: NAVY, characterSpacing: 120 })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: twip(2), after: 0 },
                children: [new TextRun({ text: expiry, bold: true, size: hp(14), font: TIMES, color: BLACK, underline: { type: UnderlineType.SINGLE } })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: twip(3), after: twip(4) },
                children: [new TextRun({ text: "Pursuant to Sec. 152, par. C of the 1991 Local Government Code", italics: true, size: hp(8), font: CAMBRIA, color: "6B7280" })],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // ── Assemble all children ──────────────────────────────────────────────────
  const children = [
    ...buildHeader(left, right),

    // Title
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: twip(8), after: twip(8) },
      children: [new TextRun({ text: "BARANGAY PERMIT CLEARANCE", bold: true, size: hp(20), font: TIMES })],
    }),

    // Info strip
    infoStrip,
    spacer(8),

    // Opening
    new Paragraph({
      spacing: { before: 0, after: twip(3) },
      children: [boldRun("TO WHOM IT MAY CONCERN:", { size: hp(12) })],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFY,
      spacing: { before: 0, after: twip(4) },
      indent: { firstLine: twip(36) },
      children: [
        run("This is to certify that the Sangguniang Barangay of "),
        boldRun("Barangay Salvacion, La Loma, Quezon City", { italics: true }),
        run(" interposes "),
        boldRun("NO OBJECTION", { underline: { type: UnderlineType.SINGLE } }),
        run(" and hereby grants this "),
        boldRun("BARANGAY PERMIT CLEARANCE", { italics: true }),
        run(" to:"),
      ],
    }),

    // Applicant highlight box
    highlightBox(
      data.full_name || "APPLICANT NAME",
      data.address || data.business_address || ""
    ),
    spacer(4),

    new Paragraph({
      alignment: AlignmentType.JUSTIFY,
      spacing: { before: 0, after: twip(4) },
      indent: { firstLine: twip(36) },
      children: [run("For the operation / conduct of:")],
    }),

    // Business highlight box
    highlightBox(
      data.business_name || "BUSINESS / ESTABLISHMENT NAME",
      [data.business_type, data.business_address].filter(Boolean).join(" · ") || ""
    ),
    spacer(8),

    // Details table
    detailsTable,
    spacer(8),

    // Conditions
    new Paragraph({
      spacing: { before: 0, after: twip(3) },
      children: [boldRun("This clearance is issued subject to the following conditions:", { size: hp(10) })],
    }),
    ...conditionParagraphs,
    spacer(6),

    // Validity box (centered)
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: twip(4) },
      children: [],
    }),
    validityBox,
    spacer(4),

    // Given this line
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: twip(8) },
      children: [
        boldRun("Given this "),
        new TextRun({ text: `"${givenDate}"`, bold: true, size: hp(10), font: CAMBRIA, color: RED_CERT }),
        run(` (${op}) at Barangay Salvacion, La Loma, Quezon City.`),
      ],
    }),

    rule(),
    spacer(4),

    // Two-column signatures
    new Paragraph({
      tabStops: [{ type: "right", position: PW }],
      spacing: { before: twip(2), after: 0 },
      children: [
        run("Records verified by:", { italics: true }),
        new TextRun({ text: "\t" }),
      ],
    }),
    spacer(14),
    new Paragraph({
      tabStops: [{ type: "right", position: PW }],
      spacing: { before: 0, after: 0 },
      children: [
        new TextRun({ text: SECRETARY, bold: true, size: hp(11), font: CAMBRIA, underline: { type: UnderlineType.SINGLE } }),
        new TextRun({ text: "\t" }),
        new TextRun({ text: PUNONG, bold: true, size: hp(11), font: CAMBRIA, underline: { type: UnderlineType.SINGLE } }),
      ],
    }),
    new Paragraph({
      tabStops: [{ type: "right", position: PW }],
      spacing: { before: 0, after: twip(4) },
      children: [
        new TextRun({ text: "Barangay Secretary", italics: true, size: hp(10), font: CAMBRIA }),
        new TextRun({ text: "\t" }),
        new TextRun({ text: "Punong Barangay",    italics: true, size: hp(10), font: CAMBRIA }),
      ],
    }),

    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: twip(6), after: 0 },
      children: [new TextRun({ text: "*Not valid without official dry seal", italics: true, size: hp(8), font: CAMBRIA })],
    }),
  ];

  return new Document({ sections: [{ properties: { page: PAGE }, children }] });
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * generateCertificate(request, images)
 * Builds the correct certificate DOCX and triggers a browser download.
 *
 * @param {Object} request — full service_requests row from Supabase
 * @param {Object} images  — { left, right } data URLs from getBase64FromUrl()
 */
export async function generateCertificate(request, images = {}) {
  const leftDataUrl  = images.left  ?? images.leftHeader  ?? null;
  const rightDataUrl = images.right ?? images.rightHeader ?? null;

  let doc;
  switch (request.service_type) {
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
 * barangay_id is a physical card — no DOCX template.
 */
export function hasDocxTemplate(serviceType) {
  return [
    "barangay_clearance",
    "certificate_indigency",
    "business_clearance",
    "permit_to_roast",
  ].includes(serviceType);
}