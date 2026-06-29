# API Documentation

**Base URL:** `/api/v1`

## Authentication Overview

This API utilizes a dual-token (Access/Refresh) JWT system.

- **Access Tokens** are short-lived and must be sent via cookies or the `Authorization: Bearer <token>` header.
- **Refresh Tokens** are long-lived, stored securely in HTTP-only cookies, and used to generate new access tokens.

All responses follow a standardized JSON wrapper:
\`\`\`json
{
"statusCode": 200,
"data": { ... },
"message": "Success message here",
"success": true
}
\`\`\`

---

## 1. Authentication Routes

### Register User

- **URL:** `/users/auth/register`
- **Method:** `POST`
- **Auth Required:** No
- **Content-Type:** `multipart/form-data`
- **Request Body:**
  - `fullName` (String, required)
  - `userName` (String, required, unique)
  - `email` (String, required, unique)
  - `password` (String, required)
  - `avatar` (File, required) - Image file for Cloudinary upload.

### Login User

- **URL:** `/users/auth/login`
- **Method:** `POST`
- **Auth Required:** No
- **Content-Type:** `application/json`
- **Request Body:**
  \`\`\`json
  {
  "email": "john@example.com",
  "password": "securepassword123"
  }
  \`\`\`
- **Success Response (200 OK):**
  _Note: Sets `accessToken` and `refreshToken` securely in cookies._
  \`\`\`json
  {
  "statusCode": 200,
  "data": {
  "user": {
  "\_id": "60d0fe4f5311236168a109ca",
  "userName": "johndoe",
  "email": "john@example.com",
  "avatar": "https://res.cloudinary.com/..."
  }
  },
  "message": "User logged in successfully..."
  }
  \`\`\`

---

## 2. User Profile (Self)

### Get Current User

- **URL:** `/users/me`
- **Method:** `GET`
- **Auth Required:** Yes (JWT)
- **Description:** Retrieves the logged-in user's profile, populated with their associated `groupsIn` and `favGroups`.

### Get My Friends (Aggregation)

- **URL:** `/users/me/friends`
- **Method:** `GET`
- **Auth Required:** Yes (JWT)
- **Description:** Leverages a complex MongoDB aggregation pipeline (`$unwind`, `$group`, `$lookup`) to extract a unique list of friends derived from all shared groups.
- **Success Response:**
  \`\`\`json
  {
  "statusCode": 200,
  "data": [
  {
  "_id": "60d0fe4f5311236168a109cb",
  "fullName": "Jane Smith",
  "userName": "janesmith",
  "avatar": "https://..."
  }
  ],
  "message": "Friends list fetched successfully"
  }
  \`\`\`

### Get My Group Balances

- **URL:** `/users/me/groups`
- **Method:** `GET`
- **Auth Required:** Yes (JWT)
- **Description:** Returns an aggregated financial summary (total owed vs. total owe) for every group the user is a part of.

---

## 3. User Interactions

### Get Other User Profile & Settlement History

- **URL:** `/users/:userId`
- **Method:** `GET`
- **Auth Required:** Yes (JWT)
- **Description:** Fetches another user's basic profile and dynamically calculates the ongoing financial transaction history (who owes whom) between the logged-in user and the requested user across all mutual groups.
- **Success Response:**
  \`\`\`json
  {
  "statusCode": 200,
  "data": {
  "userInfo": {
  "fullName": "Jane Smith",
  "userName": "janesmith"
  },
  "transactionHistory": [
  {
  "position": "owe",
  "amount": 45.50,
  "group": "Goa Trip",
  "groupId": "60d0fe4f5311236168a109cc"
  }
  ]
  },
  "message": "User data fetched successfully"
  }
  \`\`\`

### Search Users

- **URL:** `/users/search?q={query}&limit={limit}`
- **Method:** `GET`
- **Auth Required:** Yes (JWT)
- **Description:** Performs a regex-based, case-insensitive search across user `fullName` and `userName` fields.

## 4. Expense Management & Splitting Logic

The expense module is the core engine of the application. It utilizes **MongoDB Transactions (ACID)** to ensure that creating an expense and updating the group's running balances either succeed together or fail together, preventing corrupted financial states.

### Create Expense (The Split Engine)

- **URL:** `/expenses/:groupId`
- **Method:** `POST`
- **Auth Required:** Yes (JWT) + `verifyMembership`
- **Description:** Records a new transaction and automatically calculates/updates the net balances for all group members based on the provided split strategy.
- **Request Body:**
  \`\`\`json
  {
  "description": "Dinner at Taj",
  "amount": 2500,
  "paidBy": "60d0fe4f5311236168a109ca",
  "category": "FOOD AND DRINKS",
  "splitStrategy": "PERCENTAGE",
  "splitInfo": [
  {
  "userId": "60d0fe4f5311236168a109ca",
  "percentage": 60
  },
  {
  "userId": "60d0fe4f5311236168a109cb",
  "percentage": 40
  }
  ]
  }
  \`\`\`
- **Note on Architecture:** If `splitStrategy` is `"EQUAL"`, the `splitInfo` array can be omitted; the backend utility functions dynamically fetch group members and calculate exact shares to prevent floating-point rounding errors.

### Get My Expenses (Filtered)

- **URL:** `/expenses/user/me?type=owed&limit=10`
- **Method:** `GET`
- **Auth Required:** Yes (JWT)
- **Description:** A highly flexible query endpoint that fetches expenses involving the current user. Supports filtering by `type` (paid vs. owed), `groupId`, and date ranges.

---

## 5. Group Management & Settlement Tracking

Groups serve as the namespace for expenses. These routes enforce strict **Role-Based Access Control (RBAC)** to ensure only authorized admins can mutate group structures.

### Get Group Ledger & Details

- **URL:** `/groups/:groupId`
- **Method:** `GET`
- **Auth Required:** Yes (JWT) + `verifyMembership`
- **Description:** Deeply populates the group document, returning member details, a sorted history of expenses, and the current `balances` array (who owes whom).
- **Success Response (200 OK):**
  \`\`\`json
  {
  "statusCode": 200,
  "data": {
  "\_id": "60d0fe4f5311236168a109cc",
  "name": "Goa Trip 2026",
  "balances": [
  {
  "from": { "_id": "...", "fullName": "Jane" },
  "to": { "_id": "...", "fullName": "John" },
  "amount": 1250.00
  }
  ]
  },
  "message": "Group details fetched successfully"
  }
  \`\`\`

### Add Member to Group

- **URL:** `/groups/:groupId/add-member`
- **Method:** `POST`
- **Auth Required:** Yes (JWT) + `verifyGroupAdmin`
- **Description:** Adds a user to a group. Protected by the `verifyGroupAdmin` middleware to prevent unauthorized users from tampering with group membership. Safely updates both the `Group.members` array and the `User.groupsIn` array in a single flow.

### Delete Group (With Safeguards)

- **URL:** `/groups/:groupId`
- **Method:** `DELETE`
- **Auth Required:** Yes (JWT) + `verifyGroupAdmin`
- **Description:** Deletes a group and cleans up references in user documents.
- **Architectural Safeguard:** Implements pre-deletion validation. The controller iterates through the `balances` array and blocks the deletion (returning `400 Bad Request`) if there are any unsettled debts > 0, ensuring financial data is not orphaned.

---

_Note: Additional standard CRUD endpoints exist for updating expenses, exiting groups, and searching, but are omitted here for brevity._

## 🛡️ Security & Middleware Pipeline

To ensure data integrity and proper authorization, all protected routes pass through a custom middleware pipeline before hitting the controller logic.

### 1. Authentication (`verifyToken`)

- **Mechanism:** Extracts the JWT from secure HTTP-only cookies or the `Authorization` header.
- **Validation:** Verifies the token signature and cross-references the decoded `_id` against the database to ensure the user still exists and is active.
- **Context Injection:** Attaches the sanitized user object (`req.user`) to the request for downstream controllers.

### 2. Role-Based Access Control (RBAC)

For group-specific actions, the API implements strict hierarchical access control:

- **`verifyMembership`:** Ensures the requesting user is part of the `members` array for the target group before allowing read/write operations (e.g., viewing expenses).
- **`verifyGroupAdmin`:** A higher-tier check that restricts sensitive actions (like modifying group details or removing members) exclusively to the group's creator/admin.

### 3. File Processing (`upload`)

- **Mechanism:** Utilizes `multer` for multipart/form-data parsing.
- **Handling:** Safely buffers incoming media (like avatars or receipt images) to a local `/public/temp` directory with randomized, collision-resistant filenames before they are processed and offloaded to the Cloudinary CDN.
