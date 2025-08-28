import z from "zod";

const fetchSubscriptionDetailesSchema = z.object({
    token: z.string().describe("Token da sessão multidrop"),
});

const requireCustomerIdSchema = z.object({
    customerId: z.string().describe("Identificação do usuário da stripe"),
});

const requirePaymentMethodIdSchema = z.object({
    paymentMethodId: z.string().describe("Identificação do token criptografado com os dados de pagamento do usuário"),
});

const requireSubscriptionIdSchema = z.object({
    subscriptionId: z.string().describe("Identificação da assinatura"),
});

export { requirePaymentMethodIdSchema, requireSubscriptionIdSchema, fetchSubscriptionDetailesSchema, requireCustomerIdSchema };
