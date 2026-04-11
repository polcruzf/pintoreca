import { SPAIN_PROVINCES } from "@/constants/spain-provinces";
import type {
  ApplyListingFormInitialDataParams,
  CreateListingFormDataParams,
  ExistingListingFormData,
  FetchExistingListingFormDataParams,
  FetchExistingListingFormDataResponse,
  FetchInitialListingFormDataParams,
  HandleInitialSpecialtiesResponseParams,
  HandleInitialUserResponseParams,
  HandleListingBackendErrorParams,
  HandleListingConnectionErrorParams,
  HandleListingSuccessParams,
  HandlePhoneSaveBackendErrorParams,
  HandlePhoneSaveSuccessParams,
  ListingFormDefaults,
  ListingFormInitialData,
  ListingFormInitialValues,
  ListingValidationInput,
  ListingValidationResult,
  PhoneValidationResult,
  ResetListingFormParams,
  Specialty,
} from "@/types/listing-form";

export function sanitizePostalCode(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.slice(0, 5);
}

export const LISTING_FORM_DEFAULTS: ListingFormDefaults = {
  displayName: "",
  description: "",
  city: "",
  province: "Barcelona",
  postalCode: "",
  serviceRadiusKm: "5",
  acceptTerms: false,
  selectedSpecialtyId: "",
  pricePerM2: "",
  availability: "MONDAY_TO_FRIDAY",
  budgetType: "FREE",
  yearsExperience: "EXPERIENCE_10_20",
  mainImageIndex: 0,
};

export function getListingFormInitialValues(
  initialData: ListingFormInitialData | null,
  specialties: Specialty[] = []
): ListingFormInitialValues {
  const fallbackSpecialtyId = specialties[0]?.id ?? "";
  const requestedSpecialtyId = initialData?.selectedSpecialtyId?.trim() ?? "";
  const specialtyExists = specialties.some(
    (specialty) => specialty.id === requestedSpecialtyId
  );

  return {
    displayName: initialData?.displayName ?? LISTING_FORM_DEFAULTS.displayName,
    description: initialData?.description ?? LISTING_FORM_DEFAULTS.description,
    city: initialData?.city ?? LISTING_FORM_DEFAULTS.city,
    province: initialData?.province ?? LISTING_FORM_DEFAULTS.province,
    postalCode: initialData?.postalCode ?? LISTING_FORM_DEFAULTS.postalCode,
    serviceRadiusKm:
      initialData?.serviceRadiusKm ?? LISTING_FORM_DEFAULTS.serviceRadiusKm,
    acceptTerms: initialData?.acceptTerms ?? LISTING_FORM_DEFAULTS.acceptTerms,
    selectedSpecialtyId:
      specialtyExists || requestedSpecialtyId === ""
        ? requestedSpecialtyId
        : fallbackSpecialtyId,
    pricePerM2: initialData?.pricePerM2 ?? LISTING_FORM_DEFAULTS.pricePerM2,
    availability:
      initialData?.availability ?? LISTING_FORM_DEFAULTS.availability,
    budgetType: initialData?.budgetType ?? LISTING_FORM_DEFAULTS.budgetType,
    yearsExperience:
      initialData?.yearsExperience ?? LISTING_FORM_DEFAULTS.yearsExperience,
    mainImageIndex:
      initialData?.mainImageIndex ?? LISTING_FORM_DEFAULTS.mainImageIndex,
  };
}

export function applyListingFormInitialData({
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
}: ApplyListingFormInitialDataParams): void {
  const initialValues = getListingFormInitialValues(initialData, specialties);

  setDisplayName(initialValues.displayName);
  setDescription(initialValues.description);
  setCity(initialValues.city);
  setProvince(initialValues.province);
  setPostalCode(initialValues.postalCode);
  setServiceRadiusKm(initialValues.serviceRadiusKm);
  setAcceptTerms(initialValues.acceptTerms);
  setSelectedSpecialtyId(initialValues.selectedSpecialtyId);
  setPricePerM2(initialValues.pricePerM2);
  setAvailability(initialValues.availability);
  setBudgetType(initialValues.budgetType);
  setYearsExperience(initialValues.yearsExperience);
  setMainImageIndex(initialValues.mainImageIndex);
}

