import z from "zod";

import { retrieveSessionSchema, customerMetadataSchema } from "../schemas/session-schemas";

// EXTERNAL INTERFACES
import {
    CustomerBillingDataInterface,
    CustomerDataInterface,
    UpdateCustomerBillingDataInterface
} from "../../../../../../services/payment/stripe/types/interfaces/customer-interfaces";

type RetrieveSessionInterface = z.infer<typeof retrieveSessionSchema>;
type CustomerMetadadaInterface = z.infer<typeof customerMetadataSchema>;

export type {
    RetrieveSessionInterface,
    CustomerMetadadaInterface,
    CustomerBillingDataInterface,
    CustomerDataInterface,
    UpdateCustomerBillingDataInterface
};
