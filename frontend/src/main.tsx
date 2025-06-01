// src/index.tsx (или main.tsx — в зависимости от вашего проекта)
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from "./pages/App";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Database from "./pages/Database";
import TablesPage from "./pages/Table";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

import VerifyEmail from "./pages/VerifyEmail";

import ProtectedRoute from "./components/ProtectedRoute";
import OAuthCallback from "./pages/OAuthCallback";

import PageTitleSetter from "./components/PageTitleSetter";
import "./index.css";

const splash = document.getElementById("splash-screen");
if (splash) {
  splash.classList.add("opacity-0");
  setTimeout(() => splash.remove(), 900);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <PageTitleSetter />

    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/user/register" element={<Register />} />
      <Route path="/user/login" element={<Login />} />

      <Route path="/user/verify-email" element={<VerifyEmail />} />
      <Route path="/oauth/:provider/callback" element={<OAuthCallback />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/databases" element={<Database />} />
        <Route path="/database/:db_name/tables" element={<TablesPage />} />
        <Route path="/database/:db_name/chat" element={<Chat />} />
        <Route path="/user/profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

