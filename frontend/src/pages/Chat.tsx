import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import LoginHeader from "../components/LoginHeader";
import Footer from "../components/Footer";
import { format } from "date-fns";
import { Lightbulb, ArrowLeftRight, Code, Copy, Check, History, Trash2, Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Chat() {
    const API_URL = import.meta.env.VITE_API_URL;
    const navigate = useNavigate();
    const { db_name } = useParams();
    const [input, setInput] = useState("");
    const [response, setResponse] = useState("");
    const [history, setHistory] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 2;
    const totalPages = Math.ceil(history.length / itemsPerPage);
    const [isLoading, setIsLoading] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const [isFetchingHistory, setIsFetchingHistory] = useState(true);


    const [copied, setCopied] = useState(false);

    const [notifications, setNotifications] = useState<{ id: number; type: "error" | "success"; message: string }[]>([]);


    const handleCopy = () => {
        navigator.clipboard.writeText(response);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    const addNotification = (type: "error" | "success", message: string) => {
        const id = Date.now();
        setNotifications((prev) => [...prev, { id, type, message }]);

        // Удаляем уведомление через 4 секунды
        setTimeout(() => {
            setNotifications((prev) => prev.filter((notif) => notif.id !== id));
        }, 4000);
    };

    const fetchHistory = async () => {
        try {
            setIsFetchingHistory(true); // ← добавлено
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/database/${db_name}/chat`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) {
                if (res.status === 404) {
                    addNotification("error", "Ошибка загрузки истории запросов, выполняется перенаправление...");
                    navigate("/404");
                } else {
                    addNotification("error", "Ошибка загрузки истории запросов");
                }
                return;
            }

            const data = await res.json();
            setHistory(data.reverse());
        } catch (error) {
            addNotification("error", `Ошибка загрузки истории: ${error}`);
        } finally {
            setIsFetchingHistory(false); // ← добавлено
        }
    };


    const handleTranslate = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/database/${db_name}/chat`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ content: input }),
            });
            const data = await res.json();
            setResponse(data.sql);
            await fetchHistory();
            setCurrentPage(1);

            if (!res.ok) {
                if (res.status === 400) {
                    addNotification("error", "Ошибка выполнения запроса, поле не может быть пустым.");
                } else {
                    addNotification("error", "Ошибка выполнения запроса");
                }
                return;
            }
            addNotification("success", "Запрос успешно выполнен!");
        } catch (error) {
            addNotification("error", `Ошибка выполнения запроса: ${error}`);

        }
        finally {
            setIsLoading(false);
        }
    };

    const handleClearHistory = async () => {
        try {
            setIsClearing(true);
            const token = localStorage.getItem("token");
            await fetch(`${API_URL}/database/${db_name}/chat`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            setHistory([]);
            setResponse("");
            addNotification("success", "История успешно очищена!");
        } catch (error) {
            addNotification("error", `Ошибка очистки истории: ${error}`);
        } finally {
            setIsClearing(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [db_name]);

    const currentItems = history.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="flex flex-col min-h-screen">
            <LoginHeader />
            <main className="flex-1 flex flex-col bg-gradient-to-r from-purple-800 to-blue-400 p-6 text-white transition-all duration-500">
                <div
                    className={`transition-all duration-500 ease-in-out ${!history.length ? "flex flex-1 items-center justify-center" : "block"
                        }`}
                >
                    <div
                        className={`grid gap-4 mb-10 transition-all duration-500 ease-in-out grid-cols-1 md:grid-cols-${response ? "2" : "1"} max-w-4xl mx-auto w-full`}
                    >
                        <div className="bg-white/20 backdrop-blur p-4 rounded-md text-white shadow-2xl border border-white/30">
                            <div className="flex items-center space-x-3 mb-3">
                                <Lightbulb size={30} className="text-green-400 drop-shadow" />
                                <h2 className="text-2xl font-bold text-purple-100 drop-shadow-lg tracking-wide">
                                    Опишите, что нужно
                                </h2>
                            </div>
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                rows={6}
                                className="w-full p-3 rounded-md border border-white/20 bg-transparent text-white placeholder-white/40 focus:outline-none italic"
                                placeholder="Введите запрос..."
                            />
                            <div className="flex justify-center">
                                <button
                                    onClick={handleTranslate}
                                    disabled={isLoading}
                                    className={`mt-4 flex items-center justify-center gap-2 px-6 py-2 rounded-xl 
        ${isLoading ? "bg-gradient-to-r from-blue-500 to-purple-600     cursor-not-allowed opacity-70" : "bg-gradient-to-r from-blue-500 to-purple-600"} 
        text-white shadow-xl hover:from-blue-700 hover:to-purple-900 transition-all duration-300 cursor-pointer`}
                                >
                                    {isLoading ? (
                                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                                fill="none"
                                            />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                            />
                                        </svg>
                                    ) : (
                                        <>
                                            <ArrowLeftRight size={24} className="drop-shadow-sm" />
                                            <span className="font-medium tracking-wide cursor-pointer">Сгенерировать</span>
                                        </>
                                    )}
                                </button>

                            </div>
                        </div>

                        <AnimatePresence>
                            {response && (
                                <motion.div
                                    initial={{ opacity: 0, x: -40 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -40 }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                    className="bg-white/30 backdrop-blur p-4 rounded-md text-white shadow-lg relative"
                                >
                                    <div className="flex items-center space-x-3 mb-3">
                                        <Code size={30} className="text-purple-200" />
                                        <h2 className="text-2xl font-bold text-purple-100 drop-shadow-lg tracking-wide">
                                            Ваш SQL-запрос
                                        </h2>
                                    </div>

                                    <button
                                        onClick={handleCopy}
                                        className="absolute top-4 right-4 text-white/70 hover:text-white transition-all duration-300"
                                        title={copied ? "Скопировано!" : "Скопировать"}
                                    >
                                        <div className="transition-all duration-300 ease-in-out">
                                            {copied ? (
                                                <Check size={20} className="text-green-300 scale-110 opacity-100" />
                                            ) : (
                                                <Copy size={20} className="opacity-80 hover:scale-110 cursor-pointer" />
                                            )}
                                        </div>
                                    </button>

                                    <pre className="whitespace-pre-wrap break-words text-white font-mono text-sm bg-black/60 p-3 rounded-md">
                                        {response}
                                    </pre>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
                {/* История запросов */}
                {isFetchingHistory ? (
                    <div className="mt-16 w-full flex justify-center">
                        <div className="w-full max-w-xl flex flex-col gap-4 px-4">
                            {[...Array(itemsPerPage)].map((_, index) => (
                                <div key={index} className="w-full h-24 rounded-xl bg-white/10 animate-pulse" />
                            ))}
                        </div>
                    </div>
                ) : history.length > 0 && (
                    <div className="mt-16 w-full flex justify-center">
                        <div className="w-full max-w-xl flex flex-col gap-2 px-4">

                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center space-x-2">
                                    <History size={28} className="text-purple-100" />
                                    <h2 className="text-2xl font-bold text-purple-100 drop-shadow-lg tracking-wide">История</h2>
                                </div>
                                <button
                                    onClick={handleClearHistory}
                                    disabled={isClearing}
                                    className="flex items-center space-x-2 px-4 py-2 rounded-md border border-white/30 text-white 
        hover:bg-gray-900 hover:shadow-lg transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isClearing ? (
                                        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                    ) : (
                                        <>
                                            <Trash2 size={18} />
                                            <span className="text-sm">Очистить</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 justify-items-center">
                                {currentItems.map((msg, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, ease: "easeOut" }}
                                        className={`w-full max-w-xs p-4 rounded-xl shadow-xl border ${msg.sender === "user"
                                            ? "bg-white/20 border-white/30"
                                            : "bg-white/20 border-white/30"} backdrop-blur-md text-white`}
                                    >
                                        <div className="flex items-center gap-2 text-xs text-white/60 mb-2">
                                            {msg.sender === "user" ? (
                                                <User size={16} className="text-blue-300" />
                                            ) : (
                                                <Bot size={16} className="text-green-300" />
                                            )}
                                            <span>{format(new Date(msg.created_at), "dd.MM.yyyy, HH:mm:ss")}</span>
                                        </div>
                                        <div className="text-sm whitespace-pre-wrap break-words">{msg.content}</div>
                                    </motion.div>
                                ))}
                            </div>

                            {history.length > itemsPerPage && (
                                <div className="flex justify-center items-center space-x-4 mt-6">
                                    <button
                                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className={`px-4 py-2 rounded-md transition-all ${currentPage === 1
                                            ? "bg-gray-900 cursor-not-allowed hover:text-gray-900"
                                            : "bg-white text-purple-900 hover:bg-purple-900 hover:text-white"}`}
                                    >
                                        Назад
                                    </button>
                                    <span className="text-lg font-semibold text-white">
                                        {currentPage} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className={`px-4 py-2 rounded-md transition-all ${currentPage === totalPages
                                            ? "bg-gray-900 cursor-not-allowed hover:text-gray-900"
                                            : "bg-white text-purple-900 hover:bg-purple-900 hover:text-white"}`}
                                    >
                                        Вперед
                                    </button>
                                </div>
                            )}

                        </div>
                    </div>

                )
                }
            </main >
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
            <Footer />
        </div >
    );
}
