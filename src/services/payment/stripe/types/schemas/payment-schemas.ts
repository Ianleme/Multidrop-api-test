import z from "zod"

const createPaymentIntentSchema = z.object({
    amount: z.number(),
    currency: z.string(),
    customerId: z.string().optional()
})

const updatedPaymentIntent = createPaymentIntentSchema.partial()

const paymentDataSchema = z.object({
    id: z.string().describe("Id da intenção de pagamento"),
    paymentType: z.enum(["recurrence", "unique"]),
    lastInvoice: z.string().optional(),
    client_secret: z.string().describe("Secret do cliente"),
    amount: z.number().describe("Valor, em centavos, da intenção de pagamento").optional(),
}).describe("Informações referentes a Stripe")

export { paymentDataSchema, createPaymentIntentSchema, updatedPaymentIntent }