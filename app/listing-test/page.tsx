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
  createListingUpdateFormData,
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
import {
  createExistingUnifiedListingImages,
  createNewUnifiedListingImages,
  ensureSingleMainImage,
  getFinalDropIndex,
  getKeptExistingImageIds,
  getMainImageIndex,
  getMainImageKey,
  getNewImageFiles,
  getNewImageKeys,
  getNewImageNames,
  getOrderedImageKeys,
  moveListingImagesArray,
  removeListingImageByKey,
  revokeNewListingImageObjectUrls,
  setMainListingImageByKey,
} from "@/lib/listing-images";
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
  ListingSubmissionIntent,
  ListingStatusValue,
} from "@/types/listing-form";
import type {
  DragInsertPosition,
  ImageMessageType,
  ListingImagesBlockProps,
  UnifiedListingImage,
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
  const currentListingStatus: ListingStatusValue =
    initialData?.status ?? "DRAFT";

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
  const [listingImages, setListingImages] = useState<UnifiedListingImage[]>([]);
  const [imagesTouched, setImagesTouched] = useState(false);
  const [currentSubmitIntent, setCurrentSubmitIntent] =
    useState<ListingSubmissionIntent | null>(null);
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
  const previousListingImagesRef = useRef<UnifiedListingImage[]>([]);

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
      setListingImages((prev) => {
        revokeNewListingImageObjectUrls(prev);
        return [];
      });
      setImagesTouched(false);
      setIsLoadingInitialData(false);
      return;
    }

    setListingImages((prev) => {
      revokeNewListingImageObjectUrls(prev);
      return [];
    });
    setImagesTouched(false);
    setImageMessages([]);

    fetchExistingListingFormData({
      listingId,
      setInitialData,
      setExistingImages: (valueOrUpdater) => {
        if (typeof valueOrUpdater === "function") {
          return;
        }

        setListingImages(createExistingUnifiedListingImages(valueOrUpdater));
      },
      setMainImageKey: () => undefined,
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

  useEffect(() => {
    const previousListingImages = previousListingImagesRef.current;
    const currentNewImageKeys = new Set(
      listingImages
        .filter((image) => image.kind === "new")
        .map((image) => image.key)
    );

    previousListingImages.forEach((image) => {
      if (image.kind === "new" && !currentNewImageKeys.has(image.key)) {
        URL.revokeObjectURL(image.previewUrl);
      }
    });

    previousListingImagesRef.current = listingImages;
  }, [listingImages]);

  useEffect(() => {
    return () => {
      revokeNewListingImageObjectUrls(previousListingImagesRef.current);
    };
  }, []);

  useEffect(() => {
    const transparentPixel = new Image();
    transparentPixel.src =
      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

    transparentDragImageRef.current = transparentPixel;
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

    const totalCurrentImages = listingImages.length;
    const availableSlots = 8 - totalCurrentImages;

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

    const existingFileNames = getNewImageNames(listingImages);
    const nonDuplicateFiles = validFiles.filter(
      (file) => !existingFileNames.includes(file.name)
    );

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
      const nextNewImages = createNewUnifiedListingImages(compressedFiles);

      setListingImages((prev) => {
        const nextListingImages = ensureSingleMainImage([
          ...prev,
          ...nextNewImages,
        ]);

        setMainImageIndex(getMainImageIndex(nextListingImages));
        return nextListingImages;
      });
    } catch (error) {
      console.error("Error al optimizar imágenes:", error);
      setImageMessages(["No se pudieron optimizar las imágenes"]);
      setImageMessageType("error");
    } finally {
      setImagesOptimizing(false);
    }
  };

  const getSuccessMessageForIntent = (submissionIntent: ListingSubmissionIntent) => {
    if (submissionIntent === "draft") {
      if (isEditMode && currentListingStatus === "PUBLISHED") {
        return "✅ El anuncio se ha guardado como borrador";
      }

      return isEditMode
        ? "✅ Borrador guardado correctamente"
        : "✅ Borrador creado correctamente";
    }

    if (isEditMode) {
      return currentListingStatus === "PUBLISHED"
        ? "✅ Anuncio publicado actualizado correctamente"
        : "✅ Anuncio guardado y publicado correctamente";
    }

    return "✅ Anuncio publicado correctamente";
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const nativeSubmitEvent = e.nativeEvent as SubmitEvent;
    const submitter = nativeSubmitEvent.submitter as HTMLButtonElement | null;
    const submissionIntent: ListingSubmissionIntent =
      submitter?.value === "publish" ? "publish" : "draft";

    if (submissionIntent === "publish") {
      const validationResult = validateListingForm({
        displayName,
        description,
        city,
        province,
        postalCode,
        serviceRadiusKm,
        selectedSpecialtyId,
        pricePerM2,
        totalImagesCount: listingImages.length,
        acceptTerms,
      });

      if (validationResult) {
        if (validationResult.touchImages) {
          setImagesTouched(true);
        }

        setListingMessage(validationResult.message);
        return;
      }
    }

    setLoading(true);
    setCurrentSubmitIntent(submissionIntent);
    setListingMessage("");
    setPhoneMessage("");

    try {
      const endpoint = isEditMode
        ? `/api/listings/${listingId}/update`
        : "/api/listings/create";

      const mainImageKey = getMainImageKey(listingImages);
      const newImageFiles = getNewImageFiles(listingImages);

      const requestOptions = isEditMode
        ? {
            method: "PATCH",
            body: createListingUpdateFormData({
              displayName,
              description,
              yearsExperience,
              availability,
              budgetType,
              postalCode,
              city,
              province,
              serviceRadiusKm,
              selectedSpecialtyId,
              pricePerM2,
              keptExistingImageIds: getKeptExistingImageIds(listingImages),
              orderedImageKeys: getOrderedImageKeys(listingImages),
              newImageKeys: getNewImageKeys(listingImages),
              mainImageKey,
              images: newImageFiles,
              submissionIntent,
            }),
          }
        : {
            method: "POST",
            body: createListingFormData({
              displayName,
              description,
              yearsExperience,
              availability,
              budgetType,
              postalCode,
              city,
              province,
              serviceRadiusKm,
              mainImageIndex: getMainImageIndex(listingImages),
              selectedSpecialtyId,
              pricePerM2,
              images: newImageFiles,
              submissionIntent,
            }),
          };

      const response = await fetch(endpoint, requestOptions);
      const data = await response.json();

      if (!response.ok) {
        handleListingBackendError({
          data,
          setListingMessage,
          setPhoneSaved,
          setLoading,
        });
        setCurrentSubmitIntent(null);
        return;
      }

      if (isEditMode) {
        handleListingSuccess({
          setListingMessage,
          successMessage: getSuccessMessageForIntent(submissionIntent),
          resetForm: () => {
            setListingImages((prev) => {
              revokeNewListingImageObjectUrls(prev);
              return prev.filter((image) => image.kind === "existing");
            });
            setImagesTouched(false);
            fetchExistingListingFormData({
              listingId,
              setInitialData,
              setExistingImages: (valueOrUpdater) => {
                if (typeof valueOrUpdater === "function") {
                  return;
                }

                setListingImages(createExistingUnifiedListingImages(valueOrUpdater));
              },
              setMainImageKey: () => undefined,
              setListingMessage: () => undefined,
              setIsLoadingInitialData,
            });
          },
          setLoading,
        });
        setCurrentSubmitIntent(null);
        return;
      }

      handleListingSuccess({
        setListingMessage,
        successMessage: getSuccessMessageForIntent(submissionIntent),
        resetForm: () => {
          setInitialData(null);
          setListingImages((prev) => {
            revokeNewListingImageObjectUrls(prev);
            return [];
          });
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
            setImages: () => undefined,
            setImagePreviews: () => undefined,
            setImagesTouched,
            setMainImageIndex,
            setSelectedSpecialtyId,
            specialties,
          });
        },
        setLoading,
      });
      setCurrentSubmitIntent(null);
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
      setCurrentSubmitIntent(null);
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

  const moveListingImage = (fromIndex: number, toIndex: number) => {
    let nextDraggedIndex = fromIndex;

    setListingImages((prev) => {
      const { updatedImages, finalToIndex } = moveListingImagesArray(
        prev,
        fromIndex,
        toIndex
      );

      nextDraggedIndex = finalToIndex;
      setMainImageIndex(getMainImageIndex(updatedImages));

      return updatedImages;
    });

    return nextDraggedIndex;
  };

  const moveListingImageLeft = (indexToMove: number) => {
    if (indexToMove <= 0) return;
    moveListingImage(indexToMove, indexToMove - 1);
  };

  const moveListingImageRight = (indexToMove: number) => {
    if (indexToMove >= listingImages.length - 1) return;
    moveListingImage(indexToMove, indexToMove + 2);
  };

  const removeListingImage = (imageKey: string) => {
    setListingImages((prev) => {
      const updatedImages = removeListingImageByKey(prev, imageKey);

      if (updatedImages.length === 0) {
        setImageMessages([]);
        setImagesTouched(false);
      }

      setMainImageIndex(getMainImageIndex(updatedImages));
      return updatedImages;
    });
  };

  const setListingImageAsMain = (imageKey: string) => {
    setListingImages((prev) => {
      const updatedImages = setMainListingImageByKey(prev, imageKey);
      setMainImageIndex(getMainImageIndex(updatedImages));
      return updatedImages;
    });
  };

  const resetDragState = () => {
    draggedImageIndexRef.current = null;
    setDraggedImageIndex(null);
    setDragOverIndex(null);
    setDragInsertPosition(null);
  };

  const listingImagesBlockProps = {
    isEditMode,
    listingImages,
    imagesTouched,
    imageMessages,
    imageMessageType,
    imagesOptimizing,
    draggedImageIndex,
    dragOverIndex,
    dragInsertPosition,
    draggedImageIndexRef,
    transparentDragImageRef,
    processIncomingImages,
    getFinalDropIndex,
    moveListingImage,
    moveListingImageLeft,
    moveListingImageRight,
    removeListingImage,
    setListingImageAsMain,
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
    loading,
    imagesOptimizing,
    phoneSaved,
    isEditMode,
    currentSubmitIntent,
    currentListingStatus,
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

      <div
        className={`listing-status-banner ${
          currentListingStatus === "PUBLISHED" ? "is-published" : "is-draft"
        }`}
      >
        Estado actual del anuncio: <strong>{currentListingStatus}</strong>
      </div>

      {isEditMode && (
        <p className="listing-page-intro">
          Modo edición activo: puedes guardar este anuncio como borrador o
          publicarlo sin salir del mismo formulario.
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
