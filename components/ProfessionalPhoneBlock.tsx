type ProfessionalPhoneBlockProps = Readonly<{
  phoneMessage: string;
  phoneSaved: boolean;
  phone: string;
  phoneLoading: boolean;
  currentPhone?: string | null;
  onPhoneChange: (value: string) => void;
  onSavePhone: () => void;
  onEditPhone: () => void;
}>;

export default function ProfessionalPhoneBlock({
  phoneMessage,
  phoneSaved,
  phone,
  phoneLoading,
  onPhoneChange,
  onSavePhone,
  onEditPhone,
}: ProfessionalPhoneBlockProps) {
  return (
    <>
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
            onClick={onEditPhone}
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
            Debes añadir y guardar tu teléfono profesional antes de poder crear
            anuncios.
          </div>

          <div className="form-actions-row">
            <input
              type="text"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value.replace(/\D/g, ""))}
              maxLength={9}
              placeholder="Ej: 600123456"
              className="input form-input-grow"
            />

            <button
              type="button"
              onClick={onSavePhone}
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
    </>
  );
}