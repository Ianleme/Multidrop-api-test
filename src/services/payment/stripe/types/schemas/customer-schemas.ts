import z from "zod";

// EXTERNAL SCHEMAS AND TYPES
import { customerDataSchema } from "../../../../rest-clients/multidrop/types/schema/customer-schemas";

const customerBillingDataSchema = customerDataSchema
    .omit({
        zipCode: true,
    })
    .extend({
        postalCode: z.string(),
    });

const updateCustomerBillingDataSchema = customerBillingDataSchema.partial();

export { customerBillingDataSchema, customerDataSchema, updateCustomerBillingDataSchema };
