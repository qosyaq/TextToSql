import { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { DatabaseZap } from "lucide-react";
import { motion } from "framer-motion";

export default function Databases() {
    const API_URL = import.meta.env.VITE_API_URL;
    const [databases, setDatabases] = useState<{ db_name: string }[]>([]);
    const [dbName, setDbName] = useState("");
    const [dbType, setDbType] = useState("");
    const [showInput, setShowInput] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchModalOpen, setSearchModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const itemsPerPage = 4;
    const token = localStorage.getItem("token");
    const [notifications, setNotifications] = useState<{ id: number; type: "error" | "success"; message: string }[]>([]);

    useEffect(() => {
        fetchDatabases();
    }, []);

    const addNotification = (type: "error" | "success", message: string) => {
        const id = Date.now();
        setNotifications((prev) => [...prev, { id, type, message }]);

        // Удаляем уведомление через 4 секунды
        setTimeout(() => {
            setNotifications((prev) => prev.filter((notif) => notif.id !== id));
        }, 4000);
    };

    const fetchDatabases = async () => {
        if (!token) return;
        try {
            const response = await fetch(`${API_URL}/databases`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                const data = await response.json();
                setDatabases(data);

            }
        } catch (error) {
            addNotification("error", `Ошибка загрузки баз данных: ${error}`);
        }
    };

    const createDatabase = async () => {
        if (!dbName.trim()) {
            addNotification("error", "Название базы данных не может быть пустым.");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/database`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ db_name: dbName, db_type: dbType }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.detail && Array.isArray(data.detail)) {
                    const errorMessages = data.detail.map((err: any) => err.msg).join(", ");
                    addNotification("error", `Ошибка: ${errorMessages}`);
                } else {
                    addNotification("error", data.detail || "Ошибка регистрации");
                }
                return
            }

            setDatabases([...databases, { db_name: dbName }]);
            setDbName("");
            setShowInput(false);
            addNotification("success", "База данных успешно создана.");
        } catch (error: any) {
            addNotification("error", `Ошибка создания базы данных: ${error.message}`);
        }
    };

    const enterDB = (dbName: string) => {
        window.location.href = `/database/${dbName}/tables`;
    };

    // Пагинация
    const totalPages = Math.ceil(databases.length / itemsPerPage);
    const displayedDatabases = databases.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-grow flex flex-col items-center justify-center text-center bg-gradient-to-b from-purple-800 to-gray-900 text-white p-6 relative">
                <h1 className="text-4xl font-bold mb-10 flex items-center gap-2 text-purple-100 drop-shadow-lg tracking-wide">
                    Ваши базы данных
                    <DatabaseZap
                        className="ml-1 w-14 h-14 text-purple-300 transition-all duration-300 ease-in-out transform hover:scale-102 hover:text-purple-200 hover:drop-shadow-lg"
                    />

                </h1>

                {databases.length === 0 ? (
                    <p className="text-xl text-gray-300 mb-10">У вас пока нет баз данных.</p>
                ) : (
                    <>
                        <ul className="space-y-4 mb-6">
                            {displayedDatabases.map((db) => (
                                <li key={db.db_name}
                                    className="bg-white/5 backdrop-blur border border-white/13 text-white px-6 py-3 rounded-lg shadow-md text-lg font-semibold cursor-pointer hover:bg-white/10 transition-all"
                                    onClick={() => enterDB(db.db_name)}>
                                    {db.db_name}
                                </li>
                            ))}
                        </ul>
                    </>
                )}

                <button
                    onClick={() => setShowInput(true)}
                    className="bg-purple-900 text-white px-6 py-3 rounded-md text-lg font-semibold hover:bg-gray-900 transition-all cursor-pointer"
                >
                    +
                </button>

                {/* Кнопки пагинации*/}
                {databases.length > itemsPerPage && (
                    <div className="flex space-x-4 mt-4">
                        <button
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`px-4 py-2 rounded-md transition-all ${currentPage === 1 ? "bg-gray-900 cursor-not-allowed hover:text-gray-900" : "bg-white text-purple-900 hover:bg-purple-900 hover:text-white"
                                }`}
                        >
                            Назад
                        </button>

                        <span className="text-lg font-semibold">
                            {currentPage} / {totalPages}
                        </span>

                        <button
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`px-4 py-2 rounded-md transition-all ${currentPage === totalPages ? "bg-gray-900 cursor-not-allowed hover:text-gray-900" : "bg-white text-purple-900 hover:bg-purple-900 hover:text-white"
                                }`}
                        >
                            Вперед
                        </button>
                    </div>
                )}

                {showInput && (
                    <div className="fixed inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-lg z-30 transition">
                        <div className="p-6 text-white border border-white/30 rounded-lg shadow-lg w-96 relative">
                            <button
                                onClick={() => setShowInput(false)}
                                className="absolute top-2 right-3 hover:text-red-400 cursor-pointer"
                            >
                                ✕
                            </button>

                            <h2 className="text-xl font-bold mb-4 text-center">Создать базу данных</h2>

                            <input
                                type="text"
                                value={dbName}
                                onChange={(e) => setDbName(e.target.value)}
                                placeholder="Название базы данных"
                                className="p-4 border border-white/40 placeholder-gray/50 italic rounded-md w-full mb-4 focus:outline-none hover:bg-white/10 transition-all"
                            />

                            <select
                                value={dbType}
                                onChange={(e) => setDbType(e.target.value)}
                                className="p-4 border border-white/40 rounded-md hover:bg-white/10 transition-all w-full mb-5 appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                <option value="" disabled hidden className="bg-gray-800 hover:bg-gray-800/20">Выберите СУБД</option>
                                <option value="postgresql" className="bg-gray-800 hover:bg-gray-800/20">PostgreSQL</option>
                                <option value="mysql" className="bg-gray-800 hover:bg-gray-800/20">MySQL</option>
                                <option value="sqlite" className="bg-gray-800 hover:bg-gray-800/20">SQLite</option>
                                <option value="mssql" className="bg-gray-800 hover:bg-gray-800/20">SQL Server</option>
                            </select>


                            <button
                                onClick={createDatabase}
                                className="w-full bg-gradient-to-br from-blue-400 to-purple-700 text-white px-4 py-2 rounded-md transition-all hover:text-purple-100 hover:scale-101 cursor-pointer"
                            >
                                Создать
                            </button>
                        </div>
                    </div>
                )}

                <p
                    className="mt-4 text-sm text-gray-300 underline cursor-pointer hover:text-white transition"
                    onClick={() => setSearchModalOpen(true)}
                >
                    Не можете найти базу данных? Попробуйте поиск
                </p>

                {searchModalOpen && (
                    <div className="fixed inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-lg z-30 transition">
                        <div className="text-white border border-white/30 gray-900 rounded-lg p-6 w-96 relative shadow-lg">
                            <button
                                onClick={() => setSearchModalOpen(false)}
                                className="absolute top-2 right-3 hover:text-red-400 cursor-pointer"
                            >
                                ✕
                            </button>
                            <h2 className="text-xl font-extrabold mb-4 text-center text-purple-400">Поиск базы данных</h2>

                            <input
                                type="text"
                                placeholder="Введите название..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="p-3 border border-white/40 rounded-md w-full mb-2 hover:bg-white/10 transition-all focus:outline-none"
                            />
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {databases
                                    .filter((db) =>
                                        db.db_name.toLowerCase().includes(searchTerm.toLowerCase())
                                    )
                                    .map((db) => (
                                        <div
                                            key={db.db_name}
                                            onClick={() => {
                                                window.location.href = `/database/${db.db_name}/chat`;
                                            }}
                                            className="p-2 border border-white/40 bg-purple-400/10 rounded-md cursor-pointer hover:bg-purple-400/5 transition-all"
                                        >
                                            {db.db_name}
                                        </div>
                                    ))}
                                {searchTerm && databases.filter((db) =>
                                    db.db_name.toLowerCase().includes(searchTerm.toLowerCase())
                                ).length === 0 && (
                                        <p className="text-gray-500 text-sm text-center">Ничего не найдено</p>
                                    )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
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
        </div>
    );
}