export function createListingFormInitialDataFromExistingListing(
  listing: ExistingListingFormData
): ListingFormInitialData {
  return {
    displayName: listing.displayName,
    description: listing.description,
    city: listing.city,
    province: listing.province,
    postalCode: listing.postalCode,
    serviceRadiusKm: listing.serviceRadiusKm,
    selectedSpecialtyId: listing.selectedSpecialtyId,
    pricePerM2: listing.pricePerM2,
    availability: listing.availability,
    budgetType: listing.budgetType,
    yearsExperience: listing.yearsExperience,
    acceptTerms: false,
    mainImageIndex: 0,
  };
}

export async function fetchExistingListingFormData({
  listingId,
  setInitialData,
  setListingMessage,
  setIsLoadingInitialData,
}: FetchExistingListingFormDataParams): Promise<void> {
  if (!listingId.trim()) {
    setInitialData(null);
    setIsLoadingInitialData(false);
    return;
  }

  setIsLoadingInitialData(true);

  try {
    const response = await fetch(`/api/listings/${listingId}/form-data`);
    const data: FetchExistingListingFormDataResponse = await response.json();

    if (!response.ok || !data.listing) {
      setInitialData(null);
      setListingMessage(data.error || "No se pudo cargar el anuncio");
      setIsLoadingInitialData(false);
      return;
    }

    setInitialData(createListingFormInitialDataFromExistingListing(data.listing));
    setListingMessage("");
    setIsLoadingInitialData(false);
  } catch (error) {
    console.error("Error al cargar datos iniciales del anuncio:", error);
    setInitialData(null);
    setListingMessage("Error al cargar los datos iniciales del anuncio");
    setIsLoadingInitialData(false);
  }
}

export function isInvalidPrice(value: string): boolean {
  if (value === "") return false;
  return Number(value) <= 0;
}

export function handlePhoneSaveBackendError({
  errorMessage,
  setPhoneMessage,
  setPhoneLoading,
}: HandlePhoneSaveBackendErrorParams): void {
  setPhoneMessage(errorMessage || "Error al guardar el teléfono");
  setPhoneLoading(false);
}

