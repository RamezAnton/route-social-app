import { RouterProvider } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { router } from "./routes/routes";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";

function ThemedToast() {
  const { theme } = useTheme();
  return (
    <ToastContainer position="bottom-right" autoClose={3000} theme={theme} />
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
        <ThemedToast />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
