import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/RegisterHeader";
import Footer from "../components/Footer";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

export default function VerifyEmail() {
    const API_URL = import.meta.env.VITE_API_URL;
    const navigate = useNavigate();
    const { search } = useLocation();
    const params = new URLSearchParams(search);
    const location = useLocation();
    const initialEmail = (location.state as any)?.email || params.get("email") || "";
    const errorFromState = (location.state as any)?.error || "";
    const isEmailPreFilled = !!initialEmail;
    const [email, setEmail] = useState(() => initialEmail);
    const [code, setCode] = useState("");
    const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);


    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    useEffect(() => {
        if (errorFromState) {
            setNotification({ type: "error", message: errorFromState });
        }
    }, [errorFromState]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || code.length !== 6) {
            setNotification({ type: "error", message: "Введите корректный email и 6-значный код" });
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/user/verify-email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code }),
            });
            const data = await response.json();
            if (response.ok && data.status === "ok") {
                setNotification({ type: "success", message: data.detail || "Email успешно подтверждён!" });
                setTimeout(() => navigate("/user/login"), 2000);
            } else {
                setNotification({ type: "error", message: data.detail || "Ошибка подтверждения." });
            }
        } catch {
            setNotification({ type: "error", message: "Сетевая ошибка." });
        }
        setLoading(false);
    };

    const handleResend = async () => {
        if (!email) {
            setNotification({ type: "error", message: "Email отсутствует." });
            return;
        }
        setResendLoading(true);
        try {
            const response = await fetch(`${API_URL}/user/resend-verification`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();
            if (response.ok && data.status === "ok") {
                setNotification({ type: "success", message: data.detail || "Новый код отправлен." });
            } else {
                setNotification({ type: "error", message: data.detail || "Ошибка при отправке." });
            }
        } catch {
            setNotification({ type: "error", message: "Сетевая ошибка." });
        }
        setResendLoading(false);
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow flex items-center justify-center bg-gradient-to-r from-blue-800 to-purple-400 p-4">
                <motion.div
                    layout
                    transition={{ layout: { duration: 0.6, ease: "easeInOut" } }}
                    className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 relative"
                >
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Подтверждение Email</h2>
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

                    <form onSubmit={handleVerify} className="space-y-4">
                        <div>
                            <label className="block text-gray-700 font-semibold mb-1">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isEmailPreFilled}
                                className={`w-full p-3 border border-gray-300 rounded-lg ${isEmailPreFilled ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                                    }`}
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 font-semibold mb-1">Код (6 цифр)</label>
                            <input
                                type="text"
                                name="code"
                                placeholder="Введите 6-значный код"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none"
                                maxLength={6}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="bg-gradient-to-r from-purple-800 to-blue-400 w-full text-white py-3 rounded-lg font-semibold transition-opacity duration-300 disabled:opacity-50 cursor-pointer"
                            disabled={loading}
                        >
                            {loading ? (
                                <AiOutlineLoading3Quarters className="animate-spin text-xl mx-auto" />
                            ) : (
                                "Подтвердить Email"
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={handleResend}
                            className="mt-2 w-full text-center text-blue-600 hover:underline hover:text-blue-800 disabled:opacity-50 cursor-pointer"
                            disabled={resendLoading}
                        >
                            {resendLoading ? "Отправка..." : "Не пришёл код? Отправить повторно"}
                        </button>
                    </form>
                </motion.div>
            </main >
            <Footer />
        </div >
    );
}
