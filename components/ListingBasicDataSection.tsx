type Specialty = {
  id: string;
  name: string;
};

type ListingBasicDataSectionProps = Readonly<{
  displayName: string;
  description: string;
  selectedSpecialtyId: string;
  specialties: Specialty[];
  onDisplayNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSelectedSpecialtyIdChange: (value: string) => void;
}>;

export default function ListingBasicDataSection({
  displayName,
  description,
  selectedSpecialtyId,
  specialties,
  onDisplayNameChange,
  onDescriptionChange,
  onSelectedSpecialtyIdChange,
}: ListingBasicDataSectionProps) {
  return (
    <div className="form-section-card">
      <h2 className="form-section-title">Datos del anuncio</h2>

      <div className="form-section-fields">
        <div>
          <label className="label">
            Nombre del anuncio <span className="required">*</span>
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => onDisplayNameChange(e.target.value)}
            className="input"
          />

          {displayName.trim().length > 0 && displayName.trim().length < 3 && (
            <p className="form-helper-error">
              El nombre del anuncio debe tener al menos 3 caracteres.
            </p>
          )}
        </div>

        <div>
          <label className="label">
            Descripción <span className="required">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={5}
            className="textarea textarea-resize-vertical"
          />

          {description.trim().length > 0 &&
            description.trim().length < 10 && (
              <p className="form-helper-error">
                La descripción debe tener al menos 10 caracteres.
              </p>
            )}
        </div>

        <div>
          <label className="label">
            Especialidad <span className="required">*</span>
          </label>
          <select
            value={selectedSpecialtyId}
            onChange={(e) => onSelectedSpecialtyIdChange(e.target.value)}
            className="select"
          >
            {specialties.map((specialty) => (
              <option key={specialty.id} value={specialty.id}>
                {specialty.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}