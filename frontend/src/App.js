import React from "react";
import { useState } from "react";
import { FaDatabase, FaBars, FaTimes, FaHome, FaSignInAlt, FaInfoCircle } from "react-icons/fa";

export default function App() {
  const [query, setQuery] = useState("");
  const [sqlQuery, setSqlQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const handleConvert = () => {
    setSqlQuery(`SELECT * FROM example_table WHERE condition = '${query}';`);
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-200">
      {/* Боковое меню */}
      <div className="fixed top-0 left-0 h-full z-50">
        <button 
          className="m-4 p-2 text-gray-700 hover:text-gray-900 focus:outline-none" 
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
        {menuOpen && (
          <div className="bg-white shadow-md h-full w-48 p-4 flex flex-col gap-4">
            <a href="#" className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
              <FaHome /> Home
            </a>
            <a href="#" className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
              <FaSignInAlt /> Login
            </a>
            <a href="#" className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
              <FaInfoCircle /> About Us
            </a>
          </div>
        )}
      </div>
      
      {/* Основной контейнер */}
      <div className="w-full max-w-2xl bg-white p-6 rounded-lg shadow-lg text-center">
        {/* Заголовок с иконкой */}
        <h1 className="text-3xl font-bold text-gray-800 flex justify-center items-center gap-2 mb-4">
          <FaDatabase size={32} className="text-gray-800" /> Text to SQL
        </h1>

        {/* Описание */}
        <p className="text-gray-600 text-lg mb-4">Enter your natural language query and convert it into SQL.</p>

        {/* Поле для ввода запроса */}
        <textarea
          className="w-full p-4 border rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          rows="5"
          placeholder="Describe your query..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        ></textarea>

        {/* Кнопка конвертации */}
        <button
          onClick={handleConvert}
          className="mt-4 px-6 py-3 bg-gray-800 text-white rounded-md hover:bg-gray-900"
        >
          Generate SQL query
        </button>

        {/* Поле вывода SQL запроса */}
        {sqlQuery && (
          <div className="mt-4 p-3 border rounded-md bg-gray-50 text-gray-800">
            <code>{sqlQuery}</code>
          </div>
        )}
      </div>
    </div>
  );
}
