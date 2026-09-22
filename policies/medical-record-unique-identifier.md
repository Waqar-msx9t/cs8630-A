# Policy: Unique Identification of Medical Records

| Field | Value |
|---|---|
| Policy ID | DG-HIM-001 |
| Version | 1.0 |
| Status | Draft for review |
| Effective date | 2026-09-22 |
| Policy owner | Director, Health Information Management (HIM) |
| Technical owner | Data Governance Lead, Enterprise Master Patient Index (EMPI) |
| Review cycle | Annual, or upon any change to registration, EMPI, or source-system architecture |
| Primary indicator | DQI-001 — Unique Identifier Integrity Index (UIII) |

> **Note on use.** This document is written as an operational policy with a measurable
> data-quality indicator. Organisation-specific identifier formats, thresholds, and
> escalation paths are marked as configurable and must be confirmed by the policy owner.
> Regulatory citations are informative; legal and compliance review is required before
> adoption.

---

## 1. Purpose

Every medical record must be attributable to exactly one patient, and every patient must
be reachable through exactly one primary record identifier. When that correspondence
breaks, clinicians treat patients from incomplete or wrong charts, billing is misdirected,
and disclosure controls fail.

This policy establishes:

1. The rule that every medical record carries a unique, permanent, machine-verifiable
   identifier.
2. A quantitative **indicator** that measures conformance to that rule.
3. The thresholds, measurement cadence, ownership, and remediation path that make the
   indicator actionable rather than decorative.

## 2. Scope

**In scope.** All systems that create, store, or exchange patient-level records: the
electronic health record (EHR), the EMPI, registration and scheduling, laboratory,
radiology/PACS, pharmacy, revenue cycle, the clinical data warehouse, research extracts,
and any interface engine that routes patient records between them.

**In scope regardless of medium.** Electronic records, scanned documents, and legacy
paper records indexed into the EMPI.

**Out of scope.** De-identified datasets that have had identifiers removed under an
approved de-identification procedure, and fully synthetic data. These remain subject to
their own governance and to Section 3.7 below.

**Definition of "the Organization".** The covered entity and any affiliated site operating
under the shared EMPI.

## 3. Policy statements

**P-1 — Mandatory identifier.** Every medical record shall be assigned a Medical Record
Number (MRN) at the moment of creation. No record may be saved, transmitted, or billed
without one. Null, blank, placeholder ("UNKNOWN", "TEMP", "0000000"), and
system-default identifiers are non-conformant except under the controlled unidentified-
patient procedure in P-6.

**P-2 — Uniqueness.** An MRN shall identify exactly one patient within its assigning
authority. The database shall enforce this with a `UNIQUE NOT NULL` constraint; the
constraint is the control, and the indicator in Section 4 is the verification that the
control held everywhere, including in systems the constraint does not reach.

**P-3 — Singularity.** A patient shall hold exactly one active MRN per assigning
authority. Additional identifiers discovered for the same person shall be merged or
linked through the EMPI, never left as parallel active records.

**P-4 — Permanence and non-reuse.** An MRN is permanent for the life of the record and
beyond. It shall never be reused for a different patient, including after death, record
purge, or account closure. Retired identifiers shall be retained in a tombstone table so
that reuse is detectable.

**P-5 — Format conformance.** MRNs shall conform to the registered format for their
assigning authority *(configurable; default: a fixed-length numeric string with a check
digit)*. Identifiers shall be opaque: they shall not encode name, date of birth, national
identification number, or any other clinical or demographic attribute.

**P-6 — Unidentified patients.** Where care must begin before identity is established
(trauma, unresponsive patient, mass-casualty intake), a temporary identifier shall be
issued from a reserved, clearly flagged range. Every temporary identifier shall be
reconciled to a permanent MRN within **24 hours** of identification. Open temporary
identifiers older than 24 hours are counted as defects by the indicator.

**P-7 — Cross-system integrity.** Records exchanged between systems shall carry both the
local identifier and its assigning authority, so that the pair (`assigning_authority`,
`identifier`) is globally unique. Interfaces shall reject inbound records lacking this
pair. This aligns with the HL7 FHIR `Patient.identifier` structure of `system` + `value`.

