import type { TermsCheckboxBlockProps } from "@/types/listing-form";

export default function TermsCheckboxBlock({
  acceptTerms,
  setAcceptTerms,
}: TermsCheckboxBlockProps) {
  return (
    <div className="form-checkbox-row">
      <input
        type="checkbox"
        checked={acceptTerms}
        onChange={(e) => setAcceptTerms(e.target.checked)}
        className="form-checkbox-input"
      />
      <span>Acepto los términos y condiciones</span>
    </div>
  );
}