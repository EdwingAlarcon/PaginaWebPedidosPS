import { describe, expect, it } from "vitest";
import {
  findDepartment,
  findMunicipality,
  getBogotaLocalities,
  getBogotaNeighborhoodsByLocality,
  getCitiesByDepartment,
  isBogotaCity,
  isValidBogotaLocality,
  isValidBogotaNeighborhoodForLocality,
  validateDepartmentCity,
} from "@/lib/location";

describe("location helpers", () => {
  it("filters municipalities by department", () => {
    const antioquiaCities = getCitiesByDepartment("ANTIOQUIA");

    expect(antioquiaCities.some((city) => city.name === "MEDELLÍN")).toBe(true);
    expect(antioquiaCities.some((city) => city.name === "SANTIAGO DE CALI")).toBe(false);
  });

  it("recognizes common city aliases without accepting wrong departments", () => {
    expect(findMunicipality("VALLE DEL CAUCA", "CALI")?.name).toBe("SANTIAGO DE CALI");
    expect(findMunicipality("ANTIOQUIA", "CALI")).toBeNull();
  });

  it("detects Bogota variants and validates its localities", () => {
    expect(findDepartment("BOGOTÁ, D.C.")?.code).toBe("11");
    expect(isBogotaCity("Bogota D.C.")).toBe(true);
    expect(getBogotaLocalities()).toHaveLength(20);
    expect(isValidBogotaLocality("Kennedy")).toBe(true);
  });

  it("filters Bogota neighborhoods by locality", () => {
    const kennedyNeighborhoods = getBogotaNeighborhoodsByLocality("KENNEDY");

    expect(kennedyNeighborhoods.length).toBeGreaterThan(0);
    expect(isValidBogotaNeighborhoodForLocality("KENNEDY", "CASTILLA")).toBe(true);
    expect(isValidBogotaNeighborhoodForLocality("KENNEDY", "CEDRITOS")).toBe(false);
  });

  it("rejects city and department mismatches", () => {
    expect(validateDepartmentCity({ department: "CUNDINAMARCA", city: "BOGOTA" })).toBe("city");
    expect(validateDepartmentCity({ department: "ANTIOQUIA", city: "MEDELLIN" })).toBeNull();
  });
});
