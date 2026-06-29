# Split-wise Clone - Backend Service

📊 The core API and data layer for the Split-wise clone, responsible for tracking shared expenses, balancing group debts, and settling up.

A high-performance backend built with Node.js, Express, and MongoDB.

## 🚀 Key Features

- **Secure Auth:** JWT-based stateless authentication with `bcrypt` encryption.
- **Scalable Architecture:** Modular codebase with centralized data modeling.
- **Complex Financial Logic:** Supports EQUAL and PERCENTAGE-based split strategies.
- **Resilient File Handling:** Third-party Cloudinary integration with automated retry logic and server-side disk cleanup.

## 📚 Technical Documentation

Our documentation is structured to provide both a bird's-eye view of the system architecture and granular details for individual components.

- **[Data Modeling](./docs/data-modeling.md)**: Detailed schema designs, relationship mappings, and indexing strategies.
- **[API Documentation](./docs/api-docs.md)**: End-to-end endpoint specifications and request/response samples.
- **[Infrastructure](./docs/infrastructure.md)**: Database connection lifecycles, environment configurations, and external service (Cloudinary) logic.

## 🏗️ System Workflow

The application follows a clean, modular **Service-Controller-Route** pattern, ensuring separation of concerns and maintainability.

### The Request Lifecycle

1. **Middleware Layer:** Security and formatting (CORS, JSON, cookie-parser).
2. **Route Layer (`/routes`):** Traffic controller directing requests to the correct logic.
3. **Controller Layer (`/controllers`):** Orchestrates business logic and standardizes API responses.
4. **Service/Utility Layer (`/utils`, `/services`):** Handles authentication, file management, and database transactions.
5. **Global Error Handler:** Ensures consistent JSON error responses, preventing server crashes.

## 🗄️ Database Architecture

This project utilizes **MongoDB** to handle complex, relational-style data through an object-oriented modeling approach.

- **NoSQL Flexibility:** Efficiently handles nested split logic and transaction histories.
- **Referential Integrity:** Uses Mongoose to manage relations between `Users`, `Groups`, and `Expenses`.
- **Security-First Design:** Sensitive data protected via `bcrypt` hashing and stateless JWT-based session management.

## 🛠 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB & Mongoose
- **Security:** JWT, bcrypt
- **Cloud/Assets:** Cloudinary

## 🛠 Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB instance (Atlas or local)
- Cloudinary Account

### Installation & Local Setup

1. **Navigate to the backend directory:**

   ```bash
   cd server
   ```

2. **Configure Environment Variables:
   Duplicate the .env.sample file, rename it to .env, and populate it with your configuration and secrets.**

   ```bash
   cp .env.sample .env
   ```

3. **Install Dependencies:**

   ```bash
   npm install
   ```

4. **Start the Server:**

   ```bash
   npm run start
   ```
