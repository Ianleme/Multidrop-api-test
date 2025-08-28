import z from "zod"

// INTERNAL SCHEMAS AND TYPES
import { initializeCheckoutSchema } from "../schemas/checkout-schemas"


// EXTERNAL SCHEMAS AND TYPES
import { RedisSessionInterface } from "../../../../services/storage/redis/types/interfaces/redis-interfaces"
import { checkoutDataSchema } from "../../../../services/rest-clients/multidrop/types/schema/checkout-schemas"

type InitializeCheckoutInterface = z.infer<typeof initializeCheckoutSchema>
type CheckoutDataInterface = z.infer<typeof checkoutDataSchema>

export type { InitializeCheckoutInterface, CheckoutDataInterface, RedisSessionInterface }