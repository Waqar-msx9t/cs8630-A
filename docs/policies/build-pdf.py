#!/usr/bin/env python3
"""Render a controlled-policy Markdown document to a formatted PDF.

Supports the subset of Markdown used by the policy documents in this
directory: ATX headings, pipe tables, blockquotes, bullet and ordered
lists, horizontal rules, and inline bold/italic/code/link spans.

Usage: python3 build-pdf.py INPUT.md OUTPUT.pdf
"""

import re
import sys

from reportlab.lib import colors
from reportlab.lib.enums import TA_JUSTIFY
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    HRFlowable,
    KeepTogether,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

# --- palette ---------------------------------------------------------------
NAVY = colors.HexColor("#12355B")
SLATE = colors.HexColor("#3E5C76")
RULE = colors.HexColor("#C6CDD6")
ZEBRA = colors.HexColor("#F4F6F9")
INK = colors.HexColor("#1A1A1A")
MUTED = colors.HexColor("#6B7280")
NOTE_BG = colors.HexColor("#FFF8E6")
NOTE_BAR = colors.HexColor("#D9A400")

PAGE_W, PAGE_H = letter
L_MARGIN = R_MARGIN = 0.8 * inch
T_MARGIN = 0.95 * inch
B_MARGIN = 0.8 * inch
AVAIL_W = PAGE_W - L_MARGIN - R_MARGIN


# --- inline markdown -------------------------------------------------------
def inline(text):
    """Convert inline Markdown to ReportLab's mini-XML markup."""
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

    # Links: internal anchors lose the href and render as plain emphasis.
    def _link(m):
        label, href = m.group(1), m.group(2)
        if href.startswith("#"):
            return label
        return '<link href="%s" color="#12355B"><u>%s</u></link>' % (href, label)

    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", _link, text)
    text = re.sub(r"`([^`]+)`", r'<font face="Courier" size="8.5">\1</font>', text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"(?<![A-Za-z0-9_])_([^_]+)_(?![A-Za-z0-9_])", r"<i>\1</i>", text)
    return text


# --- block parser ----------------------------------------------------------
HEADING_RE = re.compile(r"^(#{1,6})\s+(.*)$")
HR_RE = re.compile(r"^\s*(-{3,}|\*{3,})\s*$")
BULLET_RE = re.compile(r"^(\s*)[-*]\s+(.*)$")
ORDERED_RE = re.compile(r"^(\s*)(\d+)\.\s+(.*)$")
SEP_CELL_RE = re.compile(r"^:?-{2,}:?$")


def structural(line):
    return (
        not line.strip()
        or HEADING_RE.match(line)
        or HR_RE.match(line)
        or line.lstrip().startswith("|")
        or line.lstrip().startswith("> ")
        or BULLET_RE.match(line)
        or ORDERED_RE.match(line)
    )


def split_row(line):
    cells = line.strip().split("|")
    if cells and not cells[0].strip():
        cells = cells[1:]
    if cells and not cells[-1].strip():
        cells = cells[:-1]
    return [c.strip() for c in cells]


