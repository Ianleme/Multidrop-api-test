import z from "zod";

const addressSchema = z.object({
    address: z.string(),
    city: z.string(),
    country: z.string(),
    state: z.string(),
    zipCode: z.string(),
});

const customerDataSchema = addressSchema.extend({
    name: z.string(),
    phone: z.string(),
    email: z.string()
});

export { addressSchema, customerDataSchema }