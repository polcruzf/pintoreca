import type { ListingSubmitButtonProps } from "@/types/listing-form";

export default function ListingSubmitButton({
  loading,
  imagesOptimizing,
  phoneSaved,
  isEditMode,
  currentSubmitIntent,
  currentListingStatus,
}: ListingSubmitButtonProps) {
  const isDisabled = loading || imagesOptimizing || !phoneSaved;

  const draftButtonText = loading
    ? currentSubmitIntent === "draft"
      ? currentListingStatus === "PUBLISHED" && isEditMode
        ? "Pasando a borrador..."
        : "Guardando borrador..."
      : "Guardar borrador"
    : imagesOptimizing
    ? "Optimizando imágenes..."
    : !phoneSaved
    ? "Guarda tu teléfono para continuar"
    : currentListingStatus === "PUBLISHED" && isEditMode
    ? "Pasar a borrador"
    : "Guardar borrador";

  const publishButtonText = loading
    ? currentSubmitIntent === "publish"
      ? currentListingStatus === "PUBLISHED" && isEditMode
        ? "Guardando publicación..."
        : "Publicando..."
      : isEditMode && currentListingStatus === "PUBLISHED"
      ? "Guardar y seguir publicado"
      : isEditMode
      ? "Guardar y publicar"
      : "Publicar anuncio"
    : imagesOptimizing
    ? "Optimizando imágenes..."
    : !phoneSaved
    ? "Guarda tu teléfono para continuar"
    : currentListingStatus === "PUBLISHED" && isEditMode
    ? "Guardar y seguir publicado"
    : isEditMode
    ? "Guardar y publicar"
    : "Publicar anuncio";

  return (
    <div className="form-submit-actions">
      <button
        type="submit"
        name="submissionIntent"
        value="draft"
        disabled={isDisabled}
        className={`form-submit-button is-secondary${
          isDisabled ? " is-disabled" : ""
        }`}
      >
        {draftButtonText}
      </button>

      <button
        type="submit"
        name="submissionIntent"
        value="publish"
        disabled={isDisabled}
        className={`form-submit-button${isDisabled ? " is-disabled" : ""}`}
      >
        {publishButtonText}
      </button>
    </div>
  );
}