def parse(md):
    lines = md.splitlines()
    blocks = []
    i = 0
    n = len(lines)

    while i < n:
        line = lines[i]

        if not line.strip():
            i += 1
            continue

        m = HEADING_RE.match(line)
        if m:
            blocks.append(("h", len(m.group(1)), m.group(2).strip()))
            i += 1
            continue

        if HR_RE.match(line):
            blocks.append(("hr",))
            i += 1
            continue

        if line.lstrip().startswith("|"):
            rows = []
            while i < n and lines[i].lstrip().startswith("|"):
                rows.append(split_row(lines[i]))
                i += 1
            header = None
            if len(rows) >= 2 and all(SEP_CELL_RE.match(c) for c in rows[1] if c):
                header, rows = rows[0], rows[2:]
            blocks.append(("table", header, rows))
            continue

        if line.lstrip().startswith("> "):
            buf = []
            while i < n and lines[i].lstrip().startswith(">"):
                buf.append(lines[i].lstrip()[1:].strip())
                i += 1
            blocks.append(("quote", " ".join(b for b in buf if b)))
            continue

        m = BULLET_RE.match(line) or ORDERED_RE.match(line)
        if m:
            ordered = bool(ORDERED_RE.match(line))
            items = []
            while i < n:
                mb = ORDERED_RE.match(lines[i]) if ordered else BULLET_RE.match(lines[i])
                if not mb:
                    break
                text = mb.group(3) if ordered else mb.group(2)
                i += 1
                # absorb wrapped continuation lines
                while i < n and lines[i].strip() and not structural(lines[i]):
                    text += " " + lines[i].strip()
                    i += 1
                while i < n and lines[i].startswith("   ") and lines[i].strip():
                    if (ORDERED_RE.match(lines[i]) if ordered else BULLET_RE.match(lines[i])):
                        break
                    text += " " + lines[i].strip()
                    i += 1
                items.append(text)
            blocks.append(("list", ordered, items))
            continue

        buf = [line.strip()]
        i += 1
        while i < n and lines[i].strip() and not structural(lines[i]):
            buf.append(lines[i].strip())
            i += 1
        blocks.append(("p", " ".join(buf)))

    return blocks


# --- styles ----------------------------------------------------------------
def build_styles():
    ss = getSampleStyleSheet()
    s = {}
    s["title"] = ParagraphStyle(
        "title", parent=ss["Title"], fontName="Helvetica-Bold", fontSize=19,
        leading=24, textColor=NAVY, alignment=0, spaceAfter=2,
    )
    s["h2"] = ParagraphStyle(
        "h2", fontName="Helvetica-Bold", fontSize=13.5, leading=17,
        textColor=NAVY, spaceBefore=16, spaceAfter=5, keepWithNext=1,
    )
    s["h3"] = ParagraphStyle(
        "h3", fontName="Helvetica-Bold", fontSize=10.8, leading=14,
        textColor=SLATE, spaceBefore=11, spaceAfter=4, keepWithNext=1,
    )
    s["h4"] = ParagraphStyle(
        "h4", fontName="Helvetica-BoldOblique", fontSize=9.8, leading=13,
        textColor=SLATE, spaceBefore=9, spaceAfter=3, keepWithNext=1,
    )
    s["body"] = ParagraphStyle(
        "body", fontName="Helvetica", fontSize=9.5, leading=13.4,
        textColor=INK, alignment=TA_JUSTIFY, spaceAfter=6,
    )
    s["bullet"] = ParagraphStyle(
        "bullet", parent=s["body"], leftIndent=16, bulletIndent=4,
        spaceAfter=3, alignment=0,
    )
    s["ordered"] = ParagraphStyle(
        "ordered", parent=s["body"], leftIndent=24, bulletIndent=3,
        spaceAfter=4, alignment=0,
    )
    s["quote"] = ParagraphStyle(
        "quote", fontName="Helvetica", fontSize=9, leading=12.8,
        textColor=INK, alignment=TA_JUSTIFY,
    )
    s["th"] = ParagraphStyle(
        "th", fontName="Helvetica-Bold", fontSize=8.8, leading=11.4,
        textColor=colors.white,
    )
    s["td"] = ParagraphStyle(
        "td", fontName="Helvetica", fontSize=8.8, leading=11.4, textColor=INK,
    )
    s["th_sm"] = ParagraphStyle("th_sm", parent=s["th"], fontSize=7.2, leading=9)
    s["td_sm"] = ParagraphStyle("td_sm", parent=s["td"], fontSize=7.2, leading=9)
    return s


def plain(text):
    """Strip inline Markdown so text can be measured."""
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    return re.sub(r"[*`_]", "", text)


