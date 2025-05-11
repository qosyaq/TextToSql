// src/components/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

export default function ProtectedRoute() {
    const location = useLocation();
    const [valid, setValid] = useState<boolean | null>(null);

    useEffect(() => {
        const checkToken = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setValid(false);
                return;
            }

            try {
                const response = await fetch("http://127.0.0.1:8000/user/me", {
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
                state={{ from: location, error: "Сначала войдите!" }}
                replace
            />
        );
    }

    return <Outlet />;
}
