import z from "zod";

const offerSchema = z
    .object({
        paymentType: z.enum(["unique", "recurrence"]).describe("Tipo do pagamento"),
        qtyRecurrence: z.number().or(z.literal("NO_LIMIT")).optional().describe("Quantidade de cobranças, caso oferta seja uma assinatura"),
        recurrenceType: z.enum(["monthly", "weekly", "quarterly", "semiannual", "yearly"]).optional().describe("Frequência da cobrança da assinatura, caso oferta seja uma assinatura"),
        intervalRecurrence: z.number().optional().describe("Intervalo, em dias, de cada cobrança caso oferta seja uma assinatura"),
        name: z.string().describe("Nome da oferta"),
        description: z.string().optional().describe("Descrição da oferta"),
        value: z.number().describe("Valor da oferta"),
        nrPrice: z.string().optional(),
        currency: z.string().describe("Moeda da venda"),
    })
    .describe("Informações referete à oferta");

const productSchema = z
    .object({
        id: z.string().describe("Identificação do produto"),
        name: z.string().describe("Nome do produto"),
        description: z.string().describe("Descrição do produto"),
        imageUrl: z.string().describe("URL da foto do produto"),
        category: z.string().describe("Categoria do produto"),
        type: z.string().describe("Tipo do produto"),
        language: z.string().describe("Idioma do produto"),
        embeddedComponent: z.string().describe("Componente embutido persionalizado pelo vendedor"),
        priceStripeID: z.string().describe("Identificador do produto na stripe"),

    })
    .describe("Informações referente ao produto da oferta");

const personalizationSchema = z
    .object({
        urLogo: z.string().describe("URL da logo persionalizável"),
        color: z.string().describe("Cor persionalizável"),
        supportEmail: z.string().describe("Email de suporte"),
    })
    .describe("Informações referente à persionalização da página de checkout");

const pixelSchema = z
    .object({
        idConversionPixel: z.number().describe("Id da conversão do pixel"),
        typePixel: z.enum(["google", "facebook", "tiktok"]).describe("Tipo do pixel"),
        name: z.string().describe("Nome do pixel"),
        pixelId: z.string().describe("Identificação do pixel"),
        pixelLabel: z.string("Label do pixel"),
        accessToken: z.string().optional()
    })
    .describe("Informações do píxel responsável por fazer a rastreabilidade da venda");

const orderBumpSchema = z.object({
    id: z.string().describe("Id do item"),
    offer: offerSchema,
    product: productSchema,
});

const upsellSchema = orderBumpSchema.extend({
    producerCheckoutCallbackPage: z.string().describe("URL da página de upsell do usuário"),
    actionTypeUpsell: z.string().describe("Tipo de ação do upsell"),
    urlRedirectUpsell: z.string().describe("Url de redirecionamento da oferta"),
    textUpsell: z.string().describe("Título de gatilho da oferta"),
    color: z.string().describe("Cor principal da oferta"),
});

const couponSchema = z.object({
    coupon: z.string().describe("Nome do cupom de desconto"),
    percentageDiscount: z.number().describe("Valor de desconto, em porcentagem"),
    valueDiscount: z.number().describe("Valor de desconto, em moeda"),
});

const subscriptionSchema = productSchema.omit({
    id: true,
    embeddedComponent: true
})

export { offerSchema, productSchema, personalizationSchema, pixelSchema, orderBumpSchema, upsellSchema, couponSchema, subscriptionSchema };
