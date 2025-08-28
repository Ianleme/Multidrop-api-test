import z from "zod";

// EXTERNAL SCHEMAS AND TYPES
import { couponSchema } from "../../../../rest-clients/multidrop/types/schema/offer-schemas";
import { paymentDataSchema } from "../../../../payment/stripe/types/schemas/payment-schemas";
import { checkoutDataSchema } from "../../../../rest-clients/multidrop/types/schema/checkout-schemas";
import { customerMetadataSchema } from "../../../../pixels/types/schemas/pixel-schemas";
import { customerBillingDataSchema } from "../../../../payment/stripe/types/schemas/customer-schemas";

const checkoutStatusEnum = z.enum(["initial", "pending_data", "requires_payment", "processing", "concluded"]);

const checkoutStatusSchema = z.object({
    status: checkoutStatusEnum,
    coupon: couponSchema.optional(),
    orderBumpItens: z.array(z.object({
        id: z.string(),
        paymentData: paymentDataSchema.optional()
    })),
    upsell: z.object({
        value: z.number(),
        id: z.string(),
        status: checkoutStatusEnum,
        paymentIntentId: z.string()
    }).optional(),
    downsell: z.object({        
        value: z.number(),
        id: z.string(),
        status: checkoutStatusEnum,
        paymentIntentId: z.string()
    }).optional(),
    amount: z.number().default(1),
});

const redisSessionSchema = z.object({
    paymentData: paymentDataSchema.optional(),
    checkoutData: checkoutDataSchema,
    checkoutStatus: checkoutStatusSchema,
    customerData: customerBillingDataSchema
        .extend({
            id: z.string().nullable(),
        })
        .optional(),
    customerMetadata: customerMetadataSchema,
});

export { redisSessionSchema };
