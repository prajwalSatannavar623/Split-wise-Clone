# 💸 Split-wise Clone

A comprehensive full-stack web application designed to track shared expenses, balance group ledgers, and simplify settling up with friends. This repository contains both the client-side frontend and the server-side backend, working in tandem to deliver a seamless, high-performance financial tracking experience.

---

## 🏗️ Repository Structure

This project is organized into a monolithic repository (monorepo) structure, separating the client and server environments into distinct directories.

- **[`/client`](./client)**: Contains the Frontend React application.
- **[`/server`](./server)**: Contains the Backend Node.js/Express application.

---

## 🚀 Key Features

- **Secure Authentication:** Stateless session management utilizing HTTP-only JWTs, protected routing boundaries, and automated session hydration on the client.
- **Complex Expense Logic:** Supports dynamic split strategies, including EQUAL and PERCENTAGE-based shared expenses.
- **Group & Ledger Management:** Centralized tracking of group activities, individual balances, and transaction histories.
- **Resilient Media Handling:** Integrated with Cloudinary for robust profile and receipt image uploads, featuring automated server-side cleanups.
- **Responsive UI/UX:** A modern, mobile-friendly interface built with React 19 and Tailwind CSS v4.

---

## 🛠 Tech Stack Overview

### Frontend (Client)

- **Framework:** React 19 (via Vite 8)
- **State Management:** Redux Toolkit (`react-redux`)
- **Routing:** React Router DOM 7
- **Styling:** Tailwind CSS 4.3
- **HTTP Client:** Axios (configured with credentials for secure cookie transport)

### Backend (Server)

- **Runtime & Framework:** Node.js with Express.js
- **Database:** MongoDB & Mongoose (Object Data Modeling)
- **Security:** JWT, bcrypt
- **Asset Management:** Cloudinary API

---

## 🏁 Getting Started

To run the application locally, you will need to set up both the backend and frontend environments.

### 1. Prerequisites

- Node.js (v18+)
- MongoDB instance (Atlas or local)
- Cloudinary Account

### 2. Backend Setup

Navigate to the server directory to configure your database and spin up the API.

```bash
cd server
cp .env.sample .env # Add your MongoDB URI, JWT secrets, and Cloudinary keys
npm install
npm run start
```

```bash
cd client
# Create a .env file and add VITE_API_BASE_URL=http://localhost:3000/api/v1
npm install
npm run dev
```
