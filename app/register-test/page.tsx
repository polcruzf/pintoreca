"use client";

import { useState } from "react";

export default function RegisterTestPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("USER");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      setMessage("El nombre y el email son obligatorios");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        setLoading(false);
        setMessage(data.error || "Ha ocurrido un error");
        return;
      }

      setLoading(false);
      setMessage("Usuario creado correctamente");
      setName("");
      setEmail("");
      setRole("USER");
    } catch (error) {
      setLoading(false);
      setMessage("Error al conectar con el servidor");
    }
  };

  return (
    <main style={{ padding: "40px", maxWidth: "500px" }}>
      <h1>Prueba de registro</h1>

      <form
        onSubmit={handleSubmit}
        style={{ display: "grid", gap: "16px", marginTop: "24px" }}
      >
        <div>
          <label>Nombre</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              display: "block",
              width: "100%",
              padding: "10px",
              marginTop: "8px",
            }}
          />
        </div>

        <div>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              display: "block",
              width: "100%",
              padding: "10px",
              marginTop: "8px",
            }}
          />
        </div>

        <div>
          <label>Tipo de cuenta</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{
              display: "block",
              width: "100%",
              padding: "10px",
              marginTop: "8px",
            }}
          >
            <option value="USER">Particular</option>
            <option value="PROFESSIONAL">Profesional</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Creando..." : "Crear usuario"}
        </button>
      </form>

      {message && <p style={{ marginTop: "20px" }}>{message}</p>}
    </main>
  );
}