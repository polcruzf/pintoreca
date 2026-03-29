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
const SPAIN_PROVINCES = [
  "Álava",
  "Albacete",
  "Alicante",
  "Almería",
  "Asturias",
  "Ávila",
  "Badajoz",
  "Barcelona",
  "Burgos",
  "Cáceres",
  "Cádiz",
  "Cantabria",
  "Castellón",
  "Ciudad Real",
  "Córdoba",
  "Cuenca",
  "Girona",
  "Granada",
  "Guadalajara",
  "Gipuzkoa",
  "Huelva",
  "Huesca",
  "Illes Balears",
  "Jaén",
  "A Coruña",
  "La Rioja",
  "Las Palmas",
  "León",
  "Lleida",
  "Lugo",
  "Madrid",
  "Málaga",
  "Murcia",
  "Navarra",
  "Ourense",
  "Palencia",
  "Pontevedra",
  "Salamanca",
  "Santa Cruz de Tenerife",
  "Segovia",
  "Sevilla",
  "Soria",
  "Tarragona",
  "Teruel",
  "Toledo",
  "Valencia",
  "Valladolid",
  "Bizkaia",
  "Zamora",
  "Zaragoza",
  "Ceuta",
  "Melilla",
];

export default function ListingTestPage() {
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("Barcelona");
  const [postalCode, setPostalCode] = useState("");
  const [serviceRadiusKm, setServiceRadiusKm] = useState("5");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState("");
  const [pricePerM2, setPricePerM2] = useState("");
  const [availability, setAvailability] = useState("MONDAY_TO_FRIDAY");
  const [budgetType, setBudgetType] = useState("FREE");
  const [yearsExperience, setYearsExperience] = useState("EXPERIENCE_10_20");
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
if (!province || !SPAIN_PROVINCES.includes(province)) {
  setMessage("Debes seleccionar una provincia válida");
  return;
}

if (!postalCode.trim()) {
  setMessage("El código postal es obligatorio");
  return;
}

if (!/^\d{5}$/.test(postalCode)) {
  setMessage("El código postal debe tener 5 dígitos");
  return;
}

if (!serviceRadiusKm || Number(serviceRadiusKm) <= 0) {
  setMessage("Debes indicar un radio de trabajo válido");
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
if (!acceptTerms) {
  setMessage("Debes aceptar los términos para continuar");
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
          yearsExperience,
          availability,
          budgetType,
          postalCode,
city,
citySlug: city.toLowerCase().trim().replace(/\s+/g, "-"),
province,
provinceSlug: province.toLowerCase().trim().replace(/\s+/g, "-"),
latitude: 41.3851,
longitude: 2.1734,
          serviceRadiusKm: Number(serviceRadiusKm),
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
  console.error("Error backend:", data);

  setMessage(
    data.error ||
    data.message ||
    JSON.stringify(data) ||
    "Error al crear el anuncio"
  );

  setLoading(false);
  return;
}

setMessage("✅ Anuncio creado correctamente");

setDisplayName("");
setDescription("");
setCity("");
setProvince("Barcelona");
setPostalCode("");
setServiceRadiusKm("5");
setAcceptTerms(false);
setPricePerM2("");
setAvailability("MONDAY_TO_FRIDAY");
setBudgetType("FREE");
setYearsExperience("EXPERIENCE_10_20");

if (specialties.length > 0) {
  setSelectedSpecialtyId(specialties[0].id);
}
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
      ><div
  style={{
    border: "1px solid #ddd",
    borderRadius: "12px",
    padding: "20px",
    backgroundColor: "#fafafa",
  }}
>
  <h2 style={{ marginTop: 0, marginBottom: "16px", fontSize: "18px" }}>
    Datos del anuncio
  </h2>

  <div style={{ display: "grid", gap: "16px" }}>
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
  </div>
</div>

        <div
  style={{
    border: "1px solid #ddd",
    borderRadius: "12px",
    padding: "20px",
    backgroundColor: "#fafafa",
  }}
>
  <h2 style={{ marginTop: 0, marginBottom: "16px", fontSize: "18px" }}>
    Condiciones del servicio
  </h2>

  <div style={{ display: "grid", gap: "16px" }}>
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
        Disponibilidad
      </label>
      <select
        value={availability}
        onChange={(e) => setAvailability(e.target.value)}
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
        <option value="MONDAY_TO_FRIDAY">Lunes a viernes</option>
        <option value="MONDAY_TO_SATURDAY">Lunes a sábado</option>
        <option value="MONDAY_TO_SUNDAY">Lunes a domingo</option>
      </select>
    </div>

    <div>
      <label style={{ display: "block", marginBottom: "8px" }}>
        Tipo de presupuesto
      </label>
      <select
        value={budgetType}
        onChange={(e) => setBudgetType(e.target.value)}
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
        <option value="FREE">Presupuesto gratuito</option>
        <option value="PAID">Presupuesto de pago</option>
      </select>
    </div>

    <div>
      <label style={{ display: "block", marginBottom: "8px" }}>
        Años de experiencia
      </label>
      <select
        value={yearsExperience}
        onChange={(e) => setYearsExperience(e.target.value)}
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
        <option value="EXPERIENCE_0_2">0 a 2 años</option>
        <option value="EXPERIENCE_3_5">3 a 5 años</option>
        <option value="EXPERIENCE_6_10">6 a 10 años</option>
        <option value="EXPERIENCE_10_20">10 a 20 años</option>
        <option value="EXPERIENCE_20_PLUS">Más de 20 años</option>
      </select>
    </div>
  </div>
</div>
<div
  style={{
    border: "1px solid #ddd",
    borderRadius: "12px",
    padding: "20px",
    backgroundColor: "#fafafa",
  }}
>
  <h2 style={{ marginTop: 0, marginBottom: "16px", fontSize: "18px" }}>
    Ubicación
  </h2>

  <div style={{ display: "grid", gap: "16px" }}>
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
    Provincia
  </label>
  <select
    value={province}
    onChange={(e) => setProvince(e.target.value)}
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
    {SPAIN_PROVINCES.map((provinceName) => (
      <option key={provinceName} value={provinceName}>
        {provinceName}
      </option>
    ))}
  </select>
</div>

    <div>
      <label style={{ display: "block", marginBottom: "8px" }}>
        Código postal
      </label>
      <input
        type="text"
        value={postalCode}
        onChange={(e) => {
          const value = e.target.value.replace(/\D/g, "");
          if (value.length <= 5) {
            setPostalCode(value);
          }
        }}
        maxLength={5}
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
    Radio de trabajo (km)
  </label>
  <input
    type="number"
    value={serviceRadiusKm}
    onChange={(e) => setServiceRadiusKm(e.target.value)}
    min="1"
    step="1"
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
  </div>
</div>
<label
  style={{
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    padding: "12px 0",
    fontSize: "14px",
    lineHeight: 1.4,
  }}
>
  <input
    type="checkbox"
    checked={acceptTerms}
    onChange={(e) => setAcceptTerms(e.target.checked)}
    style={{ marginTop: "3px" }}
  />
  <span>
    Confirmo que la información del anuncio es veraz y acepto los términos
    aplicables a la publicación.
  </span>
</label>
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

      {message && (
  <p
    style={{
      marginTop: "20px",
      padding: "12px",
      borderRadius: "8px",
      backgroundColor: message.includes("✅") ? "#e6f9ec" : "#fdecea",
      color: message.includes("✅") ? "#1e7e34" : "#b02a37",
      border: message.includes("✅")
        ? "1px solid #b7ebc6"
        : "1px solid #f5c2c7",
    }}
  >
    {message}
  </p>
)}
    </main>
  );
}