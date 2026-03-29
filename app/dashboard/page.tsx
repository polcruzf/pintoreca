"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

type DbUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  professionalProfile?: {
    id: string;
  } | null;
};

export default function DashboardPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [syncMessage, setSyncMessage] = useState("Sincronizando...");
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [dbError, setDbError] = useState("");

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setSyncMessage("No has iniciado sesión");
      return;
    }

    const loadData = async () => {
      try {
        const syncRes = await fetch("/api/sync-user", {
          method: "POST",
        });

        const syncData = await syncRes.json();

        if (syncData.message) {
          setSyncMessage(syncData.message);
        } else if (syncData.error) {
          setSyncMessage(syncData.error);
        } else {
          setSyncMessage("Respuesta no reconocida");
        }

        const meRes = await fetch("/api/me");
        const meData = await meRes.json();

        if (meData.user) {
          setDbUser(meData.user);
          setDbError("");
        } else if (meData.error) {
          setDbError(meData.error);
        } else {
          setDbError("No se pudieron cargar los datos del usuario");
        }
      } catch (error) {
        setSyncMessage("Error al sincronizar usuario");
        setDbError("Error al cargar los datos de base de datos");
      }
    };

    loadData();
  }, [isLoaded, isSignedIn]);

  return (
    <div style={{ padding: "40px" }}>
      <h1>Mi panel</h1>

      {isSignedIn && <p>Hola, {user?.firstName || "usuario"}</p>}

      <p>{syncMessage}</p>

      <hr style={{ margin: "30px 0" }} />

      <h2>Datos en base de datos</h2>

      {dbError && <p>{dbError}</p>}

{dbUser && (
  <div>
    <p><strong>ID:</strong> {dbUser.id}</p>
    <p><strong>Nombre:</strong> {dbUser.name}</p>
    <p><strong>Email:</strong> {dbUser.email}</p>
    <p><strong>Rol:</strong> {dbUser.role}</p>
    <p><strong>Estado:</strong> {dbUser.status}</p>
    <p>
      <strong>Perfil profesional:</strong>{" "}
      {dbUser.professionalProfile ? "Sí" : "No"}
    </p>
{dbUser.role === "PROFESSIONAL" ? (
  <div style={{ marginTop: "20px" }}>
    <p><strong>Cuenta profesional detectada.</strong></p>
    <p>Este usuario sí podrá crear anuncios.</p>
  </div>
) : (
  <div style={{ marginTop: "20px" }}>
    <p><strong>Cuenta particular detectada.</strong></p>
    <p>Este usuario no puede crear anuncios.</p>
  </div>
)}
   
  </div>
)}
    </div>
  );
}