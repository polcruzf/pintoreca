"use client";

import { useState } from "react";

export default function SyncTestPage() {
  const [message, setMessage] = useState("");

  const syncUser = async () => {
    try {
      const res = await fetch("/api/sync-user", {
        method: "POST",
      });

      const data = await res.json();

      if (data.message) {
        setMessage(data.message);
      } else if (data.error) {
        setMessage(data.error);
      } else {
        setMessage("Respuesta recibida, pero no reconocida");
      }
    } catch (error) {
      setMessage("Error al conectar con la API");
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>Prueba de sincronización</h1>

      <button onClick={syncUser} style={{ padding: "10px 20px", marginTop: "20px" }}>
        Sincronizar usuario
      </button>

      {message && <p style={{ marginTop: "20px" }}>{message}</p>}
    </div>
  );
}