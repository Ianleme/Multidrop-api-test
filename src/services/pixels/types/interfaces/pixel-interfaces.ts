import z from "zod";

// SCHEMAS AND TYPES
import { customerMetadataSchema } from "../schemas/pixel-schemas";

// EXTERNAL SCHEMAS AND TYPES
import { PixelInterface } from "../../../rest-clients/multidrop/types/interface/offer-interfaces";
import { CheckoutDataInterface } from "../../../rest-clients/multidrop/types/interface/checkout-interfaces";

type CustomerDataInterface = z.infer<typeof customerMetadataSchema>;
type PixelsEventsEnum =
    | "initiate_checkout"
    | "coupon_add"
    | "coupon_remove"
    | "order_bump_add"
    | "order_bump_remove"
    | "increase_amount"
    | "decrease_amount";

type CustomerPixelData = Omit<CustomerDataInterface, "userIpAddress"> & { userIpAddress: string };

interface SendPixelEventInterface {
    event: PixelsEventsEnum;
    pixel: PixelInterface;
    checkoutData: CheckoutDataInterface;
    customerMetadata: CustomerPixelData;
}

export type { CustomerDataInterface, PixelsEventsEnum, SendPixelEventInterface, PixelInterface, CustomerPixelData };
