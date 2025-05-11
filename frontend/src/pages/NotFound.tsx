import { Link } from "react-router-dom";
import Header from "../components/LoginHeader";
import Footer from "../components/Footer";

export default function NotFound() {
    return (
        <div className="flex flex-col min-h-screen text-white">
            <Header /> {/* Хедер */}

            <main className="flex-1 flex flex-col items-center justify-center text-center bg-gradient-to-r from-purple-800 to-blue-400 p-4">
                <h1 className="text-7xl font-extrabold">404</h1>
                <p className="text-xl mt-2 text-gray-300">Страница не найдена</p>
                <Link
                    to="/"
                    className="mt-4 px-6 py-3 text-lg font-bold bg-white text-gray-900 rounded-lg shadow-lg transition transform hover:scale-110 hover:bg-pink-400 hover:text-white duration-300 ease-in-ou"
                >
                    На главную
                </Link>
            </main>

            <Footer /> {/* Футер */}
        </div>
    );
}