"use client";

import { useEffect, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import ListingImagesBlock from "@/components/ListingImagesBlock";
import { SPAIN_PROVINCES } from "@/constants/spain-provinces";
import type {
  DragInsertPosition,
  ImageMessageType,
  ListingImagesBlockProps,
} from "@/types/listing-images";

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
const [imageMessageType, setImageMessageType] = useState<ImageMessageType>("info");
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
const [dragInsertPosition, setDragInsertPosition] = useState<DragInsertPosition>(null);
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
const listingImagesBlockProps = {
  images,
  imagePreviews,
  imagesTouched,
  imageMessages,
  imageMessageType,
  imagesOptimizing,
  mainImageIndex,
  draggedImageIndex,
  dragOverIndex,
  dragInsertPosition,
  draggedImageIndexRef,
  transparentDragImageRef,
  processIncomingImages,
  getFinalDropIndex,
  moveImage,
  moveImageLeft,
  moveImageRight,
  removeImage,
  setAsMainImage,
  resetDragState,
  setDraggedImageIndex,
  setDragOverIndex,
  setDragInsertPosition,
} satisfies ListingImagesBlockProps;


  if (checkingUser) {
    return (
      <main className="listing-page">
        <h1>Crear anuncio (test)</h1>
        <p>Comprobando usuario...</p>
      </main>
    );
  }

    if (!user) {
    return (
      <main className="listing-page">
        <h1>Crear anuncio (test)</h1>
        <p>{listingMessage || "No se pudo cargar el usuario"}</p>
      </main>
    );
  }

  if (user.role !== "PROFESSIONAL") {
    return (
      <main className="listing-page">
        <h1>Crear anuncio (test)</h1>
        <p>Solo las cuentas profesionales pueden acceder a esta página.</p>
      </main>
    );
  }

  return (
    <main className="listing-page">
      <h1>Crear anuncio (test)</h1>

      <p className="listing-page-intro">
        Profesional detectado: <strong>{user.name}</strong>
      </p>
{phoneMessage && (
  <p
    className={`form-message ${
      phoneMessage.includes("✅") ? "is-success" : "is-error"
    }`}
  >
    {phoneMessage}
  </p>
)}
{phoneSaved ? (
  <div className="phone-status-card">
  <h2 className="phone-status-title">
    ✅ Teléfono profesional ya guardado
  </h2>

  <p className="phone-status-text">
    No es necesario volver a añadirlo para crear anuncios.
  </p>

  <button
    type="button"
    onClick={handleEditPhone}
    className="phone-status-button"
  >
    Cambiar teléfono
  </button>
</div>
) : (
  <div className="phone-required-card">
  <h2 className="phone-required-title">
    Teléfono profesional (obligatorio)
  </h2>

  <div className="phone-required-warning">
    Debes añadir y guardar tu teléfono profesional antes de poder crear anuncios.
  </div>

<div className="form-actions-row">
            <input
        type="text"
        value={phone}
        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
        maxLength={9}
        placeholder="Ej: 600123456"
        className="input form-input-grow"
      />

<button
  type="button"
  onClick={handleSavePhone}
  disabled={phoneLoading || phone.length !== 9}
  className={`phone-save-button ${
    phoneLoading || phone.length !== 9 ? "is-disabled" : ""
  }`}
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
    className={`form-message ${
      listingMessage.includes("✅") ? "is-success" : "is-error"
    }`}
  >
    {listingMessage}
  </p>
)}
<form
  onSubmit={handleSubmit}
  className="listing-form"
><div className="form-section-card">
  <h2 className="form-section-title">
    Datos del anuncio
  </h2>

  <div className="form-section-fields">
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
  className="textarea textarea-resize-vertical"
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
  </div>
</div>

<ListingImagesBlock {...listingImagesBlockProps} />

<div className="form-section-card">
  <h2 className="form-section-title">
    Condiciones del servicio
  </h2>

  <div className="form-section-fields">
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
<div className="form-section-card">
  <h2 className="form-section-title">
    Ubicación
  </h2>

  <div className="form-section-fields">
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
<label className="form-checkbox-row">
  <input
    type="checkbox"
    checked={acceptTerms}
    onChange={(e) => setAcceptTerms(e.target.checked)}
    className="form-checkbox-input"
  />
  <span>
    Confirmo que la información del anuncio es veraz y acepto los términos
    aplicables a la publicación.
  </span>
</label>



<button
  type="submit"
  disabled={loading || imagesOptimizing || !phoneSaved}
  className={`form-submit-button${
    loading || imagesOptimizing || !phoneSaved ? " is-disabled" : ""
  }`}
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