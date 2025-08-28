import z from "zod";
import { customerBillingDataSchema, customerDataSchema, updateCustomerBillingDataSchema } from "../schemas/customer-schemas";

type CustomerBillingDataInterface = z.infer<typeof customerBillingDataSchema>;
type UpdateCustomerBillingDataInterface = z.infer<typeof updateCustomerBillingDataSchema>
type CustomerDataInterface = z.infer<typeof customerDataSchema>;

export type { CustomerBillingDataInterface, CustomerDataInterface, UpdateCustomerBillingDataInterface };
