// Builds NATURE_Trial_2026.pptx — journal club deck, simple light style.
// Usage: node build_nature_deck.js [output.pptx]
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");
const path = require("path");

const OUT = process.argv[2] || path.join(__dirname, "NATURE_Trial_2026.pptx");

// Palette: white page, deep maroon accent, warm grey for the control arm
const MAROON = "8C1D40";
const MAROON_DK = "6E1631";
const TINT = "F8F0F3";
const GREY = "A3AAB6";
const INK = "1F2937";
const MUTED = "6B7280";
const LINE = "E5E7EB";
const WHITE = "FFFFFF";
const HEAD = "Cambria";
const BODY = "Calibri";

const PRESENTER = "Dr M. Waqas Saleem";
const ROLE = "PGR Cardiology";
const PLACE = "Cardiac Centre, BVH Bahawalpur";

const svgToPng = async (svg) =>
  "image/png;base64," + (await sharp(Buffer.from(svg)).png().toBuffer()).toString("base64");

async function icon(Comp, color, size = 256) {
  return svgToPng(ReactDOMServer.renderToStaticMarkup(
    React.createElement(Comp, { color: "#" + color, size: String(size) })
  ));
}

// ───────── Illustrations (schematic, drawn as SVG) ─────────
const C = {
  wall: "#EFC3CB", wallEdge: "#D98E9C", lumen: "#FFF7F8",
  clot: "#8E1B2E", clotDk: "#6B1222", wire: "#374151",
  cath: "#64748B", mesh: "#475569", flow: "#8C1D40",
};

// diamond-cell mesh inside a rounded rectangle
function mesh(x, y, w, h, color, sw = 2.2, cell = 26, id = "m") {
  let lines = "";
  for (let k = -Math.ceil(h / cell) - 1; k <= Math.ceil(w / cell) + 1; k++) {
    const x0 = x + k * cell;
    lines += `<line x1="${x0}" y1="${y}" x2="${x0 + h}" y2="${y + h}"/>`;
    lines += `<line x1="${x0 + h}" y1="${y}" x2="${x0}" y2="${y + h}"/>`;
  }
  return `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2.6}"/></clipPath>
    <g clip-path="url(#${id})" stroke="${color}" stroke-width="${sw}" fill="none">${lines}</g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2.6}" fill="none" stroke="${color}" stroke-width="${sw + 0.6}"/>`;
}

function clot(cx, cy, rx, ry) {
  const pts = [];
  const n = 18;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = 1 + 0.12 * Math.sin(i * 2.7) + 0.08 * Math.cos(i * 4.1);
    pts.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]);
  }
  let d = `M${(pts[0][0] + pts[n - 1][0]) / 2} ${(pts[0][1] + pts[n - 1][1]) / 2}`;
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = pts[(i + 1) % n];
    d += ` Q${p[0]} ${p[1]} ${(p[0] + q[0]) / 2} ${(p[1] + q[1]) / 2}`;
  }
  return `<path d="${d} Z" fill="${C.clot}" stroke="${C.clotDk}" stroke-width="2"/>
    <circle cx="${cx - rx * 0.3}" cy="${cy - ry * 0.25}" r="${ry * 0.12}" fill="#B0364A" opacity="0.7"/>
    <circle cx="${cx + rx * 0.35}" cy="${cy + ry * 0.2}" r="${ry * 0.1}" fill="#B0364A" opacity="0.7"/>`;
}

function artery(w, h) {
  const y0 = h * 0.28, y1 = h * 0.72;
  return `<rect x="0" y="${y0 - 22}" width="${w}" height="${y1 - y0 + 44}" fill="${C.wall}"/>
    <line x1="0" y1="${y0 - 22}" x2="${w}" y2="${y0 - 22}" stroke="${C.wallEdge}" stroke-width="3"/>
    <line x1="0" y1="${y1 + 22}" x2="${w}" y2="${y1 + 22}" stroke="${C.wallEdge}" stroke-width="3"/>
    <rect x="0" y="${y0}" width="${w}" height="${y1 - y0}" fill="${C.lumen}"/>`;
}

const arrowDefs = `<defs><marker id="ah" markerWidth="10" markerHeight="10" refX="6" refY="5" orient="auto">
  <path d="M0 0 L10 5 L0 10 Z" fill="${C.flow}"/></marker></defs>`;
const flowArrows = (xs, y) => xs.map((x) =>
  `<line x1="${x}" y1="${y}" x2="${x + 60}" y2="${y}" stroke="${C.flow}" stroke-width="5" marker-end="url(#ah)"/>`).join("");

