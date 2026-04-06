function isInvalidPrice(value: string): boolean {
  if (value === "") return false;
  return Number(value) <= 0;
}

type ListingServiceConditionsSectionProps = Readonly<{
  pricePerM2: string;
  availability: string;
  budgetType: string;
  yearsExperience: string;
  onPricePerM2Change: (value: string) => void;
  onAvailabilityChange: (value: string) => void;
  onBudgetTypeChange: (value: string) => void;
  onYearsExperienceChange: (value: string) => void;
}>;

export default function ListingServiceConditionsSection({
  pricePerM2,
  availability,
  budgetType,
  yearsExperience,
  onPricePerM2Change,
  onAvailabilityChange,
  onBudgetTypeChange,
  onYearsExperienceChange,
}: ListingServiceConditionsSectionProps) {
  return (
    <div className="form-section-card">
      <h2 className="form-section-title">Condiciones del servicio</h2>

      <div className="form-section-fields">
        <div>
          <label className="label">
            Precio por m² <span className="required">*</span>
          </label>
          <input
            type="number"
            value={pricePerM2}
            onChange={(e) => onPricePerM2Change(e.target.value)}
            min="1"
            step="0.01"
            className="input"
          />

          {isInvalidPrice(pricePerM2) && (
            <p className="form-helper-error">
              Debes indicar un precio por m² válido.
            </p>
          )}
        </div>

        <div>
          <label className="label">
            Disponibilidad <span className="required">*</span>
          </label>
          <select
            value={availability}
            onChange={(e) => onAvailabilityChange(e.target.value)}
            className="select"
          >
            <option value="MONDAY_TO_FRIDAY">Lunes a viernes</option>
            <option value="MONDAY_TO_SATURDAY">Lunes a sábado</option>
            <option value="MONDAY_TO_SUNDAY">Lunes a domingo</option>
          </select>
        </div>

        <div>
          <label className="label">
            Tipo de presupuesto <span className="required">*</span>
          </label>
          <select
            value={budgetType}
            onChange={(e) => onBudgetTypeChange(e.target.value)}
            className="select"
          >
            <option value="FREE">Presupuesto gratuito</option>
            <option value="PAID">Presupuesto de pago</option>
          </select>
        </div>

        <div>
          <label className="label">
            Años de experiencia <span className="required">*</span>
          </label>
          <select
            value={yearsExperience}
            onChange={(e) => onYearsExperienceChange(e.target.value)}
            className="select"
          >
            <option value="EXPERIENCE_0_2">0 a 2 años</option>
            <option value="EXPERIENCE_3_5">3 a 5 años</option>
            <option value="EXPERIENCE_6_10">6 a 10 años</option>
            <option value="EXPERIENCE_10_20">10 a 20 años</option>
            <option value="EXPERIENCE_20_PLUS">Más de 20 años</option>
          </select>
        </div>
      </div>
    </div>
  );
}