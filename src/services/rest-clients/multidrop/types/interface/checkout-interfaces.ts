import z from "zod";

// INTERNAL SCHEMAS AND TYPES
import { checkoutDataSchema, initializeCheckoutSchema } from "../schema/checkout-schemas";

type InitializeCheckoutInterface = z.infer<typeof initializeCheckoutSchema>;
type CheckoutDataInterface = z.infer<typeof checkoutDataSchema>;

export type { CheckoutDataInterface, InitializeCheckoutInterface };
