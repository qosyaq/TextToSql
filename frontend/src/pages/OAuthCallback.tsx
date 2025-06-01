import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

export default function OAuthCallback() {
  const { provider } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = params.get("code");
    if (!code || !provider) {
      setError("Отсутствует код авторизации");
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API_URL}/user/oauth/${provider}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ oauth_token: code }),
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          localStorage.setItem("token", data.token);
          navigate("/databases", { replace: true, state: { success: `Вход через ${provider}` } });
        } else {
          console.error("OAuth error:", res.status, data);
          setError(
            typeof data.detail === "string"
              ? data.detail
              : `OAuth вход не удался (${res.status})`,
          );
        }
      } catch (e) {
        console.error("Network error", e);
        setError("Ошибка сети");
      }
    })();
  }, [params, provider, navigate]);

  if (error) {
    return (
      <ErrorScreen error={error} onBack={() => navigate("/user/login")} />
    );
  }

  return <LoadingScreen text={`Входим через ${provider}…`} />;
}

function ErrorScreen({ error, onBack }: { error: string; onBack: () => void }) {
  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-r from-purple-800 to-blue-400">
      <div className="bg-white rounded-lg p-8 shadow-lg space-y-4 max-w-sm text-center">
        <h1 className="text-xl font-semibold text-red-600">Ошибка</h1>
        <p className="text-gray-700 break-words">{error}</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 rounded-md bg-purple-700 text-white hover:bg-purple-800">
          Назад к входу
        </button>
      </div>
    </div>
  );
}

function LoadingScreen({ text }: { text: string }) {
  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-r from-purple-800 to-blue-400">
      <div className="flex flex-col items-center gap-4 text-white">
        <AiOutlineLoading3Quarters className="animate-spin text-4xl" />
        <p>{text}</p>
      </div>
    </div>
  );
}
