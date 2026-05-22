import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Suspense
      fallback={
        <div className="w-full h-full flex justify-center items-center">
          Loading...
        </div>
      }
    >
      <App />
    </Suspense>
  </React.StrictMode>,
);
