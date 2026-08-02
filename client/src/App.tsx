import { RouterProvider } from "react-router-dom";
import { QueryProvider } from "@/providers/QueryProvider";
import { CurrentProjectProvider } from "@/providers/CurrentProjectContext";
import { router } from "@/routes/router";

export default function App() {
  return (
    <QueryProvider>
      <CurrentProjectProvider>
        <RouterProvider router={router} />
      </CurrentProjectProvider>
    </QueryProvider>
  );
}
