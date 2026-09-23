# MATPULSE React Frontend (SIH Problem Statement 26099)

> **AI-Powered Material Harmonization & Master Data Standardization across CPSEs**

---

## Overview

The MATPULSE frontend is an enterprise web interface providing:
- **Executive Harmonization Dashboard**: Visualizes cross-CPSE catalog statistics, matching distributions, category breakdowns, and AI match recommendation alerts.
- **Enterprise Sidebar Navigation**: Direct access to Dashboard, Materials, AI Matching, Review Queue, Common Materials, and Analytics.
- **Seamless FastAPI Integration**: Communicates via a central Axios client configured with environment variables (`VITE_API_BASE_URL`).

---

## Tech Stack

- **React 18**
- **Vite** (Next-generation frontend tooling & dev server)
- **Tailwind CSS** (Utility-first styling with custom dark enterprise theme)
- **React Router v6** (Client-side routing)
- **Recharts** (Interactive data visualization: bar charts, donut charts)
- **Lucide React** (Clean, professional enterprise icons)
- **Axios** (Centralized API client with interceptors)

---

## Getting Started

### 1. Install Dependencies

```powershell
cd frontend
npm install
```

### 2. Configure Environment

Ensure `.env` contains the backend API base URL:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### 3. Start Development Server

```powershell
npm run dev
```

The frontend will run at `http://localhost:5173`.

### 4. Build for Production

```powershell
npm run build
```

---

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── StatCard.jsx         # Metric card with loading skeleton & badges
│   │   └── StatusBadge.jsx      # Harmonization status indicator
│   ├── layouts/
│   │   └── MainLayout.jsx       # Sidebar navigation & top bar
│   ├── pages/
│   │   ├── Dashboard.jsx        # Executive KPIs, charts & live AI queue
│   │   └── PlaceholderPage.jsx  # Polished views for upcoming modules
│   ├── services/
│   │   ├── api.js               # Central Axios client
│   │   ├── materialService.js   # Master catalog & stats queries
│   │   └── matchingService.js   # Review queue & matching actions
│   ├── App.jsx                  # React Router routes definition
│   ├── index.css                # Tailwind directives & dark theme styling
│   └── main.jsx                 # App root mount
├── .env                         # Local environment variables
├── .env.example                 # Example environment template
├── index.html                   # HTML template with Google Fonts
├── package.json                 # Dependencies & scripts
├── tailwind.config.js           # Tailwind theme configuration
└── vite.config.js               # Vite config & API proxy
```
