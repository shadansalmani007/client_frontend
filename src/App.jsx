import { RouterProvider } from "react-router-dom";
import { AppProviders } from "./providers/AppProviders.jsx";
import { router } from "./routes/index.jsx";

export default function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