**P-8 — Merge and unmerge discipline.** Only trained HIM staff may merge or unmerge
records. Every merge shall record the surviving MRN, the retired MRN(s), the operator,
the timestamp, and the evidence used. Every merge shall be reversible.

**P-9 — Measurement.** Conformance to P-1 through P-8 shall be measured by indicator
DQI-001 on the cadence in Section 5. An unmeasured control is treated as a failed control.

## 4. Indicator specification — DQI-001

### 4.1 Header

| Attribute | Specification |
|---|---|
| Indicator ID | DQI-001 |
| Indicator name | Unique Identifier Integrity Index (UIII) |
| Data quality dimension | Uniqueness / identity integrity (DAMA-DMBOK dimension set) |
| Type | Composite percentage, derived from three component indicators |
| Unit | Percent (0.00–100.00), reported to two decimal places |
| Direction | Higher is better |
| Population | All active medical records in scope at the measurement instant |
| Exclusions | Records flagged as test/training data; records in the reserved temporary range that are less than 24 hours old |

### 4.2 Terminology

The three failure modes are distinct and are measured separately, because they carry
different clinical risk and different remediation:

| Term | Meaning | Risk |
|---|---|---|
| **Missing** | A record with no valid identifier | Record is unfindable; care delivered blind |
| **Overlay** | One MRN pointing at **more than one patient** | Highest — one patient's chart is read as another's |
| **Duplicate** | One patient holding **more than one active MRN** | Fragmented history; allergies and results are split across charts |
| **Overlap** | The same patient held under different MRNs in different assigning authorities | Managed by linkage, not merge; tracked separately |

### 4.3 Component indicators

Let the measurement population be `R` = all in-scope active records, and `P` = all distinct
patients represented in `R`.

**I-1 — Identifier Assignment Rate**

```
I-1 = ( | records in R with a non-null, format-conformant MRN | / |R| ) x 100
```

Measures P-1 and P-5. A record fails I-1 if the MRN is null, blank, a placeholder value,
fails the registered format or check digit, or is an unreconciled temporary identifier
older than 24 hours.

**I-2 — Overlay-Free Rate**

```
I-2 = ( 1 - ( | records whose MRN is shared by more than one distinct patient | / |R_id| ) ) x 100
```

where `R_id` is the subset of `R` holding an MRN. Measures P-2. Note that both sides of an
overlay count as defects: if one MRN maps to two patients, two records are defective.

**I-3 — Duplicate-Free Rate**

```
I-3 = ( | patients in P holding exactly one active MRN | / |P| ) x 100
```

Measures P-3. Patient identity for this calculation is resolved by the EMPI matching
algorithm at its configured auto-link confidence threshold; records in the manual review
queue are counted as duplicates until cleared, so that an unworked queue degrades the
score rather than hiding in it.

### 4.4 Composite

```
UIII = (0.25 x I-1) + (0.45 x I-2) + (0.30 x I-3)
```

Overlay carries the heaviest weight because it is the only failure mode that can place one
patient's clinical data in front of a clinician treating another. Weights are configurable
by the policy owner but shall keep `w(I-2)` as the largest term.

### 4.5 Worked example

A daily run over 1,000,000 active records covering 940,000 distinct patients finds:

- 1,200 records with no usable MRN (missing or malformed, so excluded from `R_id`) → I-1 = (998,800 / 1,000,000) × 100 = **99.88**
- 6 MRNs each shared by 2 patients → 12 defective records out of 998,800 → I-2 = (1 − 12/998,800) × 100 = **99.9988**
- 3,100 patients holding more than one active MRN → I-3 = (936,900 / 940,000) × 100 = **99.67**

```
UIII = (0.25 x 99.88) + (0.45 x 99.9988) + (0.30 x 99.67)
     = 24.9700 + 44.9995 + 29.9010
     = 99.87
```

UIII of 99.87 rates **Green** on the scale below — but the 6 overlays independently
trigger a Severity-1 response under Section 4.6. The composite never suppresses an
overlay finding.

### 4.6 Thresholds and rating

