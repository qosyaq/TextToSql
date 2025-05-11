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

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/user/register" element={<Register />} />
        <Route path="/user/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/databases" element={<Database />} />
          <Route path="/database/:db_name/tables" element={<TablesPage />} />
          <Route path="/database/:db_name/chat" element={<Chat />} />
        </Route>

        {/* Другие маршруты */}
        <Route path="*" element={<NotFound />} /> {/* Страница 404 */}

      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
