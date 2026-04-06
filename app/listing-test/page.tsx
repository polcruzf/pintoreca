"use client";

import { useEffect, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import ListingImagesBlock from "@/components/ListingImagesBlock";
import ListingMessageBlock from "@/components/ListingMessageBlock";
import ListingSubmitButton from "@/components/ListingSubmitButton";
import TermsCheckboxBlock from "@/components/TermsCheckboxBlock";
import ProfessionalPhoneBlock from "@/components/ProfessionalPhoneBlock";
import ListingBasicDataSection from "@/components/ListingBasicDataSection";
import ListingServiceConditionsSection from "@/components/ListingServiceConditionsSection";
import ListingLocationSection from "@/components/ListingLocationSection";
import { SPAIN_PROVINCES } from "@/constants/spain-provinces";
import type {
  DragInsertPosition,
  ImageMessageType,
  ListingImagesBlockProps,
} from "@/types/listing-images";

function sanitizePostalCode(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.slice(0, 5);
}

function isInvalidPrice(value: string): boolean {
  if (value === "") return false;
  return Number(value) <= 0;
}

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

type ListingValidationResult =
  | Readonly<{
      message: string;
      touchImages?: boolean;
    }>
  | null;

type ListingValidationInput = Readonly<{
  displayName: string;
  description: string;
  city: string;
  province: string;
  postalCode: string;
  serviceRadiusKm: string;
  selectedSpecialtyId: string;
  pricePerM2: string;
  imagesCount: number;
  acceptTerms: boolean;
}>;

type ResetListingFormParams = Readonly<{
  setDisplayName: (value: string) => void;
  setDescription: (value: string) => void;
  setCity: (value: string) => void;
  setProvince: (value: string) => void;
  setPostalCode: (value: string) => void;
  setServiceRadiusKm: (value: string) => void;
  setAcceptTerms: (value: boolean) => void;
  setPricePerM2: (value: string) => void;
  setAvailability: (value: string) => void;
  setBudgetType: (value: string) => void;
  setYearsExperience: (value: string) => void;
  setImages: (value: File[]) => void;
  setImagePreviews: (value: string[]) => void;
  setImagesTouched: (value: boolean) => void;
  setMainImageIndex: (value: number) => void;
  setSelectedSpecialtyId: (value: string) => void;
  specialties: Specialty[];
}>;

type CreateListingFormDataParams = Readonly<{
  displayName: string;
  description: string;
  yearsExperience: string;
  availability: string;
  budgetType: string;
  postalCode: string;
  city: string;
  province: string;
  serviceRadiusKm: string;
  mainImageIndex: number;
  selectedSpecialtyId: string;
  pricePerM2: string;
  images: File[];
}>;

type ListingBackendErrorData = Readonly<{
  error?: string;
  message?: string;
}>;

type HandleListingBackendErrorParams = Readonly<{
  data: ListingBackendErrorData;
  setListingMessage: (value: string) => void;
  setPhoneSaved: (value: boolean) => void;
  setLoading: (value: boolean) => void;
}>;

type HandleListingSuccessParams = Readonly<{
  setListingMessage: (value: string) => void;
  resetForm: () => void;
  setLoading: (value: boolean) => void;
}>;

type HandleListingConnectionErrorParams = Readonly<{
  setListingMessage: (value: string) => void;
  setLoading: (value: boolean) => void;
}>;

type PhoneValidationResult = string | null;
type HandlePhoneSaveSuccessParams = Readonly<{
  phone: string;
  setPhoneMessage: (value: string) => void;
  setPhoneSaved: (value: boolean) => void;
  setUser: React.Dispatch<React.SetStateAction<UserData | null>>;
  setPhoneLoading: (value: boolean) => void;
}>;

type HandlePhoneSaveBackendErrorParams = Readonly<{
  errorMessage?: string;
  setPhoneMessage: (value: string) => void;
  setPhoneLoading: (value: boolean) => void;
}>;

function handlePhoneSaveBackendError({
  errorMessage,
  setPhoneMessage,
  setPhoneLoading,
}: HandlePhoneSaveBackendErrorParams): void {
  setPhoneMessage(errorMessage || "Error al guardar el teléfono");
  setPhoneLoading(false);
}

function handlePhoneSaveSuccess({
  phone,
  setPhoneMessage,
  setPhoneSaved,
  setUser,
  setPhoneLoading,
}: HandlePhoneSaveSuccessParams): void {
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
}

function validateProfessionalPhone(phone: string): PhoneValidationResult {
  if (!phone.trim()) {
    return "El teléfono es obligatorio";
  }

  if (!/^\d{9}$/.test(phone)) {
    return "El teléfono debe tener 9 dígitos";
  }

  return null;
}

function handleListingConnectionError({
  setListingMessage,
  setLoading,
}: HandleListingConnectionErrorParams): void {
  setListingMessage("Error de conexión");
  window.scrollTo({ top: 0, behavior: "smooth" });
  setLoading(false);
}

function handleListingSuccess({
  setListingMessage,
  resetForm,
  setLoading,
}: HandleListingSuccessParams): void {
  setListingMessage("✅ Anuncio creado correctamente");
  window.scrollTo({ top: 0, behavior: "smooth" });
  resetForm();
  setLoading(false);
}

function handleListingBackendError({
  data,
  setListingMessage,
  setPhoneSaved,
  setLoading,
}: HandleListingBackendErrorParams): void {
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
}

function createListingFormData({
  displayName,
  description,
  yearsExperience,
  availability,
  budgetType,
  postalCode,
  city,
  province,
  serviceRadiusKm,
  mainImageIndex,
  selectedSpecialtyId,
  pricePerM2,
  images,
}: CreateListingFormDataParams): FormData {
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
  formData.append(
    "provinceSlug",
    province.toLowerCase().trim().replace(/\s+/g, "-")
  );
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

  return formData;
}

function resetListingFormAfterSuccess({
  setDisplayName,
  setDescription,
  setCity,
  setProvince,
  setPostalCode,
  setServiceRadiusKm,
  setAcceptTerms,
  setPricePerM2,
  setAvailability,
  setBudgetType,
  setYearsExperience,
  setImages,
  setImagePreviews,
  setImagesTouched,
  setMainImageIndex,
  setSelectedSpecialtyId,
  specialties,
}: ResetListingFormParams): void {
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
}

function validateListingForm({
  displayName,
  description,
  city,
  province,
  postalCode,
  serviceRadiusKm,
  selectedSpecialtyId,
  pricePerM2,
  imagesCount,
  acceptTerms,
}: ListingValidationInput): ListingValidationResult {
  if (!displayName.trim()) {
    return { message: "El nombre del anuncio es obligatorio" };
  }

  if (displayName.trim().length < 3) {
    return {
      message: "El nombre del anuncio debe tener al menos 3 caracteres",
    };
  }

  if (!description.trim()) {
    return { message: "La descripción es obligatoria" };
  }

  if (description.trim().length < 10) {
    return {
      message: "La descripción debe tener al menos 10 caracteres",
    };
  }

  if (!city.trim()) {
    return { message: "La ciudad es obligatoria" };
  }

  if (city.trim().length < 3) {
    return {
      message: "La ciudad debe tener al menos 3 caracteres",
    };
  }

  if (!province || !(SPAIN_PROVINCES as readonly string[]).includes(province)) {
    return { message: "Debes seleccionar una provincia válida" };
  }

  if (!postalCode.trim()) {
    return { message: "El código postal es obligatorio" };
  }

  if (!/^\d{5}$/.test(postalCode)) {
    return { message: "El código postal debe tener 5 dígitos" };
  }

  if (!serviceRadiusKm || Number(serviceRadiusKm) <= 0) {
    return { message: "Debes indicar un radio de trabajo válido" };
  }

  if (!selectedSpecialtyId) {
    return { message: "Debes seleccionar una especialidad" };
  }

  if (!pricePerM2 || Number(pricePerM2) <= 0) {
    return { message: "Debes indicar un precio por m² válido" };
  }

  if (imagesCount === 0) {
    return {
      message: "Debes añadir al menos 1 imagen para crear el anuncio",
      touchImages: true,
    };
  }

  if (!acceptTerms) {
    return { message: "Debes aceptar los términos para continuar" };
  }

  return null;
}

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

    const validationResult = validateListingForm({
      displayName,
      description,
      city,
      province,
      postalCode,
      serviceRadiusKm,
      selectedSpecialtyId,
      pricePerM2,
      imagesCount: images.length,
      acceptTerms,
    });

    if (validationResult) {
      if (validationResult.touchImages) {
        setImagesTouched(true);
      }

      setListingMessage(validationResult.message);
      return;
    }

setLoading(true);
setListingMessage("");
setPhoneMessage("");

    try {
const formData = createListingFormData({
  displayName,
  description,
  yearsExperience,
  availability,
  budgetType,
  postalCode,
  city,
  province,
  serviceRadiusKm,
  mainImageIndex,
  selectedSpecialtyId,
  pricePerM2,
  images,
});

const response = await fetch("/api/listings/create", {
  method: "POST",
  body: formData,
});

      const data = await response.json();

      if (!response.ok) {
        handleListingBackendError({
          data,
          setListingMessage,
          setPhoneSaved,
          setLoading,
        });
        return;
      }

handleListingSuccess({
  setListingMessage,
  resetForm: () =>
    resetListingFormAfterSuccess({
      setDisplayName,
      setDescription,
      setCity,
      setProvince,
      setPostalCode,
      setServiceRadiusKm,
      setAcceptTerms,
      setPricePerM2,
      setAvailability,
      setBudgetType,
      setYearsExperience,
      setImages,
      setImagePreviews,
      setImagesTouched,
      setMainImageIndex,
      setSelectedSpecialtyId,
      specialties,
    }),
  setLoading,
});
    } catch (error) {
      handleListingConnectionError({
        setListingMessage,
        setLoading,
      });
    }
  };
  const handleSavePhone = async () => {
  const phoneValidationMessage = validateProfessionalPhone(phone);

  if (phoneValidationMessage) {
    setPhoneMessage(phoneValidationMessage);
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
      handlePhoneSaveBackendError({
        errorMessage: data.error,
        setPhoneMessage,
        setPhoneLoading,
      });
      return;
    }

    handlePhoneSaveSuccess({
      phone,
      setPhoneMessage,
      setPhoneSaved,
      setUser,
      setPhoneLoading,
    });
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

const professionalPhoneBlockProps = {
  phoneMessage,
  phoneSaved,
  phone,
  phoneLoading,
  currentPhone: user?.professionalProfile?.phone,
  onPhoneChange: setPhone,
  onSavePhone: handleSavePhone,
  onEditPhone: handleEditPhone,
};

const listingMessageBlockProps = {
  listingMessage,
};

const termsCheckboxBlockProps = {
  acceptTerms,
  setAcceptTerms,
};

const listingSubmitButtonProps = {
  loading,
  imagesOptimizing,
  phoneSaved,
};

const listingBasicDataSectionProps = {
  displayName,
  description,
  selectedSpecialtyId,
  specialties,
  onDisplayNameChange: setDisplayName,
  onDescriptionChange: setDescription,
  onSelectedSpecialtyIdChange: setSelectedSpecialtyId,
};

const listingServiceConditionsSectionProps = {
  pricePerM2,
  availability,
  budgetType,
  yearsExperience,
  onPricePerM2Change: setPricePerM2,
  onAvailabilityChange: setAvailability,
  onBudgetTypeChange: setBudgetType,
  onYearsExperienceChange: setYearsExperience,
};

const listingLocationSectionProps = {
  city,
  province,
  postalCode,
  serviceRadiusKm,
  onCityChange: setCity,
  onProvinceChange: setProvince,
  onPostalCodeChange: setPostalCode,
  onServiceRadiusKmChange: setServiceRadiusKm,
};

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
<ProfessionalPhoneBlock {...professionalPhoneBlockProps} />

<ListingMessageBlock {...listingMessageBlockProps} />
<form
  onSubmit={handleSubmit}
  className="listing-form"
><ListingBasicDataSection {...listingBasicDataSectionProps} />

<ListingImagesBlock {...listingImagesBlockProps} />

<ListingServiceConditionsSection
  {...listingServiceConditionsSectionProps}
/>
<ListingLocationSection {...listingLocationSectionProps} />
<TermsCheckboxBlock {...termsCheckboxBlockProps} />



<ListingSubmitButton {...listingSubmitButtonProps} />
      </form>


    </main>
  );
}