"use client";

import { useState } from "react";

export default function ListingTestPage() {
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim()) {
      setMessage("El nombre del anuncio es obligatorio");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/listings/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          professionalProfileId: "47a0f48c-7cd2-470c-a1f5-16cec611474c",
          displayName,
          description: "Descripción de prueba",
          yearsExperience: "EXPERIENCE_10_20",
          availability: "MONDAY_TO_FRIDAY",
          budgetType: "FREE",
          postalCode: "08001",
          city: "Barcelona",
          citySlug: "barcelona",
          province: "Barcelona",
          provinceSlug: "barcelona",
          latitude: 41.3851,
          longitude: 2.1734,
          serviceRadiusKm: 5,
          specialties: [
            {
              specialtyId: "11111111-1111-1111-1111-111111111111",
              pricePerM2: 10,
            },
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setLoading(false);
        setMessage(data.error || "Error al crear el anuncio");
        return;
      }

      setLoading(false);
      setMessage("Listing creado correctamente");
      setDisplayName("");
    } catch (error) {
      setLoading(false);
      setMessage("Error de conexión");
    }
  };

  return (
    <main style={{ padding: "40px", maxWidth: "500px" }}>
      <h1>Crear anuncio (test)</h1>

      <form
        onSubmit={handleSubmit}
        style={{ display: "grid", gap: "16px", marginTop: "24px" }}
      >
        <div>
          <label>Nombre del anuncio</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            style={{
              display: "block",
              width: "100%",
              padding: "10px",
              marginTop: "8px",
            }}
          />
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
          {loading ? "Creando..." : "Crear anuncio"}
        </button>
      </form>

      {message && <p style={{ marginTop: "20px" }}>{message}</p>}
    </main>
  );
}