export function handlePhoneSaveSuccess({
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

export function validateProfessionalPhone(
  phone: string
): PhoneValidationResult {
  if (!phone.trim()) {
    return "El teléfono es obligatorio";
  }

  if (!/^\d{9}$/.test(phone)) {
    return "El teléfono debe tener 9 dígitos";
  }

  return null;
}

export function handleListingConnectionError({
  setListingMessage,
  setLoading,
}: HandleListingConnectionErrorParams): void {
  setListingMessage("Error de conexión");
  window.scrollTo({ top: 0, behavior: "smooth" });
  setLoading(false);
}

export function handleListingSuccess({
  successMessage,
  setListingMessage,
  resetForm,
  setLoading,
}: HandleListingSuccessParams): void {
  setListingMessage(successMessage);
  window.scrollTo({ top: 0, behavior: "smooth" });
  resetForm();
  setLoading(false);
}

export function handleListingBackendError({
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

export function createListingFormData({
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
  formData.append("specialtyId", selectedSpecialtyId);
  formData.append("pricePerM2", pricePerM2);

  images.forEach((image) => {
    formData.append("images", image);
  });

  return formData;
}

export function validateListingForm({
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
  requireImages = true,
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

  if (!selectedSpecialtyId) {
    return { message: "Debes seleccionar una especialidad" };
  }

  if (!pricePerM2 || Number(pricePerM2) <= 0) {
    return { message: "El precio por m² debe ser mayor que 0" };
  }

  if (!city.trim()) {
    return { message: "La ciudad es obligatoria" };
  }

  if (city.trim().length < 3) {
    return {
      message: "La ciudad debe tener al menos 3 caracteres",
    };
  }

  if (
    !province ||
    !SPAIN_PROVINCES.includes(province as (typeof SPAIN_PROVINCES)[number])
  ) {
    return { message: "Debes seleccionar una provincia válida" };
  }

  if (!/^\d{5}$/.test(postalCode)) {
    return { message: "El código postal debe tener 5 dígitos" };
  }

  if (!serviceRadiusKm || Number(serviceRadiusKm) <= 0) {
    return { message: "El radio de servicio debe ser mayor que 0" };
  }

  if (requireImages && imagesCount === 0) {
    return {
      message: "Debes añadir al menos una imagen",
      touchImages: true,
    };
  }

  if (!acceptTerms) {
    return { message: "Debes aceptar los términos para continuar" };
  }

  return null;
}

export function resetListingFormAfterSuccess({
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
  setDisplayName(LISTING_FORM_DEFAULTS.displayName);
  setDescription(LISTING_FORM_DEFAULTS.description);
  setCity(LISTING_FORM_DEFAULTS.city);
  setProvince(LISTING_FORM_DEFAULTS.province);
  setPostalCode(LISTING_FORM_DEFAULTS.postalCode);
  setServiceRadiusKm(LISTING_FORM_DEFAULTS.serviceRadiusKm);
  setAcceptTerms(LISTING_FORM_DEFAULTS.acceptTerms);
  setPricePerM2(LISTING_FORM_DEFAULTS.pricePerM2);
  setAvailability(LISTING_FORM_DEFAULTS.availability);
  setBudgetType(LISTING_FORM_DEFAULTS.budgetType);
  setYearsExperience(LISTING_FORM_DEFAULTS.yearsExperience);
  setImages([]);
  setImagePreviews([]);
  setImagesTouched(false);
  setMainImageIndex(LISTING_FORM_DEFAULTS.mainImageIndex);
  setSelectedSpecialtyId(specialties[0]?.id || LISTING_FORM_DEFAULTS.selectedSpecialtyId);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function handleInitialUserResponse({
  userResponseOk,
  userData,
  setListingMessage,
  setCheckingUser,
  setUser,
  setPhone,
  setPhoneSaved,
}: HandleInitialUserResponseParams): boolean {
  if (!userResponseOk) {
    setListingMessage(userData.error || "No se pudo cargar el usuario");
    setCheckingUser(false);
    return false;
  }

  if (!userData.user) {
    setListingMessage("No se pudo cargar el usuario");
    setCheckingUser(false);
    return false;
  }

  setUser(userData.user);

  const currentPhone = userData.user.professionalProfile?.phone || "";
  setPhone(currentPhone);
  setPhoneSaved(Boolean(currentPhone));

  return true;
}

export function handleInitialSpecialtiesResponse({
  specialtiesResponseOk,
  specialtiesData,
  setListingMessage,
  setCheckingUser,
  setSpecialties,
  setSelectedSpecialtyId,
}: HandleInitialSpecialtiesResponseParams): boolean {
  if (!specialtiesResponseOk) {
    setListingMessage(
      specialtiesData.error || "No se pudieron cargar las especialidades"
    );
    setCheckingUser(false);
    return false;
  }

  const nextSpecialties = specialtiesData.specialties || [];
  setSpecialties(nextSpecialties);

  if (nextSpecialties.length > 0) {
    setSelectedSpecialtyId(nextSpecialties[0].id);
  }

  return true;
}

export async function fetchInitialListingFormData({
  setListingMessage,
  setCheckingUser,
  setUser,
  setPhone,
  setPhoneSaved,
  setSpecialties,
  setSelectedSpecialtyId,
}: FetchInitialListingFormDataParams): Promise<void> {
  try {
    const [userResponse, specialtiesResponse] = await Promise.all([
      fetch("/api/me"),
      fetch("/api/specialties"),
    ]);

    const userData = await userResponse.json();
    const specialtiesData = await specialtiesResponse.json();

    const userOk = handleInitialUserResponse({
      userResponseOk: userResponse.ok,
      userData,
      setListingMessage,
      setCheckingUser,
      setUser,
      setPhone,
      setPhoneSaved,
    });

    if (!userOk) {
      return;
    }

    const specialtiesOk = handleInitialSpecialtiesResponse({
      specialtiesResponseOk: specialtiesResponse.ok,
      specialtiesData,
      setListingMessage,
      setCheckingUser,
      setSpecialties,
      setSelectedSpecialtyId,
    });

    if (!specialtiesOk) {
      return;
    }

    setCheckingUser(false);
  } catch (error) {
    console.error("Error cargando datos iniciales del formulario:", error);
    setListingMessage("No se pudieron cargar los datos iniciales");
    setCheckingUser(false);
  }
}
