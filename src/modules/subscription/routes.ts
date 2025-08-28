import { FastifyTypedWithZod } from "../../types/types";

// CORE LAYERS
import SubscriptionController from "./controller";

// SCHEMAS AND TYPES
import {
    requirePaymentMethodIdSchema,
    requireSubscriptionIdSchema,
    fetchSubscriptionDetailesSchema,
    requireCustomerIdSchema,
} from "./types/schemas/subscription-schemas";

export default async function subscriptionRoutes(
    app: FastifyTypedWithZod,
    subscriptionController: SubscriptionController
) {
    app.get(
        "/",
        {
            schema: {
                tags: ["Subscription"],
                description: "Endpoint pra buscar detalhes da assinatura",
                querystring: fetchSubscriptionDetailesSchema,
            },
        },
        subscriptionController.fetchSubscription.bind(subscriptionController)
    );

    app.post(
        "/payment-method/setup-intent",
        {
            schema: {
                tags: ["Subscription"],
                description: "Endpoint para atualizar os dados de faturamento do cliente",
                body: requireCustomerIdSchema,
            },
        },
        subscriptionController.createPaymentSetupIntent.bind(subscriptionController)
    );

    app.patch(
        "/payment-method/:subscriptionId",
        {
            schema: {
                tags: ["Subscription"],
                description: "Endpoint para atualizar os dados de faturamento do cliente",
                body: requirePaymentMethodIdSchema,
                params: requireSubscriptionIdSchema,
            },
        },
        subscriptionController.updateSubscriptionPaymentMethod.bind(subscriptionController)
    );

    app.delete(
        "/:subscriptionId",
        {
            schema: {
                tags: ["Subscription"],
                description: "Endpoint para processar o cancelamento da assinatura",
                params: requireSubscriptionIdSchema,
            },
        },
        subscriptionController.cancelSubscription.bind(subscriptionController)
    );
}
