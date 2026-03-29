"use client";

import { useEffect, useState } from "react";

type Listing = {
  id: string;
  displayName: string;
  status: string;
  city: string;
  postalCode: string;
};

type ProfessionalProfile = {
  id: string;
  listings?: Listing[];
};

type UserData = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  professionalProfile: ProfessionalProfile | null;
};

export default function DashboardPage() {
  const [message, setMessage] = useState("Sincronizando usuario...");
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncAndFetchUser = async () => {
      try {
        const syncResponse = await fetch("/api/sync-user", {
          method: "POST",
        });

        const syncData = await syncResponse.json();

        if (!syncResponse.ok) {
          setMessage(syncData.error || "Error al sincronizar usuario");
          setLoading(false);
          return;
        }

        setMessage(syncData.message || "Usuario sincronizado correctamente");

        const meResponse = await fetch("/api/me");
        const meData = await meResponse.json();

        if (!meResponse.ok) {
          setMessage(meData.error || "Error al obtener datos del usuario");
          setLoading(false);
          return;
        }

        setUser(meData.user);
        setLoading(false);
      } catch (error) {
        setMessage("Error de conexión con el servidor");
        setLoading(false);
      }
    };

    syncAndFetchUser();
  }, []);

  if (loading) {
    return (
      <main style={{ padding: "40px" }}>
        <h1>Mi panel</h1>
        <p>{message}</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "40px", maxWidth: "900px" }}>
      <h1>Mi panel</h1>

      {user && (
        <div style={{ marginTop: "24px" }}>
          <p>Hola, {user.name}</p>
          <p>{message}</p>

          <div style={{ marginTop: "32px" }}>
            <h2>Datos en base de datos</h2>
            <p>
              <strong>ID:</strong> {user.id}
            </p>
            <p>
              <strong>Nombre:</strong> {user.name}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Rol:</strong> {user.role}
            </p>
            <p>
              <strong>Estado:</strong> {user.status}
            </p>
            <p>
              <strong>Perfil profesional:</strong>{" "}
              {user.professionalProfile ? "Sí" : "No"}
            </p>

            {user.role === "PROFESSIONAL" ? (
              <div style={{ marginTop: "24px" }}>
                <p>
                  <strong>Cuenta profesional detectada.</strong>
                </p>
                <p>Este usuario sí podrá crear anuncios.</p>

                <div style={{ marginTop: "32px" }}>
                  <h2>Mis anuncios</h2>

                  {user.professionalProfile?.listings &&
                  user.professionalProfile.listings.length > 0 ? (
                    <div style={{ marginTop: "16px", display: "grid", gap: "16px" }}>
                      {user.professionalProfile.listings.map((listing) => (
                        <div
                          key={listing.id}
                          style={{
                            border: "1px solid #ccc",
                            borderRadius: "8px",
                            padding: "16px",
                          }}
                        >
                          <p>
                            <strong>Nombre:</strong> {listing.displayName}
                          </p>
                          <p>
                            <strong>Estado:</strong> {listing.status}
                          </p>
                          <p>
                            <strong>Ciudad:</strong> {listing.city}
                          </p>
                          <p>
                            <strong>Código postal:</strong> {listing.postalCode}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ marginTop: "16px" }}>
                      Todavía no tienes anuncios creados.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ marginTop: "24px" }}>
                <p>
                  <strong>Cuenta particular detectada.</strong>
                </p>
                <p>Este usuario no puede crear anuncios.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}