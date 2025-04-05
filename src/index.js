import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.js"; // Add .js extension
import reportWebVitals from "./reportWebVitals.js"; // Add .js extension
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
