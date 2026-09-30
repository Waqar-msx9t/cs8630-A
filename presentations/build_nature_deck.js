const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");
const path = require("path");

const OUT = process.argv[2] || path.join(__dirname, "NATURE_Trial_2026.pptx");

// Palette: "clinical noir" — ink, crimson (heart), teal (enVast arm), slate (control)
const INK = "0E1117";
const CARD = "1A1F2B";
const CRIMSON = "E5383B";
const ROSE = "F4B6BB";
const TEAL = "1FA99C";
const TEAL_LT = "E3F5F3";
const SLATE = "8A93A6";
const WHITE = "FFFFFF";
const PAPER = "F6F7F9";
const TEXT = "1B2230";
const MUTED = "5E6778";
const HEAD = "Cambria";
const BODY = "Calibri";

async function icon(Comp, color, size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(Comp, { color: "#" + color, size: String(size) })
  );
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

// ECG trace motif rendered as a transparent PNG
async function ecg(color, w = 2400, h = 300, beats = 4, stroke = 7) {
  const mid = h * 0.62;
  const seg = w / beats;
  let d = `M0 ${mid}`;
  for (let i = 0; i < beats; i++) {
    const x = i * seg;
    const u = seg / 100;
    d += ` L${x + 20 * u} ${mid}`;
    d += ` Q${x + 25 * u} ${mid - h * 0.1} ${x + 30 * u} ${mid}`; // P
    d += ` L${x + 38 * u} ${mid}`;
    d += ` L${x + 41 * u} ${mid + h * 0.1}`; // Q
    d += ` L${x + 45 * u} ${h * 0.05}`; // R
    d += ` L${x + 49 * u} ${h * 0.95}`; // S
    d += ` L${x + 52 * u} ${mid}`;
    d += ` L${x + 62 * u} ${mid}`;
    d += ` Q${x + 70 * u} ${mid - h * 0.22} ${x + 78 * u} ${mid}`; // T
    d += ` L${x + 100 * u} ${mid}`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><path d="${d}" fill="none" stroke="#${color}" stroke-width="${stroke}" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9"; // 10 x 5.625
  pres.title = "NATURE Trial — ESC Congress 2026";
  pres.subject = "enVast-assisted mechanical thrombectomy in large-thrombus STEMI";

  const I = {
    heart: await icon(fa.FaHeartbeat, CRIMSON),
    heartW: await icon(fa.FaHeartbeat, WHITE),
    tint: await icon(fa.FaTint, CRIMSON),
    ban: await icon(fa.FaBan, CRIMSON),
    book: await icon(fa.FaBookMedical, CRIMSON),
    users: await icon(fa.FaUsers, WHITE),
    random: await icon(fa.FaRandom, WHITE),
    hospital: await icon(fa.FaHospital, TEAL),
    flask: await icon(fa.FaFlask, WHITE),
    mri: await icon(fa.FaMagnet, WHITE),
    shield: await icon(fa.FaShieldAlt, WHITE),
    check: await icon(fa.FaCheck, WHITE),
    warn: await icon(fa.FaExclamation, WHITE),
    arrowR: await icon(fa.FaArrowRight, SLATE),
    arrowD: await icon(fa.FaArrowDown, SLATE),
    target: await icon(fa.FaCrosshairs, WHITE),
    link: await icon(fa.FaLink, WHITE),
    undo: await icon(fa.FaUndoAlt, WHITE),
  };
  const ECG_RED = await ecg(CRIMSON, 2400, 300, 4, 7);
  const ECG_SMALL = await ecg(CRIMSON, 600, 120, 1, 8);

  let n = 0;
  const TOTAL = 11;

  function frame(slide, dark) {
    n++;
    slide.background = { color: dark ? INK : WHITE };
    slide.addImage({ data: ECG_SMALL, x: 8.55, y: 5.17, w: 0.75, h: 0.15 });
    slide.addText(`${String(n).padStart(2, "0")} / ${TOTAL}`, {
      x: 9.3, y: 5.1, w: 0.6, h: 0.3, fontFace: BODY, fontSize: 9,
      color: dark ? SLATE : MUTED, align: "right", margin: 0, isTextBox: true,
    });
    slide.addText("NATURE · ESC 2026", {
      x: 0.5, y: 5.1, w: 3, h: 0.3, fontFace: BODY, fontSize: 9, charSpacing: 2,
      color: dark ? SLATE : MUTED, margin: 0, isTextBox: true,
    });
  }

  function header(slide, kicker, title, dark) {
    slide.addText(kicker.toUpperCase(), {
      x: 0.5, y: 0.35, w: 9, h: 0.3, fontFace: BODY, fontSize: 11, bold: true,
      charSpacing: 4, color: CRIMSON, margin: 0, isTextBox: true,
    });
    slide.addText(title, {
      x: 0.5, y: 0.65, w: 9, h: 0.7, fontFace: HEAD, fontSize: 30, bold: true,
      color: dark ? WHITE : TEXT, margin: 0, valign: "top", isTextBox: true,
    });
  }

  function circleIcon(slide, x, y, d, fill, img) {
    slide.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { color: fill } });
    const p = d * 0.26;
    slide.addImage({ data: img, x: x + p, y: y + p, w: d - 2 * p, h: d - 2 * p });
  }

  // ─────────────── 1. Title ───────────────
  {
    const s = pres.addSlide();
    frame(s, true);
    s.addImage({ data: ECG_RED, x: -0.2, y: 2.9, w: 10.4, h: 1.15, transparency: 55 });
    s.addText("ESC CONGRESS 2026 · MUNICH · LATE-BREAKING CLINICAL TRIAL", {
      x: 0.6, y: 0.55, w: 8.8, h: 0.3, fontFace: BODY, fontSize: 11, bold: true,
      charSpacing: 4, color: ROSE, margin: 0, isTextBox: true,
    });
    s.addText("NATURE", {
      x: 0.6, y: 0.95, w: 8.8, h: 1.3, fontFace: HEAD, fontSize: 88, bold: true,
      color: WHITE, charSpacing: 6, margin: 0, isTextBox: true,
    });
    s.addText(
      "enVast-assisted mechanical thrombectomy versus standard primary PCI in STEMI with large thrombus burden",
      { x: 0.6, y: 2.2, w: 7.2, h: 0.8, fontFace: HEAD, italic: true, fontSize: 18, color: ROSE, margin: 0, valign: "top", isTextBox: true }
    );
    const stats = [["154", "patients"], ["11", "centres"], ["1 : 1", "randomised"], ["−26%", "infarct size"]];
    stats.forEach(([v, l], i) => {
      const x = 0.6 + i * 2.2;
      s.addText(v, { x, y: 3.95, w: 2, h: 0.55, fontFace: HEAD, fontSize: 30, bold: true, color: i === 3 ? CRIMSON : WHITE, margin: 0, isTextBox: true });
      s.addText(l.toUpperCase(), { x, y: 4.5, w: 2, h: 0.25, fontFace: BODY, fontSize: 10, charSpacing: 3, color: SLATE, margin: 0, isTextBox: true });
    });
    s.addNotes(
      "NATURE was presented as a late-breaking clinical trial at ESC Congress 2026 in Munich by Prof. Marco Valgimigli (Cardiocentro Ticino Institute, Lugano). " +
      "It asks whether a coronary stent-retriever (enVast, Vesalio) used before conventional PCI can limit myocardial damage in STEMI patients with a large clot burden."
    );
  }

  // ─────────────── 2. The problem ───────────────
  {
    const s = pres.addSlide();
    frame(s, false);
    header(s, "The clinical problem", "Large thrombus: the clot that won’t stay put", false);
    // Left: mechanism chain
    const steps = [
      ["Large thrombus burden", "Common in STEMI; ballooning and stenting can fragment the clot."],
      ["Distal embolisation", "Debris showers into the microcirculation downstream of the culprit lesion."],
      ["Microvascular obstruction", "Epicardial flow is restored, but tissue-level reperfusion fails."],
      ["Larger infarct", "More myocardium lost, higher risk of heart failure and death."],
    ];
    steps.forEach(([t, d], i) => {
      const y = 1.55 + i * 0.85;
      s.addShape(pres.shapes.OVAL, { x: 0.5, y, w: 0.5, h: 0.5, fill: { color: i === 3 ? CRIMSON : INK }, line: { color: i === 3 ? CRIMSON : INK } });
      s.addText(String(i + 1), { x: 0.5, y, w: 0.5, h: 0.5, fontFace: HEAD, fontSize: 16, bold: true, color: WHITE, align: "center", valign: "middle", margin: 0, isTextBox: true });
      s.addText(t, { x: 1.2, y: y - 0.04, w: 3.7, h: 0.3, fontFace: BODY, fontSize: 15, bold: true, color: TEXT, margin: 0, isTextBox: true });
      s.addText(d, { x: 1.2, y: y + 0.26, w: 3.7, h: 0.45, fontFace: BODY, fontSize: 11.5, color: MUTED, margin: 0, valign: "top", isTextBox: true });
    });
    // Right: history panel
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 5.3, y: 1.5, w: 4.2, h: 3.4, fill: { color: PAPER }, line: { color: PAPER }, rectRadius: 0.12 });
    s.addText("Aspiration thrombectomy already failed", {
      x: 5.55, y: 1.65, w: 3.8, h: 0.35, fontFace: HEAD, fontSize: 15, bold: true, color: TEXT, margin: 0, isTextBox: true,
    });
    const hist = [
      [I.tint, "TASTE", "n = 7,244 · no mortality benefit from routine aspiration"],
      [I.tint, "TOTAL", "n = 10,732 · no clinical benefit; excess stroke at 30 days"],
      [I.ban, "Guidelines", "Routine thrombus aspiration not recommended (ESC Class III)"],
    ];
    hist.forEach(([ic, t, d], i) => {
      const y = 2.15 + i * 0.85;
      s.addImage({ data: ic, x: 5.55, y: y + 0.05, w: 0.32, h: 0.32 });
      s.addText(t, { x: 6.05, y, w: 3.3, h: 0.3, fontFace: BODY, fontSize: 13, bold: true, color: CRIMSON, margin: 0, isTextBox: true });
      s.addText(d, { x: 6.05, y: y + 0.28, w: 3.3, h: 0.5, fontFace: BODY, fontSize: 11, color: TEXT, margin: 0, valign: "top", isTextBox: true });
    });
    s.addNotes(
      "The rationale: in patients with a large thrombus, PCI can push clot downstream, causing microvascular obstruction and larger infarcts. " +
      "Manual aspiration was the obvious fix, but TASTE and TOTAL were neutral on hard outcomes and TOTAL raised a stroke signal, so guidelines advise against routine aspiration. " +
      "NATURE tests a different mechanical approach — a stent-retriever — in a population selected for large thrombus."
    );
  }

  // ─────────────── 3. The device ───────────────
  {
    const s = pres.addSlide();
    frame(s, false);
    header(s, "The intervention", "enVast: a stent-retriever built for coronary clot", false);
    s.addText(
      "Developed by Vesalio from its NeVa neurovascular thrombectomy platform, enVast captures and removes thrombus mechanically before the operator balloons or stents the culprit lesion.",
      { x: 0.5, y: 1.4, w: 9, h: 0.6, fontFace: BODY, fontSize: 13, color: MUTED, margin: 0, valign: "top", isTextBox: true }
    );
    const steps = [
      [I.target, "Cross & deploy", "Wire the infarct-related artery and deploy the retriever across the thrombus."],
      [I.link, "Capture", "The clot is engaged and held within the device’s struts."],
      [I.undo, "Retrieve, then PCI", "Withdraw device and clot together, then complete conventional PCI."],
    ];
    steps.forEach(([ic, t, d], i) => {
      const x = 0.5 + i * 3.15;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x, y: 2.25, w: 2.75, h: 2.55, fill: { color: WHITE }, line: { color: "E4E7EC", width: 1 }, rectRadius: 0.12,
        shadow: { type: "outer", color: "000000", opacity: 0.08, blur: 8, offset: 2, angle: 90 },
      });
      circleIcon(s, x + 0.3, 2.5, 0.7, i === 2 ? TEAL : CRIMSON, ic);
      s.addText(`STEP ${i + 1}`, { x: x + 1.15, y: 2.62, w: 1.4, h: 0.3, fontFace: BODY, fontSize: 10, bold: true, charSpacing: 3, color: MUTED, margin: 0, isTextBox: true });
      s.addText(t, { x: x + 0.3, y: 3.4, w: 2.25, h: 0.35, fontFace: HEAD, fontSize: 17, bold: true, color: TEXT, margin: 0, isTextBox: true });
      s.addText(d, { x: x + 0.3, y: 3.8, w: 2.25, h: 0.85, fontFace: BODY, fontSize: 12, color: MUTED, margin: 0, valign: "top", isTextBox: true });
      if (i < 2) s.addImage({ data: I.arrowR, x: x + 2.83, y: 3.4, w: 0.25, h: 0.25 });
    });
    s.addNotes(
      "enVast is Vesalio's coronary clot retriever, derived from the NeVa device used for stroke thrombectomy. " +
      "The idea: remove the bulk of the clot as a whole rather than aspirate it, so less debris embolises when the lesion is subsequently treated with balloon and stent."
    );
  }

  // ─────────────── 4. Trial design ───────────────
  {
    const s = pres.addSlide();
    frame(s, false);
    header(s, "Trial design", "Prospective, multicentre, randomised 1 : 1", false);
    // Flow diagram
    const fx = 0.5, fw = 5.6;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: fx, y: 1.5, w: fw, h: 0.7, fill: { color: INK }, line: { color: INK }, rectRadius: 0.1 });
    s.addImage({ data: I.users, x: fx + 0.2, y: 1.66, w: 0.38, h: 0.38 });
    s.addText([
      { text: "154 STEMI patients", options: { bold: true, fontSize: 15, breakLine: true } },
      { text: "large thrombus burden · 11 centres", options: { fontSize: 11, color: ROSE } },
    ], { x: fx + 0.75, y: 1.5, w: fw - 0.9, h: 0.7, fontFace: BODY, color: WHITE, valign: "middle", margin: 0, isTextBox: true });
    s.addImage({ data: I.arrowD, x: fx + fw / 2 - 0.12, y: 2.27, w: 0.24, h: 0.24 });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: fx + fw / 2 - 1.3, y: 2.57, w: 2.6, h: 0.42, fill: { color: CRIMSON }, line: { color: CRIMSON }, rectRadius: 0.21 });
    s.addText("RANDOMISED 1 : 1", { x: fx + fw / 2 - 1.3, y: 2.57, w: 2.6, h: 0.42, fontFace: BODY, fontSize: 11, bold: true, charSpacing: 3, color: WHITE, align: "center", valign: "middle", margin: 0, isTextBox: true });
    s.addImage({ data: I.arrowD, x: fx + 1.25, y: 3.06, w: 0.24, h: 0.24 });
    s.addImage({ data: I.arrowD, x: fx + fw - 1.49, y: 3.06, w: 0.24, h: 0.24 });
    const arms = [
      [fx, TEAL, "enVast thrombectomy", "then conventional PCI"],
      [fx + fw / 2 + 0.1, SLATE, "Standard of care", "conventional primary PCI"],
    ];
    arms.forEach(([x, c, t, d]) => {
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 3.37, w: fw / 2 - 0.1, h: 0.8, fill: { color: c }, line: { color: c }, rectRadius: 0.1 });
      s.addText([
        { text: t, options: { bold: true, fontSize: 14, breakLine: true } },
        { text: d, options: { fontSize: 11 } },
      ], { x: x + 0.2, y: 3.37, w: fw / 2 - 0.5, h: 0.8, fontFace: BODY, color: WHITE, valign: "middle", margin: 0, isTextBox: true });
    });
    s.addText("Follow-up: CK-MB AUC  ·  CMR at day 3  ·  30-day clinical events", {
      x: fx, y: 4.35, w: fw, h: 0.35, fontFace: BODY, fontSize: 11.5, italic: true, color: MUTED, align: "center", margin: 0, isTextBox: true,
    });
    // Right: key facts
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 6.5, y: 1.5, w: 3.0, h: 3.2, fill: { color: PAPER }, line: { color: PAPER }, rectRadius: 0.12 });
    const facts = [
      ["Hypothesis", "Superiority of enVast on infarct size"],
      ["Principal investigator", "Prof. Marco Valgimigli, Cardiocentro Ticino, Lugano"],
      ["Sponsor", "Vesalio"],
      ["Registry", "NCT04969471"],
    ];
    facts.forEach(([k, v], i) => {
      const y = 1.68 + i * 0.74;
      s.addText(k.toUpperCase(), { x: 6.75, y, w: 2.6, h: 0.25, fontFace: BODY, fontSize: 9.5, bold: true, charSpacing: 2, color: CRIMSON, margin: 0, isTextBox: true });
      s.addText(v, { x: 6.75, y: y + 0.24, w: 2.6, h: 0.45, fontFace: BODY, fontSize: 12, color: TEXT, margin: 0, valign: "top", isTextBox: true });
    });
    s.addNotes(
      "154 patients at 11 centres were randomised 1:1 to enVast-assisted thrombectomy followed by conventional PCI, or to standard-of-care primary PCI. " +
      "The design and rationale were published by Landi et al. in Cardiovascular Revascularization Medicine (March 2026)."
    );
  }

  // ─────────────── 5. Population & endpoints ───────────────
  {
    const s = pres.addSlide();
    frame(s, false);
    header(s, "Population & endpoints", "Enriched for clot; judged on infarct size", false);
    // Left inclusion card (dark)
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 1.5, w: 3.9, h: 3.3, fill: { color: INK }, line: { color: INK }, rectRadius: 0.12 });
    s.addText("KEY INCLUSION", { x: 0.8, y: 1.7, w: 3.3, h: 0.3, fontFace: BODY, fontSize: 11, bold: true, charSpacing: 4, color: ROSE, margin: 0, isTextBox: true });
    s.addText([
      { text: "STEMI undergoing primary PCI", options: { bullet: true, breakLine: true } },
      { text: "TIMI thrombus grade ≥ 3 in the infarct-related artery", options: { bullet: true, breakLine: true } },
      { text: "If grade 5 (TIMI 0 flow), grade ≥ 3 re-confirmed after wiring", options: { bullet: true } },
    ], { x: 0.8, y: 2.1, w: 3.4, h: 2.5, fontFace: BODY, fontSize: 13.5, color: WHITE, paraSpaceAfter: 10, valign: "top", margin: 0, isTextBox: true });
    s.addText("Why enrich? Benefit is most plausible where there is the most clot to embolise.", {
      x: 0.8, y: 4.0, w: 3.4, h: 0.6, fontFace: HEAD, italic: true, fontSize: 12, color: ROSE, margin: 0, valign: "top", isTextBox: true,
    });
    // Right endpoints
    const eps = [
      [CRIMSON, I.flask, "Primary efficacy", "Infarct size by CK-MB area under the curve"],
      [TEAL, I.mri, "Key secondary", "Infarct size on cardiac MRI (% LV mass) at day 3"],
      [INK, I.shield, "Safety", "Death, stroke and MACE at 30 days"],
    ];
    eps.forEach(([c, ic, t, d], i) => {
      const y = 1.5 + i * 1.12;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 4.8, y, w: 4.7, h: 0.95, fill: { color: PAPER }, line: { color: PAPER }, rectRadius: 0.1 });
      circleIcon(s, 5.0, y + 0.18, 0.6, c, ic);
      s.addText(t.toUpperCase(), { x: 5.8, y: y + 0.14, w: 3.5, h: 0.28, fontFace: BODY, fontSize: 10, bold: true, charSpacing: 3, color: c === INK ? MUTED : c, margin: 0, isTextBox: true });
      s.addText(d, { x: 5.8, y: y + 0.42, w: 3.5, h: 0.45, fontFace: BODY, fontSize: 13, color: TEXT, margin: 0, valign: "top", isTextBox: true });
    });
    s.addNotes(
      "Patients were selected for a large thrombus (TIMI thrombus grade 3 or more); occluded vessels were re-graded after wiring. " +
      "The primary endpoint is a physiological one — enzymatic infarct size — backed by CMR infarct size as a secondary, with 30-day safety events."
    );
  }

  // ─────────────── 6. Primary result (dark) ───────────────
  {
    const s = pres.addSlide();
    frame(s, true);
    header(s, "Primary endpoint · met", "Infarct size cut by about a quarter", true);
    s.addText("−26%", { x: 0.5, y: 1.6, w: 4.2, h: 1.3, fontFace: HEAD, fontSize: 80, bold: true, color: CRIMSON, margin: 0, isTextBox: true });
    s.addText("relative reduction in infarct size (CK-MB AUC) with enVast versus standard PCI", {
      x: 0.5, y: 2.95, w: 4.0, h: 0.7, fontFace: BODY, fontSize: 14, color: WHITE, margin: 0, valign: "top", isTextBox: true,
    });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 3.85, w: 1.7, h: 0.5, fill: { color: CARD }, line: { color: SLATE, width: 0.75 }, rectRadius: 0.25 });
    s.addText("P = 0.001", { x: 0.5, y: 3.85, w: 1.7, h: 0.5, fontFace: BODY, fontSize: 15, bold: true, color: WHITE, align: "center", valign: "middle", margin: 0, isTextBox: true });
    s.addChart(pres.charts.BAR, [{ name: "Infarct size index", labels: ["Standard PCI", "enVast + PCI"], values: [100, 74] }], {
      x: 5.0, y: 1.45, w: 4.5, h: 3.4, barDir: "col", barGapWidthPct: 70,
      chartColors: [SLATE, TEAL], plotArea: { fill: { color: INK } },
      showTitle: true, title: "Infarct size, indexed to control = 100", titleColor: "C9CFDA", titleFontSize: 11, titleFontFace: BODY,
      showValue: true, dataLabelPosition: "outEnd", dataLabelColor: WHITE, dataLabelFontSize: 14, dataLabelFontBold: true,
      catAxisLabelColor: "C9CFDA", catAxisLabelFontSize: 12, catAxisLabelFontFace: BODY, catAxisLineShow: false,
      valAxisHidden: true, valAxisMinVal: 0, valAxisMaxVal: 115,
      valGridLine: { style: "none" }, catGridLine: { style: "none" }, showLegend: false,
    });
    s.addNotes(
      "The trial met its primary endpoint: enzymatic infarct size by CK-MB area under the curve was about 26% lower with enVast (P = 0.001). " +
      "The chart shows the relative effect indexed to control; absolute CK-MB values are in the primary presentation/publication."
    );
  }

  // ─────────────── 7. Imaging concordance ───────────────
  {
    const s = pres.addSlide();
    frame(s, false);
    header(s, "Secondary endpoint", "Biomarker and MRI tell the same story", false);
    const cards = [
      [I.flask, CRIMSON, "CK-MB AUC", "Primary endpoint", 26, "P = 0.001 · significant"],
      [I.mri, TEAL, "Cardiac MRI, day 3", "Infarct size, % LV mass", 25, "Directionally consistent trend"],
    ];
    cards.forEach(([ic, c, t, sub, pct, note], i) => {
      const x = 0.5 + i * 4.75;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.55, w: 4.25, h: 3.2, fill: { color: PAPER }, line: { color: PAPER }, rectRadius: 0.12 });
      circleIcon(s, x + 0.3, 1.8, 0.62, c, ic);
      s.addText(t, { x: x + 1.1, y: 1.8, w: 3.0, h: 0.32, fontFace: HEAD, fontSize: 16, bold: true, color: TEXT, margin: 0, isTextBox: true });
      s.addText(sub, { x: x + 1.1, y: 2.12, w: 3.0, h: 0.3, fontFace: BODY, fontSize: 11.5, color: MUTED, margin: 0, isTextBox: true });
      s.addText(`−${pct}%`, { x: x + 0.3, y: 2.6, w: 3.6, h: 0.85, fontFace: HEAD, fontSize: 48, bold: true, color: c, margin: 0, isTextBox: true });
      // relative bars
      const bw = 3.65, bx = x + 0.3;
      s.addText("Standard PCI", { x: bx, y: 3.5, w: 1.5, h: 0.22, fontFace: BODY, fontSize: 9.5, color: MUTED, margin: 0, isTextBox: true });
      s.addShape(pres.shapes.RECTANGLE, { x: bx, y: 3.73, w: bw, h: 0.18, fill: { color: "C7CCD6" }, line: { color: "C7CCD6" } });
      s.addText("enVast + PCI", { x: bx, y: 3.97, w: 1.5, h: 0.22, fontFace: BODY, fontSize: 9.5, color: MUTED, margin: 0, isTextBox: true });
      s.addShape(pres.shapes.RECTANGLE, { x: bx, y: 4.2, w: bw * (100 - pct) / 100, h: 0.18, fill: { color: c }, line: { color: c } });
      s.addText(note, { x: bx, y: 4.42, w: bw, h: 0.25, fontFace: BODY, fontSize: 10.5, italic: true, color: TEXT, margin: 0, isTextBox: true });
    });
    s.addText("≈", { x: 4.75, y: 2.6, w: 0.5, h: 0.8, fontFace: HEAD, fontSize: 36, bold: true, color: MUTED, align: "center", valign: "middle", margin: 0, isTextBox: true });
    s.addNotes(
      "CMR at day 3 showed about a 25% relative reduction in infarct size as a percentage of LV mass — a positive trend rather than a formally significant result, " +
      "but concordant with the biomarker finding, which supports a real biological effect."
    );
  }

  // ─────────────── 8. Safety ───────────────
  {
    const s = pres.addSlide();
    frame(s, false);
    header(s, "30-day safety", "No strokes, no deaths in the enVast arm", false);
    s.addChart(pres.charts.BAR, [
      { name: "enVast + PCI", labels: ["Stroke", "Death", "MACE"], values: [0, 0, 1.3] },
      { name: "Standard PCI", labels: ["Stroke", "Death", "MACE"], values: [1.3, 2.6, 3.8] },
    ], {
      x: 0.4, y: 1.45, w: 5.6, h: 3.45, barDir: "col", barGrouping: "clustered", barGapWidthPct: 60,
      chartColors: [TEAL, SLATE],
      showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: '0.0"%"', dataLabelColor: TEXT, dataLabelFontSize: 12, dataLabelFontBold: true,
      catAxisLabelColor: TEXT, catAxisLabelFontSize: 13, catAxisLabelFontFace: BODY,
      valAxisHidden: true, valAxisMinVal: 0, valAxisMaxVal: 4.6,
      valGridLine: { style: "none" }, catGridLine: { style: "none" },
      showLegend: true, legendPos: "t", legendFontSize: 11, legendColor: TEXT, legendFontFace: BODY,
      showTitle: true, title: "Event rate at 30 days (%)", titleColor: MUTED, titleFontSize: 11, titleFontFace: BODY,
    });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 6.4, y: 1.55, w: 3.1, h: 1.55, fill: { color: TEAL_LT }, line: { color: TEAL_LT }, rectRadius: 0.12 });
    circleIcon(s, 6.6, 1.75, 0.5, TEAL, I.check);
    s.addText("Why it matters", { x: 7.25, y: 1.8, w: 2.2, h: 0.4, fontFace: HEAD, fontSize: 14, bold: true, color: TEXT, valign: "middle", margin: 0, isTextBox: true });
    s.addText("Aspiration in TOTAL carried a stroke signal. NATURE saw none with enVast.", {
      x: 6.6, y: 2.35, w: 2.75, h: 0.7, fontFace: BODY, fontSize: 11.5, color: TEXT, margin: 0, valign: "top", isTextBox: true,
    });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 6.4, y: 3.3, w: 3.1, h: 1.55, fill: { color: "FDECEC" }, line: { color: "FDECEC" }, rectRadius: 0.12 });
    circleIcon(s, 6.6, 3.5, 0.5, CRIMSON, I.warn);
    s.addText("Read with care", { x: 7.25, y: 3.55, w: 2.2, h: 0.4, fontFace: HEAD, fontSize: 14, bold: true, color: TEXT, valign: "middle", margin: 0, isTextBox: true });
    s.addText("Only a handful of events; the trial was not powered for clinical outcomes.", {
      x: 6.6, y: 4.1, w: 2.75, h: 0.7, fontFace: BODY, fontSize: 11.5, color: TEXT, margin: 0, valign: "top", isTextBox: true,
    });
    s.addNotes(
      "At 30 days: stroke 0% vs 1.3%, death 0% vs 2.6%, MACE 1.3% vs 3.8% (enVast vs control). " +
      "Reassuring given the stroke concern with aspiration in TOTAL — but these are very small numbers of events and should be treated as hypothesis-generating."
    );
  }

  // ─────────────── 9. Critical appraisal ───────────────
  {
    const s = pres.addSlide();
    frame(s, false);
    header(s, "Critical appraisal", "Strong signal, early evidence", false);
    const cols = [
      [TEAL, I.check, "Strengths", [
        "Randomised, multicentre design",
        "Population enriched for large thrombus — where benefit is most plausible",
        "Biomarker and CMR results agree",
        "No stroke or death signal at 30 days",
      ]],
      [CRIMSON, I.warn, "Limitations", [
        "Modest sample (n = 154)",
        "Surrogate primary endpoint, not hard outcomes",
        "Operators cannot be blinded to device use",
        "CMR effect a trend; industry-sponsored",
      ]],
    ];
    cols.forEach(([c, ic, t, items], i) => {
      const x = 0.5 + i * 4.6;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.5, w: 4.4, h: 2.75, fill: { color: PAPER }, line: { color: PAPER }, rectRadius: 0.12 });
      circleIcon(s, x + 0.3, 1.72, 0.55, c, ic);
      s.addText(t, { x: x + 1.0, y: 1.72, w: 3.2, h: 0.55, fontFace: HEAD, fontSize: 19, bold: true, color: TEXT, valign: "middle", margin: 0, isTextBox: true });
      s.addText(items.map((it, j) => ({ text: it, options: { bullet: true, breakLine: j < items.length - 1 } })), {
        x: x + 0.3, y: 2.45, w: 3.9, h: 1.7, fontFace: BODY, fontSize: 13, color: TEXT, paraSpaceAfter: 8, valign: "top", margin: 0, isTextBox: true,
      });
    });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 4.4, w: 9.0, h: 0.5, fill: { color: INK }, line: { color: INK }, rectRadius: 0.25 });
    s.addText([
      { text: "VERDICT   ", options: { bold: true, color: ROSE, charSpacing: 3 } },
      { text: "Confirms the hypothesis on infarct size; generates the hypothesis for clinical outcomes.", options: { color: WHITE } },
    ], { x: 0.8, y: 4.4, w: 8.5, h: 0.5, fontFace: BODY, fontSize: 12.5, valign: "middle", margin: 0, isTextBox: true });
    s.addNotes(
      "Strengths: randomisation, a targeted population, and concordant endpoints. " +
      "Limitations: small, surrogate primary endpoint, inherent lack of operator blinding, CMR only a trend, and sponsor involvement. " +
      "The next step must be an adequately powered trial with clinical endpoints."
    );
  }

  // ─────────────── 10. Take-home (dark) ───────────────
  {
    const s = pres.addSlide();
    frame(s, true);
    s.addImage({ data: ECG_RED, x: -0.2, y: 3.95, w: 10.4, h: 1.0, transparency: 70 });
    header(s, "Take-home", "What NATURE means for the cath lab", true);
    const pts = [
      ["Superior on infarct size", "enVast before PCI cut enzymatic infarct size by ~26% in large-thrombus STEMI (P = 0.001)."],
      ["Consistent and safe", "CMR pointed the same way; no strokes or deaths with enVast at 30 days."],
      ["Not yet practice-changing", "A larger outcomes trial is needed before routine use — selective, not universal."],
    ];
    pts.forEach(([t, d], i) => {
      const x = 0.5 + i * 3.1;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.55, w: 2.85, h: 2.4, fill: { color: CARD }, line: { color: CARD }, rectRadius: 0.12 });
      s.addText(String(i + 1).padStart(2, "0"), { x: x + 0.25, y: 1.7, w: 1, h: 0.55, fontFace: HEAD, fontSize: 28, bold: true, color: CRIMSON, margin: 0, isTextBox: true });
      s.addText(t, { x: x + 0.25, y: 2.3, w: 2.4, h: 0.4, fontFace: HEAD, fontSize: 15, bold: true, color: WHITE, margin: 0, isTextBox: true });
      s.addText(d, { x: x + 0.25, y: 2.75, w: 2.4, h: 1.1, fontFace: BODY, fontSize: 12, color: "C9CFDA", margin: 0, valign: "top", isTextBox: true });
    });
    s.addNotes(
      "Bottom line: in carefully selected STEMI patients with a large thrombus, stent-retriever thrombectomy before PCI reduced infarct size with no early safety penalty. " +
      "It is a promising signal, but clinical-outcome data are needed before it changes guidelines."
    );
  }

  // ─────────────── 11. References ───────────────
  {
    const s = pres.addSlide();
    frame(s, false);
    header(s, "Sources", "References", false);
    circleIcon(s, 0.5, 1.55, 0.55, INK, I.heartW);
    const refs = [
      "Valgimigli M. NATURE: enVast-assisted mechanical thrombectomy in large-thrombus STEMI. Late-Breaking Clinical Trial, ESC Congress 2026, Munich.",
      "Landi A, et al. The use of mechanical thrombectomy in patients with STEMI and large thrombus burden: design and rationale of the NATURE trial. Cardiovasc Revasc Med. 2026.",
      "ClinicalTrials.gov NCT04969471 — NATURE (enVast as an adjunct to PPCI in subjects presenting with STEMI).",
      "Fröbert O, et al. Thrombus aspiration during ST-segment elevation myocardial infarction (TASTE). N Engl J Med. 2013.",
      "Jolly SS, et al. Randomized trial of primary PCI with or without routine manual thrombectomy (TOTAL). N Engl J Med. 2015.",
      "Byrne RA, et al. 2023 ESC Guidelines for the management of acute coronary syndromes. Eur Heart J. 2023.",
    ];
    s.addText(refs.map((r, i) => ({ text: r, options: { bullet: { type: "number" }, breakLine: i < refs.length - 1 } })), {
      x: 1.35, y: 1.5, w: 8.15, h: 3.3, fontFace: BODY, fontSize: 12, color: TEXT, paraSpaceAfter: 7, valign: "top", margin: 0, isTextBox: true,
    });
    s.addNotes("Figures for NATURE are taken from the ESC 2026 late-breaking presentation and sponsor/press reports; check the peer-reviewed publication for final values.");
  }

  await pres.writeFile({ fileName: OUT });
  console.log("wrote", OUT);
})();
