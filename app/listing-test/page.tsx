"use client";

import { useEffect, useRef, useState } from "react";
import imageCompression from "browser-image-compression";

type UserData = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  professionalProfile: {
  id: string;
  phone?: string | null;
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
  // Mensajes teléfono
const [phoneMessage, setPhoneMessage] = useState("");

// Mensajes anuncio
const [listingMessage, setListingMessage] = useState("");
const [imageMessages, setImageMessages] = useState<string[]>([]);
const [imageMessageType, setImageMessageType] = useState<"info" | "error">("info");
const [loading, setLoading] = useState(false);
const [phoneLoading, setPhoneLoading] = useState(false);
const [imagesOptimizing, setImagesOptimizing] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [phone, setPhone] = useState("");
  const [phoneSaved, setPhoneSaved] = useState(false);
const [images, setImages] = useState<File[]>([]);
const [imagePreviews, setImagePreviews] = useState<string[]>([]);
const [imagesTouched, setImagesTouched] = useState(false);
const [mainImageIndex, setMainImageIndex] = useState(0);
const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
const [dragInsertPosition, setDragInsertPosition] = useState<"before" | "after" | null>(null);
const draggedImageIndexRef = useRef<number | null>(null);
const transparentDragImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const userResponse = await fetch("/api/me");
        const userData = await userResponse.json();

        if (!userResponse.ok) {
          setListingMessage(userData.error || "No se pudo obtener el usuario");
          setCheckingUser(false);
          return;
        }

setUser(userData.user);

if (userData.user?.professionalProfile?.phone) {
  setPhone(userData.user.professionalProfile.phone);
  setPhoneSaved(true);
}

        const specialtiesResponse = await fetch("/api/specialties");
        const specialtiesData = await specialtiesResponse.json();

        if (!specialtiesResponse.ok) {
          setListingMessage(
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
        setListingMessage("Error al cargar los datos iniciales");
        setCheckingUser(false);
      }
    };

    fetchInitialData();
  }, []);

    const compressImagesBeforeUpload = async (files: File[]) => {
    const compressionOptions = {
      maxSizeMB: 1.2,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
      initialQuality: 0.8,
    };

    const compressedFiles = await Promise.all(
      files.map(async (file) => {
        if (!file.type.startsWith("image/")) {
          return file;
        }

        try {
          const compressedFile = await imageCompression(file, compressionOptions);
          return compressedFile;
        } catch (error) {
          console.error("Error al comprimir imagen:", file.name, error);
          return file;
        }
      })
    );

    return compressedFiles;
  };

    const processIncomingImages = async (incomingFiles: File[]) => {
    const files = Array.from(incomingFiles || []);
    if (files.length === 0) return;

    const availableSlots = 8 - images.length;

    setImagesTouched(true);
    setListingMessage("");
    setImageMessages([]);
    setImageMessageType("info");

    if (availableSlots <= 0) {
      setImageMessages(["Ya has alcanzado el máximo de 8 imágenes"]);
      setImageMessageType("error");
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSizeBytes = 5 * 1024 * 1024;
    const nextImageMessages: string[] = [];

    const incompatibleFiles = files.filter(
      (file) => !validTypes.includes(file.type)
    );

    if (incompatibleFiles.length > 0) {
      nextImageMessages.push(
        "Archivo no compatible. Solo se permiten imágenes JPG, PNG y WEBP"
      );
    }

    const oversizedFiles = files.filter(
      (file) => file.size > maxSizeBytes
    );

    if (oversizedFiles.length > 0) {
      nextImageMessages.push(
        "El tamaño de una o varias imágenes es superior a 5 MB"
      );
    }

    const validFiles = files.filter(
      (file) =>
        validTypes.includes(file.type) && file.size <= maxSizeBytes
    );

    const nonDuplicateFiles = validFiles.filter((file) => {
      return !images.some(
        (existingImage) => existingImage.name === file.name
      );
    });

    if (nonDuplicateFiles.length < validFiles.length) {
      nextImageMessages.push("Algunas imágenes duplicadas no se han añadido");
    }

    const limitedFiles = nonDuplicateFiles.slice(0, availableSlots);

    if (nonDuplicateFiles.length > availableSlots) {
      nextImageMessages.push(
        `Solo puedes añadir ${availableSlots} imagen(es) más`
      );
    }

    if (nextImageMessages.length > 0) {
      setImageMessages(nextImageMessages);
      setImageMessageType("error");
    }

    if (limitedFiles.length === 0) return;

    try {
      setImagesOptimizing(true);
      const compressedFiles = await compressImagesBeforeUpload(limitedFiles);

      setImages((prev) => [...prev, ...compressedFiles]);

      if (images.length === 0) {
        setMainImageIndex(0);
      }
    } catch (error) {
      console.error("Error al optimizar imágenes:", error);
      setImageMessages(["No se pudieron optimizar las imágenes"]);
      setImageMessageType("error");
    } finally {
      setImagesOptimizing(false);
    }
  };

    useEffect(() => {
    const previewUrls = images.map((image) => URL.createObjectURL(image));
    setImagePreviews(previewUrls);

    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [images]);

  useEffect(() => {
  const transparentPixel = new Image();
  transparentPixel.src =
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

  transparentDragImageRef.current = transparentPixel;
}, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim()) {
  setListingMessage("El nombre del anuncio es obligatorio");
  return;
}

if (displayName.trim().length < 3) {
  setListingMessage("El nombre del anuncio debe tener al menos 3 caracteres");
  return;
}

if (!description.trim()) {
  setListingMessage("La descripción es obligatoria");
  return;
}

if (description.trim().length < 10) {
  setListingMessage("La descripción debe tener al menos 10 caracteres");
  return;
}

if (!city.trim()) {
  setListingMessage("La ciudad es obligatoria");
  return;
}

if (city.trim().length < 3) {
  setListingMessage("La ciudad debe tener al menos 3 caracteres");
  return;
}
if (!province || !SPAIN_PROVINCES.includes(province)) {
  setListingMessage("Debes seleccionar una provincia válida");
  return;
}

if (!postalCode.trim()) {
  setListingMessage("El código postal es obligatorio");
  return;
}

if (!/^\d{5}$/.test(postalCode)) {
  setListingMessage("El código postal debe tener 5 dígitos");
  return;
}

if (!serviceRadiusKm || Number(serviceRadiusKm) <= 0) {
  setListingMessage("Debes indicar un radio de trabajo válido");
  return;
}

if (!selectedSpecialtyId) {
  setListingMessage("Debes seleccionar una especialidad");
  return;
}

if (!pricePerM2 || Number(pricePerM2) <= 0) {
  setListingMessage("Debes indicar un precio por m² válido");
  return;
}

if (images.length === 0) {
  setImagesTouched(true);
  setListingMessage("Debes añadir al menos 1 imagen para crear el anuncio");
  return;
}

if (!acceptTerms) {
  setListingMessage("Debes aceptar los términos para continuar");
  return;
}

setLoading(true);
setListingMessage("");
setPhoneMessage("");

    try {
const formData = new FormData();

formData.append("displayName", displayName);
formData.append("description", description);
formData.append("yearsExperience", yearsExperience);
formData.append("availability", availability);
formData.append("budgetType", budgetType);
formData.append("postalCode", postalCode);
formData.append("city", city);
formData.append("citySlug", city.toLowerCase().trim().replace(/\s+/g, "-"));
formData.append("province", province);
formData.append("provinceSlug", province.toLowerCase().trim().replace(/\s+/g, "-"));
formData.append("latitude", "41.3851");
formData.append("longitude", "2.1734");
formData.append("serviceRadiusKm", serviceRadiusKm);
formData.append("mainImageIndex", String(mainImageIndex));

formData.append(
  "specialties",
  JSON.stringify([
    {
      specialtyId: selectedSpecialtyId,
      pricePerM2: Number(pricePerM2),
    },
  ])
);

images.forEach((image) => {
  formData.append("images", image);
});

const response = await fetch("/api/listings/create", {
  method: "POST",
  body: formData,
});

      const data = await response.json();

      if (!response.ok) {
  console.error("Error backend:", data);

  setListingMessage(
    data.error ||
    data.message ||
    JSON.stringify(data) ||
    "Error al crear el anuncio"
  );

  if (
  (data.error || "").includes("teléfono profesional antes de crear un anuncio")
) {
  setPhoneSaved(false);
}

  window.scrollTo({ top: 0, behavior: "smooth" });

  setLoading(false);
  return;
}

setListingMessage("✅ Anuncio creado correctamente");
window.scrollTo({ top: 0, behavior: "smooth" });

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
setImages([]);
setImagePreviews([]);
setImagesTouched(false);
setMainImageIndex(0);

if (specialties.length > 0) {
  setSelectedSpecialtyId(specialties[0].id);
}

setLoading(false);
    } catch (error) {
      setListingMessage("Error de conexión");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setLoading(false);
    }
  };
  const handleSavePhone = async () => {
  if (!phone.trim()) {
    setPhoneMessage("El teléfono es obligatorio");
    return;
  }

  if (!/^\d{9}$/.test(phone)) {
    setPhoneMessage("El teléfono debe tener 9 dígitos");
    return;
  }

  setPhoneLoading(true);
setPhoneMessage("");
setListingMessage("");

  try {
    const res = await fetch("/api/professional/update-phone", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone }),
    });

    const data = await res.json();

    if (!res.ok) {
      setPhoneMessage(data.error || "Error al guardar el teléfono");
      setPhoneLoading(false);
      return;
    }

    setPhoneMessage("✅ Teléfono guardado correctamente");
    setPhoneSaved(true);

    setUser((prev) => {
      if (!prev || !prev.professionalProfile) {
        return prev;
      }

      return {
        ...prev,
        professionalProfile: {
          ...prev.professionalProfile,
          phone,
        },
      };
    });

    setPhoneLoading(false);
  } catch (error) {
    setPhoneMessage("Error de conexión");
    setPhoneLoading(false);
  }
};

