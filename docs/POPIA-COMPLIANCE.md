# NUSAF Platform - POPIA Compliance

## Overview

The Protection of Personal Information Act (POPIA) is South Africa's data protection law. This document outlines how the NUSAF Platform complies with POPIA requirements.

## POPIA Principles & Our Compliance

### 1. Accountability
**Requirement:** The responsible party must ensure compliance with POPIA.

**Our Approach:**
- Guido is the designated responsible party
- This document tracks compliance measures
- Regular compliance reviews scheduled

**Status:** IN PROGRESS

---

### 2. Processing Limitation
**Requirement:** Personal information must be processed lawfully and in a reasonable manner.

**Our Approach:**
- Only collect data necessary for business operations
- Document legal basis for each data type (see DATA-INVENTORY.md)
- Obtain consent where required

**Status:** PLANNED

---

### 3. Purpose Specification
**Requirement:** Personal information must be collected for a specific, explicitly defined purpose.

**Our Approach:**
- Each data field has documented purpose (see DATA-INVENTORY.md)
- Users informed of purpose at collection point
- Data not used for undisclosed purposes

**Status:** PLANNED

---

### 4. Further Processing Limitation
**Requirement:** Personal information not processed for secondary purposes incompatible with original purpose.

**Our Approach:**
- Secondary processing requires new consent
- Data sharing with third parties documented and consented

**Status:** PLANNED

---

### 5. Information Quality
**Requirement:** Personal information must be complete, accurate, and not misleading.

**Our Approach:**
- Users can view and update their information
- Regular data quality reviews
- Validation at data entry points

**Status:** PLANNED

---

### 6. Openness
**Requirement:** Data subjects must be aware that personal information is being collected.

**Our Approach:**
- Privacy policy displayed prominently
- Clear notification at data collection points
- Information about data processing available on request

**Status:** PLANNED

---

### 7. Security Safeguards
**Requirement:** Personal information must be protected against loss, damage, and unauthorized access.

**Our Approach:**
- Encryption in transit (HTTPS)
- Encryption at rest (database encryption)
- Access controls (role-based permissions)
- Secure authentication (hashed passwords)
- Regular security reviews

**Status:** PLANNED

---

### 8. Data Subject Participation
**Requirement:** Data subjects have the right to access, correct, and delete their personal information.

**Our Approach:**
- "My Data" section for users to view their data
- Data export functionality
- Data deletion/anonymization functionality
- Process for handling data requests

**Status:** PLANNED

---

## User Rights Implementation

| Right | Implementation | Location in System |
|-------|----------------|-------------------|
| Right to access | User can view all their data | *[TBD: /account/my-data]* |
| Right to correction | User can edit their information | *[TBD: /account/edit]* |
| Right to deletion | User can request account deletion | *[TBD: /account/delete]* |
| Right to data portability | User can export their data | *[TBD: /account/export]* |
| Right to object | User can opt out of processing | *[TBD: /account/privacy]* |

## Consent Management

### Types of Consent Required
| Activity | Consent Type | Required |
|----------|--------------|----------|
| Account creation | Explicit (checkbox) | Yes |
| Marketing emails | Explicit opt-in | No (optional) |
| Data sharing | Explicit | If applicable |

### Consent Records
- Consent timestamp recorded
- Consent version recorded
- Consent can be withdrawn at any time

## Data Retention

| Data Type | Retention Period | Basis |
|-----------|-----------------|-------|
| Active user accounts | Duration of relationship | Contract |
| Closed accounts | *[To be defined]* | Legal requirement |
| Logs | *[To be defined]* | Security |

## Breach Response Plan

### If a Data Breach Occurs:

1. **Contain** - Stop the breach immediately
2. **Assess** - Determine scope and impact
3. **Notify** - If significant:
   - Notify Information Regulator within 72 hours
   - Notify affected data subjects
4. **Document** - Record the incident
5. **Remediate** - Fix the vulnerability

### Contact Information
- Information Regulator: *[Contact details to be added]*
- Internal contact: Guido

## Compliance Checklist

### Documentation
- [ ] Privacy policy created
- [ ] Terms of service created
- [ ] Data inventory maintained (DATA-INVENTORY.md)
- [ ] Processing records maintained

### Technical Measures
- [ ] HTTPS enabled
- [ ] Password hashing implemented
- [ ] Access controls implemented
- [ ] Audit logging implemented
- [ ] Data encryption at rest

### User Features
- [ ] "My Data" view implemented
- [ ] Data export feature implemented
- [ ] Account deletion feature implemented
- [ ] Consent management implemented

### Organizational
- [ ] Staff awareness training
- [ ] Breach response procedures tested
- [ ] Regular compliance reviews scheduled

---

*This document should be reviewed and updated regularly. Last review: 2026-01-17*

*For detailed data inventory, see DATA-INVENTORY.md*
