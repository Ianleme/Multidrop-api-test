import z from "zod"
import { paymentDataSchema, createPaymentIntentSchema, updatedPaymentIntent } from "../schemas/payment-schemas"

type PaymentDataInterface = z.infer<typeof paymentDataSchema>
type CreatePaymentIntentInterface = z.infer<typeof createPaymentIntentSchema>
type UpdatePaymentIntentInterface = z.infer<typeof updatedPaymentIntent>

export type { PaymentDataInterface, CreatePaymentIntentInterface, UpdatePaymentIntentInterface }