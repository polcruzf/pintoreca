type ListingSubmitButtonProps = Readonly<{
  loading: boolean;
  imagesOptimizing: boolean;
  phoneSaved: boolean;
}>;

export default function ListingSubmitButton({
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
        ? "Creando..."
        : imagesOptimizing
        ? "Optimizando imágenes..."
        : !phoneSaved
        ? "Guarda tu teléfono para continuar"
        : "Crear anuncio"}
    </button>
  );
}