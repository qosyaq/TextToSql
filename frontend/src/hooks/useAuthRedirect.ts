import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const useAuthRedirect = () => {
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const token = localStorage.getItem("token");

        const checkToken = async () => {
            if (!token) return;

            try {
                const response = await fetch(`${API_URL}/user/me`, {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    navigate("/");
                } else {
                    const data = await response.json();
                    if (data.detail === "Invalid Token..." || data.detail === "Token has expired") {
                        localStorage.removeItem("token");
                    }
                }
            } catch (error) {
                console.error("Ошибка при проверке токена:", error);
            }
        };

        checkToken();
    }, [navigate]);
};