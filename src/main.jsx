import React from "react";
import { hydrateRoot } from "react-dom/client";
import { App } from "./App.jsx";
import "./styles.css";
import "./studio-details.css";
import "./growth-features.css";
import "./visual-polish.css";
import "./mobile-experience.css";
import "./studio-front-page.css";

const root = document.getElementById("root");
const page = root.firstElementChild.innerHTML;
const language = document.documentElement.lang === "en" ? "en" : "cs";

hydrateRoot(root,
  <React.StrictMode>
    <App page={page} language={language} />
  </React.StrictMode>,
);
