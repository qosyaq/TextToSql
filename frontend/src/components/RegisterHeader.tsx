import { Link } from "react-router-dom";
import { Brain, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="bg-gradient-to-r from-blue-800 to-purple-400 p-4 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
                {/*Логотип*/}
                <Link
                    to="/"
                    className="text-white text-2xl font-bold tracking-wide hover:scale-105 transition-transform flex items-center gap-2"
                >
                    <Brain className="w-6 h-6" />
                    Text-to-SQL
                </Link>

                {/*Бургер-кнопка*/}
                <button
                    className="lg:hidden text-white"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>

                {/*Мобильное меню*/}
                <nav
                    className={`flex flex-col gap-2 absolute top-16 left-0 right-0 z-50 bg-gradient-to-r from-blue-800 to-purple-400 p-4 rounded-lg shadow-lg transition-all duration-300 lg:hidden
                    ${isMenuOpen ? "flex" : "hidden"}`}
                >
                    <Link to="/" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 bg-white text-gray-900 font-semibold rounded-lg shadow-md hover:bg-gray-200 transition">
                        Главная
                    </Link>
                    <Link to="/user/register" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 bg-white text-gray-900 font-semibold rounded-lg shadow-md hover:bg-gray-200 transition">
                        Регистрация
                    </Link>
                    <Link to="/user/login" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 bg-white text-gray-900 font-semibold rounded-lg shadow-md hover:bg-gray-200 transition">
                        Войти
                    </Link>
                </nav>

                {/*Десктопное меню*/}
                <nav className="hidden lg:flex space-x-4">
                    <Link to="/" className="px-4 py-2 bg-white text-gray-900 font-semibold rounded-lg shadow-md hover:bg-gray-200 transition">
                        Главная
                    </Link>
                    <Link to="/user/register" className="px-4 py-2 bg-white text-gray-900 font-semibold rounded-lg shadow-md hover:bg-gray-200 transition">
                        Регистрация
                    </Link>
                    <Link to="/user/login" className="px-4 py-2 bg-white text-gray-900 font-semibold rounded-lg shadow-md hover:bg-gray-200 transition">
                        Войти
                    </Link>
                </nav>
            </div>
        </header>
    );
}
