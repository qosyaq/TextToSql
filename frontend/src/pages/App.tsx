import { Link } from "react-router-dom";
import Header from "../components/MainHeader";
import Footer from "../components/Footer";
import { useState, useEffect } from "react";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Верхняя навигация */}
      <Header />

      {/* Основной контент на весь экран */}
      <main className="flex-grow flex flex-col items-center justify-center text-center bg-gradient-to-r from-blue-600 to-purple-800 text-white p-6">
        <h1 className="text-5xl font-extrabold mb-4 animate-fade-in drop-shadow-lg">
          Добро пожаловать в <span className="text-pink-400">Text-to-SQL</span>
        </h1>

        <p className="text-lg max-w-2xl mb-6 opacity-90">
          Преобразуйте ваши текстовые запросы в SQL одним нажатием!
          Идеальный инструмент для разработчиков, аналитиков данных и студентов.
        </p>

        {!isAuthenticated ? (<Link to="/user/login">
          <button className="px-6 py-3 text-lg font-bold bg-white text-gray-900 rounded-lg shadow-lg transition transform hover:scale-110 hover:bg-pink-400 hover:text-white duration-300 ease-in-out cursor-pointer">
            Get Started
          </button>
        </Link>) : (
          <Link to="/databases">
            <button className="px-6 py-3 text-lg font-bold bg-white text-gray-900 rounded-lg shadow-lg transition transform hover:scale-110 hover:bg-pink-400 hover:text-white duration-300 ease-in-out cursor-pointer">
              Get Started
            </button>
          </Link>
        )}


      </main>

      {/* Нижний футер */}
      <Footer />
    </div>
  );
}
