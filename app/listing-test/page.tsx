"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useSearchParams } from "next/navigation";
import imageCompression from "browser-image-compression";
import ListingImagesBlock from "@/components/ListingImagesBlock";
import ListingMessageBlock from "@/components/ListingMessageBlock";
import ListingSubmitButton from "@/components/ListingSubmitButton";
import TermsCheckboxBlock from "@/components/TermsCheckboxBlock";
import ProfessionalPhoneBlock from "@/components/ProfessionalPhoneBlock";
import ListingBasicDataSection from "@/components/ListingBasicDataSection";
import ListingServiceConditionsSection from "@/components/ListingServiceConditionsSection";
import ListingLocationSection from "@/components/ListingLocationSection";
import {
  applyListingFormInitialData,
  createListingFormData,
  fetchExistingListingFormData,
  fetchInitialListingFormData,
  handleListingBackendError,
  handleListingConnectionError,
  handleListingSuccess,
  handlePhoneSaveBackendError,
  handlePhoneSaveSuccess,
  LISTING_FORM_DEFAULTS,
  resetListingFormAfterSuccess,
  validateListingForm,
  validateProfessionalPhone,
} from "@/lib/listing-form";
import type {
  ListingBasicDataSectionProps,
  ListingFormInitialData,
  ListingLocationSectionProps,
  ListingMessageBlockProps,
  ListingServiceConditionsSectionProps,
  ListingSubmitButtonProps,
  ProfessionalPhoneBlockProps,
  Specialty,
  TermsCheckboxBlockProps,
  UserData,
} from "@/types/listing-form";
import type {
  DragInsertPosition,
  ImageMessageType,
  ListingImagesBlockProps,
} from "@/types/listing-images";

