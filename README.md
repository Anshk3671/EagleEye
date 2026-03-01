# EagleEye Logistics Tracking System

An Automated Web-Based Courier & Consignment Tracking System built with Node.js, Express, and SQLite.

## Table of Contents
- [Features](#features)
- [Requirements](#requirements)
- [Installation Setup](#installation-setup)
- [Running the Project](#running-the-project)
- [Repository Structure](#repository-structure)

## Features
- **Customer Portal**: Interactive UI for tracking and booking parcels using interactive maps (OpenStreetMap).
- **Admin Dashboard**: Web-based administration for managing hubs and sending broad-cast notifications.
- **Agent Mobile Interface**: Mobile-responsive web view for status updates and proof of delivery capture.
- **Robust Database**: SQLite integration to safely store AWB tracking records, hubs, users, and statuses. 

## Requirements
- Node.js (v18+)
- SQLite3 (included via node module)

## Installation Setup
Clone or download the repository to your local machine.

```bash
npm install
```

## Running the Project
Once dependencies are installed, you can launch the server using:

```bash
node server.js
```
The server will start at `http://localhost:3000`. 
Access the portal in any modern web browser.

## Repository Structure
- `server.js` - Main Express server entry point.
- `src/` - Backend application code (Controllers, Routes).
- `src/database/` - SQLite connection and schema definitions.
- `public/` - Static assets including CSS, JS, and Images for the frontend.
- `views/` - HTML views for the application.

---
*Developed by Team Eagle Eye (Ansh, Yash, Abeer).*
