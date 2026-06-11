import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { setupGlobalErrorHandling } from "./utils/errorHandler";

// Initialise global error handling first
setupGlobalErrorHandling();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
