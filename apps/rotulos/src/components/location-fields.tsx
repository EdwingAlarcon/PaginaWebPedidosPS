import { getBogotaLocalities, getBogotaNeighborhoodsByLocality, getCitiesByDepartment, getDepartments, isBogotaLocation } from "@/lib/location";
import type { LocationFieldsValue } from "@/lib/location";
import { FormField } from "@/components/ui/form-field";
import { Input, Select, Textarea } from "@/components/ui/input";

type LocationFieldChange<T extends LocationFieldsValue> = T | ((current: T) => T);

type LocationFieldsProps<T extends LocationFieldsValue> = {
  value: T;
  onChange: (value: LocationFieldChange<T>) => void;
  errors: Record<string, string>;
  prefix: string;
  addressLabel?: string;
  addressAsTextarea?: boolean;
  addressRows?: number;
  includeNeighborhood?: boolean;
  required?: boolean;
  limits?: {
    department?: number;
    city?: number;
    locality?: number;
    neighborhood?: number;
    address?: number;
  };
};

function hasOption<T extends { name: string; code: string }>(items: T[], value: string): boolean {
  return items.some((item) => item.name === value || item.code === value);
}

export function LocationFields<T extends LocationFieldsValue>({
  value,
  onChange,
  errors,
  prefix,
  addressLabel = "Dirección",
  addressAsTextarea = false,
  addressRows = 2,
  includeNeighborhood = true,
  required = false,
  limits,
}: LocationFieldsProps<T>) {
  const departments = getDepartments();
  const cities = getCitiesByDepartment(value.department);
  const localities = getBogotaLocalities();
  const showLocality = isBogotaLocation(value);
  const bogotaNeighborhoods = showLocality ? getBogotaNeighborhoodsByLocality(value.locality ?? "") : [];
  const cityDisabled = !value.department;
  const localityDisabled = !showLocality || !value.city;
  const neighborhoodDisabled = showLocality && !(value.locality ?? "");
  const disabledSelectClassName = "border-dashed bg-surface-muted";

  function patch(next: Partial<T>) {
    onChange((current) => ({ ...current, ...next }));
  }

  function setDepartment(department: string) {
    patch({ department, city: "", locality: "", neighborhood: "" } as Partial<T>);
  }

  function setCity(city: string) {
    patch({ city, locality: "", neighborhood: "" } as Partial<T>);
  }

  function setLocality(locality: string) {
    patch({ locality, neighborhood: "" } as Partial<T>);
  }

  return (
    <>
      <FormField label="Departamento" htmlFor={`${prefix}.department`} required={required} error={errors[`${prefix}.department`]}>
        <Select id={`${prefix}.department`} value={value.department} onChange={(event) => setDepartment(event.target.value)}>
          <option value="">Selecciona departamento</option>
          {value.department && !hasOption(departments, value.department) ? (
            <option value={value.department}>{value.department}</option>
          ) : null}
          {departments.map((department) => (
            <option key={department.code} value={department.name}>
              {department.name}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField
        label="Ciudad / municipio"
        htmlFor={`${prefix}.city`}
        required={required}
        error={errors[`${prefix}.city`]}
        hint={cityDisabled ? "Selecciona primero un departamento." : undefined}
      >
        <Select
          id={`${prefix}.city`}
          value={value.city}
          disabled={cityDisabled}
          className={cityDisabled ? disabledSelectClassName : undefined}
          onChange={(event) => setCity(event.target.value)}
        >
          <option value="">Selecciona ciudad / municipio</option>
          {value.city && !hasOption(cities, value.city) ? <option value={value.city}>{value.city}</option> : null}
          {cities.map((city) => (
            <option key={city.code} value={city.name}>
              {city.name}
            </option>
          ))}
        </Select>
      </FormField>

      {showLocality ? (
        <FormField
          label="Localidad"
          htmlFor={`${prefix}.locality`}
          required={required}
          error={errors[`${prefix}.locality`]}
          hint={localityDisabled ? "Selecciona primero una ciudad." : undefined}
        >
          <Select
            id={`${prefix}.locality`}
            value={value.locality ?? ""}
            disabled={localityDisabled}
            className={localityDisabled ? disabledSelectClassName : undefined}
            onChange={(event) => setLocality(event.target.value)}
          >
            <option value="">Selecciona localidad</option>
            {value.locality && !hasOption(localities, value.locality) ? <option value={value.locality}>{value.locality}</option> : null}
            {localities.map((locality) => (
              <option key={locality.code} value={locality.name}>
                {locality.name}
              </option>
            ))}
          </Select>
        </FormField>
      ) : null}

      {includeNeighborhood ? (
        <FormField
          label="Barrio / sector"
          htmlFor={`${prefix}.neighborhood`}
          error={errors[`${prefix}.neighborhood`]}
          hint={neighborhoodDisabled ? "Selecciona primero una localidad." : undefined}
        >
          {showLocality ? (
            <Select
              id={`${prefix}.neighborhood`}
              value={value.neighborhood ?? ""}
              disabled={neighborhoodDisabled}
              className={neighborhoodDisabled ? disabledSelectClassName : undefined}
              onChange={(event) => patch({ neighborhood: event.target.value } as Partial<T>)}
            >
              <option value="">Selecciona barrio / sector</option>
              {value.neighborhood && !hasOption(bogotaNeighborhoods, value.neighborhood) ? (
                <option value={value.neighborhood}>{value.neighborhood}</option>
              ) : null}
              {bogotaNeighborhoods.map((neighborhood) => (
                <option key={neighborhood.code} value={neighborhood.name}>
                  {neighborhood.name}
                </option>
              ))}
            </Select>
          ) : (
            <Input
              id={`${prefix}.neighborhood`}
              value={value.neighborhood ?? ""}
              maxLength={limits?.neighborhood}
              onChange={(event) => patch({ neighborhood: event.target.value } as Partial<T>)}
            />
          )}
        </FormField>
      ) : null}

      <FormField label={addressLabel} htmlFor={`${prefix}.address`} required={required} error={errors[`${prefix}.address`]} className="sm:col-span-2">
        {addressAsTextarea ? (
          <Textarea
            id={`${prefix}.address`}
            value={value.address}
            maxLength={limits?.address}
            rows={addressRows}
            onChange={(event) => patch({ address: event.target.value } as Partial<T>)}
          />
        ) : (
          <Input
            id={`${prefix}.address`}
            value={value.address}
            maxLength={limits?.address}
            onChange={(event) => patch({ address: event.target.value } as Partial<T>)}
          />
        )}
      </FormField>
    </>
  );
}
