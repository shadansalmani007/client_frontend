import { RouterProvider } from "react-router-dom";
import { router } from "./router/index.jsx";

export default function App() {
  console.log("App render");
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}