const handleEditPhone = () => {
  setPhone(user?.professionalProfile?.phone || "");
  setPhoneSaved(false);
  setPhoneMessage("");
  setListingMessage("");
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const getFinalDropIndex = (fromIndex: number, toIndex: number) => {
  let finalToIndex = toIndex;

  if (fromIndex < toIndex) {
    finalToIndex = toIndex - 1;
  }

  return finalToIndex;
};

const moveImage = (fromIndex: number, toIndex: number) => {
  if (fromIndex < 0 || toIndex < 0) return fromIndex;
  if (fromIndex >= images.length || toIndex > images.length) return fromIndex;

  const finalToIndex = getFinalDropIndex(fromIndex, toIndex);

  if (fromIndex === finalToIndex) return finalToIndex;

  setImages((prev) => {
    const updated = [...prev];
    const [movedImage] = updated.splice(fromIndex, 1);
    updated.splice(finalToIndex, 0, movedImage);
    return updated;
  });

  if (mainImageIndex === fromIndex) {
    setMainImageIndex(finalToIndex);
  } else if (
    fromIndex < finalToIndex &&
    mainImageIndex > fromIndex &&
    mainImageIndex <= finalToIndex
  ) {
    setMainImageIndex((prev) => prev - 1);
  } else if (
    fromIndex > finalToIndex &&
    mainImageIndex >= finalToIndex &&
    mainImageIndex < fromIndex
  ) {
    setMainImageIndex((prev) => prev + 1);
  }

  return finalToIndex;
};
const preventButtonDrag = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.stopPropagation();
};
const removeImage = (indexToRemove: number) => {
  setImages((prev) => {
    const updated = prev.filter((_, i) => i !== indexToRemove);

    if (updated.length === 0) {
      setImageMessages([]);
      setImagesTouched(false);
      setMainImageIndex(0);
    } else {
      if (indexToRemove === mainImageIndex) {
        setMainImageIndex(0);
      } else if (indexToRemove < mainImageIndex) {
        setMainImageIndex((prevMainImageIndex) => prevMainImageIndex - 1);
      }
    }

    return updated;
  });
};
const setAsMainImage = (indexToSet: number) => {
  if (indexToSet < 0 || indexToSet >= images.length) return;
  if (indexToSet === mainImageIndex) return;

  setMainImageIndex(indexToSet);
};
const moveImageLeft = (indexToMove: number) => {
  if (indexToMove <= 0) return;
  moveImage(indexToMove, indexToMove - 1);
};

