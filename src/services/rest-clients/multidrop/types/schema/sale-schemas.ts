import z from "zod";
import { addressSchema } from "./customer-schemas";

const saleSchema = z.object({
    cupom: z.string().optional(),
    discount: z.number().optional(),
    linkId: z.number(),
    paymentIntentStripe: z.string(),
    paymentType: z.string(),
    productId: z.number(),
    profileCode: z.string(),
    subscriptionIdStripe: z.string().optional(),
    statusStripe: z.string(),
    totalPrice: z.number(),
});

const registerSaleSchema = z.object({
    basicPaymentInfo: saleSchema,
    orderBump: z.array(
        z.object({
            productId: z.number(),
            value: z.number(),
        })
    ),
    personalPaymentInfo: z.object({
        name: z.string(),
        email: z.string(),
        personalAddress: addressSchema,
        shippingAddress: addressSchema,
    }),
});

export { registerSaleSchema, saleSchema };
