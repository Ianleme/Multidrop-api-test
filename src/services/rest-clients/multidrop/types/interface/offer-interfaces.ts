import z from "zod";
import {
    couponSchema,
    offerSchema,
    orderBumpSchema,
    personalizationSchema,
    pixelSchema,
    subscriptionSchema,
    productSchema,
} from "../schema/offer-schemas";

type OfferInterface = z.infer<typeof offerSchema>;
type ProductInterface = z.infer<typeof productSchema>;
type PersionalizationInterface = z.infer<typeof personalizationSchema>;
type PixelInterface = z.infer<typeof pixelSchema>;
type OrderBumpInterface = z.infer<typeof orderBumpSchema>;
type CouponInterface = z.infer<typeof couponSchema>;
type SubscriptionInterface = z.infer<typeof subscriptionSchema>

export type {
    SubscriptionInterface,
    OfferInterface,
    ProductInterface,
    PersionalizationInterface,
    PixelInterface,
    OrderBumpInterface,
    CouponInterface,
};
