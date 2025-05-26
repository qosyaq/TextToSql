import { Link } from "react-router-dom";
import { Brain, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function Header() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

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
        <header className="bg-gradient-to-r from-purple-800 to-blue-400 p-4 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
                <Link
                    to="/"
                    className="text-white text-2xl font-bold tracking-wide hover:scale-105 transition-transform flex items-center gap-2"
                >
                    <Brain className="w-6 h-6" />
                    Text-to-SQL
                </Link>

                {/*Бургер-кнопка только для мобильных*/}
                <button
                    className="lg:hidden text-white"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>

                {/*Мобильный nav*/}
                <nav
                    className={`flex-col gap-2 absolute top-16 left-0 right-0 
                        p-4 rounded-lg shadow-lg transition-all duration-300 z-50
                        bg-gradient-to-r from-purple-800 to-blue-400 backdrop-blur-xl
                        ${isMenuOpen ? "flex" : "hidden"} lg:hidden`}
                >
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
                                className="px-4 py-2 bg-gray-800 text-white font-semibold rounded-lg shadow-md hover:bg-gray-900 transition cursor-pointer"
                            >
                                Выйти
                            </button>
                        </>
                    )}
                </nav>

                {/*Десктоп nav*/}
                <nav className="hidden lg:flex flex-row gap-4 items-center">
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
                                className="px-4 py-2 bg-gray-800 text-white font-semibold rounded-lg shadow-md hover:bg-gray-900 transition cursor-pointer"
                            >
                                Выйти
                            </button>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}
