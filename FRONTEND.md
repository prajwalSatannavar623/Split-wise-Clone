# Split-wise Clone - Frontend Application

📊 The client-side application for the Split-wise clone, providing a responsive, intuitive interface for managing shared expenses, group ledgers, and friend settlements.

Built for high performance using **React 19**, **Vite**, and **Tailwind CSS v4**.

## 🚀 Key Features

- **Centralized State Management:** Utilizes Redux Toolkit for predictable, globally accessible user session and UI state.
- **Protected Routing Architecture:** Deeply nested, authenticated routes using `react-router-dom` v7 to ensure secure access to financial dashboards.
- **Persistent Sessions:** On-mount authentication hydration prevents UI flickering and unauthorized redirects upon hard browser refreshes.
- **Modular UI:** Clean separation of concern between reusable presentational components and complex page-level layouts.

## 🛠 Tech Stack

- **Framework:** React 19
- **Build Tool:** Vite 8
- **Styling:** Tailwind CSS 4.3
- **State Management:** Redux Toolkit (`react-redux`)
- **Routing:** React Router DOM 7
- **HTTP Client:** Axios

---

### 🏗️ Application Architecture

The codebase strictly follows a domain-driven folder structure to maintain scalability as the application grows.

| Directory                | Purpose                                                       |
| :----------------------- | :------------------------------------------------------------ |
| 📂 **`src/api/`**        | 🔌 Configured Axios instances (interceptors, base URLs)       |
| 📂 **`src/assets/`**     | 🖼️ Static media (images, icons, svgs)                         |
| 📂 **`src/components/`** | 🧩 Reusable, stateless UI building blocks (`Button`, `Input`) |
| 📂 **`src/features/`**   | 🧠 Redux logic organized by feature (`authSlice.js`)          |
| 📂 **`src/pages/`**      | 📄 Route-level components mapping to specific URLs            |
| ↳ 📂 **`Dashboard/`**    | 📊 Nested dashboard views (`Groups`, `Activity`, `Expenses`)  |
| 📂 **`src/store/`**      | 📦 Central Redux store configuration                          |

---

## 🛣️ Routing & Authentication Flow

The application employs a robust routing strategy using `createBrowserRouter` to handle complex nested layouts and authorization boundaries.

### 1. The Authentication Boundary (`<ProtectedRoute />`)

All dashboard routes are wrapped within a `<ProtectedRoute />` component. This component acts as a gatekeeper, intercepting unauthenticated users and seamlessly redirecting them to the `/login` view before rendering sensitive financial data.

### 2. Session Hydration (The App Shell)

To handle browser refreshes seamlessly, the root `<App />` component stalls the router rendering until it verifies the user's session:

1. **Mount:** Application triggers an invisible `/users/me` API call.
2. **Hydrate:** Upon success, Redux (`authSlice`) is hydrated with the user's persistent data.
3. **Render:** The `isInitializing` lock is released, and the `RouterProvider` renders the correct protected layout without jarring redirects.

### 3. Nested Dashboard Layout

The `/dashboard` route serves as a persistent layout wrapper (containing the navigation/sidebar). Child routes (e.g., `/dashboard/groups/:groupId`) are injected into the dashboard's outlet, ensuring smooth transitions between views without full-page reloads.

---

## 🧠 State & Network Configuration

The application maintains a strict separation of concerns between UI rendering, global state management, and network communication.

### 1. Global Authentication State (`src/features/authSlice.js`)

The application utilizes **Redux Toolkit (RTK)** to manage the global authentication session, ensuring that deeply nested dashboard components always have synchronous access to the user's profile and authorization status without prop-drilling.

- **Immutable State Updates:** Uses RTK's built-in Immer library under the hood, allowing predictable state mutations (e.g., `state.isAuthenticated = true`).
- **Action Encapsulation:** The `setCredentials` and `logout` reducers act as the single source of truth for transitioning the app between authenticated and unauthenticated states, keeping UI components purely presentational.

### 2. Centralized HTTP Client (`src/api/axios.js`)

Instead of calling `axios` directly within components, all external communication is routed through a pre-configured Axios instance.

- **Environment Decoupling:** Base URLs are injected via Vite environment variables (`import.meta.env`), allowing seamless transitions between local development and production deployments.
- **Secure Credential Transport:** Crucially configured with `withCredentials: true`. This instructs the browser to automatically attach the secure, HTTP-only JWT cookies (Access and Refresh tokens) to every outgoing cross-origin request, aligning perfectly with the backend's stateless authentication architecture.

---

## 🛠 Getting Started (Local Development)

### Prerequisites

- Node.js (v18+)
- Backend server running locally (See `BACKEND.md`)

### Installation

1. **Navigate to the client directory:**

   ```bash
   cd client
   ```

2. **Configure Environment Variables:
   Create a .env file in the root of the client directory and specify your backend URL.**
   `bash
VITE_API_BASE_URL=http://localhost:3000/api/v1 or frontend ip address
`

3. **Install Dependencies:**

   ```bash
   npm install
   ```

4. **Start the Development Server:**

   ```bash
   npm run dev
   ```
