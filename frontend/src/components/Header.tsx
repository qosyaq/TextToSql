import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Brain, Menu, X } from "lucide-react";

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
        <header className="bg-purple-800 p-4 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
                {/*Логотип*/}
                <Link
                    to="/"
                    className="text-white text-2xl font-bold tracking-wide hover:scale-105 transition-transform flex items-center gap-2"
                >
                    <Brain className="w-6 h-6" />
                    Text-to-SQL
                </Link>

                {/*Бургер-кнопка для мобильных*/}
                <button
                    className="lg:hidden text-white"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>

                {/*Мобильное меню*/}
                <nav
                    className={`flex flex-col gap-2 absolute top-16 left-0 right-0 bg-purple-800 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 lg:hidden 
                    ${isMenuOpen ? "flex" : "hidden"}`}
                >
                    {!isAuthenticated ? (
                        <>
                            <Link to="/" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 bg-white text-gray-900 font-semibold rounded-lg shadow-md hover:bg-gray-200 transition">
                                Главная
                            </Link>
                            <Link to="/user/register" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 bg-white text-gray-900 font-semibold rounded-lg shadow-md hover:bg-gray-200 transition">
                                Регистрация
                            </Link>
                            <Link to="/user/login" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 bg-white text-gray-900 font-semibold rounded-lg shadow-md hover:bg-gray-200 transition">
                                Войти
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link to="/databases" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 bg-white text-gray-900 font-semibold rounded-lg shadow-md hover:bg-gray-200 transition">
                                Базы данных
                            </Link>
                            <Link to="/user/profile" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 bg-white text-gray-900 font-semibold rounded-lg shadow-md hover:bg-gray-200 transition">
                                Профиль
                            </Link>
                            <button
                                onClick={() => {
                                    handleLogout();
                                    setIsMenuOpen(false);
                                }}
                                className="px-4 py-2 bg-gray-800 text-white font-semibold rounded-lg shadow-md hover:bg-gray-900 transition cursor-pointer"
                            >
                                Выйти
                            </button>
                        </>
                    )}
                </nav>

                {/*Десктоп меню*/}
                <nav className="hidden lg:flex space-x-4">
                    {!isAuthenticated ? (
                        <>
                            <Link to="/" className="px-4 py-2 bg-white text-gray-900 font-semibold rounded-lg shadow-md hover:bg-gray-200 transition">
                                Главная
                            </Link>
                            <Link to="/user/register" className="px-4 py-2 bg-white text-gray-900 font-semibold rounded-lg shadow-md hover:bg-gray-200 transition">
                                Регистрация
                            </Link>
                            <Link to="/user/login" className="px-4 py-2 bg-white text-gray-900 font-semibold rounded-lg shadow-md hover:bg-gray-200 transition cursor-pointer">
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
