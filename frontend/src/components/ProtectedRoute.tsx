// src/components/ProtectedRoute.tsx
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

                if (response.ok) {
                    setValid(true);
                } else {
                    setValid(false);
                }
            } catch {
                setValid(false);
            }
        };

        checkToken();
    }, []);

    if (valid === null) return <div className="text-center mt-10 text-white">Загрузка...</div>;

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
