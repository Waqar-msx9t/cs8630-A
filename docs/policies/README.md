# Policies

Controlled policy and procedure documents maintained in this repository.

| Document | Number | Scope |
| --- | --- | --- |
| [Documentation of Surgery-Related Policies and Procedures — Ophthalmology](ophthalmology-surgical-policies-and-procedures.md) ([PDF](ophthalmology-surgical-policies-and-procedures.pdf)) | OPH-SURG-001 | Requires that all surgery-related policies and procedures for ophthalmic surgical services are written, approved, accessible, current, and auditable; defines the minimum required topic inventory. |

Each document is a template intended for local adaptation. Review and amendment by clinical
leadership, infection prevention, pharmacy, risk management, and legal/compliance is required
before adoption.

## Regenerating the PDFs

The Markdown file is the source of record; the PDF is a build artifact and should never be
edited directly. To rebuild after changing the Markdown:

```sh
pip install reportlab
python3 docs/policies/build-pdf.py \
    docs/policies/ophthalmology-surgical-policies-and-procedures.md \
    docs/policies/ophthalmology-surgical-policies-and-procedures.pdf
```

`build-pdf.py` renders the subset of Markdown these documents use — ATX headings, pipe tables,
blockquotes, bullet and ordered lists, horizontal rules, and inline bold/italic/code/link spans —
and adds the running header, page numbering, and template footer.
