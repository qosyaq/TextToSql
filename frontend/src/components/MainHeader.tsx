import { Link } from "react-router-dom";
import { Brain } from "lucide-react";
import { useEffect, useState } from "react";
export default function Header() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        setIsAuthenticated(!!token);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        window.location.href = "/user/login";
    };

    return (
        <header className="bg-gradient-to-r from-blue-600 to-purple-800 p-4 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
                <Link
                    to="/"
                    className="text-white text-2xl font-bold tracking-wide hover:scale-105 transition-transform flex items-center gap-2"
                >
                    <Brain className="w-6 h-6" />
                    Text-to-SQL
                </Link>

                <nav className="flex space-x-3">
                    {!isAuthenticated ? (
                        <>
                            <Link to="/" className="px-4 py-2 bg-white text-gray-900 font-semibold rounded-lg shadow-md hover:bg-gray-200 transition">
                                Главная
                            </Link>
                            <Link to="/user/register" className="px-4 py-2 bg-white text-gray-900 font-semibold rounded-lg shadow-md hover:bg-gray-200 transition">
                                Регистрация
                            </Link>

                            <Link to="/user/login" className="px-4 py-2 bg-white text-gray-900 font-semibold rounded-lg shadow-md hover:bg-gray-200 transition">
                                Войти
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link to="/databases" className="px-4 py-2 bg-white text-gray-900 font-semibold rounded-lg shadow-md hover:bg-gray-200 transition">
                                Базы данных
                            </Link>
                            <Link to="/user/profile" className="px-4 py-2 bg-white text-gray-900 font-semibold rounded-lg shadow-md hover:bg-gray-200 transition">
                                Профиль
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 bg-gray-800 text-white font-semibold rounded-lg shadow-md hover:bg-gray-900 transition">
                                Выйти
                            </button>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}
