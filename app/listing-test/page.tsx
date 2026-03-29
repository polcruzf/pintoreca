"use client";

import { useEffect, useState } from "react";

type UserData = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  professionalProfile: {
    id: string;
  } | null;
};

type Specialty = {
  id: string;
  name: string;
};

export default function ListingTestPage() {
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState("");
  const [pricePerM2, setPricePerM2] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const userResponse = await fetch("/api/me");
        const userData = await userResponse.json();

        if (!userResponse.ok) {
          setMessage(userData.error || "No se pudo obtener el usuario");
          setCheckingUser(false);
          return;
        }

        setUser(userData.user);

        const specialtiesResponse = await fetch("/api/specialties");
        const specialtiesData = await specialtiesResponse.json();

        if (!specialtiesResponse.ok) {
          setMessage(
            specialtiesData.error || "No se pudieron obtener las especialidades"
          );
          setCheckingUser(false);
          return;
        }

        setSpecialties(specialtiesData.specialties);

        if (specialtiesData.specialties.length > 0) {
          setSelectedSpecialtyId(specialtiesData.specialties[0].id);
        }

        setCheckingUser(false);
      } catch (error) {
        setMessage("Error al cargar los datos iniciales");
        setCheckingUser(false);
      }
    };

    fetchInitialData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim()) {
      setMessage("El nombre del anuncio es obligatorio");
      return;
    }

    if (!description.trim()) {
      setMessage("La descripción es obligatoria");
      return;
    }

    if (!city.trim()) {
      setMessage("La ciudad es obligatoria");
      return;
    }

    if (!postalCode.trim()) {
      setMessage("El código postal es obligatorio");
      return;
    }

    if (!selectedSpecialtyId) {
      setMessage("Debes seleccionar una especialidad");
      return;
    }

    if (!pricePerM2 || Number(pricePerM2) <= 0) {
      setMessage("Debes indicar un precio por m² válido");
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
          displayName,
          description,
          yearsExperience: "EXPERIENCE_10_20",
          availability: "MONDAY_TO_FRIDAY",
          budgetType: "FREE",
          postalCode,
          city,
          citySlug: city.toLowerCase().trim().replace(/\s+/g, "-"),
          province: city,
          provinceSlug: city.toLowerCase().trim().replace(/\s+/g, "-"),
          latitude: 41.3851,
          longitude: 2.1734,
          serviceRadiusKm: 5,
          specialties: [
            {
              specialtyId: selectedSpecialtyId,
              pricePerM2: Number(pricePerM2),
            },
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Error al crear el anuncio");
        setLoading(false);
        return;
      }

      setMessage("Listing creado correctamente");
      setDisplayName("");
      setDescription("");
      setCity("");
      setPostalCode("");
      setPricePerM2("");
      setLoading(false);
    } catch (error) {
      setMessage("Error de conexión");
      setLoading(false);
    }
  };

  if (checkingUser) {
    return (
      <main style={{ padding: "40px", maxWidth: "600px" }}>
        <h1>Crear anuncio (test)</h1>
        <p>Comprobando usuario...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main style={{ padding: "40px", maxWidth: "600px" }}>
        <h1>Crear anuncio (test)</h1>
        <p>{message || "No se pudo cargar el usuario"}</p>
      </main>
    );
  }

  if (user.role !== "PROFESSIONAL") {
    return (
      <main style={{ padding: "40px", maxWidth: "600px" }}>
        <h1>Crear anuncio (test)</h1>
        <p>Solo las cuentas profesionales pueden acceder a esta página.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "40px", maxWidth: "600px" }}>
      <h1>Crear anuncio (test)</h1>

      <p style={{ marginTop: "12px" }}>
        Profesional detectado: <strong>{user.name}</strong>
      </p>

      <form
        onSubmit={handleSubmit}
        style={{ display: "grid", gap: "16px", marginTop: "24px" }}
      >
        <div>
          <label style={{ display: "block", marginBottom: "8px" }}>
            Nombre del anuncio
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            style={{
              display: "block",
              width: "100%",
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              backgroundColor: "#fff",
              color: "#000",
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "8px" }}>
            Descripción
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            style={{
              display: "block",
              width: "100%",
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              backgroundColor: "#fff",
              color: "#000",
              resize: "vertical",
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "8px" }}>
            Especialidad
          </label>
          <select
            value={selectedSpecialtyId}
            onChange={(e) => setSelectedSpecialtyId(e.target.value)}
            style={{
              display: "block",
              width: "100%",
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              backgroundColor: "#fff",
              color: "#000",
            }}
          >
            {specialties.map((specialty) => (
              <option key={specialty.id} value={specialty.id}>
                {specialty.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "8px" }}>
            Precio por m²
          </label>
          <input
            type="number"
            value={pricePerM2}
            onChange={(e) => setPricePerM2(e.target.value)}
            min="1"
            step="0.01"
            style={{
              display: "block",
              width: "100%",
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              backgroundColor: "#fff",
              color: "#000",
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "8px" }}>
            Ciudad
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            style={{
              display: "block",
              width: "100%",
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              backgroundColor: "#fff",
              color: "#000",
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "8px" }}>
            Código postal
          </label>
          <input
            type="text"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            style={{
              display: "block",
              width: "100%",
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              backgroundColor: "#fff",
              color: "#000",
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px 16px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
            border: "1px solid #111",
            borderRadius: "8px",
            backgroundColor: "#111",
            color: "#fff",
          }}
        >
          {loading ? "Creando..." : "Crear anuncio"}
        </button>
      </form>

      {message && <p style={{ marginTop: "20px" }}>{message}</p>}
    </main>
  );
}