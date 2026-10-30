import "@fontsource-variable/archivo";
import "@fontsource-variable/noto-sans-sc";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PracticePreview } from "./PracticePreview";
import "@/styles/global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode><PracticePreview /></StrictMode>,
);
