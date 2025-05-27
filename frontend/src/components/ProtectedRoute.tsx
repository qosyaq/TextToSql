import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

export default function ProtectedRoute() {
    const location = useLocation();
    const [valid, setValid] = useState<boolean | null>(null);
    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const checkToken = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setValid(false);
                return;
            }

            try {
                const response = await fetch(`${API_URL}/user/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                setValid(response.ok);
            } catch {
                setValid(false);
            }
        };

        checkToken();
    }, []);

    // Удаляем splash, как только проверка завершилась
    useEffect(() => {
        if (valid !== null) {
            const splash = document.getElementById("splash-screen");
            if (splash) {
                splash.classList.add("opacity-0");
                setTimeout(() => splash.remove(), 400);
            }
        }
    }, [valid]);

    if (valid === null) return null;

    if (!valid) {
        return (
            <Navigate
                to="/user/login"
                state={{ from: location, message: "Сначала войдите!", type: "error" }}
                replace
            />
        );
    }

    return <Outlet />;
}