| Rating | UIII | Response |
|---|---|---|
| Green | ≥ 99.50 | Routine monitoring |
| Amber | 98.00 – 99.49 | Root-cause review within 5 business days; corrective plan to the Data Governance Committee |
| Red | < 98.00 | Escalation to the Chief Medical Information Officer within 24 hours; registration pathway review |

**Overriding rule — overlays.** The target for overlays is **zero**. Any confirmed
overlay is a Severity-1 patient-safety event regardless of the composite score: the
affected records are quarantined from clinical view within 1 hour of confirmation, the
attending clinicians and the Patient Safety Officer are notified, and a root-cause
analysis is filed within 5 business days.

**Secondary targets.** Duplicate rate `(100 − I-3)` shall not exceed **2.0%**, consistent
with widely used industry benchmarks for EMPI duplicate rates; the policy owner may
tighten this. Temporary identifiers unreconciled beyond 24 hours shall not exceed 0.1% of
records created in the period.

## 5. Measurement procedure

### 5.1 Cadence

| Layer | Control | Frequency |
|---|---|---|
| Preventive | `UNIQUE NOT NULL` constraint; check-digit validation at entry; duplicate-search prompt before new-record creation | Real time, at registration |
| Detective | Automated DQI-001 calculation over the clinical data warehouse | Daily, 02:00 local |
| Detective | Full cross-authority overlap scan | Weekly |
| Reporting | Indicator pack to the Data Governance Committee | Monthly |
| Assurance | Independent audit of the calculation logic and of a sample of merges | Annual |

### 5.2 Reference queries

The measurement job is the authoritative implementation; the queries below define its
intended semantics and are written in ANSI SQL against a conformed view
`medical_record (record_id, mrn, assigning_authority, patient_key, status, created_at, is_test)`.

Missing or malformed identifiers (I-1 defects):

```sql
SELECT COUNT(*) AS missing_or_malformed
FROM   medical_record
WHERE  status = 'ACTIVE'
  AND  is_test = FALSE
  AND (mrn IS NULL
       OR TRIM(mrn) = ''
       OR mrn IN ('UNKNOWN', 'TEMP', '0000000')
       OR mrn NOT SIMILAR TO '[0-9]{8}');   -- registered format; configurable
```

Overlays — one identifier, several patients (I-2 defects):

```sql
SELECT   assigning_authority,
         mrn,
         COUNT(DISTINCT patient_key) AS patients_sharing_mrn,
         COUNT(*)                    AS defective_records
FROM     medical_record
WHERE    status = 'ACTIVE' AND is_test = FALSE AND mrn IS NOT NULL
GROUP BY assigning_authority, mrn
HAVING   COUNT(DISTINCT patient_key) > 1
ORDER BY patients_sharing_mrn DESC;
```

Duplicates — one patient, several identifiers (I-3 defects):

```sql
SELECT   patient_key,
         COUNT(DISTINCT mrn) AS active_mrns
FROM     medical_record
WHERE    status = 'ACTIVE' AND is_test = FALSE AND mrn IS NOT NULL
GROUP BY patient_key
HAVING   COUNT(DISTINCT mrn) > 1;
```

Reuse of a retired identifier (P-4 breach; always Severity-1):

```sql
SELECT r.mrn, r.retired_at, r.retired_patient_key, m.patient_key AS reissued_to
FROM   retired_mrn r
JOIN   medical_record m
  ON   m.mrn = r.mrn
 AND   m.assigning_authority = r.assigning_authority
WHERE  m.patient_key <> r.retired_patient_key;
```

### 5.3 Evidence retention

