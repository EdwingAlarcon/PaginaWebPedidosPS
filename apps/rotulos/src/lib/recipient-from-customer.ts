import type { Customer } from "@/lib/business-types";
import type { Recipient } from "@/lib/types";

export function mergeCustomerIntoRecipient(recipient: Recipient, customer: Customer): Recipient {
  return {
    ...recipient,
    fullName: customer.fullName,
    phone: customer.phone,
    department: customer.department,
    city: customer.city,
    locality: customer.locality ?? "",
    address: customer.address,
    neighborhood: customer.neighborhood,
  };
}
