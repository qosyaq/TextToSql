import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import RegisterHeader from "../components/RegisterHeader";
import RegisterFooter from "../components/Footer";
import { AiOutlineLoading3Quarters } from "react-icons/ai"
import { useAuthRedirect } from "../hooks/useAuthRedirect"
import { motion, AnimatePresence } from "framer-motion";



export default function Register() {
    useAuthRedirect();
    const API_URL = import.meta.env.VITE_API_URL;
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [notification, setNotification] = useState<{ type: string; message: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);


        const response = await fetch(`${API_URL}/user/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });

        const data = await response.json();
        if (response.ok) {
            setNotification({ type: "success", message: "Успешная регистрация! Проверьте почту." });
            setTimeout(() => {
                navigate(`/user/verify-email?email=${encodeURIComponent(formData.email)}`);
            }, 2000);
        } else {
            if (data.detail && Array.isArray(data.detail)) {
                const errorMessages = data.detail.map((err: any) => err.msg).join(", ");
                setNotification({ type: "error", message: `${errorMessages}` });
            } else {
                setNotification({ type: "error", message: data.detail || "Ошибка регистрации" });
            }
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen flex flex-col">
            <RegisterHeader />

            <main className="flex-grow flex items-center justify-center bg-gradient-to-r from-blue-800 to-purple-400 p-4">
                <motion.div
                    layout
                    transition={{ layout: { duration: 0.6, ease: "easeInOut" } }}
                    className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 relative"
                >
                    <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Регистрация</h2>
                    <AnimatePresence mode="wait">
                        {notification && (
                            <motion.div
                                key={notification.message}
                                layout="position"
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10, height: 0, paddingTop: 0, paddingBottom: 0, marginBottom: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className={`mb-4 w-full text-center px-4 py-2 rounded-md text-white text-sm shadow-lg break-words whitespace-pre-wrap ${notification.type === "success" ? "bg-green-600" : "bg-red-600"
                                    }`}
                            >
                                {notification.message}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-gray-700 font-semibold mb-1">Email</label>
                            <input
                                type="email"
                                name="email"
                                placeholder="Введите ваш email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full p-3 border border-black/30 rounded-lg focus:outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 font-semibold mb-1">Пароль</label>
                            <input
                                type="password"
                                name="password"
                                placeholder="Введите пароль"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full p-3 border border-black/30 rounded-lg focus:outline-none"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="bg-gradient-to-r from-purple-800 to-blue-400 w-full text-white py-3 rounded-lg font-semibold transition duration-300 flex justify-center items-center cursor-pointer hover:opacity-90"
                            disabled={loading}
                        >
                            {loading ? (
                                <AiOutlineLoading3Quarters className="animate-spin text-xl" />
                            ) : (
                                "Зарегистрироваться"
                            )}
                        </button>
                    </form>

                    <p className="text-center text-gray-600 mt-4">
                        Уже есть аккаунт?{" "}
                        <Link to="/user/login" className="text-blue-500 hover:underline">
                            Войти
                        </Link>
                    </p>
                </motion.div>
            </main>

            <RegisterFooter />
        </div>
    );
}
