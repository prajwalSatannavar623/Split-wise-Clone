# Infrastructure & Services Specification

This document outlines the core infrastructure configurations and third-party service integrations for the backend application. It details how the server interacts with external systems safely and reliably.

---

## 1. Database Configuration (`src/db/server.js`)

### Overview

This module handles the lifecycle of the MongoDB connection. It ensures the application establishes a robust link to the database upon startup and handles connection failures gracefully to prevent the application from running in an inconsistent state.

### Key Implementation Details

- **Async Connection Handling:** Utilizes an `async/await` pattern to ensure the database connection is fully established before the Express app starts listening for incoming requests.
- **Resilient Error Handling:** Implements a strict `try-catch` block. If the database connection fails, the process logs a descriptive error and executes `process.exit(1)`. This "fail-fast" approach is critical in cloud-native deployments (like Docker or PM2) to trigger automatic service restarts.
- **Environment Variable Security:** Decouples configuration from code by utilizing `process.env.MONOGO_DB_URL`, ensuring that sensitive database credentials remain externalized and secure.

### Design Rationale

- **Instance Logging:** By logging `connectionInstance.connection.host`, the system provides immediate console visibility into which database cluster the application is currently talking to—a vital debugging feature when switching between local development and production environments.

---

## 2. Cloudinary Asset Service (`src/services/cloudinary.service.js`)

### Service Overview

This service acts as the bridge between the backend and **Cloudinary’s CDN**. It is engineered for high availability, featuring built-in resiliency patterns to handle network instability and automated filesystem cleanup to maintain server health.

### Implementation Details

- **Resiliency & Retries:** Both the `uploadOnCloudinary` and `deletingOldCloudinaryImages` methods implement a retry loop (defaulting to 3 attempts with a 1-second delay). This minimizes the impact of transient network failures, ensuring a seamless user experience for file-intensive operations (like uploading avatars or group receipts).
- **Automated Lifecycle Management:** The service enforces a strict disk cleanup policy. By utilizing Node's `fs.unlinkSync`, it ensures that temporary local files (saved via Multer) are scrubbed from the server disk immediately after an upload attempt completes—regardless of whether the Cloudinary upload succeeded or reached the maximum retry limit.
- **Asset Optimization:** The `upload` method uses `resource_type: "auto"`, allowing the CDN to seamlessly detect and optimize images, documents, or media without requiring separate parsing logic on our server.

### Service Rationale

- **Memory and Disk Safety:** The logic explicitly verifies the existence of local files (`fs.existsSync`) before attempting to unlink them. This defensive programming prevents runtime exceptions in high-concurrency environments where a file might have already been removed.
- **Non-Blocking Execution:** By encapsulating these third-party I/O operations within asynchronous service methods, the application controllers remain non-blocking, ensuring the API stays fast even when waiting for CDN responses.
