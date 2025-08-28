import { FastifyReply, FastifyRequest } from "fastify";

import z from "zod";

// SCHEMAS AND TYPES
import SessionService from "./service";
import {
    retrieveSessionSchema,
    customerMetadataSchema,
    customerBillingDataSchema,
    customerDataSchema,
    updateCustomerBillingDataSchema,
} from "./types/schemas/session-schemas";

export default class SessionController {
    constructor(private sessionService: SessionService) {}

    async getSession(req: FastifyRequest, res: FastifyReply) {
        const sessionId = req.sessionId;

        const { offerId, sellerId } = retrieveSessionSchema.parse(req.query);

        const { customerMetadata, ...response } = await this.sessionService.getSession({
            sessionId,
            offerId,
            sellerId,
        });

        const { orderBumpItens } = response.checkoutStatus;
        const oderBumpDtoList: string[] = orderBumpItens.map((orderBump) => orderBump.id);
        return res.status(200).send({
            message: "Sessão encontrada!",
            session: {
                ...response,
                checkoutStatus: {
                    ...response.checkoutStatus,
                    orderBumpItens: oderBumpDtoList,
                },
            },
        });
    }

    async acceptTracking(req: FastifyRequest, res: FastifyReply) {
        const sessionId = req.sessionId;
        const userIpAddress = req.ip;
        const { userBrowserAgent, googleClientId } = customerMetadataSchema.parse(req.body);

        await this.sessionService.acceptTracking(sessionId, { googleClientId, userIpAddress, userBrowserAgent });

        return res.status(204).send({});
    }

    async addCoupon(req: FastifyRequest, res: FastifyReply) {
        const { coupon } = z.object({ coupon: z.string({ error: "Campo 'coupon' é obrigatório!" }) }).parse(req.body);
        const sessionId = req.sessionId;

        const updatedSession = await this.sessionService.addCoupon(sessionId, coupon);

        return res.status(200).send({
            message: "Sessão atualizada com sucesso!",
            updatedSession,
        });
    }

    async removeCoupon(req: FastifyRequest, res: FastifyReply) {
        const sessionId = req.sessionId;

        const { coupon } = await this.sessionService.removeCoupon(sessionId);

        return res.status(200).send({
            message: "Cupom de desconto removido com sucesso!",
            updatedSession: {
                coupon,
            },
        });
    }

    async addOrderBump(req: FastifyRequest, res: FastifyReply) {
        const sessionId = req.sessionId;
        const { offerId } = z.object({ offerId: z.string({ error: "Campo 'offerId' é obrigatório" }) }).parse(req.body);

        await this.sessionService.addOrderBump(sessionId, offerId);

        return res.status(201).send({
            message: "Item adicionado no checkout com sucesso!",
        });
    }

    async removeOrderBump(req: FastifyRequest, res: FastifyReply) {
        const sessionId = req.sessionId;

        const { offerId } = z.object({ offerId: z.string({ error: "Campo 'offerId' faltando" }) }).parse(req.body);

        await this.sessionService.removeOrderBump(sessionId, offerId);

        return res.status(200).send({
            message: "Item adicional removido da sessão do checkout",
        });
    }

    async changeAmount(req: FastifyRequest, res: FastifyReply) {
        const sessionId = req.sessionId;

        const { amount } = z
            .object({
                amount: z.coerce
                    .number({ error: "Campo 'amount' é obrigatório" })
                    .min(1, { error: "Quantidade de produtos não pode ser menor que 1" }),
            })
            .parse(req.body);
        const { updatedAmount } = await this.sessionService.changeAmount(sessionId, amount);

        res.status(200).send({
            message: "Quantidade alterada com sucesso!",
            updatedAmount,
        });
    }

    async startSubscription(req: FastifyRequest, res: FastifyReply) {
        const sessionId = req.sessionId;
        const customerBillingData = customerBillingDataSchema.parse(req.body);

        const clientSecret = await this.sessionService.startSubscription(sessionId, customerBillingData);

        return res.status(200).send({
            message: "Assinatura iniciada com sucesso!",
            payment: {
                clientSecret,
            },
        });
    }

    async paymentConfirm(req: FastifyRequest, res: FastifyReply) {
        const sessionId = req.sessionId;
        const { paymentMethodId } = z.object({ paymentMethodId: z.string() }).parse(req.body);

        const paymentData = await this.sessionService.paymentConfirm(sessionId, paymentMethodId);

        return res.status(200).send({
            message: "Pagamento efeturado com sucesso!",
            paymentData,
        });
    }

    async updateCustomerData(req: FastifyRequest, res: FastifyReply) {
        const newValues = updateCustomerBillingDataSchema.parse(req.body);
        const sessionId = req.sessionId;

        const updatedCustomer = await this.sessionService.updateCustomerData(sessionId, newValues);

        return res.status(200).send({
            message: "Dados do cliente atualizados com sucesso!",
            updatedCustomer,
        });
    }

    async registerSale(req: FastifyRequest, res: FastifyReply) {
        const sessionId = req.sessionId;

        const customerData = customerDataSchema.parse(req.body)

        const updatedStatus = await this.sessionService.registerSale(sessionId, customerData );

        return res.status(200).send({
            message: "O status da sessão foi atualizado!",
            status: updatedStatus,
        });
    }

    async initializeUpsell(req: FastifyRequest, res: FastifyReply) {
        const sessionId = req.sessionId;

        await this.sessionService.initializeUpsell(sessionId);
        const { paymentData, upsellData } = await this.sessionService.initializeUpsell(sessionId);

        return res.status(201).send({
            message: "Sessão de checkout do upsell iniciada com sucesso!",
            checkout: {
                upsellData,
                paymentData,
            },
        });
    }

    async initializeDownsell(req: FastifyRequest, res: FastifyReply) {
        const sessionId = req.sessionId;

        await this.sessionService.initializeUpsell(sessionId);
        const { paymentData, upsellData } = await this.sessionService.initializeDownsell(sessionId);

        return res.status(201).send({
            message: "Sessão de checkout do downsell iniciada com sucesso!",
            checkout: {
                upsellData,
                paymentData,
            },
        });
    }

    async upsellPaymentConfirm(req: FastifyRequest, res: FastifyReply){
        const sessionId = req.sessionId;
        const { type } = z.object({ type: z.enum(["upsell", "downsell"]).describe("Tipo da venda que foi registrada") }).parse(req.query)
        await this.sessionService.upsellPaymentConfirm(sessionId, type)

    }
}
