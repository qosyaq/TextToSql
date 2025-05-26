import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function PageTitleSetter() {
    const location = useLocation();

    useEffect(() => {
        const path = location.pathname;

        let title = "Text-to-SQL"; // значение по умолчанию

        if (path === "/") {
            title = "Главная — Text-to-SQL";
        } else if (path === "/user/register") {
            title = "Регистрация — Text-to-SQL";
        } else if (path === "/user/login") {
            title = "Вход — Text-to-SQL";
        } else if (path === "/databases") {
            title = "Базы данных — Text-to-SQL";
        } else if (path === "/user/profile") {
            title = "Профиль — Text-to-SQL";
        } else if (/^\/database\/[^/]+\/chat$/.test(path)) {
            title = "Чат — Text-to-SQL";
        } else if (/^\/database\/[^/]+\/tables$/.test(path)) {
            title = "Таблицы — Text-to-SQL";
        }

        document.title = title;
    }, [location]);

    return null;
}
