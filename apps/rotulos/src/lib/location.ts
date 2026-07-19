import { BOGOTA_LOCALITIES } from "@/lib/bogota-locations";
import { BOGOTA_NEIGHBORHOODS_BY_LOCALITY } from "@/lib/bogota-neighborhoods";
import { COLOMBIA_DEPARTMENTS, COLOMBIA_MUNICIPALITIES } from "@/lib/colombia-locations";
import { normalizeText } from "@/lib/normalize";

export type LocationFieldsValue = {
  department: string;
  city: string;
  address: string;
  locality?: string;
  neighborhood?: string;
};

function normalizeLookup(value: string): string {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^A-Z0-9]+/g, "");
}

function cityAliases(value: string): string[] {
  const lookup = normalizeLookup(value);
  const aliases: Record<string, string[]> = {
    CALI: ["SANTIAGODECALI"],
    CARTAGENA: ["CARTAGENADEINDIAS"],
  };
  return [lookup, ...(aliases[lookup] ?? [])];
}

export function getDepartments() {
  return COLOMBIA_DEPARTMENTS;
}

export function getCitiesByDepartment(department: string) {
  const selected = findDepartment(department);
  if (!selected) return [];
  return COLOMBIA_MUNICIPALITIES.filter((city) => city.departmentCode === selected.code);
}

export function getBogotaLocalities() {
  return BOGOTA_LOCALITIES;
}

export function getBogotaNeighborhoodsByLocality(locality: string) {
  const lookup = normalizeLookup(locality);
  const group = BOGOTA_NEIGHBORHOODS_BY_LOCALITY.find((item) => normalizeLookup(item.locality) === lookup);
  return group?.neighborhoods ?? [];
}

export function findDepartment(department: string) {
  const lookup = normalizeLookup(department);
  return COLOMBIA_DEPARTMENTS.find((item) => item.code === department || normalizeLookup(item.name) === lookup) ?? null;
}

export function findMunicipality(department: string, city: string) {
  const selected = findDepartment(department);
  if (!selected) return null;
  const aliases = cityAliases(city);
  return COLOMBIA_MUNICIPALITIES.find((item) => item.departmentCode === selected.code && (item.code === city || aliases.includes(normalizeLookup(item.name)))) ?? null;
}

export function isBogotaCity(city: string): boolean {
  const lookup = normalizeLookup(city);
  return lookup === "BOGOTA" || lookup === "BOGOTADC" || lookup === "BOGOTADISTRITOCAPITAL";
}

export function isBogotaLocation(value: LocationFieldsValue): boolean {
  return isBogotaCity(value.city);
}

export function isValidBogotaLocality(locality: string): boolean {
  const lookup = normalizeLookup(locality);
  return BOGOTA_LOCALITIES.some((item) => item.code === locality || normalizeLookup(item.name) === lookup);
}

export function isValidBogotaNeighborhoodForLocality(locality: string, neighborhood: string): boolean {
  const lookup = normalizeLookup(neighborhood);
  return getBogotaNeighborhoodsByLocality(locality).some((item) => item.code === neighborhood || normalizeLookup(item.name) === lookup);
}

export function normalizeLocationValue(value: string): string {
  return normalizeText(value);
}

export function validateDepartmentCity(value: Pick<LocationFieldsValue, "department" | "city">): "department" | "city" | null {
  if (value.department && !findDepartment(value.department)) return "department";
  if (value.department && value.city && !findMunicipality(value.department, value.city)) return "city";
  return null;
}
