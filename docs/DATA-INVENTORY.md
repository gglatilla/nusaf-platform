# NUSAF Platform - Data Inventory

## Overview

This document tracks all personal information collected by the NUSAF Platform, including the purpose, legal basis, and retention period for each data type.

## Data Categories

### User Account Data

| Field | Purpose | Legal Basis | Retention | Sensitive |
|-------|---------|-------------|-----------|-----------|
| Email address | Account identification, login, communication | Contract | Account lifetime + *[TBD]* | No |
| Password (hashed) | Authentication | Contract | Account lifetime | Yes |
| Full name | Display, identification | Contract | Account lifetime + *[TBD]* | No |
| Phone number | Contact, optional 2FA | Consent | Until withdrawn | No |
| *[Add more as defined]* | | | | |

### Employee Data
*[To be defined based on system requirements]*

| Field | Purpose | Legal Basis | Retention | Sensitive |
|-------|---------|-------------|-----------|-----------|
| *[Field]* | *[Purpose]* | *[Basis]* | *[Period]* | *[Yes/No]* |

### Customer Data
*[To be defined based on system requirements]*

| Field | Purpose | Legal Basis | Retention | Sensitive |
|-------|---------|-------------|-----------|-----------|
| *[Field]* | *[Purpose]* | *[Basis]* | *[Period]* | *[Yes/No]* |

### Transaction Data
*[To be defined based on system requirements]*

| Field | Purpose | Legal Basis | Retention | Sensitive |
|-------|---------|-------------|-----------|-----------|
| *[Field]* | *[Purpose]* | *[Basis]* | *[Period]* | *[Yes/No]* |

## System/Technical Data

| Field | Purpose | Legal Basis | Retention | Sensitive |
|-------|---------|-------------|-----------|-----------|
| IP address | Security, logging | Legitimate interest | *[TBD]* | No |
| Login timestamps | Security, audit trail | Legitimate interest | *[TBD]* | No |
| User agent | Debugging, security | Legitimate interest | *[TBD]* | No |
| Session tokens | Authentication | Contract | Session duration | No |

## Special Categories of Data

**POPIA defines special personal information that requires additional protection:**
- Religious or philosophical beliefs
- Race or ethnic origin
- Trade union membership
- Political opinions
- Health or sex life
- Biometric information
- Criminal behavior

**Current status:** The NUSAF Platform does NOT collect special categories of data.

*If this changes, update this document and implement additional safeguards.*

## Data Flows

### Internal Data Flows

```
User Input → Frontend → API → Backend → Database
                                  ↓
                            Audit Logs
```

### External Data Flows

| Recipient | Data Shared | Purpose | Legal Basis |
|-----------|-------------|---------|-------------|
| *[None currently]* | - | - | - |

*Update this table if data is shared with third parties.*

## Data Minimization Review

Last reviewed: 2026-01-17

| Question | Answer |
|----------|--------|
| Is all collected data necessary? | *[To be verified]* |
| Can any fields be removed? | *[To be verified]* |
| Is data being retained longer than needed? | *[To be verified]* |

## Access Controls

### Who Can Access What

| Role | User Data | Employee Data | Customer Data | Admin Data |
|------|-----------|---------------|---------------|------------|
| Admin | Full | Full | Full | Full |
| Employee | Own only | *[TBD]* | *[TBD]* | None |
| Customer | Own only | None | Own only | None |

## Encryption Status

| Data Type | In Transit | At Rest |
|-----------|------------|---------|
| Passwords | HTTPS | bcrypt hash |
| Personal data | HTTPS | *[TBD]* |
| Financial data | HTTPS | *[TBD - if applicable]* |

## Data Subject Requests Log

*Track requests from data subjects here*

| Date | Requester | Request Type | Status | Completed |
|------|-----------|--------------|--------|-----------|
| - | - | - | - | - |

---

*This document must be updated whenever:*
- *New data fields are added*
- *Data purposes change*
- *New data flows are established*
- *Retention periods change*

*Last updated: 2026-01-17*
