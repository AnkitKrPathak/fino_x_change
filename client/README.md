# Fino X Change - Frontend

React frontend for the Fino X Change peer-to-peer lending platform.

## Tech Stack

- **React 19** with Vite 5
- **React Router** for navigation
- **CSS** (no external UI framework) - Custom dark theme with DM Sans font

## Setup

```bash
cd client
npm install
```

## Development

1. **Start the backend** (from project root):
   ```bash
   npm start
   ```
   Backend runs on `http://localhost:1335`

2. **Start the frontend**:
   ```bash
   npm run dev
   ```
   Frontend runs on `http://localhost:5173` and proxies API requests to the backend.

## Build

```bash
npm run build
```

Output goes to `dist/`. Serve with any static file server or configure your backend to serve the `dist` folder.

## Features

- **Authentication**: Register, Login, JWT-based sessions
- **Borrower**: Create/edit/cancel loan requests, view funded loans, make repayments, rate lenders
- **Lender**: Browse pending loans, fund via Razorpay, view funded/completed loans, rate borrowers
- **Repayments**: EMI schedule, repayment history, Razorpay checkout for payments

## Environment

The frontend proxies `/api` to `http://localhost:1335`. For production, update the proxy in `vite.config.js` or configure your server to handle API routing.
