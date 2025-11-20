import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Auth() {
  const [accessKey, setAccessKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key: accessKey.trim() }),  // <<< SEM UPPERCASE
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Chave inválida");
        setLoading(false);
        return;
      }

      // Salva sessão
      localStorage.setItem("session_key", data.token);

      // Vai para dashboard
      navigate("/dashboard");

    } catch (err) {
      setError("Erro ao conectar ao servidor.");
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-box">

        <h1>Prompt Manager Ultra</h1>
        <p className="subtitle">Acesso Restrito</p>

        <input
          type="text"
          placeholder="Chave de Acesso"
          value={accessKey}
          onChange={(e) => setAccessKey(e.target.value.trim())}  // <<< CORRIGIDO
        />

        {error && <p className="error">{error}</p>}

        <button disabled={loading} onClick={handleLogin}>
          {loading ? "Verificando..." : "Acessar Sistema"}
        </button>

      </div>
    </div>
  );
}
