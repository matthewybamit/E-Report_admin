// src/utils/generateCertificate.js
// ─────────────────────────────────────────────────────────────────────────────
// Generates official Barangay Salvacion certificates as .docx files.
// Header layout exactly matches the official letterhead:
//   [ Left Seal Image ] | [ Center Text Block ] | [ Right Seal Image ]
//
// Usage:
//   const images = await loadHeaderImages();  // { left, right }  (data URLs)
//   await generateCertificate(request, images);
// ─────────────────────────────────────────────────────────────────────────────
import {
  AlignmentType,
  BorderStyle,
  Document,
  ImageRun,
  Packer,
  Paragraph,
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
const BLUE_DARK = "1A3A6B";   // BARANGAY SALVACION header text
const BLACK     = "000000";
const RED_CERT  = "CC0000";   // placeholder values shown in red on the templates
const LINK_BLUE = "1155CC";   // email link color

// ── Unit helpers ──────────────────────────────────────────────────────────────
const twip = (pt) => Math.round(pt * 20);   // points to twips
const hp   = (pt) => Math.round(pt * 2);    // points to half-points (font size unit)

// ── Table border helpers ──────────────────────────────────────────────────────
const NO_BORDER  = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const NO_BORDERS = {
  top: NO_BORDER, bottom: NO_BORDER,
  left: NO_BORDER, right: NO_BORDER,
  insideH: NO_BORDER, insideV: NO_BORDER,
};

// ── Page setup — US Letter, ~0.75in L/R, ~0.625in T/B margins ────────────────
const PAGE = {
  size:   { width: twip(612), height: twip(792) },
  margin: { top: twip(45), right: twip(54), bottom: twip(45), left: twip(54) },
};

// Printable width in twips (504pt = 10080 twips)
const PW = twip(504);

// ── Convert data URL to Uint8Array for ImageRun ───────────────────────────────
// docx ImageRun expects raw binary, not a data URL string.
function dataUrlToUint8Array(dataUrl) {
  if (!dataUrl) return null;
  try {
    const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
    const binary = atob(base64);
    const bytes  = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

// ── Shared text run helpers ───────────────────────────────────────────────────
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
// Exact layout from screenshots:
//   Col 1: Left seal image  (Quezon City)
//   Col 2: Center text block
//   Col 3: Right seal image (Barangay Salvacion)
// Followed by a horizontal rule separator.
// ─────────────────────────────────────────────────────────────────────────────
function buildHeader(leftDataUrl, rightDataUrl) {
  // Column widths in twips
  const IMG_COL_W = 1400;               // ~0.97 inch each side
  const TXT_COL_W = PW - IMG_COL_W * 2; // remaining center

  // Image cell builder
  const imgCell = (dataUrl, align) => {
    const bytes    = dataUrlToUint8Array(dataUrl);
    const children = bytes
      ? [new ImageRun({ data: bytes, transformation: { width: 78, height: 78 } })]
      : [];
    return new TableCell({
      width:         { size: IMG_COL_W, type: WidthType.DXA },
      verticalAlign: VerticalAlign.CENTER,
      borders:       NO_BORDERS,
      children: [
        new Paragraph({
          alignment: align,
          spacing: { before: 0, after: 0 },
          children,
        }),
      ],
    });
  };

  // Center text cell — mirrors the official letterhead exactly
  const centerCell = new TableCell({
    width:         { size: TXT_COL_W, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    borders:       NO_BORDERS,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0 },
        children: [
          new TextRun({ text: "REPUBLIC OF THE PHILIPPINES", bold: true, size: hp(9), font: TIMES, color: BLACK }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0 },
        children: [
          new TextRun({ text: "Area 6, District 1, Quezon City", size: hp(9), font: CAMBRIA, color: BLACK }),
        ],
      }),
      // ── "BARANGAY SALVACION" — large, bold, dark blue, dominant ──
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: twip(1), after: 0 },
        children: [
          new TextRun({ text: "BARANGAY SALVACION", bold: true, size: hp(24), font: TIMES, color: BLUE_DARK }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0 },
        children: [
          new TextRun({ text: "Tanggapan ng Punong Barangay", bold: true, size: hp(12), font: CAMBRIA, color: BLACK }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0 },
        children: [
          new TextRun({ text: "74 Bulusan Street, La Loma, Quezon City", size: hp(9), font: CAMBRIA, color: BLACK }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0 },
        children: [
          new TextRun({ text: "Barangaysalvacion1114@gmail.com", size: hp(9), font: CAMBRIA, color: LINK_BLUE }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0 },
        children: [
          new TextRun({ text: "8-742-0944/0920-433-1754", size: hp(9), font: CAMBRIA, color: BLACK }),
        ],
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
            imgCell(leftDataUrl,  AlignmentType.LEFT),
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

// Right-aligned signature (Business Clearance, Indigency, Permit)
function rightSig(name = PUNONG, title = "Punong Barangay") {
  return [
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: twip(2), after: 0 },
      children: [
        new TextRun({ text: name, bold: true, size: hp(11), font: CAMBRIA, underline: { type: UnderlineType.SINGLE } }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 0, after: twip(4) },
      children: [new TextRun({ text: title, italics: true, size: hp(10), font: CAMBRIA })],
    }),
  ];
}

// Left-aligned signature (Prepared by / Secretary)
function leftSig(name = SECRETARY, title = "Barangay Secretary") {
  return [
    new Paragraph({
      spacing: { before: 0, after: 0 },
      children: [
        new TextRun({ text: name, bold: true, size: hp(11), font: CAMBRIA, underline: { type: UnderlineType.SINGLE } }),
      ],
    }),
    new Paragraph({
      spacing: { before: 0, after: twip(4) },
      children: [new TextRun({ text: title, italics: true, size: hp(10), font: CAMBRIA })],
    }),
  ];
}

// Two-column signature row (Barangay Clearance — Secretary left, Punong right)
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

// Footer note
function footerNote() {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: twip(3), after: 0 },
    children: [new TextRun({ text: "*Not valid without dry seal", italics: true, size: hp(8), font: CAMBRIA })],
  });
}

// Control number / OR No. / Amount footer block
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

  // Build label : value rows — bold red values matching the template
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
          width: { size: 2200, type: WidthType.DXA },
          borders: NO_BORDERS,
          children: [new Paragraph({
            spacing: { before: twip(1.5), after: twip(1.5) },
            children: [boldRun(label, { size: hp(10) })],
          })],
        }),
        new TableCell({
          width: { size: 300, type: WidthType.DXA },
          borders: NO_BORDERS,
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: twip(1.5), after: twip(1.5) },
            children: [boldRun(":", { size: hp(10) })],
          })],
        }),
        new TableCell({
          width: { size: 5580, type: WidthType.DXA },
          borders: NO_BORDERS,
          children: [new Paragraph({
            spacing: { before: twip(1.5), after: twip(1.5) },
            children: [new TextRun({
              text: `"${value}"`,
              bold: true, italics: true, size: hp(10), font: CAMBRIA,
              // VALID UP TO shown in bold black (not red) when it has a real date
              color: label === "VALID UP TO" ? BLACK : RED_CERT,
            })],
          })],
        }),
      ],
    })
  );

  // PREPARED BY row — orange-red, separate from main rows
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
  const sex    = (data.gender || "").toLowerCase() === "female" ? "Female" : "Male";
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
// DOCUMENT 4 — BARANGAY CLEARANCE PERMIT  (Permit to Roast)
// ─────────────────────────────────────────────────────────────────────────────
function buildPermitToRoast(data, left, right) {
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

  const provision = (num, text) =>
    new Paragraph({
      spacing: { before: twip(1.5), after: twip(1.5) },
      indent: { left: twip(36), hanging: twip(18) },
      children: [boldRun(`${num}.\t`), run(text)],
    });

  const children = [
    ...buildHeader(left, right),

    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: twip(8), after: twip(10) },
      children: [new TextRun({ text: "BARANGAY CLEARANCE PERMIT", bold: true, size: hp(20), font: TIMES })],
    }),

    new Paragraph({ spacing: { before: 0, after: twip(3) }, children: [boldRun("TO WHOM IT MAY CONCERN:", { size: hp(11) })] }),

    new Paragraph({
      alignment: AlignmentType.JUSTIFY,
      spacing: { before: 0, after: twip(3) },
      indent: { firstLine: twip(36) },
      children: [
        run("This is to certify that the Sangguniang barangay of Salvacion "),
        boldRun("Interposes no objection"),
        run(" with the reference to the "),
        boldRun("APPLICATION OF"),
      ],
    }),

    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: twip(3), after: twip(1) },
      children: [new TextRun({ text: `"${data.business_name || "BUSINESS NAME"}"`, bold: true, size: hp(14), font: CAMBRIA, color: RED_CERT })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: twip(1) },
      children: [
        boldRun("FOR A PERMIT TO ", { size: hp(12), color: RED_CERT }),
        new TextRun({ text: `"${data.items_to_roast || data.purpose || "PURPOSE"}"`, bold: true, size: hp(12), font: CAMBRIA, color: RED_CERT }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: twip(5) },
      children: [
        boldRun("AT ", { size: hp(12), color: RED_CERT }),
        new TextRun({ text: `"${data.business_address || "ADDRESS"}"`, bold: true, size: hp(12), font: CAMBRIA, color: RED_CERT }),
      ],
    }),

    new Paragraph({ spacing: { before: 0, after: twip(2) }, children: [run("Provided that:")] }),

    provision(1, "This business facility is 15  meters away from any petroleum filling station, establishments which may produce, manufacture or store combustible or flammable materials."),
    provision(2, "The business establishment is not erected  on a public sidewalk, street, avenue, park or plaza\nOr any government property (Sec. 17, Ord.85)"),
    provision(3, "This business establishment is not a nuisance to the public safety and order:"),
    provision(4, "That they will comply with the sanitary requirements of the City and this Barangay."),

    spacer(4),

    new Paragraph({
      alignment: AlignmentType.JUSTIFY,
      spacing: { before: 0, after: twip(3) },
      children: [run("For presentation to the Business permit & Licensing Office of this City, prior to the issuance of any license or permit for said business activity pursuant to Sec. 152, par. C, of the 1991 Local Government Code.")],
    }),

    new Paragraph({
      alignment: AlignmentType.JUSTIFY,
      spacing: { before: 0, after: twip(4) },
      children: [
        run("Any violation/s of the above-mentioned prohibitions is/are grounds for "),
        boldRun("REVOCATION OF THIS CLEARANCE."),
      ],
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
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * generateCertificate(request, images)
 *
 * Builds the correct certificate DOCX and triggers a browser download.
 *
 * @param {Object} request — full service_requests row from Supabase
 * @param {Object} images  — { left, right } — data URLs from getBase64FromUrl()
 *                           Also accepts { leftHeader, rightHeader } for back-compat.
 */
export async function generateCertificate(request, images = {}) {
  // Support both naming conventions
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
      doc = buildPermitToRoast(request, leftDataUrl, rightDataUrl);
      break;
    default:
      throw new Error(`No DOCX template for service type: ${request.service_type}`);
  }

  const blob     = await Packer.toBlob(doc);
  const url      = URL.createObjectURL(blob);
  const anchor   = document.createElement("a");
  anchor.href    = url;
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
  return ["barangay_clearance", "certificate_indigency", "business_clearance", "permit_to_roast"]
    .includes(serviceType);
}