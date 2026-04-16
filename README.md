# EagleEye Logistics Management System

A modern, multi-page web application for logistics and shipment tracking management, built with React, TypeScript, and Tailwind CSS.

## Features

### 🏠 Home Page
- Hero section with animated logistics visuals
- Service categories (Personal Courier, E-Commerce, Bulk Shipping)
- Live network statistics
- Company overview and trust indicators

### 📦 Track Consignment
- Real-time shipment tracking search
- Shipment status cards with delivery information
- End-to-end insurance information
- 24/7 global support details

### 🚀 Ship Now (Client Portal)
- Interactive shipment booking flow
- Pickup & delivery location entry
- Rate calculator with service tiers
- Payment integration UI
- Delivery tracking

### 🎛️ Admin Dashboard (Network Command Center)
- Real-time fleet orchestration
- Active shipments monitoring
- Hub utilization metrics
- Registered agents tracking
- Shipping volume analytics
- System alerts and notifications
- Top performing agents leaderboard

### 📦 Agent Dashboard
- Daily route overview
- Assignment management
- Priority task highlighting
- Proof of delivery (POD) interface
- Delivery status tracking

### 🏢 Hub Management
- Global hub oversight
- Capacity monitoring (Mumbai, Delhi, Bangalore, Singapore, Dubai hubs)
- Active agent tracking per hub
- Hub performance metrics
- Agent registration & new hub provisioning

### 🌐 Network Map
- Interactive India map with hub locations
- Route visualization between hubs
- Real-time hub status indicators

### 📋 Shipment Details
- Complete tracking history timeline
- Route insights with map visualization
- Parcel specifications & service level details
- Download invoice / share tracking

### 💬 Support Pages
- Customer Care with contact options
- FAQs with searchable accordion
- Locate Us with branch finder
- Service Guide with detailed documentation

### 👤 Account
- Order History with filtering
- Notifications center

## Navigation Structure

```
/                          → Home Page
/track                     → Track Consignment
/client                    → Ship Now (Client Portal)
/admin                     → Admin Dashboard
/agent                     → Agent Dashboard
/hubs                      → Hub Management
/network                   → Network Map
/shipments/:id             → Shipment Details
/support/customer-care     → Customer Care
/support/faqs              → FAQs
/support/locate-us         → Locate Us
/support/service-guide     → Service Guide
/account/orders            → Order History
/account/notifications     → Notifications
```

## Tech Stack

- **React** 18.3.1 — UI framework
- **TypeScript** — Type safety
- **React Router** 7.x — Client-side routing
- **Tailwind CSS** 4.x — Styling
- **Vite** 6.x — Build tool & dev server
- **Radix UI** — Accessible component primitives
- **Recharts** — Data visualization charts
- **Leaflet / MapLibre GL** — Interactive maps
- **Framer Motion** — Animations
- **Prisma + Express** — Backend API (in `server/`)

## Getting Started

### Frontend

```bash
npm install
npm run dev
```

### Backend (optional — for live API data)

```bash
cd server
npm run setup    # Install deps, generate Prisma client, seed DB
npm run dev      # Start API server on port 3001
```

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
EagleEye2/
├── public/images/          # Static assets (hero images, service images)
├── src/
│   ├── main.tsx            # Application entry point
│   └── app/
│       ├── App.tsx         # Root component with router
│       ├── routes.tsx      # All route definitions
│       ├── components/     # Shared components (Header, RootLayout, UI library)
│       ├── hooks/          # Custom React hooks
│       ├── lib/            # API client, data utilities, map data
│       ├── map/            # Network map components (IndiaMap, layers)
│       ├── pages/          # All page components
│       └── styles/         # CSS (Tailwind, theme, fonts)
├── server/                 # Express + Prisma backend
│   ├── src/                # API routes
│   └── prisma/             # Schema & seed data
├── index.html              # HTML entry point
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies & scripts
```

## Design System

### Colors
- **Primary Blue**: `#0058BE` — CTAs and primary actions
- **Dark Navy**: `#131B2E` — Hero sections and emphasis
- **Light Gray**: `#F8F9FF` — Background
- **Text Primary**: `#0B1C30` — Headings
- **Text Secondary**: `#45464D` — Body text

### Typography
- **Display**: Manrope Extra Bold — Hero headings
- **Headings**: Manrope Bold — Section titles
- **Body**: Inter Regular — Content
- **Labels**: Inter Semi Bold — UI elements

### Features
- 🌗 Light / Dark mode support
- 📱 Responsive design
- ✨ Smooth animations and micro-interactions
- 🗺️ Interactive map visualizations

## Sample Tracking Numbers

- `EE-742-9910` — In Transit (with delay)
- `EE-8829-0012` — Urgent Priority
- `EE-9041-5521` — Standard
- `EE-7762-1109` — Standard