Each run shall persist the component values, the composite, the population size, the
defect record keys, and the code version that produced them. Results are retained for
**7 years** *(configurable to the Organization's record-retention schedule)* so that the
indicator series is itself auditable.

## 6. Reporting

The monthly pack shall present:

- UIII as a **run chart** over at least 13 periods, with the Green/Amber threshold bands
  drawn on the chart. A single-period number invites over-reaction to noise; the series
  shows whether the process is stable.
- The three components as separate series — a flat composite can hide I-2 degrading while
  I-1 improves.
- Overlay count as an absolute count, never a percentage. Percentages of very small
  numbers read as zero and are how overlays get ignored.
- Defect volume by originating system and by registration point, to direct remediation at
  the source rather than at the symptom.

## 7. Roles and responsibilities

| Role | Responsibility |
|---|---|
| Data Governance Committee | Approves this policy, the thresholds, and the weights; reviews the monthly pack; adjudicates exceptions |
| Director, HIM (policy owner) | Owns the policy and the indicator definition; owns merge/unmerge procedure and staff training |
| Data Governance Lead / EMPI (technical owner) | Owns the measurement job, its correctness, and its scheduled execution; publishes the indicator |
| Registration and Patient Access | First line of prevention: duplicate search before record creation; correct capture of demographics |
| Application owners | Enforce the database constraint and interface validation in their system; remediate defects attributed to it |
| Patient Safety Officer | Co-leads the response to any overlay |
| Internal Audit | Annual independent verification of calculation logic and merge sampling |

## 8. Remediation

1. **Detect.** The daily job writes defects to the data-quality work queue, classified as
   missing, overlay, duplicate, overlap, or reuse.
2. **Triage.** Overlays and reuse are Severity-1 and jump the queue. Missing identifiers on
   records with clinical activity in the last 30 days are Severity-2. Everything else is
   Severity-3.
3. **Contain.** For an overlay, quarantine the affected records from clinical view within
   1 hour of confirmation and notify the treating clinicians.
4. **Correct.** HIM performs the merge, unmerge, or identifier assignment under P-8, with
   full audit trail.
5. **Verify.** The next scheduled run must show the defect cleared. Defects that reappear
   are escalated as a control failure, not re-worked as a new defect.
6. **Prevent.** Any Severity-1, and any Amber or Red period, requires a root-cause analysis
   naming the system or process that admitted the defect, and a dated corrective action.

## 9. Exceptions

Exceptions shall be requested in writing to the Data Governance Committee, shall state a
business justification, a compensating control, and an expiry date, and shall not exceed
12 months. No exception may be granted to P-2 (uniqueness) or P-4 (non-reuse). Approved
exceptions are recorded in the exception register and their affected records are still
counted as defects by DQI-001 — an exception permits the condition, it does not make the
measurement lie.

## 10. Non-compliance

Systems that cannot demonstrate conformance to P-1, P-2, and P-7 shall not be granted or
shall lose approval to exchange patient records across the interface engine. Repeated
individual non-compliance with the merge procedure in P-8 is handled under the
Organization's existing disciplinary and retraining process.

## 11. Definitions

| Term | Definition |
|---|---|
| **Assigning authority** | The organisation or system namespace responsible for issuing a given identifier; makes an identifier globally unique when paired with the identifier value |
| **Check digit** | A digit computed from the other digits of an identifier, used to detect transcription error at entry |
| **EMPI** | Enterprise Master Patient Index — the service that resolves records across systems to a single patient identity |
| **Medical record** | Any record holding patient-level clinical or administrative information about an identifiable individual |
| **MRN** | Medical Record Number — the primary identifier issued by an assigning authority |
| **Tombstone record** | A retained stub for a retired identifier, kept so that reuse is detectable |
| **UIII** | Unique Identifier Integrity Index — the composite indicator DQI-001 |

## 12. Informative references

These informed the policy; they are listed for orientation and are not a compliance
determination. Confirm current applicability with the compliance function.

- HIPAA Security Rule, integrity standard — 45 CFR § 164.312(c)(1)
- HIPAA Privacy Rule, amendment of protected health information — 45 CFR § 164.526
- The Joint Commission, National Patient Safety Goal on patient identification (NPSG.01.01.01)
- DAMA-DMBOK, data quality dimensions (uniqueness)
- ISO/IEC 25012, data quality model
- HL7 FHIR, `Patient.identifier` (`system` + `value`) and identifier use codes

## 13. Revision history

| Version | Date | Author | Change |
|---|---|---|---|
| 1.0 | 2026-09-22 | Data Governance | Initial policy and DQI-001 indicator specification |
