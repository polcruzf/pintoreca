import type { ListingSubmitButtonProps } from "@/types/listing-form";

export default function ListingSubmitButton({
  mode,
  loading,
  imagesOptimizing,
  phoneSaved,
}: ListingSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading || imagesOptimizing || !phoneSaved}
      className={`form-submit-button${
        loading || imagesOptimizing || !phoneSaved ? " is-disabled" : ""
      }`}
    >
      {loading
        ? mode === "edit"
          ? "Guardando..."
          : "Creando..."
        : imagesOptimizing
        ? "Optimizando imágenes..."
        : !phoneSaved
        ? "Guarda tu teléfono para continuar"
        : mode === "edit"
        ? "Guardar cambios"
        : "Crear anuncio"}
    </button>
  );
}