// procedure panels: 600 x 300
function panel(step) {
  const W = 600, H = 300, cy = H / 2;
  let body = artery(W, H);
  if (step === 1) {
    body += clot(330, cy, 95, 40);
    body += `<line x1="0" y1="${cy}" x2="560" y2="${cy}" stroke="${C.wire}" stroke-width="3"/>`;
    body += `<line x1="0" y1="${cy}" x2="455" y2="${cy}" stroke="${C.cath}" stroke-width="11" stroke-linecap="round"/>`;
  } else if (step === 2) {
    body += clot(330, cy, 95, 40);
    body += `<line x1="0" y1="${cy}" x2="560" y2="${cy}" stroke="${C.wire}" stroke-width="3"/>`;
    body += `<line x1="0" y1="${cy}" x2="190" y2="${cy}" stroke="${C.cath}" stroke-width="11" stroke-linecap="round"/>`;
    body += mesh(215, cy - 42, 240, 84, "#E5E7EB", 2.4, 26, "p2");
  } else if (step === 3) {
    body += `<rect x="0" y="${cy - 30}" width="120" height="60" rx="8" fill="${C.cath}" opacity="0.9"/>`;
    body += clot(205, cy, 70, 32);
    body += mesh(130, cy - 36, 160, 72, "#E5E7EB", 2.2, 22, "p3");
    body += `<line x1="0" y1="${cy}" x2="560" y2="${cy}" stroke="${C.wire}" stroke-width="3"/>`;
    body += `<line x1="470" y1="${cy - 58}" x2="360" y2="${cy - 58}" stroke="${C.wire}" stroke-width="5" marker-end="url(#ah)"/>`;
    body += flowArrows([350, 470], cy + 45);
  } else {
    body += `<rect x="240" y="${cy - 66}" width="180" height="132" fill="${C.wall}" opacity="0.6"/>`;
    body += mesh(240, cy - 66, 180, 132, "#64748B", 3, 30, "p4");
    body += flowArrows([40, 150, 460], cy);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${arrowDefs}
    <rect width="${W}" height="${H}" fill="#FFFFFF"/>${body}</svg>`;
}

// device close-up: 1400 x 520
function deviceSvg() {
  const W = 1400, H = 520, cy = 250;
  const mx0 = 430, mx1 = 1030, mh = 170;
  const lab = (x, y, tx, ty, text) => `
    <line x1="${x}" y1="${y}" x2="${tx}" y2="${ty + (ty < y ? 14 : -30)}" stroke="#9CA3AF" stroke-width="2"/>
    <circle cx="${x}" cy="${y}" r="6" fill="${C.flow}"/>
    <text x="${tx}" y="${ty}" font-family="Carlito, Calibri, Arial" font-size="30" fill="#1F2937" text-anchor="middle">${text}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="#FFFFFF"/>
    <line x1="30" y1="${cy}" x2="${mx0 - 90}" y2="${cy}" stroke="${C.wire}" stroke-width="7" stroke-linecap="round"/>
    <line x1="30" y1="${cy}" x2="220" y2="${cy}" stroke="${C.cath}" stroke-width="26" stroke-linecap="round"/>
    <g stroke="${C.mesh}" stroke-width="3" fill="none">
      <line x1="${mx0 - 90}" y1="${cy}" x2="${mx0}" y2="${cy - mh / 2}"/>
      <line x1="${mx0 - 90}" y1="${cy}" x2="${mx0}" y2="${cy + mh / 2}"/>
      <line x1="${mx1 + 90}" y1="${cy}" x2="${mx1}" y2="${cy - mh / 2}"/>
      <line x1="${mx1 + 90}" y1="${cy}" x2="${mx1}" y2="${cy + mh / 2}"/>
    </g>
    ${mesh(mx0, cy - mh / 2, mx1 - mx0, mh, C.mesh, 3, 40, "dv")}
    <g opacity="0.85">${clot(640, cy + 5, 70, 42)}</g>
    <line x1="${mx1 + 90}" y1="${cy}" x2="${mx1 + 230}" y2="${cy}" stroke="${C.wire}" stroke-width="5" stroke-linecap="round"/>
    <circle cx="${mx0 - 90}" cy="${cy}" r="9" fill="#111827"/><circle cx="${mx1 + 90}" cy="${cy}" r="9" fill="#111827"/>
    ${lab(130, cy, 130, 110, "Microcatheter")}
    ${lab(300, cy, 300, 440, "Push wire")}
    ${lab(870, cy - mh / 2, 870, 90, "Self-expanding stent-retriever")}
    ${lab(640, cy + 45, 640, 440, "Clot captured in the cells")}
    ${lab(mx1 + 90, cy, mx1 + 170, 440, "Radiopaque marker / distal tip")}
  </svg>`;
}

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9"; // 10 x 5.625
  pres.title = "NATURE Trial — Journal Club";
  pres.author = PRESENTER;

  const I = {
    check: await icon(fa.FaCheck, WHITE),
    times: await icon(fa.FaTimes, WHITE),
    info: await icon(fa.FaInfoCircle, MAROON),
    flask: await icon(fa.FaFlask, MAROON),
    mri: await icon(fa.FaMagnet, MAROON),
    shield: await icon(fa.FaShieldAlt, MAROON),
    arrow: await icon(fa.FaArrowRight, GREY),
    down: await icon(fa.FaArrowDown, GREY),
  };
  const DEVICE = await svgToPng(deviceSvg());
  const P = [];
  for (let i = 1; i <= 4; i++) P.push(await svgToPng(panel(i)));

  let n = 0;

  // Content slide: white, title top-left, quiet footer
  function slide(title, notes) {
    n++;
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText(title, {
      x: 0.5, y: 0.35, w: 9, h: 0.6, fontFace: HEAD, fontSize: 28, bold: true, color: INK,
      margin: 0, valign: "middle", isTextBox: true,
    });
    s.addText(String(n), {
      x: 9.0, y: 5.15, w: 0.5, h: 0.25, fontFace: BODY, fontSize: 9, bold: true, color: MAROON, align: "right", margin: 0, isTextBox: true,
    });
    if (notes) s.addNotes(notes);
    return s;
  }

  const panelBox = (s, x, y, w, h, fill = TINT) =>
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, line: { color: fill }, rectRadius: 0.08 });

  const dot = (s, x, y, d, fill, content, isImg) => {
    s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { color: fill } });
    if (isImg) {
      const p = d * 0.27;
      s.addImage({ data: content, x: x + p, y: y + p, w: d - 2 * p, h: d - 2 * p });
    } else {
      s.addText(content, { x, y, w: d, h: d, fontFace: BODY, fontSize: 13, bold: true, color: WHITE, align: "center", valign: "middle", margin: 0, isTextBox: true });
    }
  };

  const bullets = (s, items, opts) =>
    s.addText(items.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < items.length - 1 } })), {
      fontFace: BODY, fontSize: 15, color: INK, paraSpaceAfter: 8, valign: "top", margin: 0, isTextBox: true, ...opts,
    });

  // ═════════ 1. Title (presenter) ═════════
  {
    n++;
    const s = pres.addSlide();
    s.background = { color: MAROON };
    s.addText("JOURNAL CLUB", {
      x: 0.7, y: 0.6, w: 6, h: 0.35, fontFace: BODY, fontSize: 14, bold: true, charSpacing: 6, color: "F3C9D5", margin: 0, isTextBox: true,
    });
    s.addText("NATURE Trial", {
      x: 0.7, y: 1.05, w: 8.5, h: 0.95, fontFace: HEAD, fontSize: 50, bold: true, color: WHITE, margin: 0, isTextBox: true,
    });
    s.addText("Mechanical thrombectomy with enVast in STEMI with large thrombus burden — a randomised superiority trial (ESC Congress 2026)", {
      x: 0.7, y: 2.05, w: 7.6, h: 0.75, fontFace: BODY, fontSize: 16, color: "F3C9D5", margin: 0, valign: "top", isTextBox: true,
    });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.7, y: 3.2, w: 5.2, h: 1.6, fill: { color: MAROON_DK }, line: { color: MAROON_DK }, rectRadius: 0.08 });
    s.addText([
      { text: "Presented by", options: { fontSize: 11, color: "F3C9D5", charSpacing: 2, breakLine: true } },
      { text: PRESENTER, options: { fontSize: 22, bold: true, color: WHITE, fontFace: HEAD, breakLine: true } },
      { text: ROLE, options: { fontSize: 14, color: WHITE, breakLine: true } },
      { text: PLACE, options: { fontSize: 14, color: WHITE } },
    ], { x: 1.0, y: 3.3, w: 4.8, h: 1.4, fontFace: BODY, valign: "middle", margin: 0, isTextBox: true });
    s.addNotes("Journal club presentation of the NATURE trial, presented as a late-breaking clinical trial at ESC Congress 2026 in Munich by Prof. Marco Valgimigli.");
  }

  // ═════════ 2. Background ═════════
  {
    const s = slide("Background: why a large thrombus matters",
      "In STEMI with a large thrombus, balloon and stent can fragment clot and push it downstream (distal embolisation), causing microvascular obstruction and larger infarcts. " +
      "Routine manual aspiration was tested in TASTE and TOTAL without clinical benefit, and TOTAL showed more strokes, so current ESC guidance does not recommend routine aspiration.");
    const flow = ["Large thrombus", "Distal embolisation", "Microvascular obstruction", "Larger infarct"];
    flow.forEach((t, i) => {
      const x = 0.5 + i * 2.35;
      panelBox(s, x, 1.3, 1.95, 0.9, i === 3 ? MAROON : TINT);
      s.addText(t, { x, y: 1.3, w: 1.95, h: 0.9, fontFace: BODY, fontSize: 14, bold: true, color: i === 3 ? WHITE : INK, align: "center", valign: "middle", margin: 0.05, isTextBox: true });
      if (i < 3) s.addImage({ data: I.arrow, x: x + 2.02, y: 1.64, w: 0.22, h: 0.22 });
    });
    s.addText("What we already know", { x: 0.5, y: 2.55, w: 9, h: 0.35, fontFace: HEAD, fontSize: 17, bold: true, color: MAROON, margin: 0, isTextBox: true });
    bullets(s, [
      "TASTE (n = 7,244): routine aspiration did not reduce mortality",
      "TOTAL (n = 10,732): no clinical benefit, and more strokes at 30 days",
      "ESC guidelines: routine thrombus aspiration is not recommended (Class III)",
      "Question: can a stent-retriever remove clot better and more safely?",
    ], { x: 0.5, y: 3.0, w: 9, h: 2.0 });
  }

  // ═════════ 3. The device (picture) ═════════
  {
    const s = slide("The enVast device",
      "enVast is Vesalio's coronary clot retriever, derived from its NeVa neurovascular thrombectomy platform. " +
      "It is delivered through a microcatheter, self-expands inside the clot, holds the clot in its cells and is then pulled back. " +
      "The picture is a schematic illustration, not a photograph.");
    s.addImage({ data: DEVICE, x: 0.5, y: 1.15, w: 9.0, h: 3.34 });
    s.addText("Schematic illustration (not to scale). Coronary stent-retriever by Vesalio, derived from the NeVa neurovascular thrombectomy platform.", {
      x: 0.5, y: 4.6, w: 9, h: 0.4, fontFace: BODY, fontSize: 11, italic: true, color: MUTED, align: "center", margin: 0, isTextBox: true,
    });
  }

  // ═════════ 4. The procedure (pictures) ═════════
  {
    const s = slide("The procedure step by step",
      "Step 1: the wire and microcatheter cross the thrombus. Step 2: the microcatheter is pulled back and the retriever expands inside the clot. " +
      "Step 3: the retriever and the captured clot are withdrawn into the guide catheter, restoring flow. Step 4: conventional PCI with stent implantation completes the procedure.");
    const caps = [
      ["1", "Cross", "Wire and microcatheter pass through the clot"],
      ["2", "Deploy", "Retriever opens inside the clot and holds it"],
      ["3", "Retrieve", "Device and clot pulled back into the guide"],
      ["4", "Stent", "Conventional PCI; flow restored"],
    ];
    caps.forEach(([k, t, d], i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = 0.5 + col * 4.6, y = 1.15 + row * 1.8;
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: 2.8, h: 1.4, fill: { color: WHITE }, line: { color: LINE, width: 1 } });
      s.addImage({ data: P[i], x: x + 0.01, y: y + 0.01, w: 2.78, h: 1.38 });
      dot(s, x + 2.95, y + 0.05, 0.42, MAROON, k);
      s.addText(t, { x: x + 3.45, y: y + 0.05, w: 1.0, h: 0.42, fontFace: HEAD, fontSize: 14, bold: true, color: INK, valign: "middle", margin: 0, isTextBox: true });
      s.addText(d, { x: x + 2.95, y: y + 0.57, w: 1.5, h: 0.8, fontFace: BODY, fontSize: 11, color: MUTED, valign: "top", margin: 0, isTextBox: true });
    });
    s.addText("Schematic illustrations (not to scale).", {
      x: 0.5, y: 4.8, w: 9, h: 0.25, fontFace: BODY, fontSize: 10, italic: true, color: MUTED, margin: 0, isTextBox: true,
    });
  }

  // ═════════ 5. Trial design ═════════
  {
    const s = slide("Trial design",
      "154 patients at 11 centres were randomised 1:1 to enVast-assisted thrombectomy followed by conventional PCI, or to standard primary PCI. " +
      "The hypothesis was superiority of enVast on infarct size. Design paper: Landi et al., Cardiovascular Revascularization Medicine, 2026.");
    panelBox(s, 0.5, 1.2, 5.4, 0.7, INK);
    s.addText("154 STEMI patients with large thrombus · 11 centres", { x: 0.5, y: 1.2, w: 5.4, h: 0.7, fontFace: BODY, fontSize: 15, bold: true, color: WHITE, align: "center", valign: "middle", margin: 0, isTextBox: true });
    s.addImage({ data: I.down, x: 3.08, y: 2.0, w: 0.24, h: 0.24 });
    s.addText("Randomised 1 : 1", { x: 1.7, y: 2.3, w: 3.0, h: 0.4, fontFace: BODY, fontSize: 13, bold: true, color: MAROON, align: "center", valign: "middle", margin: 0, isTextBox: true });
    s.addImage({ data: I.down, x: 1.7, y: 2.78, w: 0.24, h: 0.24 });
    s.addImage({ data: I.down, x: 4.46, y: 2.78, w: 0.24, h: 0.24 });
    panelBox(s, 0.5, 3.1, 2.6, 1.0, MAROON);
    s.addText([{ text: "enVast thrombectomy", options: { bold: true, breakLine: true } }, { text: "then conventional PCI", options: { fontSize: 12 } }],
      { x: 0.5, y: 3.1, w: 2.6, h: 1.0, fontFace: BODY, fontSize: 14, color: WHITE, align: "center", valign: "middle", margin: 0, isTextBox: true });
    panelBox(s, 3.3, 3.1, 2.6, 1.0, GREY);
    s.addText([{ text: "Standard PCI", options: { bold: true, breakLine: true } }, { text: "standard of care", options: { fontSize: 12 } }],
      { x: 3.3, y: 3.1, w: 2.6, h: 1.0, fontFace: BODY, fontSize: 14, color: WHITE, align: "center", valign: "middle", margin: 0, isTextBox: true });
    const facts = [
      ["Type", "Prospective, multicentre, randomised"],
      ["Hypothesis", "Superiority on infarct size"],
      ["PI", "Prof. Marco Valgimigli, Lugano"],
      ["Sponsor", "Vesalio"],
      ["Registry", "NCT04969471"],
    ];
    facts.forEach(([k, v], i) => {
      const y = 1.2 + i * 0.6;
      s.addText(k, { x: 6.4, y, w: 1.05, h: 0.5, fontFace: BODY, fontSize: 12, bold: true, color: MAROON, valign: "middle", margin: 0, isTextBox: true });
      s.addText(v, { x: 7.45, y, w: 2.05, h: 0.5, fontFace: BODY, fontSize: 12, color: INK, valign: "middle", margin: 0, isTextBox: true });
      if (i < facts.length - 1) s.addShape(pres.shapes.LINE, { x: 6.4, y: y + 0.55, w: 3.1, h: 0, line: { color: LINE, width: 1 } });
    });
  }

  // ═════════ 6. Inclusion criteria ═════════
  {
    const s = slide("Inclusion criteria",
      "Inclusion criteria as listed on ClinicalTrials.gov (NCT04969471). The key criterion is TIMI thrombus grade 3 or more, re-confirmed after wiring if the artery is occluded.");
    const items = [
      "Age ≥ 18 years",
      "Chest pain > 20 min with ST elevation ≥ 1 mm in ≥ 2 contiguous leads, or infero-lateral MI with ST depression ≥ 1 mm in ≥ 2 of V1–V3 and a positive terminal T wave",
      "TIMI thrombus grade ≥ 3 in the infarct-related artery (re-confirmed after wiring if TIMI 0 flow)",
      "Intervention started within 8 hours of symptom onset",
      "Informed consent before the procedure",
    ];
    const hs = [0.4, 0.75, 0.52, 0.4, 0.4];
    let y = 1.2;
    items.forEach((t, i) => {
      dot(s, 0.5, y, 0.4, MAROON, I.check, true);
      s.addText(t, { x: 1.1, y: y + 0.07, w: 4.9, h: hs[i], fontFace: BODY, fontSize: 14, color: INK, valign: "top", margin: 0, isTextBox: true });
      y += hs[i] + 0.3;
    });
    panelBox(s, 6.4, 1.2, 3.1, 3.7);
    s.addImage({ data: I.info, x: 6.65, y: 1.42, w: 0.38, h: 0.38 });
    s.addText("Key point", { x: 7.15, y: 1.42, w: 2.2, h: 0.38, fontFace: HEAD, fontSize: 15, bold: true, color: MAROON, valign: "middle", margin: 0, isTextBox: true });
    s.addText("TIMI thrombus grade ≥ 3", { x: 6.65, y: 2.0, w: 2.7, h: 0.4, fontFace: HEAD, fontSize: 17, bold: true, color: INK, margin: 0, isTextBox: true });
    s.addText("A definite clot longer than half the vessel diameter. These patients are the most likely to embolise clot during PCI, so they have the most to gain from thrombectomy.", {
      x: 6.65, y: 2.5, w: 2.65, h: 2.2, fontFace: BODY, fontSize: 13, color: INK, valign: "top", margin: 0, isTextBox: true,
    });
  }

  // ═════════ 7. Exclusion criteria ═════════
  {
    const s = slide("Exclusion criteria",
      "Exclusion criteria as listed on ClinicalTrials.gov (NCT04969471). Most exclude anatomy where a retriever is hard to deliver safely, or situations that would confound the infarct-size endpoint.");
    const items = [
      "Unconscious patient",
      "Infarct-related artery < 2.5 mm (visual estimate)",
      "Severe calcification or extreme tortuosity at or proximal to the culprit lesion",
      "Stent thrombosis as the culprit lesion",
      "Previous MI in the same territory",
      "Women of child-bearing potential",
      "Participation in another interventional trial",
    ];
    const hs = [0.4, 0.4, 0.62, 0.4, 0.4, 0.4, 0.4];
    let y = 1.2;
    items.forEach((t, i) => {
      dot(s, 0.5, y, 0.38, GREY, I.times, true);
      s.addText(t, { x: 1.1, y: y + 0.06, w: 4.9, h: hs[i], fontFace: BODY, fontSize: 14, color: INK, valign: "top", margin: 0, isTextBox: true });
      y += hs[i] + 0.1;
    });
    panelBox(s, 6.4, 1.2, 3.1, 3.7);
    s.addImage({ data: I.info, x: 6.65, y: 1.42, w: 0.38, h: 0.38 });
    s.addText("Why these exclusions?", { x: 7.15, y: 1.42, w: 2.3, h: 0.38, fontFace: HEAD, fontSize: 15, bold: true, color: MAROON, valign: "middle", margin: 0, isTextBox: true });
    bullets(s, [
      "Small, calcified or tortuous vessels: hard to deliver a retriever safely",
      "Stent thrombosis and prior MI in the same territory would confound infarct size",
    ], { x: 6.65, y: 2.0, w: 2.65, h: 2.7, fontSize: 13 });
  }

  // ═════════ 8. Endpoints ═════════
  {
    const s = slide("Endpoints",
      "The primary endpoint is enzymatic infarct size (CK-MB area under the curve). The key secondary endpoint is infarct size on cardiac MRI at day 3. Safety was assessed at 30 days.");
    const eps = [
      [I.flask, "Primary", "Infarct size by CK-MB area under the curve"],
      [I.mri, "Secondary", "Infarct size on cardiac MRI (% of LV mass) at day 3"],
      [I.shield, "Safety", "Death, stroke and MACE at 30 days"],
    ];
    eps.forEach(([ic, t, d], i) => {
      const x = 0.5 + i * 3.07;
      panelBox(s, x, 1.3, 2.85, 2.75);
      s.addShape(pres.shapes.OVAL, { x: x + 0.3, y: 1.6, w: 0.8, h: 0.8, fill: { color: WHITE }, line: { color: WHITE } });
      s.addImage({ data: ic, x: x + 0.5, y: 1.8, w: 0.4, h: 0.4 });
      s.addText(t, { x: x + 0.3, y: 2.65, w: 2.3, h: 0.45, fontFace: HEAD, fontSize: 20, bold: true, color: MAROON, margin: 0, isTextBox: true });
      s.addText(d, { x: x + 0.3, y: 3.15, w: 2.3, h: 1.2, fontFace: BODY, fontSize: 14, color: INK, valign: "top", margin: 0, isTextBox: true });
    });
  }

  // ═════════ 9. Primary result ═════════
  {
    const s = slide("Primary endpoint: met",
      "Enzymatic infarct size by CK-MB AUC was about 26% lower with enVast (P = 0.001). The chart shows the relative effect with control set to 100; absolute values are in the primary presentation.");
    s.addText("26%", { x: 0.5, y: 1.35, w: 4, h: 1.2, fontFace: HEAD, fontSize: 80, bold: true, color: MAROON, margin: 0, isTextBox: true });
    s.addText("relative reduction in infarct size (CK-MB AUC) with enVast versus standard PCI", {
      x: 0.5, y: 2.6, w: 3.9, h: 0.75, fontFace: BODY, fontSize: 15, color: INK, valign: "top", margin: 0, isTextBox: true,
    });
    panelBox(s, 0.5, 3.6, 1.8, 0.55);
    s.addText("P = 0.001", { x: 0.5, y: 3.6, w: 1.8, h: 0.55, fontFace: BODY, fontSize: 16, bold: true, color: MAROON, align: "center", valign: "middle", margin: 0, isTextBox: true });
    s.addChart(pres.charts.BAR, [{ name: "Infarct size", labels: ["Standard PCI", "enVast + PCI"], values: [100, 74] }], {
      x: 5.0, y: 1.2, w: 4.5, h: 3.7, barDir: "col", barGapWidthPct: 80, chartColors: [GREY, MAROON],
      showTitle: true, title: "Infarct size (control = 100)", titleColor: MUTED, titleFontSize: 11, titleFontFace: BODY,
      showValue: true, dataLabelPosition: "outEnd", dataLabelColor: INK, dataLabelFontSize: 14, dataLabelFontBold: true,
      catAxisLabelColor: INK, catAxisLabelFontSize: 12, catAxisLabelFontFace: BODY,
      valAxisHidden: true, valAxisMinVal: 0, valAxisMaxVal: 115, valGridLine: { style: "none" }, catGridLine: { style: "none" }, showLegend: false,
    });
  }

  // ═════════ 10. Secondary: CMR ═════════
  {
    const s = slide("Secondary endpoint: cardiac MRI",
      "Cardiac MRI at day 3 showed about a 25% relative reduction in infarct size as a percentage of LV mass. It was a positive trend rather than a formally significant result, but it agrees with the CK-MB finding.");
    const rows = [
      ["CK-MB AUC (primary)", 26, "Significant, P = 0.001"],
      ["Cardiac MRI at day 3 (secondary)", 25, "Trend in the same direction"],
    ];
    rows.forEach(([t, pct, note], i) => {
      const y = 1.35 + i * 1.65;
      s.addText(t, { x: 0.5, y, w: 6, h: 0.4, fontFace: HEAD, fontSize: 17, bold: true, color: INK, margin: 0, isTextBox: true });
      s.addText(`${pct}% smaller`, { x: 6.8, y, w: 2.7, h: 0.4, fontFace: HEAD, fontSize: 20, bold: true, color: MAROON, align: "right", margin: 0, isTextBox: true });
      s.addText("Standard PCI", { x: 0.5, y: y + 0.5, w: 1.4, h: 0.3, fontFace: BODY, fontSize: 11, color: MUTED, valign: "middle", margin: 0, isTextBox: true });
      s.addShape(pres.shapes.RECTANGLE, { x: 1.95, y: y + 0.52, w: 7.55, h: 0.26, fill: { color: GREY }, line: { color: GREY } });
      s.addText("enVast + PCI", { x: 0.5, y: y + 0.88, w: 1.4, h: 0.3, fontFace: BODY, fontSize: 11, color: MUTED, valign: "middle", margin: 0, isTextBox: true });
      s.addShape(pres.shapes.RECTANGLE, { x: 1.95, y: y + 0.9, w: 7.55 * (100 - pct) / 100, h: 0.26, fill: { color: MAROON }, line: { color: MAROON } });
      s.addText(note, { x: 1.95 + 7.55 * (100 - pct) / 100 + 0.15, y: y + 0.88, w: 1.8, h: 0.3, fontFace: BODY, fontSize: 11, italic: true, color: INK, valign: "middle", margin: 0, isTextBox: true });
    });
    s.addText("Two different measures, a blood test and imaging, point the same way.", {
      x: 0.5, y: 4.6, w: 9, h: 0.35, fontFace: BODY, fontSize: 13, italic: true, color: MUTED, margin: 0, isTextBox: true,
    });
  }

  // ═════════ 11. Safety ═════════
  {
    const s = slide("Safety at 30 days",
      "At 30 days: stroke 0% vs 1.3%, death 0% vs 2.6%, MACE 1.3% vs 3.8% (enVast vs control). Reassuring given the stroke signal with aspiration in TOTAL, but the event numbers are very small.");
    s.addChart(pres.charts.BAR, [
      { name: "enVast + PCI", labels: ["Stroke", "Death", "MACE"], values: [0, 0, 1.3] },
      { name: "Standard PCI", labels: ["Stroke", "Death", "MACE"], values: [1.3, 2.6, 3.8] },
    ], {
      x: 0.4, y: 1.15, w: 5.8, h: 3.8, barDir: "col", barGrouping: "clustered", barGapWidthPct: 60, chartColors: [MAROON, GREY],
      showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: '0.0"%"', dataLabelColor: INK, dataLabelFontSize: 12, dataLabelFontBold: true,
      catAxisLabelColor: INK, catAxisLabelFontSize: 13, catAxisLabelFontFace: BODY,
      valAxisHidden: true, valAxisMinVal: 0, valAxisMaxVal: 4.6, valGridLine: { style: "none" }, catGridLine: { style: "none" },
      showLegend: true, legendPos: "t", legendFontSize: 11, legendColor: INK, legendFontFace: BODY,
    });
    panelBox(s, 6.5, 1.3, 3.0, 3.5);
    s.addText("No strokes and no deaths with enVast", { x: 6.75, y: 1.5, w: 2.55, h: 0.8, fontFace: HEAD, fontSize: 16, bold: true, color: MAROON, valign: "top", margin: 0, isTextBox: true });
    bullets(s, [
      "Important because aspiration in TOTAL increased stroke",
      "Very few events overall",
      "The trial was not powered for clinical outcomes",
    ], { x: 6.75, y: 2.4, w: 2.55, h: 2.3, fontSize: 13 });
  }

  // ═════════ 12. Strengths ═════════
  {
    const s = slide("Strengths",
      "Randomised multicentre design, a population chosen where benefit is plausible, agreement between biomarker and MRI, and no early safety signal.");
    const items = [
      ["Randomised, multicentre", "11 centres, 1:1 allocation"],
      ["Right population", "Only patients with a large thrombus"],
      ["Consistent results", "CK-MB and cardiac MRI agree"],
      ["Safe early course", "No stroke or death with enVast at 30 days"],
    ];
    items.forEach(([t, d], i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = 0.5 + col * 4.6, y = 1.35 + row * 1.65;
      panelBox(s, x, y, 4.4, 1.4);
      dot(s, x + 0.3, y + 0.3, 0.45, MAROON, I.check, true);
      s.addText(t, { x: x + 0.95, y: y + 0.3, w: 3.3, h: 0.45, fontFace: HEAD, fontSize: 16, bold: true, color: INK, valign: "middle", margin: 0, isTextBox: true });
      s.addText(d, { x: x + 0.95, y: y + 0.8, w: 3.3, h: 0.6, fontFace: BODY, fontSize: 13, color: MUTED, valign: "top", margin: 0, isTextBox: true });
    });
  }

  // ═════════ 13. Limitations ═════════
  {
    const s = slide("Limitations",
      "Small sample, surrogate primary endpoint, operators unavoidably aware of device use, the MRI result only a trend, and industry sponsorship.");
    const items = [
      ["Small trial", "Only 154 patients"],
      ["Surrogate endpoint", "Infarct size, not death or heart failure"],
      ["Operators not blinded", "Device use cannot be hidden"],
      ["MRI only a trend", "Industry-funded; needs independent confirmation"],
    ];
    items.forEach(([t, d], i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = 0.5 + col * 4.6, y = 1.35 + row * 1.65;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 4.4, h: 1.4, fill: { color: WHITE }, line: { color: LINE, width: 1.25 }, rectRadius: 0.08 });
      dot(s, x + 0.3, y + 0.3, 0.45, GREY, String(i + 1));
      s.addText(t, { x: x + 0.95, y: y + 0.3, w: 3.3, h: 0.45, fontFace: HEAD, fontSize: 16, bold: true, color: INK, valign: "middle", margin: 0, isTextBox: true });
      s.addText(d, { x: x + 0.95, y: y + 0.8, w: 3.3, h: 0.6, fontFace: BODY, fontSize: 13, color: MUTED, valign: "top", margin: 0, isTextBox: true });
    });
  }

  // ═════════ 14. Conclusion ═════════
  {
    const s = slide("Conclusion",
      "NATURE met its superiority hypothesis on infarct size, with reassuring 30-day safety. Because it is small and uses a surrogate endpoint, it should not yet change routine practice; an outcomes trial is the next step.");
    panelBox(s, 0.5, 1.2, 9, 1.5, MAROON);
    s.addText("In STEMI with a large thrombus, enVast thrombectomy before PCI was superior to standard PCI in reducing infarct size, with no early safety concern.", {
      x: 0.8, y: 1.2, w: 8.4, h: 1.5, fontFace: HEAD, fontSize: 19, italic: true, color: WHITE, valign: "middle", margin: 0, isTextBox: true,
    });
    const pts = [
      ["Today", "Promising for selected large-thrombus cases, but not yet routine. Guidelines are unchanged."],
      ["Next", "A larger trial with hard outcomes: death, heart failure and stroke."],
    ];
    pts.forEach(([t, d], i) => {
      const x = 0.5 + i * 4.6;
      s.addText(t, { x, y: 3.0, w: 4.4, h: 0.4, fontFace: HEAD, fontSize: 17, bold: true, color: MAROON, margin: 0, isTextBox: true });
      s.addText(d, { x, y: 3.45, w: 4.3, h: 1.2, fontFace: BODY, fontSize: 14, color: INK, valign: "top", margin: 0, isTextBox: true });
    });
  }

  // ═════════ 15. Take-home ═════════
  {
    const s = slide("Take-home for our cath lab",
      "Practical messages for discussion: grade thrombus burden, do not use routine aspiration, and follow the evidence as outcome trials report.");
    const pts = [
      "Grade the thrombus (TIMI thrombus grade) in every STEMI",
      "Routine manual aspiration is still not recommended",
      "Stent-retriever thrombectomy is promising for large thrombus, but awaits outcome data",
    ];
    pts.forEach((t, i) => {
      const y = 1.35 + i * 1.1;
      s.addText(String(i + 1).padStart(2, "0"), { x: 0.5, y, w: 1.0, h: 0.8, fontFace: HEAD, fontSize: 36, bold: true, color: MAROON, valign: "middle", margin: 0, isTextBox: true });
      s.addText(t, { x: 1.6, y, w: 7.9, h: 0.8, fontFace: BODY, fontSize: 17, color: INK, valign: "middle", margin: 0, isTextBox: true });
    });
  }

  // ═════════ 16. References ═════════
  {
    const s = slide("References", "NATURE figures are from the ESC 2026 late-breaking presentation and press reports; check the peer-reviewed publication for final values.");
    const refs = [
      "Valgimigli M. NATURE trial. Late-Breaking Clinical Trial, ESC Congress 2026, Munich.",
      "Landi A, et al. Mechanical thrombectomy in STEMI with large thrombus burden: design and rationale of the NATURE trial. Cardiovasc Revasc Med. 2026.",
      "ClinicalTrials.gov NCT04969471: NATURE (enVast as an adjunct to PPCI in STEMI).",
      "Fröbert O, et al. Thrombus aspiration during STEMI (TASTE). N Engl J Med. 2013.",
      "Jolly SS, et al. Primary PCI with or without routine manual thrombectomy (TOTAL). N Engl J Med. 2015.",
      "Byrne RA, et al. 2023 ESC Guidelines for the management of acute coronary syndromes. Eur Heart J. 2023.",
    ];
    s.addText(refs.map((r, i) => ({ text: r, options: { bullet: { type: "number" }, breakLine: i < refs.length - 1 } })), {
      x: 0.5, y: 1.2, w: 9, h: 3.7, fontFace: BODY, fontSize: 13, color: INK, paraSpaceAfter: 8, valign: "top", margin: 0, isTextBox: true,
    });
  }

  // ═════════ 17. Thank you ═════════
  {
    n++;
    const s = pres.addSlide();
    s.background = { color: MAROON };
    s.addText("Thank you", { x: 0.5, y: 1.55, w: 9, h: 1.1, fontFace: HEAD, fontSize: 60, bold: true, color: WHITE, align: "center", margin: 0, isTextBox: true });
    s.addText("Questions and discussion", { x: 0.5, y: 2.7, w: 9, h: 0.5, fontFace: BODY, fontSize: 20, color: "F3C9D5", align: "center", margin: 0, isTextBox: true });
    s.addText(`${PRESENTER}  ·  ${ROLE}  ·  ${PLACE}`, { x: 0.5, y: 4.4, w: 9, h: 0.4, fontFace: BODY, fontSize: 13, color: WHITE, align: "center", margin: 0, isTextBox: true });
  }

  await pres.writeFile({ fileName: OUT });
  console.log("wrote", OUT, "slides:", n);
})();
