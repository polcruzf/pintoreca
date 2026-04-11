import { SPAIN_PROVINCES } from "@/constants/spain-provinces";
import { sanitizePostalCode } from "@/lib/listing-form";
import type { ListingLocationSectionProps } from "@/types/listing-form";

export default function ListingLocationSection({
  city,
  province,
  postalCode,
  serviceRadiusKm,
  onCityChange,
  onProvinceChange,
  onPostalCodeChange,
  onServiceRadiusKmChange,
}: ListingLocationSectionProps) {
  return (
    <div className="form-section-card">
      <h2 className="form-section-title">Ubicación</h2>

      <div className="form-section-fields">
        <div>
          <label className="label">
            Ciudad <span className="required">*</span>
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            className="input"
          />

          {city.trim().length > 0 && city.trim().length < 3 && (
            <p className="form-helper-error">
              La ciudad debe tener al menos 3 caracteres.
            </p>
          )}
        </div>

        <div>
          <label className="label">
            Provincia <span className="required">*</span>
          </label>
          <select
            value={province}
            onChange={(e) => onProvinceChange(e.target.value)}
            className="select"
          >
            {SPAIN_PROVINCES.map((provinceName) => (
              <option key={provinceName} value={provinceName}>
                {provinceName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">
            Código postal <span className="required">*</span>
          </label>
          <input
            type="text"
            value={postalCode}
            onChange={(e) =>
              onPostalCodeChange(sanitizePostalCode(e.target.value))
            }
            maxLength={5}
            className="input"
          />

          {postalCode.length > 0 && postalCode.length < 5 && (
            <p className="form-helper-error">
              El código postal debe tener 5 dígitos.
            </p>
          )}
        </div>

        <div>
          <label className="label">
            Radio de trabajo (km) <span className="required">*</span>
          </label>
          <select
            value={serviceRadiusKm}
            onChange={(e) => onServiceRadiusKmChange(e.target.value)}
            className="select"
          >
            <option value="1">1 km</option>
            <option value="2">2 km</option>
            <option value="3">3 km</option>
            <option value="4">4 km</option>
            <option value="5">5 km</option>
          </select>
        </div>
      </div>
    </div>
  );
}