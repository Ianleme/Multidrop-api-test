import z from "zod";

// EXTERNAL SCHEMAS
import {
    customerBillingDataSchema,
    customerDataSchema,
    updateCustomerBillingDataSchema,
} from "../../../../../../services/payment/stripe/types/schemas/customer-schemas";
import { requireCustomerIdSchema } from "../../../../../subscription/types/schemas/subscription-schemas";

const retrieveSessionSchema = z.object({
    offerId: z.string({ error: "Informe 'offerId' como parâmetro de busca" }).optional(),
    sellerId: z.string({ error: "Informe 'sellerId' como parâmetro de busca" }).optional(),
});

const customerMetadataSchema = z.object({
    userBrowserAgent: z.string().optional().describe("Agente do navegador do usuário"),
    googleClientId: z.string().optional().describe("Id do cliente final, gerado pelo serviço Google Analytcs"),
});

export {
    retrieveSessionSchema,
    customerMetadataSchema,
    customerBillingDataSchema,
    customerDataSchema,
    updateCustomerBillingDataSchema,
    requireCustomerIdSchema,
};
