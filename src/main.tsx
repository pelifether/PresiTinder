import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { BUNDLE } from "./lib/experiment";
import "./styles.css";

// Theme arm applied before first paint so there is no color flash.
document.documentElement.dataset.theme = BUNDLE.id;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
