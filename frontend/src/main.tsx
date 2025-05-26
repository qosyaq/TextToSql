import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./pages/App";
import Register from "./pages/Register";
import Login from "./pages/Login.tsx";
import Database from "./pages/Database";
import TablesPage from "./pages/Table.tsx";
import "./index.css";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import NotFound from "./pages/NotFound";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile.tsx";
import PageTitleSetter from "./components/PageTitleSetter";


ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <PageTitleSetter />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/user/register" element={<Register />} />
        <Route path="/user/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/databases" element={<Database />} />
          <Route path="/database/:db_name/tables" element={<TablesPage />} />
          <Route path="/database/:db_name/chat" element={<Chat />} />
          <Route path="/user/profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<NotFound />} /> {/* Страница 404 */}

      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
const splash = document.getElementById("splash-screen");
if (splash) {
  splash.classList.add("opacity-0");
  setTimeout(() => splash.remove(), 500); // 400–600 мс оптимально
}