import z from "zod"

// EXTERNAL SCHEMAS AND TYPES
import { couponSchema } from "../../../../services/rest-clients/multidrop/types/schema/offer-schemas";
import { redisSessionSchema } from "../../../../services/storage/redis/types/schemas/redis-schemas";

const initializeCheckoutSchema = z.object({
    offerId: z.string({ error: "Informe 'offerId' como parâmetro de busca" }),
    sellerId: z.string({ error: "Informe 'sellerId' como parâmetro de busca" })
})

const checkoutStatusEnum = z.enum(["initial", "pending_data", "processing", "concluded"]);

const checkoutStatusSchema = z.object({
    status: checkoutStatusEnum,
    coupon: couponSchema.optional(),
    orderBumpItens: z.array(z.string()),
    amount: z.number().default(1),
});

const checkoutSessionSchema = z.object({
    sessionId: z.string().describe("Id da sessão do banco Redis"),
    sessionData: redisSessionSchema
})

export { initializeCheckoutSchema, checkoutStatusSchema, checkoutSessionSchema }