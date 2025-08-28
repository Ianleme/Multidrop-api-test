import { FastifyRequest, FastifyReply } from "fastify";

// SERVICES
import SubscriptionService from "./service";

// SCHEMAS AND TYPES
import {
    requireCustomerIdSchema,
    fetchSubscriptionDetailesSchema,
    requirePaymentMethodIdSchema,
    requireSubscriptionIdSchema,
} from "./types/schemas/subscription-schemas";

export default class SubscriptionController {
    constructor(private subscriptionSerivce: SubscriptionService) {}

    async fetchSubscription(req: FastifyRequest, res: FastifyReply) {
        const { token } = fetchSubscriptionDetailesSchema.parse(req.query);

        const response = await this.subscriptionSerivce.fetchSubscription(token);

        return res.status(200).send({
            message: "Assinatura encontrada com sucesso!",
            data: response,
        });
    }

    async createPaymentSetupIntent(req: FastifyRequest, res: FastifyReply) {
        const { customerId } = requireCustomerIdSchema.parse(req.body);
        const paymentType = "card";

        const client_secret = await this.subscriptionSerivce.createPaymentSetupIntent({ customerId, paymentType });

        return res.status(201).send({
            message: "Sessão de pagamento criada com sucesso!",
            paymentData: {
                client_secret,
            },
        });
    }

    async updateSubscriptionPaymentMethod(req: FastifyRequest, res: FastifyReply) {
        const { paymentMethodId } = requirePaymentMethodIdSchema.parse(req.body);
        const { subscriptionId } = requireSubscriptionIdSchema.parse(req.params);

        await this.subscriptionSerivce.updateSubscriptionPaymentMethod({ paymentMethodId, subscriptionId });

        return res.status(200).send({
            message: "Informações de pagamento atualizadas com sucesso!",
            success: true,
        });
    }

    async cancelSubscription(req: FastifyRequest, res: FastifyReply) {
        const { subscriptionId } = requireSubscriptionIdSchema.parse(req.params)
    
        await this.subscriptionSerivce.cancelSubscription(subscriptionId)

        return res.status(200).send({
            message: "Assinatura cancelada com sucesso!"
        })

    }
}
