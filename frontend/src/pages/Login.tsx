import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import LoginHeader from "../components/LoginHeader";
import LoginFooter from "../components/Footer";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useAuthRedirect } from "../hooks/useAuthRedirect"
import { motion, AnimatePresence } from "framer-motion";

export default function Login() {
    useAuthRedirect();
    const API_URL = import.meta.env.VITE_API_URL;

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [notification, setNotification] = useState<{ type: string; message: string } | null>(null);

    const [loading, setLoading] = useState(false);

    const location = useLocation();

    const navigate = useNavigate();

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    useEffect(() => {
        if (location.state?.message) {
            setNotification({ type: location.state.type || "success", message: location.state.message });

            navigate(location.pathname, { replace: true });
        }
    }, [location.state, navigate]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/user/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            if (response.ok) {
                localStorage.setItem("token", data.token);
                navigate("/databases", {
                    state: {
                        email: formData.email,
                        success: "Успешный вход! Добро пожаловать!",
                    },
                });
            } else if (response.status === 403 && data.detail?.toLowerCase().includes("not verified")) {
                setLoading(false);
                navigate("/user/verify-email", {
                    state: {
                        email: formData.email,
                        error: "Email не подтверждён. Пожалуйста, введите код подтверждения.",
                    },
                });
                return;
            } else {
                if (data.detail && Array.isArray(data.detail)) {
                    const errorMessages = data.detail.map((err: any) => err.msg).join(", ");
                    setNotification({ type: "error", message: `${errorMessages}` });
                } else {
                    setNotification({ type: "error", message: data.detail || "Ошибка входа" });
                }
            }
        } catch (error) {
            setNotification({ type: "error", message: "Ошибка сети" });
        }

        setLoading(false);
    };

    const GOOGLE_AUTH_URL =
        "https://accounts.google.com/o/oauth2/v2/auth" +
        `?client_id=${import.meta.env.VITE_GOOGLE_CLIENT_ID}` +
        `&redirect_uri=${import.meta.env.VITE_GOOGLE_REDIRECT_URI}` +
        "&response_type=code" +
        "&scope=openid%20email%20profile" +
        "&state=login" +
        "&prompt=consent";

    const handleGoogleLogin = () => {
        window.location.href = GOOGLE_AUTH_URL;   // просто редирект
    };

    const MS_AUTH_URL =
        "https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize" +
        `?client_id=${import.meta.env.VITE_MICROSOFT_CLIENT_ID}` +
        `&redirect_uri=${import.meta.env.VITE_MICROSOFT_REDIRECT_URI}` +
        "&response_type=code" +
        "&scope=openid%20email%20profile%20offline_access%20User.Read" +
        "&state=login" +
        "&prompt=select_account";

    const handleMicrosoftLogin = () => {
        window.location.href = MS_AUTH_URL;
    };

    return (
        <div className="min-h-screen flex flex-col">
            <LoginHeader />

            <main className="flex-grow flex items-center justify-center bg-gradient-to-r from-purple-800 to-blue-400 p-4">
                <motion.div
                    layout
                    transition={{ layout: { duration: 0.6, ease: "easeInOut" } }}
                    className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 relative"
                >
                    <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Вход</h2>
                    <AnimatePresence mode="wait">
                        {notification && (
                            <motion.div
                                key={notification.message}
                                layout="position" // <--- добавлено
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
                                className="w-full p-3 border border-black/30 bg-white/20 rounded-lg focus:outline-none"
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
                                "Войти"
                            )}
                        </button>
                    </form>

                    <p className="text-center text-gray-600 mt-4">
                        Нет аккаунта?{" "}
                        <Link to="/user/register" className="text-blue-500 hover:underline">
                            Зарегистрироваться
                        </Link>
                    </p>

                    <div className="flex flex-col space-y-3 mt-6">
                        <button
                            onClick={handleGoogleLogin}
                            className="w-full flex items-center justify-center gap-2 border border-gray-300 py-2 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                        >
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" />
                            Войти через Google
                        </button>
                        <button
                            onClick={handleMicrosoftLogin}
                            className="w-full flex items-center justify-center gap-2 border border-gray-300 py-2 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                        >
                            <img src="https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/microsoft.svg"
                                alt="Microsoft logo"
                                className="w-5 h-5" />
                            Войти через Microsoft
                        </button>
                    </div>
                </motion.div>
            </main>
            <LoginFooter />
        </div>
    );
}