def col_widths(header, rows, ncols, size, pad):
    """Proportional widths, floored so no column splits a word."""
    weights, floors = [], []
    for c in range(ncols):
        cells = []
        if header and c < len(header):
            cells.append((header[c], "Helvetica-Bold"))
        for r in rows:
            if c < len(r):
                cells.append((r[c], "Helvetica"))
        longest, widest_word = 0, 0.0
        for raw, font in cells:
            txt = plain(raw)
            longest = max(longest, len(txt))
            for word in txt.split():
                widest_word = max(widest_word, stringWidth(word, font, size))
        weights.append(max(6, min(longest, 90)))
        floors.append(min(widest_word + 2 * pad + 2, AVAIL_W / 2.0))

    if sum(floors) >= AVAIL_W:  # cannot honour every floor; scale them
        scale = AVAIL_W / sum(floors)
        return [f * scale for f in floors]

    widths = [None] * ncols
    while True:
        free_idx = [i for i in range(ncols) if widths[i] is None]
        budget = AVAIL_W - sum(w for w in widths if w is not None)
        total = float(sum(weights[i] for i in free_idx))
        grew = False
        for i in free_idx:
            if budget * weights[i] / total < floors[i]:
                widths[i] = floors[i]
                grew = True
        if not grew:
            for i in free_idx:
                widths[i] = budget * weights[i] / total
            return widths


def make_table(header, rows, s):
    ncols = len(header) if header else 0
    for r in rows:
        ncols = max(ncols, len(r))
    ncols = max(ncols, 1)

    small = ncols > 4
    th, td = (s["th_sm"], s["td_sm"]) if small else (s["th"], s["td"])
    pad = 3 if small else 5

    data = []
    if header:
        data.append([Paragraph(inline(c), th)
                     for c in header + [""] * (ncols - len(header))])
    for r in rows:
        data.append([Paragraph(inline(c), td) for c in r + [""] * (ncols - len(r))])

    style = [
        ("GRID", (0, 0), (-1, -1), 0.4, RULE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), pad),
        ("RIGHTPADDING", (0, 0), (-1, -1), pad),
        ("TOPPADDING", (0, 0), (-1, -1), pad),
        ("BOTTOMPADDING", (0, 0), (-1, -1), pad),
    ]
    start = 0
    if header:
        style += [
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("LINEBELOW", (0, 0), (-1, 0), 0.6, NAVY),
        ]
        start = 1
    for idx in range(start, len(data)):
        if (idx - start) % 2 == 1:
            style.append(("BACKGROUND", (0, idx), (-1, idx), ZEBRA))

    t = Table(data, colWidths=col_widths(header, rows, ncols, td.fontSize, pad),
              repeatRows=1 if header else 0, hAlign="LEFT")
    t.setStyle(TableStyle(style))
    return t


def make_quote(text, s):
    inner = Paragraph(inline(text), s["quote"])
    t = Table([["", inner]], colWidths=[3.5, AVAIL_W - 3.5], hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), NOTE_BAR),
        ("BACKGROUND", (1, 0), (1, 0), NOTE_BG),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (0, 0), 0),
        ("RIGHTPADDING", (0, 0), (0, 0), 0),
        ("TOPPADDING", (0, 0), (0, 0), 0),
        ("BOTTOMPADDING", (0, 0), (0, 0), 0),
        ("LEFTPADDING", (1, 0), (1, 0), 9),
        ("RIGHTPADDING", (1, 0), (1, 0), 9),
        ("TOPPADDING", (1, 0), (1, 0), 8),
        ("BOTTOMPADDING", (1, 0), (1, 0), 8),
    ]))
    return t


