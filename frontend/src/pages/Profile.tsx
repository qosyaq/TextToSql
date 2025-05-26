import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { UserCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function Profile() {
    const [profile, setProfile] = useState<{ id: number; email: string; created_at: string } | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [password, setPassword] = useState("");
    const [notifications, setNotifications] = useState<{ id: number; type: "error" | "success"; message: string }[]>([]);

    const token = localStorage.getItem("token");
    const navigate = useNavigate();
    const location = useLocation();
    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const fetchProfile = async () => {
            if (!token) return;

            try {
                const response = await fetch(`${API_URL}/user/profile`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await response.json();

                if (!response.ok) {
                    addNotification("error", data.detail || "Ошибка загрузки профиля");
                    return;
                }

                setProfile(data);
            } catch (error) {
                addNotification("error", "Ошибка загрузки профиля");
            }
        };

        fetchProfile();
    }, [token]);


    const addNotification = (type: "error" | "success", message: string) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, type, message }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 4000);
    };
    const handleDelete = async () => {
        try {
            const res = await fetch(`${API_URL}/user/delete`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ password }),
            });

            const data = await res.json();
            if (!res.ok) {
                addNotification("error", data.detail || "Ошибка удаления");
                return;
            }

            localStorage.removeItem("token");
            navigate("/user/login", {
                state: { from: location, message: "Аккаунт успешно удалён", type: "success" },
            });
        } catch (err) {
            addNotification("error", "Ошибка при удалении аккаунта");
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        navigate("/user/login", {
            state: { from: location, message: "Вы вышли из аккаунта", type: "success" },
        });
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow flex flex-col items-center justify-center text-center bg-gradient-to-b from-purple-800 to-gray-900 text-white p-6 relative">
                <h1 className="text-4xl font-bold mb-6 flex items-center gap-2 text-blue-100 drop-shadow-lg tracking-wide">
                    Профиль
                    <UserCircle className="ml-1 w-14 h-14 text-blue-300 hover:text-blue-100 transition duration-300" />
                </h1>

                {profile ? (
                    <div className="bg-white/5 backdrop-blur border border-white/20 hover:scale-100.5 hover:bg-white/6 p-6 rounded-lg text-white shadow-lg w-full max-w-md text-left">
                        <p><span className="font-bold">ID:</span> {profile.id}</p>
                        <p><span className="font-bold">Email:</span> {profile.email}</p>
                        <p><span className="font-bold">Создан:</span> {new Date(profile.created_at).toLocaleString()}</p>

                        <div className="mt-6 flex flex-col gap-4">

                            <button
                                onClick={logout}
                                className="w-full border border-white/30 bg-gray-400/5 hover:bg-gray-400/10 transition text-white py-2 px-4 rounded-md cursor-pointer"
                            >
                                Выйти
                            </button>
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="w-full border border-red-500/60 bg-red-600/5 hover:bg-red-600/10 transition text-red-500 py-2 px-4 rounded-md cursor-pointer"
                            >
                                Удалить аккаунт
                            </button>

                        </div>
                    </div>
                ) : (
                    <p className="text-gray-300">Загрузка...</p>
                )}

                {showDeleteModal && (
                    <div className="fixed inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-lg z-30 transition">
                        <div className="p-6 text-white border border-white/30 rounded-lg shadow-lg w-96 relative ">
                            <button onClick={() => setShowDeleteModal(false)} className="absolute top-2 right-3 hover:text-red-400 cursor-pointer">✕</button>
                            <h2 className="text-xl font-bold mb-4 text-center">Подтвердите удаление</h2>
                            <p className="text-sm mb-4">Введите пароль, чтобы подтвердить удаление аккаунта.</p>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Пароль"
                                className="p-4 border border-white/40 placeholder-gray/50 italic rounded-md w-full mb-5 focus:outline-none hover:bg-white/10 transition-all"
                            />
                            <button
                                onClick={handleDelete}
                                className="w-full border border-red-500/60 bg-red-600/5 hover:bg-red-600/10 transition text-red-500 py-2 px-4 rounded-md cursor-pointer"
                            >
                                Удалить
                            </button>
                        </div>
                    </div>
                )}

                <div className="fixed bottom-4 left-4 flex flex-col gap-2 z-50">
                    {notifications.map((notif) => (
                        <motion.div
                            key={notif.id}
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className={`p-3 rounded-lg shadow-lg text-white text-sm transition-all ${notif.type === "success" ? "bg-green-600" : "bg-red-600"
                                }`}
                        >
                            {notif.message}
                        </motion.div>
                    ))}
                </div>
            </main>
            <Footer />
        </div>
    );
}
