import { Link } from "react-router-dom";
import { Brain } from "lucide-react";
export default function Header() {

    return (
        <header className="bg-gradient-to-r from-blue-800 to-purple-400 p-4 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
                <Link
                    to="/"
                    className="text-white text-2xl font-bold tracking-wide hover:scale-105 transition-transform flex items-center gap-2"
                >
                    <Brain className="w-6 h-6" />
                    Text-to-SQL
                </Link>

                <nav className="flex space-x-4">
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
