// Cozy Creatures - Client Entry Point
//
// Mounts the React app to the DOM.
//
// Depends on: App.tsx
// Used by:    index.html

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
