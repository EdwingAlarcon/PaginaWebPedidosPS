"use client";

import { Select } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import type { CatalogFilterOption } from "@/lib/catalog-filter";

interface CatalogCategorySelectProps {
  value: string;
  options: CatalogFilterOption[];
  onChange: (value: string) => void;
}

export function CatalogCategorySelect({ value, options, onChange }: CatalogCategorySelectProps) {
  return (
    <FormField label="Categoría" className="w-52">
      <Select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </FormField>
  );
}
