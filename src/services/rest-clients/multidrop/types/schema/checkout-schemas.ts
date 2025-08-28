import z from "zod";

// INTERNAL SCHEMAS AND TYPES
import {
    offerSchema,
    orderBumpSchema,
    personalizationSchema,
    pixelSchema,
    productSchema,
    upsellSchema,
} from "./offer-schemas";

const initializeCheckoutSchema = z.object({
    offerId: z.string({ error: "Informe 'offerId' como parâmetro de busca" }),
    sellerId: z.string({ error: "Informe 'sellerId' como parâmetro de busca" }),
})

const checkoutDataSchema = initializeCheckoutSchema.extend({
    offer: offerSchema,
    product: productSchema,
    strategy: z.object({
        orderBump: z.array(orderBumpSchema).optional(),
        upsell: upsellSchema.optional(),
        downsell: upsellSchema.optional(),
    }),
    personalization: personalizationSchema,
    pixels: z.array(pixelSchema).optional(),
});

export { checkoutDataSchema, initializeCheckoutSchema };
