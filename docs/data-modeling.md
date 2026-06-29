# Data Modeling Specification

This document details the schema design and architectural decisions for the application's MongoDB-based data layer.

## Overview

The data layer is built with **Mongoose** to enforce schema validation and encapsulate security logic. Design patterns prioritize data integrity, security-first authentication, and query performance.

---

## 1. User Model (`User`)

### User Entity Overview

The central identity and authentication entity. Manages credentials, profile metadata, and subscription tiers.

### User Schema Definitions

| Field      | Type       | Attributes       | Description                        |
| :--------- | :--------- | :--------------- | :--------------------------------- |
| `userName` | String     | Unique, Required | Normalized handle for routing.     |
| `email`    | String     | Unique, Required | Primary authentication key.        |
| `password` | String     | Required         | Encrypted via `bcrypt`.            |
| `groupsIn` | [ObjectId] | Ref: Group       | Many-to-many relationship mapping. |

### Security & Optimization

- **Middleware Hooks:** Utilizes `pre("save")` hooks for automatic `bcrypt` password hashing.
- **Stateless Auth:** Implements dual JWT architecture (Access/Refresh tokens) via model instance methods.
- **Indexing:** Unique indexes enforced on `userName` and `email` for $O(\log n)$ lookup performance.

---

## 2. Expense Model (`Expense`)

### Expense Entity Overview

The `Expense` model tracks individual financial transactions within a group. It is designed to handle complex cost-sharing scenarios, moving beyond simple equality to support percentage-based and custom split strategies.

### Expense Schema Definitions

| Field           | Type     | Attributes              | Description                                   |
| :-------------- | :------- | :---------------------- | :-------------------------------------------- |
| `category`      | String   | Enum, Default: OTHER    | Categorization for analytical insights.       |
| `amount`        | Number   | Required, min: 0        | Total cost of the transaction.                |
| `paidBy`        | ObjectId | Ref: User               | The user who covered the initial cost.        |
| `group`         | ObjectId | Ref: Group              | The shared namespace for the expense.         |
| `splitStrategy` | String   | Enum: EQUAL, PERCENTAGE | Algorithm for cost distribution.              |
| `splitInfo`     | [Object] | Required                | Array of participant-specific breakdown data. |

### Key Architectural Decisions

- **Dynamic Split Strategy:** The `splitStrategy` enum coupled with the `splitInfo` array allows for flexible business logic (equal vs. proportional splits) without schema migration.
- **Data Integrity:** `min: 0` validators prevent invalid financial states at the database level.
- **Analytical Readiness:** The structured `category` field enables high-performance querying for user-facing spending reports.

---

## 3. Group Model (`Group`)

### Group Entity Overview

The `Group` model serves as the central container for collaborative financial activities. It manages membership, administrative control, and the aggregated financial state (balances) of all participants within a specific shared context.

### Group Schema Definitions

| Field      | Type       | Attributes     | Description                                    |
| :--------- | :--------- | :------------- | :--------------------------------------------- |
| `name`     | String     | Required, Trim | Display name of the group.                     |
| `members`  | [ObjectId] | Ref: User      | List of participating users.                   |
| `admin`    | ObjectId   | Ref: User      | The user with group management privileges.     |
| `balances` | [Object]   | Array          | Current net settlement status between members. |
| `expenses` | [ObjectId] | Ref: Expense   | History of all transactions within the group.  |

### Key Architectural Decisions

- **Centralized Settlement Tracking:** The `balances` array maintains a running ledger of who owes whom, facilitating rapid "who owes what" calculations without needing to compute the entire transaction history from scratch.
- **Administrative Hierarchy:** The `admin` field explicitly defines authorization boundaries, ensuring only authorized users can modify group settings or add/remove members.
- **Aggregated Relationships:** By referencing `Expense` documents, the model allows for efficient retrieval of a group's entire financial timeline in a single populate call.

### Design Rationale & Optimization

- **Query Efficiency:** Storing an array of `expenses` ObjectIds allows for optimized pagination when loading a group's transaction feed, essential for long-running groups with hundreds of entries.
- **Normalization vs. Performance:** While the `balances` array introduces a risk of "de-normalization" (as it must be kept in sync with individual `Expense` records), it provides high read performance for dashboard views, significantly reducing computational overhead during group settlement checks.

---

## 4. Settlement Model (`Settlement`)

### Settlement Entity Overview

The `Settlement` model represents the finalization of debt between two users within a group. Unlike an `Expense`, which records a shared cost, a `Settlement` records a specific payment action taken to resolve outstanding balances.

### Settlement Schema Definitions

| Field         | Type     | Attributes           | Description                                    |
| :------------ | :------- | :------------------- | :--------------------------------------------- |
| `group`       | ObjectId | Ref: Group, Required | The group context where the settlement occurs. |
| `from`        | ObjectId | Ref: User, Required  | The payer (the person reducing their debt).    |
| `to`          | ObjectId | Ref: User, Required  | The payee (the person receiving the payment).  |
| `amount`      | Number   | Required             | The monetary value of the settlement.          |
| `description` | String   | Default: 'Payment'   | Contextual metadata for the transaction.       |

### Key Architectural Decisions

- **Separation of Concerns:** By decoupling `Settlement` from `Expense`, you maintain a cleaner financial audit trail. This prevents the primary ledger from becoming cluttered with transactional settlement data, allowing for independent reporting of "debts created" vs. "debts resolved."
- **Auditability:** Every settlement is timestamped via Mongoose `timestamps`, enabling the reconstruction of a user’s debt resolution history over time—a critical feature for transparency in shared-expense applications.
- **Integrity:** The `from` and `to` references enforce strict validation, ensuring that settlements are always linked to valid, existing user entities.

### Design Rationale & Optimization

- **Simplified Ledger Logic:** Keeping `Settlement` as a standalone document allows the application to query all settlements for a specific `Group` efficiently, simplifying the calculation of current net balances by providing a clear subtraction of "Total Paid - Total Settled."

---
