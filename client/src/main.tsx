import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { installApiBase } from "./lib/apiBase";
import "./lib/firebase"; // Initialize Firebase

// Send /api and /uploads requests to the backend when the client is hosted separately (Netlify).
installApiBase();

createRoot(document.getElementById("root")!).render(<App />);
