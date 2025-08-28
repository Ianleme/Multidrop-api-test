import z from "zod";
import { FastifyTypedWithZod } from "../../../../types/types";

import SessionController from "./controller";

import {
    customerBillingDataSchema,
    customerDataSchema,
    updateCustomerBillingDataSchema,
} from "./types/schemas/session-schemas";

export default async function sessionRoutes(app: FastifyTypedWithZod, sessionController: SessionController) {
    app.get(
        "/",
        {
            schema: {
                tags: ["Session"],
                description: "Busca a sessão e checkout atual do cliente",
                // querystring:
            },
        },
        sessionController.getSession.bind(sessionController)
    );

    // PIXEL COOKIES CONFIRMATION
    app.post(
        "/tracking/confirm",
        {
            schema: {
                tags: ["Session"],
                description: "Aceitar cookies de rastreio",
                // body: acceptTrackingSchema,
            },
        },
        sessionController.acceptTracking.bind(sessionController)
    );

    // COUPON ROUTES
    app.patch(
        "/coupon/add",
        {
            schema: {
                tags: ["Session"],
                description: "Adicionar cupom de desconto",
            },
        },
        sessionController.addCoupon.bind(sessionController)
    );

    app.patch(
        "/coupon/remove",
        {
            schema: {
                tags: ["Session"],
                description: "Remover cupom de desconto",
            },
        },
        sessionController.removeCoupon.bind(sessionController)
    );

    // ORDER BUMP ROUTES
    app.patch(
        "/order-bump/add",
        {
            schema: {
                tags: ["Session"],
                description: "Adiciona um item de order bump à sessão de checkout",
            },
        },
        sessionController.addOrderBump.bind(sessionController)
    );

    app.patch(
        "/order-bump/remove",
        {
            schema: {
                tags: ["Session"],
                description: "Remover oferta de order bump da sessão de checkout",
            },
        },
        sessionController.removeOrderBump.bind(sessionController)
    );

    // PRODUCT AMOUNT ROUTES
    app.patch(
        "/amount/change",
        {
            schema: {
                tags: ["Session"],
                description: "Alterar a quantidade do produto do checkout",
            },
        },
        sessionController.changeAmount.bind(sessionController)
    );

    // RECURRENCE ROUTES
    app.post(
        "/setup-intent/start",
        {
            schema: {
                tags: ["Session"],
                description: "Endpoint para gerar a recorrência",
                body: customerBillingDataSchema,
            },
        },
        sessionController.startSubscription.bind(sessionController)
    );

    app.patch(
        "/subscription/customer",
        {
            schema: {
                tags: ["Session"],
                body: updateCustomerBillingDataSchema,
            },
        },
        sessionController.updateCustomerData.bind(sessionController)
    );

    // PAYMENT CONFIRMATION ROUTES
    app.post(
        "/confirm",
        {
            schema: {
                tags: ["Session"],
                description: "Endpoint para confirmar o pagamento de um checkout",
                body: z.object({ paymentMethodId: z.string() }),
            },
        },
        sessionController.paymentConfirm.bind(sessionController)
    );

    app.post(
        "/sale/register",
        {
            schema: {
                tags: ["Session"],
                description: "Endpoint para registar a venda na base de dados",
                body: customerDataSchema,
            },
        },
        sessionController.registerSale.bind(sessionController)
    );

    // UPSELL/DOWNSELL
    app.get(
        "/upsell/initialize",
        { schema: { tags: ["Upsell/Downsell"], description: "Endpoint para iniciar sessão do upsell" } },
        sessionController.initializeUpsell.bind(sessionController)
    );

    app.get(
        "/downsell/initialize",
        { schema: { tags: ["Upsell/Downsell"], description: "Endpoint para iniciar sessão do upsell" } },
        sessionController.initializeDownsell.bind(sessionController)
    );

    app.post(
        "/upsell/sale",
        {
            schema: {
                tags: ["Upsell/Downsell"],
                description: "Endpoint para registar a venda de um upsell/downsell",
                querystring: z.object({
                    type: z.enum(["upsell", "downsell"]).describe("Tipo da venda que foi registrada"),
                }),
            },
        },
        sessionController.upsellPaymentConfirm.bind(sessionController)
    );
}
