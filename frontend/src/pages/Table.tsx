import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Trash2, Settings, CirclePlus, MessageCircleCode } from "lucide-react";
import { motion } from "framer-motion";

interface Column {
    column_name: string;
    column_type: string;
}

interface Table {
    table_name: string;
    columns: Column[];
}

export default function TablesPage() {
    const { db_name } = useParams<{ db_name: string }>();
    const [tables, setTables] = useState<Table[]>([]);
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);

    const [newTable, setNewTable] = useState("");

    const [newColumn, setNewColumn] = useState("");
    const [columnType, setColumnType] = useState("VARCHAR");

    const [notifications, setNotifications] = useState<{ id: number; type: "error" | "success"; message: string }[]>([]);


    const token = localStorage.getItem("token");
    const navigate = useNavigate();

    const itemsPerPage = 7;
    const [currentPage, setCurrentPage] = useState(1);

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [showInput, setShowInput] = useState(false);


    const confirmDeleteDatabase = () => {
        deleteDatabase();
        setIsConfirmModalOpen(false);
    };

    useEffect(() => {
        if (db_name) {
            fetchTables();

        }
    }, [db_name]);

    // Пагинация
    const totalPages = Math.ceil(tables.length / itemsPerPage);
    const displayedTables = tables.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);


    const addNotification = (type: "error" | "success", message: string) => {
        const id = Date.now();
        setNotifications((prev) => [...prev, { id, type, message }]);

        // Удаляем уведомление через 4 секунды
        setTimeout(() => {
            setNotifications((prev) => prev.filter((notif) => notif.id !== id));
        }, 4000);
    };


    // ====================== FETCH TABLES ======================
    const fetchTables = async () => {
        if (!token || !db_name) return;
        try {
            const response = await fetch(`http://127.0.0.1:8000/database/${db_name}/tables`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setTables(data || []);
            } else {
                addNotification("error", "Ошибка загрузки таблиц, выполняется перенаправление...");
                navigate("/404");
            }
        } catch (err) {
            addNotification("error", "Ошибка загрузки таблиц");
        }
    };

    // ====================== FETCH COLUMNS (CORE FIX) ======================
    /**
     * Когда пользователь кликает на таблицу, мы делаем запрос на список колонок
     * и сохраняем результат в `selectedTable`.
     */
    const fetchColumns = async (tableName: string) => {
        if (!token || !db_name) return;
        try {
            const response = await fetch(
                `http://127.0.0.1:8000/database/${db_name}/table/${tableName}/columns`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (response.ok) {
                // Предположим, сервер возвращает массив вида [{column_name, column_type}, ...]
                const columnsData: Column[] = await response.json();

                // Находим таблицу
                const tableObj: Table = {
                    table_name: tableName,
                    columns: columnsData || [],
                };
                setSelectedTable(tableObj);
            }
            else {
                const data = await response.json();
                if (data.detail && Array.isArray(data.detail)) {
                    const errorMessages = data.detail.map((err: any) => err.msg).join(", ");
                    addNotification("error", `${errorMessages}`);
                } else {
                    addNotification("error", data.detail || "Ошибка при загрузке колонок");
                }
            }
        } catch (err) {
            addNotification("error", "Ошибка соединения при загрузке колонок");
        }
    };

    // ====================== ADD TABLE ======================
    const addTable = async () => {
        if (!newTable.trim()) {
            addNotification("error", "Название таблицы не может быть пустым.");
            return;
        }
        if (!token || !db_name) return;

        try {
            const response = await fetch(`http://127.0.0.1:8000/database/${db_name}/table`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ table_name: newTable }),
            });
            const data = await response.json();

            if (response.ok) {
                // Добавляем новую таблицу (пустой список колонок)
                setTables([...tables, { table_name: newTable, columns: [] }]);
                setNewTable("");
                setShowInput(false);
                addNotification("success", "Таблица успешно создана!");
            } else {
                if (data.detail && Array.isArray(data.detail)) {
                    const errorMessages = data.detail.map((err: any) => err.msg).join(", ");
                    addNotification("error", `${errorMessages}`);
                } else {
                    addNotification("error", data.detail || "Ошибка при добавлении в таблицу");
                }
            }
        } catch (err) {
            addNotification("error", "Ошибка соединения при добавлении таблицы");
        }
    };

    // ====================== DELETE TABLE ======================
    const deleteTable = async (tableName: string) => {
        if (!token || !db_name) return;
        try {
            const response = await fetch(
                `http://127.0.0.1:8000/database/${db_name}/table/${tableName}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.ok) {
                const updatedTables = tables.filter((t) => t.table_name !== tableName);
                setTables(updatedTables);

                if (selectedTable?.table_name === tableName) {
                    setSelectedTable(null);
                }

                const newTotalPages = Math.ceil(updatedTables.length / itemsPerPage);
                if (currentPage > newTotalPages) {
                    setCurrentPage(newTotalPages > 0 ? newTotalPages : 1);
                }

                addNotification("success", "Таблица успешно удалена!");
            }
        } catch (err) {
            console.error("Ошибка при удалении таблицы:", err);
        }
    };


    // ====================== ADD COLUMN ======================
    const addColumn = async () => {
        if (!selectedTable) return;
        if (!newColumn.trim()) {
            addNotification("error", "Название колонки не может быть пустым.");
            return;
        }
        if (!token || !db_name) return;

        try {
            const response = await fetch(
                `http://127.0.0.1:8000/database/${db_name}/table/${selectedTable.table_name}/column`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ column_name: newColumn, column_type: columnType }),
                }
            );
            const data = await response.json();

            if (response.ok) {
                // Локально добавляем
                const updatedColumns = [
                    ...selectedTable.columns,
                    { column_name: newColumn, column_type: columnType },
                ];
                setSelectedTable({
                    ...selectedTable,
                    columns: updatedColumns,
                });

                // Также обновим основной массив tables
                setTables((prev) =>
                    prev.map((t) =>
                        t.table_name === selectedTable.table_name
                            ? { ...t, columns: updatedColumns }
                            : t
                    )
                );

                setNewColumn("");
                addNotification("success", "Колонна успешно создана!");
            } else {
                if (data.detail && Array.isArray(data.detail)) {
                    const errorMessages = data.detail.map((err: any) => err.msg).join(", ");
                    addNotification("error", `${errorMessages}`);
                } else {
                    addNotification("error", data.detail || "Ошибка при добавлении колонок");
                }
            }
        } catch (err) {
            addNotification("error", "Ошибка соединения при добавлении колонки");
        }
    };

    // ====================== DELETE COLUMN ======================
    const deleteColumn = async (columnName: string) => {
        if (!selectedTable) return;
        if (!token || !db_name) return;

        try {
            const response = await fetch(
                `http://127.0.0.1:8000/database/${db_name}/table/${selectedTable.table_name}/column/${columnName}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (response.ok) {
                const updatedColumns = selectedTable.columns.filter(
                    (c) => c.column_name !== columnName
                );
                // Обновляем локальное selectedTable
                setSelectedTable({
                    ...selectedTable,
                    columns: updatedColumns,
                });
                // Обновляем общий список tables
                setTables((prev) =>
                    prev.map((t) =>
                        t.table_name === selectedTable.table_name
                            ? { ...t, columns: updatedColumns }
                            : t
                    )
                );
                addNotification("success", "Колонна успешно удалена!");
            }
        } catch (err) {
            console.error("Ошибка при удалении колонки:", err);
        }
    };

    // ====================== DELETE DATABASE ======================
    const deleteDatabase = async () => {
        if (!token || !db_name) return;
        try {
            const response = await fetch(`http://127.0.0.1:8000/database/${db_name}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                navigate("/databases");
            }
        } catch (err) {
            console.error("Ошибка при удалении базы:", err);
        }
    };

    // ====================== UI Helpers ======================
    const closeModal = () => {
        setSelectedTable(null);
        setNewColumn("");
    };
    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="bg-gradient-to-b from-purple-800 to-gray-900 flex-grow text-white p-6 flex flex-col items-center">

                <div className="flex items-center flex-wrap gap-4 mb-8 justify-between">
                    <h1 className="text-3xl md:text-4xl font-bold text-purple-100 tracking-wide drop-shadow-md">
                        Таблицы в{" "}
                        <span className="text-4xl font-bold bg-gradient-to-br from-purple-500 to-blue-300  backdrop-blur text-purple-900 px-3 rounded-xl shadow-inner">
                            {db_name}
                        </span>
                    </h1>

                    <div className="flex gap-3">
                        <Link
                            to={`/database/${db_name}/chat`}
                            className="p-3 rounded-full bg-gradient-to-br from-green-600 to-blue-400 text-white hover:bg-white hover:text-green-200 hover:scale-101 shadow-lg transition-all duration-300 hover:opacity-80"
                            title="Перейти в чат"
                        >
                            <MessageCircleCode size={26} />
                        </Link>

                        <button
                            onClick={() => setIsConfirmModalOpen(true)}
                            className="p-3 rounded-full bg-gradient-to-br from-orange-500 to-red-400 text-white hover:bg-white hover:text-red-200 shadow-lg hover:scale-101  transition-all duration-300 cursor-pointer hover:opacity-80"
                            title="Удалить базу данных"
                        >
                            <Trash2 size={26} />
                        </button>
                    </div>
                </div>


                {/* Список таблиц */}
                {tables.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-gray-300">
                        <p className="text-xl mb-4 italic text-purple-200">Таблиц пока нет.</p>
                        <div className="flex items-center space-x-3">
                            {!showInput ? (
                                <button
                                    onClick={() => setShowInput(true)}
                                    className="bg-gradient-to-br from-purple-500 to-blue-300  text-purple-900 px-4 py-2 rounded-lg transition-all text-2xl font-bold hover:scale-103 hover:text-purple-900/85 cursor-pointer"
                                >
                                    Создать
                                </button>
                            ) : (
                                <>
                                    <input
                                        type="text"
                                        value={newTable}
                                        onChange={(e) => setNewTable(e.target.value)}
                                        placeholder="Название таблицы"
                                        className="p-3 rounded-md border border-white/30 focus:outline-none hover:bg-white/10 transition-all"
                                    />
                                    <button
                                        onClick={addTable}
                                        className="text-white font-bold rounded-full hover:text-green-400 transition-all duration-600 ease-in-out cursor-pointer"
                                    >
                                        <CirclePlus size={40} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                ) : (
                    <>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                            {displayedTables.map((table) => (
                                <li
                                    key={table.table_name}
                                    className="bg-white/5 backdrop-blur p-4 rounded-md text-white shadow-2xl border border-white/13 italic flex justify-between items-center transition-all hover:scale-102 hover:bg-white/10"
                                >
                                    <span className="font-semibold text-lg">{table.table_name}</span>
                                    <div className="flex gap-4">
                                        <motion.div whileHover={{ rotate: 60 }} className="cursor-pointer" onClick={() => fetchColumns(table.table_name)}>
                                            <Settings size={24} />
                                        </motion.div>
                                        <motion.div whileHover={{ scale: 1.1 }} className="cursor-pointer text-red-400 hover:text-red-400/80" onClick={() => deleteTable(table.table_name)}>
                                            <Trash2 size={24} />
                                        </motion.div>
                                    </div>
                                </li>
                            ))}


                            {/* Кнопка добавления таблицы */}
                            <li className="bg-white/5 backdrop-blur p-4 rounded-md text-white shadow-2xl border border-white/13 flex justify-center items-center transition-all hover:scale-102 hover:bg-white/10">
                                {!showInput ? (
                                    // Когда showInput = false, показываем только кнопку "+"
                                    <button
                                        onClick={() => setShowInput(true)}
                                        className="text-green-400 hover:text-green-300 transition cursor-pointer"
                                    >
                                        <CirclePlus size={29} />
                                    </button>
                                ) : (
                                    // Когда showInput = true, плавно показываем инпут и кнопку "+"
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }} // Исходное состояние (скрыто и уменьшено)
                                        animate={{ opacity: 1, scale: 1 }} // Анимация появления
                                        transition={{ duration: 0.3, ease: "easeOut" }} // Плавный переход
                                        className="flex items-center gap-2 w-full"
                                    >
                                        <input
                                            type="text"
                                            value={newTable}
                                            onChange={(e) => setNewTable(e.target.value)}
                                            placeholder="Название таблицы"
                                            className="flex-grow w-1 rounded-md border border-white/20 placeholder-white/40 text-white text-center focus:outline-none"
                                        />
                                        <button
                                            onClick={addTable}
                                            className="text-green-400 hover:text-green-300 transition cursor-pointer"
                                        >
                                            <CirclePlus size={29} />
                                        </button>
                                    </motion.div>
                                )}
                            </li>
                        </ul>
                    </>
                )}

                {/* Кнопки пагинации */}
                {tables.length > itemsPerPage && (
                    <div className="flex space-x-4 mt-8">
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
            </main>

            {/* Модальное окно подтверждения удаления базы */}
            {
                isConfirmModalOpen && (
                    <div className="fixed inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-lg z-30 transition">
                        <div className="text-white border border-white/30 p-4 rounded-lg shadow-lg w-85">
                            <h2 className="text-xl font-bold mb-3 text-center">Удалить базу данных?</h2>
                            <p className="text-center text-gray-300 mb-8 italic">Это действие необратимо.</p>
                            <div className="flex justify-between gap-x-8">
                                <button
                                    onClick={() => setIsConfirmModalOpen(false)}
                                    className="w-full border border-white/30 bg-gray-400/5 hover:bg-gray-400/10 transition text-white py-2 px-4 rounded-md cursor-pointer"
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={confirmDeleteDatabase}
                                    className="w-full border border-red-500/60 bg-red-600/5 hover:bg-red-600/10 transition text-red-500 py-2 px-4 rounded-md cursor-pointer"
                                >
                                    Удалить
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }


            {/* Модальное окно для колонок в выбранной таблице */}
            {selectedTable && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-lg z-30 transition">
                    <div
                        className={`border border-white/30 p-6 text-gray-800 rounded-lg shadow-lg relative flex flex-col transition-all duration-500 ease-in-out ${selectedTable.columns.length === 0 ? "w-[400px]" : "w-[800px]"
                            }`}
                    >
                        <button
                            onClick={closeModal}
                            className="absolute top-2 right-3 text-white/30 hover:text-red-400 cursor-pointer"
                        >
                            ✕
                        </button>

                        {selectedTable.columns.length === 0 ? (
                            // Если колонок нет, отображаем только форму по центру
                            <div className="flex flex-col items-center text-white">
                                <h3 className="text-xl font-extrabold mb-5 text-center text-purple-300">Добавить колонку</h3>
                                <input
                                    type="text"
                                    value={newColumn}
                                    onChange={(e) => setNewColumn(e.target.value)}
                                    placeholder="Название колонки"
                                    className="p-4 border border-white/40 hover:bg-white/10 transition-all rounded-md w-full mb-3 italic focus:outline-none"
                                />
                                <select
                                    value={columnType}
                                    onChange={(e) => setColumnType(e.target.value)}
                                    className="p-4 border border-white/40 rounded-md hover:bg-white/10 transition-all w-full mb-3 appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                    <option value="VARCHAR" className="bg-gray-800">VARCHAR</option>
                                    <option value="INT" className="bg-gray-800">INT</option>
                                    <option value="BOOLEAN" className="bg-gray-800">BOOLEAN</option>
                                    <option value="DATE" className="bg-gray-800">DATE</option>
                                    <option value="TEXT" className="bg-gray-800">TEXT</option>
                                </select>
                                <button
                                    onClick={addColumn}
                                    className="w-full bg-gradient-to-br from-purple-500 to-blue-300 text-purple-100 hover:scale-101 transition-al px-4 py-2 rounded-md hover:bg-gray-800 hover:text-purple-50 cursor-pointer"
                                >
                                    Добавить
                                </button>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-3xl font-bold mb-6 text-center text-white">
                                    Колонки в <span className="font-extrabold text-4xl text-purple-400">{selectedTable.table_name}</span>
                                </h2>
                                <div className="flex text-white">
                                    <div className="flex-1 overflow-y-auto max-h-100 pr-3 scrollbar-thin scrollbar-thumb-white scrollbar-track-transparent">
                                        <ul className="space-y-2 mb-4">
                                            {selectedTable.columns.map((col) => (
                                                <li
                                                    key={col.column_name}
                                                    className="p-2 border border-white/40 rounded-md flex justify-between items-center"
                                                >
                                                    <span>
                                                        {col.column_name} <i className="text-purple-400"> [{col.column_type}]</i>
                                                    </span>
                                                    <button
                                                        onClick={() => deleteColumn(col.column_name)}
                                                        className="hover:text-red-400 hover:scale-102 transition cursor-pointer"
                                                    >
                                                        ✕
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="w-1/2 border-l border-white/40 ml-3 pl-5">
                                        <h3 className="text-lg font-bold mb-2 text-purple-300">Добавить колонку</h3>
                                        <input
                                            type="text"
                                            value={newColumn}
                                            onChange={(e) => setNewColumn(e.target.value)}
                                            placeholder="Название колонки"
                                            className="p-4 border border-white/40 rounded-md w-full mb-2 italic focus:outline-none"
                                        />
                                        <select
                                            value={columnType}
                                            onChange={(e) => setColumnType(e.target.value)}
                                            className="p-4 border border-white/40 rounded-md w-full mb-2 appearance-none cursor-pointer text-white placeholder-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        >
                                            <option className="bg-gray-800 text-white" value="VARCHAR">VARCHAR</option>
                                            <option className="bg-gray-800 text-white" value="INT">INT</option>
                                            <option className="bg-gray-800 text-white" value="BOOLEAN">BOOLEAN</option>
                                            <option className="bg-gray-800 text-white" value="DATE">DATE</option>
                                            <option className="bg-gray-800 text-white" value="TEXT">TEXT</option>
                                        </select>
                                        <button
                                            onClick={addColumn}
                                            className="w-full bg-gradient-to-br from-purple-500 to-blue-300 text-purple-100 hover:scale-101 transition-all hover:text-purple-50 px-4 py-2 rounded-md hover:bg-gray-800 cursor-pointer"
                                        >
                                            Добавить
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
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

            <Footer />
        </div >
    );
}