export default function ListingTestPage() {
  const searchParams = useSearchParams();
  const listingId = searchParams.get("listingId") || "";
  const isEditMode = Boolean(listingId);
  const pageTitle = isEditMode ? "Editar anuncio (test)" : "Crear anuncio (test)";
  const [initialData, setInitialData] = useState<ListingFormInitialData | null>(
    null
  );
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(false);

  const [displayName, setDisplayName] = useState(
    LISTING_FORM_DEFAULTS.displayName
  );
  const [description, setDescription] = useState(
    LISTING_FORM_DEFAULTS.description
  );
  const [city, setCity] = useState(LISTING_FORM_DEFAULTS.city);
  const [province, setProvince] = useState(LISTING_FORM_DEFAULTS.province);
  const [postalCode, setPostalCode] = useState(
    LISTING_FORM_DEFAULTS.postalCode
  );
  const [serviceRadiusKm, setServiceRadiusKm] = useState(
    LISTING_FORM_DEFAULTS.serviceRadiusKm
  );
  const [acceptTerms, setAcceptTerms] = useState(
    LISTING_FORM_DEFAULTS.acceptTerms
  );
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState(
    LISTING_FORM_DEFAULTS.selectedSpecialtyId
  );
  const [pricePerM2, setPricePerM2] = useState(
    LISTING_FORM_DEFAULTS.pricePerM2
  );
  const [availability, setAvailability] = useState(
    LISTING_FORM_DEFAULTS.availability
  );
  const [budgetType, setBudgetType] = useState(
    LISTING_FORM_DEFAULTS.budgetType
  );
  const [yearsExperience, setYearsExperience] = useState(
    LISTING_FORM_DEFAULTS.yearsExperience
  );
  const [phoneMessage, setPhoneMessage] = useState("");
  const [listingMessage, setListingMessage] = useState("");
  const [imageMessages, setImageMessages] = useState<string[]>([]);
  const [imageMessageType, setImageMessageType] =
    useState<ImageMessageType>("info");
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
  const [mainImageIndex, setMainImageIndex] = useState(
    LISTING_FORM_DEFAULTS.mainImageIndex
  );
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(
    null
  );
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragInsertPosition, setDragInsertPosition] =
    useState<DragInsertPosition>(null);
  const draggedImageIndexRef = useRef<number | null>(null);
  const transparentDragImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    fetchInitialListingFormData({
      setListingMessage,
      setCheckingUser,
      setUser,
      setPhone,
      setPhoneSaved,
      setSpecialties,
      setSelectedSpecialtyId,
    });
  }, []);

  useEffect(() => {
    if (!listingId) {
      setInitialData(null);
      setIsLoadingInitialData(false);
      return;
    }

    fetchExistingListingFormData({
      listingId,
      setInitialData,
      setListingMessage,
      setIsLoadingInitialData,
    });
  }, [listingId]);

  useEffect(() => {
    if (checkingUser) {
      return;
    }

    applyListingFormInitialData({
      initialData,
      specialties,
      setDisplayName,
      setDescription,
      setCity,
      setProvince,
      setPostalCode,
      setServiceRadiusKm,
      setAcceptTerms,
      setSelectedSpecialtyId,
      setPricePerM2,
      setAvailability,
      setBudgetType,
      setYearsExperience,
      setMainImageIndex,
    });
  }, [checkingUser, initialData, specialties]);

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

    const oversizedFiles = files.filter((file) => file.size > maxSizeBytes);

    if (oversizedFiles.length > 0) {
      nextImageMessages.push(
        "El tamaño de una o varias imágenes es superior a 5 MB"
      );
    }

    const validFiles = files.filter(
      (file) => validTypes.includes(file.type) && file.size <= maxSizeBytes
    );

    const nonDuplicateFiles = validFiles.filter((file) => {
      return !images.some((existingImage) => existingImage.name === file.name);
    });

    if (nonDuplicateFiles.length < validFiles.length) {
      nextImageMessages.push("Algunas imágenes duplicadas no se han añadido");
    }

    const limitedFiles = nonDuplicateFiles.slice(0, availableSlots);

    if (nonDuplicateFiles.length > availableSlots) {
      nextImageMessages.push(`Solo puedes añadir ${availableSlots} imagen(es) más`);
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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
      requireImages: !isEditMode,
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

      const endpoint = isEditMode
        ? `/api/listings/${listingId}/update`
        : "/api/listings/create";
      const method = isEditMode ? "PUT" : "POST";
      const successMessage = isEditMode
        ? "✅ Anuncio actualizado correctamente"
        : "✅ Anuncio creado correctamente";

      const response = await fetch(endpoint, {
        method,
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
        successMessage,
        setListingMessage,
        resetForm: () => {
          if (isEditMode) {
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
          }

          setInitialData(null);
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
          });
        },
        setLoading,
      });
    } catch (error) {
      console.error(
        isEditMode
          ? "Error de conexión al actualizar el anuncio:"
          : "Error de conexión al crear el anuncio:",
        error
      );
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
      console.error("Error de conexión al guardar el teléfono:", error);
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
  } satisfies ProfessionalPhoneBlockProps;

  const listingMessageBlockProps = {
    listingMessage,
  } satisfies ListingMessageBlockProps;

  const termsCheckboxBlockProps = {
    acceptTerms,
    setAcceptTerms,
  } satisfies TermsCheckboxBlockProps;

  const listingSubmitButtonProps = {
    mode: isEditMode ? "edit" : "create",
    loading,
    imagesOptimizing,
    phoneSaved,
  } satisfies ListingSubmitButtonProps;

  const listingBasicDataSectionProps = {
    displayName,
    description,
    selectedSpecialtyId,
    specialties,
    onDisplayNameChange: setDisplayName,
    onDescriptionChange: setDescription,
    onSelectedSpecialtyIdChange: setSelectedSpecialtyId,
  } satisfies ListingBasicDataSectionProps;

  const listingServiceConditionsSectionProps = {
    pricePerM2,
    availability,
    budgetType,
    yearsExperience,
    onPricePerM2Change: setPricePerM2,
    onAvailabilityChange: setAvailability,
    onBudgetTypeChange: setBudgetType,
    onYearsExperienceChange: setYearsExperience,
  } satisfies ListingServiceConditionsSectionProps;

  const listingLocationSectionProps = {
    city,
    province,
    postalCode,
    serviceRadiusKm,
    onCityChange: setCity,
    onProvinceChange: setProvince,
    onPostalCodeChange: setPostalCode,
    onServiceRadiusKmChange: setServiceRadiusKm,
  } satisfies ListingLocationSectionProps;

  if (checkingUser || isLoadingInitialData) {
    return (
      <main className="listing-page">
        <h1>{pageTitle}</h1>
        <p>
          {checkingUser
            ? "Comprobando usuario..."
            : "Cargando datos iniciales del anuncio..."}
        </p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="listing-page">
        <h1>{pageTitle}</h1>
        <p>{listingMessage || "No se pudo cargar el usuario"}</p>
      </main>
    );
  }

  if (user.role !== "PROFESSIONAL") {
    return (
      <main className="listing-page">
        <h1>{pageTitle}</h1>
        <p>Solo las cuentas profesionales pueden acceder a esta página.</p>
      </main>
    );
  }

  return (
    <main className="listing-page">
      <h1>{pageTitle}</h1>

      <p className="listing-page-intro">
        Profesional detectado: <strong>{user.name}</strong>
      </p>

      {isEditMode && (
        <p className="listing-page-intro">
          Modo edición activo: estás modificando un anuncio existente.
        </p>
      )}

      <ProfessionalPhoneBlock {...professionalPhoneBlockProps} />
      <ListingMessageBlock {...listingMessageBlockProps} />

      <form onSubmit={handleSubmit} className="listing-form">
        <ListingBasicDataSection {...listingBasicDataSectionProps} />
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