# --- document chrome -------------------------------------------------------
class PolicyDoc(BaseDocTemplate):
    def __init__(self, path, title, doc_number, **kw):
        BaseDocTemplate.__init__(
            self, path, pagesize=letter, leftMargin=L_MARGIN, rightMargin=R_MARGIN,
            topMargin=T_MARGIN, bottomMargin=B_MARGIN, title=title,
            author="Ophthalmic Surgical Services", subject=doc_number, **kw
        )
        self.doc_title = title
        self.doc_number = doc_number
        frame = Frame(L_MARGIN, B_MARGIN, AVAIL_W,
                      PAGE_H - T_MARGIN - B_MARGIN, id="body",
                      leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
        self.addPageTemplates([PageTemplate(id="std", frames=[frame],
                                            onPage=self.decorate)])

    def decorate(self, canv, doc):
        canv.saveState()
        y = PAGE_H - T_MARGIN + 22
        canv.setFont("Helvetica", 7.5)
        canv.setFillColor(MUTED)
        if doc.page > 1:
            canv.drawString(L_MARGIN, y, self.doc_title)
        canv.drawRightString(PAGE_W - R_MARGIN, y, self.doc_number)
        canv.setStrokeColor(RULE)
        canv.setLineWidth(0.5)
        canv.line(L_MARGIN, y - 5, PAGE_W - R_MARGIN, y - 5)

        fy = B_MARGIN - 26
        canv.line(L_MARGIN, fy + 13, PAGE_W - R_MARGIN, fy + 13)
        canv.setFont("Helvetica-Oblique", 7)
        canv.drawString(L_MARGIN, fy, "Template — requires local review and approval before adoption.")
        canv.setFont("Helvetica", 7.5)
        canv.drawRightString(PAGE_W - R_MARGIN, fy, "Page %d" % doc.page)
        canv.restoreState()


def build(md_path, pdf_path):
    md = open(md_path, encoding="utf-8").read()
    blocks = parse(md)
    s = build_styles()

    title = "Policy"
    for b in blocks:
        if b[0] == "h" and b[1] == 1:
            title = b[2]
            break
    short = title.split("—")[-1].strip() if "—" in title else title

    doc_number = "OPH-SURG-001"
    for b in blocks:
        if b[0] == "table" and b[2]:
            for row in b[2]:
                if len(row) >= 2 and row[0].strip().lower() == "policy number":
                    doc_number = row[1].strip()
    story = []
    seen_title = False

    for b in blocks:
        kind = b[0]

        if kind == "h":
            level, text = b[1], b[2]
            if level == 1 and not seen_title:
                seen_title = True
                story.append(Paragraph(inline(text), s["title"]))
                story.append(Spacer(1, 3))
                story.append(HRFlowable(width="100%", thickness=1.4, color=NAVY,
                                        spaceBefore=0, spaceAfter=12))
                continue
            style = {1: s["h2"], 2: s["h2"], 3: s["h3"]}.get(level, s["h4"])
            para = Paragraph(inline(text), style)
            if style is s["h2"]:
                story.append(KeepTogether([
                    para,
                    HRFlowable(width="100%", thickness=0.6, color=RULE,
                               spaceBefore=1, spaceAfter=7),
                ]))
            else:
                story.append(para)

        elif kind == "hr":
            if seen_title:
                story.append(Spacer(1, 6))
                story.append(HRFlowable(width="100%", thickness=0.6, color=RULE,
                                        spaceBefore=0, spaceAfter=8))

        elif kind == "p":
            story.append(Paragraph(inline(b[1]), s["body"]))

        elif kind == "quote":
            story.append(make_quote(b[1], s))
            story.append(Spacer(1, 9))

        elif kind == "list":
            ordered, items = b[1], b[2]
            for idx, item in enumerate(items, 1):
                if ordered:
                    story.append(Paragraph(inline(item), s["ordered"],
                                           bulletText="%d." % idx))
                else:
                    story.append(Paragraph(inline(item), s["bullet"], bulletText="•"))
            story.append(Spacer(1, 4))

        elif kind == "table":
            # No leading Spacer: a preceding heading's keepWithNext must bind
            # to the table itself, not to a spacer that trivially fits.
            t = make_table(b[1], b[2], s)
            t.spaceBefore = 3
            story.append(t)
            story.append(Spacer(1, 10))

    PolicyDoc(pdf_path, short, doc_number).build(story)
    print("wrote %s" % pdf_path)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit("usage: build-pdf.py INPUT.md OUTPUT.pdf")
    build(sys.argv[1], sys.argv[2])
