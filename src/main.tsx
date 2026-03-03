// ============================================================
// main.tsx — Application Entry Point
// This is the first JavaScript file that runs.
// It finds the #root div in index.html and mounts the React app inside it.
// ============================================================

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App"; // Root component that wraps the entire application
import "./app/styles/index.css"; // Global CSS styles applied to the whole app

// ReactDOM.createRoot: Creates a React root attached to the <div id="root"> in index.html
// .render(): Starts rendering the App component inside that div
// React.StrictMode: A development helper that warns about potential problems in the code
ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
