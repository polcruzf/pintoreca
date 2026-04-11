import type { Dispatch, SetStateAction } from "react";

export type UserData = Readonly<{
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  professionalProfile:
    | Readonly<{
        id: string;
        phone?: string | null;
      }>
    | null;
}>;

export type Specialty = Readonly<{
  id: string;
  name: string;
}>;

export type ListingMode = "create" | "edit";

export type ListingFormDefaults = Readonly<{
  displayName: string;
  description: string;
  city: string;
  province: string;
  postalCode: string;
  serviceRadiusKm: string;
  acceptTerms: boolean;
  selectedSpecialtyId: string;
  pricePerM2: string;
  availability: string;
  budgetType: string;
  yearsExperience: string;
  mainImageIndex: number;
}>;

export type ListingFormInitialData = Readonly<{
  displayName?: string;
  description?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  serviceRadiusKm?: string;
  acceptTerms?: boolean;
  selectedSpecialtyId?: string;
  pricePerM2?: string;
  availability?: string;
  budgetType?: string;
  yearsExperience?: string;
  mainImageIndex?: number;
}>;

export type ListingFormInitialValues = Readonly<{
  displayName: string;
  description: string;
  city: string;
  province: string;
  postalCode: string;
  serviceRadiusKm: string;
  acceptTerms: boolean;
  selectedSpecialtyId: string;
  pricePerM2: string;
  availability: string;
  budgetType: string;
  yearsExperience: string;
  mainImageIndex: number;
}>;

export type ApplyListingFormInitialDataParams = Readonly<{
  initialData: ListingFormInitialData | null;
  specialties: Specialty[];
  setDisplayName: (value: string) => void;
  setDescription: (value: string) => void;
  setCity: (value: string) => void;
  setProvince: (value: string) => void;
  setPostalCode: (value: string) => void;
  setServiceRadiusKm: (value: string) => void;
  setAcceptTerms: (value: boolean) => void;
  setSelectedSpecialtyId: (value: string) => void;
  setPricePerM2: (value: string) => void;
  setAvailability: (value: string) => void;
  setBudgetType: (value: string) => void;
  setYearsExperience: (value: string) => void;
  setMainImageIndex: (value: number) => void;
}>;

export type ExistingListingFormData = Readonly<{
  id: string;
  displayName: string;
  description: string;
  yearsExperience: string;
  availability: string;
  budgetType: string;
  postalCode: string;
  city: string;
  province: string;
  serviceRadiusKm: string;
  selectedSpecialtyId: string;
  pricePerM2: string;
}>;

export type FetchExistingListingFormDataResponse = Readonly<{
  listing?: ExistingListingFormData;
  error?: string;
}>;

export type FetchExistingListingFormDataParams = Readonly<{
  listingId: string;
  setInitialData: Dispatch<SetStateAction<ListingFormInitialData | null>>;
  setListingMessage: (value: string) => void;
  setIsLoadingInitialData: (value: boolean) => void;
}>;

export type ListingValidationResult =
  | Readonly<{
      message: string;
      touchImages?: boolean;
    }>
  | null;

export type ListingValidationInput = Readonly<{
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
  requireImages?: boolean;
}>;

export type ResetListingFormParams = Readonly<{
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

export type CreateListingFormDataParams = Readonly<{
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

export type ListingBackendErrorData = Readonly<{
  error?: string;
  message?: string;
}>;

export type HandleListingBackendErrorParams = Readonly<{
  data: ListingBackendErrorData;
  setListingMessage: (value: string) => void;
  setPhoneSaved: (value: boolean) => void;
  setLoading: (value: boolean) => void;
}>;

export type HandleListingSuccessParams = Readonly<{
  successMessage: string;
  setListingMessage: (value: string) => void;
  resetForm: () => void;
  setLoading: (value: boolean) => void;
}>;

export type HandleListingConnectionErrorParams = Readonly<{
  setListingMessage: (value: string) => void;
  setLoading: (value: boolean) => void;
}>;

export type PhoneValidationResult = string | null;

export type HandlePhoneSaveSuccessParams = Readonly<{
  phone: string;
  setPhoneMessage: (value: string) => void;
  setPhoneSaved: (value: boolean) => void;
  setUser: Dispatch<SetStateAction<UserData | null>>;
  setPhoneLoading: (value: boolean) => void;
}>;

export type HandlePhoneSaveBackendErrorParams = Readonly<{
  errorMessage?: string;
  setPhoneMessage: (value: string) => void;
  setPhoneLoading: (value: boolean) => void;
}>;

export type HandleInitialUserResponseParams = Readonly<{
  userResponseOk: boolean;
  userData: {
    error?: string;
    user?: UserData;
  };
  setListingMessage: (value: string) => void;
  setCheckingUser: (value: boolean) => void;
  setUser: Dispatch<SetStateAction<UserData | null>>;
  setPhone: (value: string) => void;
  setPhoneSaved: (value: boolean) => void;
}>;

export type HandleInitialSpecialtiesResponseParams = Readonly<{
  specialtiesResponseOk: boolean;
  specialtiesData: {
    error?: string;
    specialties?: Specialty[];
  };
  setListingMessage: (value: string) => void;
  setCheckingUser: (value: boolean) => void;
  setSpecialties: Dispatch<SetStateAction<Specialty[]>>;
  setSelectedSpecialtyId: (value: string) => void;
}>;

export type FetchInitialListingFormDataParams = Readonly<{
  setListingMessage: (value: string) => void;
  setCheckingUser: (value: boolean) => void;
  setUser: Dispatch<SetStateAction<UserData | null>>;
  setPhone: (value: string) => void;
  setPhoneSaved: (value: boolean) => void;
  setSpecialties: Dispatch<SetStateAction<Specialty[]>>;
  setSelectedSpecialtyId: (value: string) => void;
}>;

export type ListingBasicDataSectionProps = Readonly<{
  displayName: string;
  description: string;
  selectedSpecialtyId: string;
  specialties: Specialty[];
  onDisplayNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSelectedSpecialtyIdChange: (value: string) => void;
}>;

export type ListingServiceConditionsSectionProps = Readonly<{
  pricePerM2: string;
  availability: string;
  budgetType: string;
  yearsExperience: string;
  onPricePerM2Change: (value: string) => void;
  onAvailabilityChange: (value: string) => void;
  onBudgetTypeChange: (value: string) => void;
  onYearsExperienceChange: (value: string) => void;
}>;

export type ListingLocationSectionProps = Readonly<{
  city: string;
  province: string;
  postalCode: string;
  serviceRadiusKm: string;
  onCityChange: (value: string) => void;
  onProvinceChange: (value: string) => void;
  onPostalCodeChange: (value: string) => void;
  onServiceRadiusKmChange: (value: string) => void;
}>;

export type ProfessionalPhoneBlockProps = Readonly<{
  phoneMessage: string;
  phoneSaved: boolean;
  phone: string;
  phoneLoading: boolean;
  currentPhone?: string | null;
  onPhoneChange: (value: string) => void;
  onSavePhone: () => void;
  onEditPhone: () => void;
}>;

export type ListingMessageBlockProps = Readonly<{
  listingMessage: string;
}>;

export type TermsCheckboxBlockProps = Readonly<{
  acceptTerms: boolean;
  setAcceptTerms: (value: boolean) => void;
}>;

export type ListingSubmitButtonProps = Readonly<{
  mode: ListingMode;
  loading: boolean;
  imagesOptimizing: boolean;
  phoneSaved: boolean;
}>;