const moveImageRight = (indexToMove: number) => {
  if (indexToMove >= images.length - 1) return;
  moveImage(indexToMove, indexToMove + 2);
};
const resetDragState = () => {
  draggedImageIndexRef.current = null;
  setDraggedImageIndex(null);
  setDragOverIndex(null);
  setDragInsertPosition(null);
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
        <p>{listingMessage || "No se pudo cargar el usuario"}</p>
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
     {phoneMessage && (
  <p
    style={{
      marginTop: "20px",
      padding: "12px",
      borderRadius: "8px",
      backgroundColor: phoneMessage.includes("✅") ? "#e6f9ec" : "#fdecea",
      color: phoneMessage.includes("✅") ? "#1e7e34" : "#b02a37",
      border: phoneMessage.includes("✅")
        ? "1px solid #b7ebc6"
        : "1px solid #f5c2c7",
    }}
  >
    {phoneMessage}
  </p>
)} 
{phoneSaved ? (
  <div
    style={{
      border: "1px solid #b7ebc6",
      borderRadius: "12px",
      padding: "20px",
      backgroundColor: "#e6f9ec",
      marginTop: "20px",
    }}
  >
    <h2
      style={{
        marginTop: 0,
        marginBottom: "8px",
        fontSize: "16px",
        color: "#1e7e34",
      }}
    >
      ✅ Teléfono profesional ya guardado
    </h2>

    <p style={{ margin: 0, fontSize: "14px", color: "#1e7e34" }}>
      No es necesario volver a añadirlo para crear anuncios.
    </p>

    <button
      type="button"
      onClick={handleEditPhone}
      style={{
        marginTop: "12px",
        padding: "10px 14px",
        border: "1px solid #1e7e34",
        borderRadius: "8px",
        backgroundColor: "#fff",
        color: "#1e7e34",
        cursor: "pointer",
      }}
    >
      Cambiar teléfono
    </button>
  </div>
) : (
  <div
    style={{
      border: "1px solid #ddd",
      borderRadius: "12px",
      padding: "20px",
      backgroundColor: "#fff8e1",
      marginTop: "20px",
    }}
  >
    <h2 style={{ marginTop: 0, marginBottom: "12px", fontSize: "16px" }}>
      Teléfono profesional (obligatorio)
    </h2>

    <div
  style={{
    fontSize: "14px",
    marginBottom: "12px",
    padding: "12px",
    borderRadius: "8px",
    backgroundColor: "#fff3cd",
    border: "1px solid #ffe69c",
    color: "#856404",
    lineHeight: 1.4,
  }}
>
  Debes añadir y guardar tu teléfono profesional antes de poder crear anuncios.
</div>

    <div style={{ display: "flex", gap: "10px" }}>
            <input
        type="text"
        value={phone}
        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
        maxLength={9}
        placeholder="Ej: 600123456"
        className="input"
        style={{ flex: 1 }}
      />

      <button
  type="button"
  onClick={handleSavePhone}
  disabled={phoneLoading || phone.length !== 9}
  style={{
    padding: "12px 16px",
    border: "1px solid #111",
    borderRadius: "8px",
    backgroundColor: "#111",
    color: "#fff",
    cursor: phoneLoading || phone.length !== 9 ? "not-allowed" : "pointer",
    opacity: phoneLoading || phone.length !== 9 ? 0.6 : 1,
  }}
>
  {phoneLoading ? "Guardando..." : "Guardar"}
</button>
    </div>
 {phone.length > 0 && phone.length < 9 && (
  <p className="form-helper-error">
    El teléfono debe tener exactamente 9 dígitos.
  </p>
)}
  </div>
)}
{listingMessage && (
  <p
    style={{
      marginTop: "20px",
      padding: "12px",
      borderRadius: "8px",
      backgroundColor: listingMessage.includes("✅") ? "#e6f9ec" : "#fdecea",
      color: listingMessage.includes("✅") ? "#1e7e34" : "#b02a37",
      border: listingMessage.includes("✅")
        ? "1px solid #b7ebc6"
        : "1px solid #f5c2c7",
    }}
  >
    {listingMessage}
  </p>
)}
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
  <label className="label">
    Nombre del anuncio <span className="required">*</span>
  </label>
    <input
    type="text"
    value={displayName}
    onChange={(e) => setDisplayName(e.target.value)}
    className="input"
  />

  {displayName.trim().length > 0 && displayName.trim().length < 3 && (
    <p className="form-helper-error">
      El nombre del anuncio debe tener al menos 3 caracteres.
    </p>
  )}
</div>

    <div>
  <label className="label">
    Descripción <span className="required">*</span>
  </label>
  <textarea
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  rows={5}
  className="textarea"
  style={{ resize: "vertical" }}
/>

  {description.trim().length > 0 && description.trim().length < 10 && (
    <p className="form-helper-error">
      La descripción debe tener al menos 10 caracteres.
    </p>
  )}
</div>

    <div>
      <label className="label">
        Especialidad <span className="required">*</span>
      </label>
            <select
        value={selectedSpecialtyId}
        onChange={(e) => setSelectedSpecialtyId(e.target.value)}
        className="select"
      >
        {specialties.map((specialty) => (
          <option key={specialty.id} value={specialty.id}>
            {specialty.name}
          </option>
        ))}
      </select>
    </div>
           <div>
           <label className="label">
        Imágenes del anuncio <span className="required">*</span>
      </label>
      <div
  onDragOver={(e) => e.preventDefault()}
  onDrop={async (e) => {
    e.preventDefault();
    await processIncomingImages(Array.from(e.dataTransfer.files || []));
  }}
  className="listing-image-dropzone"
>
  Suelta aquí tus imágenes para subirlas
</div>

      <input
        type="file"
        accept="image/*"
        multiple
        disabled={imagesOptimizing}
        onChange={async (e) => {
          const input = e.target;
          await processIncomingImages(Array.from(input.files || []));
          input.value = "";
        }}
        className="input"
      />

      <p className="listing-image-help-text">
        Puedes subir entre 1 y 8 imágenes. Puedes añadir más en varias tandas. Se optimizarán automáticamente antes del envío.
      </p>

      {imagesOptimizing && (
        <p className="form-helper-info">
          Optimizando imágenes... espera un momento.
        </p>
      )}
      {imageMessages.length > 0 && (
        <div>
          {imageMessages.map((message, index) => (
            <p
              key={index}
              className={imageMessageType === "error" ? "form-helper-error" : "form-helper-info"}
            >
              {message}
            </p>
          ))}
        </div>
      )}
</div>
      <p className="listing-image-order-help">
        La imagen principal será la que se mostrará primero en los resultados. También puedes cambiar el orden con las flechas.
      </p>

{imagesTouched && images.length === 0 && (
  <p className="form-helper-error">
    Debes añadir al menos 1 imagen.
  </p>
)}

      {images.length > 0 && (
        <p className="listing-image-count">
          {images.length} imagen(es) seleccionada(s)
        </p>
      )}
      {images.length > 0 && (
  <div className="listing-image-grid">
{images.map((image, index) => (
    <div
      key={index}
      draggable
onDragStart={(e) => {
  draggedImageIndexRef.current = index;
  setDraggedImageIndex(index);

  if (transparentDragImageRef.current) {
    e.dataTransfer.setDragImage(transparentDragImageRef.current, 0, 0);
  }

  e.dataTransfer.effectAllowed = "move";
}}
      onDragOver={(e) => {
        e.preventDefault();

        const currentDraggedIndex = draggedImageIndexRef.current;
        if (currentDraggedIndex === null) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const middleX = rect.left + rect.width / 2;
        const position = e.clientX < middleX ? "before" : "after";

        setDragOverIndex(index);
        setDragInsertPosition(position);

        const targetIndex = position === "after" ? index + 1 : index;
        const finalTargetIndex = getFinalDropIndex(currentDraggedIndex, targetIndex);

        if (currentDraggedIndex === finalTargetIndex) return;

        const newIndex = moveImage(currentDraggedIndex, targetIndex);
        draggedImageIndexRef.current = newIndex;
        setDraggedImageIndex(newIndex);
      }}
      onDrop={() => {
        resetDragState();
      }}
      onDragEnd={() => {
        resetDragState();
      }}
      className={`listing-image-card${
        draggedImageIndex === index ? " is-dragging" : ""
      }${
        dragOverIndex === index && dragInsertPosition === "before"
          ? " is-drag-over-before"
          : ""
      }${
        dragOverIndex === index && dragInsertPosition === "after"
          ? " is-drag-over-after"
          : ""
      }`}
    >
    <img
      src={imagePreviews[index]}
      alt={`preview-${index}`}
      draggable={false}
      className="listing-image-preview"
      style={{
        border: index === mainImageIndex ? "3px solid #111" : "1px solid #ddd",
        boxShadow:
          index === mainImageIndex
            ? "0 0 0 2px rgba(17, 17, 17, 0.08), 0 6px 16px rgba(0, 0, 0, 0.12)"
            : "none",
        opacity: draggedImageIndex === index ? 0.6 : 1,
      }}
    />

    {index === mainImageIndex && (
      <div className="listing-image-badge-main">
        Principal
      </div>
    )}

{index !== mainImageIndex && (
  <button
    type="button"
    onMouseDown={preventButtonDrag}
    onClick={() => {
      setAsMainImage(index);
    }}
    className="listing-image-action-button listing-image-make-main-button"
  >
    Hacer principal
  </button>
)}

    <button
      type="button"
      onMouseDown={preventButtonDrag}
      onClick={() => {
        moveImageLeft(index);
      }}
      disabled={index === 0}
      className="listing-image-action-button listing-image-move-left-button"
    >
      ←
    </button>

    <button
      type="button"
      onMouseDown={preventButtonDrag}
      onClick={() => {
        moveImageRight(index);
      }}
      disabled={index === images.length - 1}
      className="listing-image-action-button listing-image-move-right-button"
    >
      →
    </button>

    <button
      type="button"
      onMouseDown={preventButtonDrag}
      onClick={() => {
        removeImage(index);
      }}
      className="listing-image-remove-button"
    >
      ×
    </button>
  </div>
))}

<div
  onDragOver={(e) => {
    e.preventDefault();

    const currentDraggedIndex = draggedImageIndexRef.current;
    if (currentDraggedIndex === null) return;

    setDragOverIndex(images.length);
    setDragInsertPosition("after");

    const finalTargetIndex = getFinalDropIndex(currentDraggedIndex, images.length);

    if (currentDraggedIndex === finalTargetIndex) return;

    const newIndex = moveImage(currentDraggedIndex, images.length);
    draggedImageIndexRef.current = newIndex;
    setDraggedImageIndex(newIndex);
  }}
  onDrop={() => {
    resetDragState();
  }}
  onDragEnd={() => {
    resetDragState();
  }}
  className={`listing-image-move-end-dropzone${
    dragOverIndex === images.length ? " is-active" : ""
  }`}
>
  Suelta aquí para mover al final
</div>

  </div>
)}

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
  <label className="label">
    Precio por m² <span className="required">*</span>
  </label>
    <input
    type="number"
    value={pricePerM2}
    onChange={(e) => setPricePerM2(e.target.value)}
    min="1"
    step="0.01"
    className="input"
  />

  {pricePerM2 !== "" && Number(pricePerM2) <= 0 && (
  <p className="form-helper-error">
    Debes indicar un precio por m² válido.
  </p>
)}
</div>

    <div>
      <label className="label">
        Disponibilidad <span className="required">*</span>
      </label>
            <select
        value={availability}
        onChange={(e) => setAvailability(e.target.value)}
        className="select"
      >
        <option value="MONDAY_TO_FRIDAY">Lunes a viernes</option>
        <option value="MONDAY_TO_SATURDAY">Lunes a sábado</option>
        <option value="MONDAY_TO_SUNDAY">Lunes a domingo</option>
      </select>
    </div>

    <div>
      <label className="label">
        Tipo de presupuesto <span className="required">*</span>
      </label>
            <select
        value={budgetType}
        onChange={(e) => setBudgetType(e.target.value)}
        className="select"
      >
        <option value="FREE">Presupuesto gratuito</option>
        <option value="PAID">Presupuesto de pago</option>
      </select>
    </div>

    <div>
      <label className="label">
        Años de experiencia <span className="required">*</span>
      </label>
            <select
        value={yearsExperience}
        onChange={(e) => setYearsExperience(e.target.value)}
        className="select"
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
  <label className="label">
    Ciudad <span className="required">*</span>
  </label>
    <input
    type="text"
    value={city}
    onChange={(e) => setCity(e.target.value)}
    className="input"
  />

  {city.trim().length > 0 && city.trim().length < 3 && (
    <p className="form-helper-error">
      La ciudad debe tener al menos 3 caracteres.
    </p>
  )}
</div>

    <div>
  <label className="label">
    Provincia <span className="required">*</span>
  </label>
    <select
    value={province}
    onChange={(e) => setProvince(e.target.value)}
    className="select"
  >
    {SPAIN_PROVINCES.map((provinceName) => (
      <option key={provinceName} value={provinceName}>
        {provinceName}
      </option>
    ))}
  </select>
</div>

    <div>
  <label className="label">
    Código postal <span className="required">*</span>
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
    className="input"
  />

  {postalCode.length > 0 && postalCode.length < 5 && (
    <p className="form-helper-error">
      El código postal debe tener 5 dígitos.
    </p>
  )}
</div>
    <div>
  <label className="label">
    Radio de trabajo (km) <span className="required">*</span>
  </label>
   <select
  value={serviceRadiusKm}
  onChange={(e) => setServiceRadiusKm(e.target.value)}
  className="select"
>
  <option value="1">1 km</option>
  <option value="2">2 km</option>
  <option value="3">3 km</option>
  <option value="4">4 km</option>
  <option value="5">5 km</option>
</select>

  
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
disabled={loading || imagesOptimizing || !phoneSaved}
  style={{
    padding: "12px 16px",
    cursor: loading || !phoneSaved ? "not-allowed" : "pointer",
    opacity: loading || !phoneSaved ? 0.6 : 1,
    border: "1px solid #111",
    borderRadius: "8px",
    backgroundColor: "#111",
    color: "#fff",
  }}
>
{loading
  ? "Creando..."
  : imagesOptimizing
  ? "Optimizando imágenes..."
  : !phoneSaved
  ? "Guarda tu teléfono para continuar"
  : "Crear anuncio"}
</button>
      </form>


    </main>
  );
}