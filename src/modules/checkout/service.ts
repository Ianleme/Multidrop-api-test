// CORE SERVICES
import { AppError } from "../../exceptions/errors/AppError";
import StripeService from "../../services/payment/stripe/service";
import PixelsService from "../../services/pixels/service";
import MultidropRestClient from "../../services/rest-clients/multidrop/service";
import RedisService from "../../services/storage/redis/service";

// SCHEMAS AND TYPES
import {
    InitializeCheckoutInterface,
    CheckoutDataInterface,
    RedisSessionInterface,
} from "./types/interfaces/checkout-interfaces";

export class CheckoutService {
    private TO_CENTS: number = 100;

    constructor(
        private stripeService: StripeService,
        private redisService: RedisService,
        private multidropRestClient: MultidropRestClient,
        private pixelService: PixelsService
    ) {}

    async initializeCheckoutSession({ offerId, sellerId }: InitializeCheckoutInterface) {
        const checkoutData = await this.multidropRestClient.fetchCheckoutData({ offerId, sellerId });

        if (checkoutData.offer.paymentType === "unique")
            return await this.initializeSinglePaymentCheckout(checkoutData);

        return await this.initializeSubscriptionCheckout(checkoutData);
    }

    async updateSaleStatus(sig: string | string[], payload: any) {
        const { type, data } = this.stripeService.asignWebHook(sig, payload);

        const EXPECTED_EVENTS = [
            "payment_intent.succeeded",
            "payment_intent.payment_failed",
            "invoice.paid",
            "invoice.payment_failed",
        ];

        if (!EXPECTED_EVENTS.includes(type)) return;

        if (type === "payment_intent.succeeded" || type === "payment_intent.payment_failed") {
            // Save at multidrop
            const status = data.object.status === "succeeded" ? "concluded" : "failure";
            await this.multidropRestClient.updateSaleStatus(data.object.id, status);
        }

        if (type === "invoice.paid" || type === "invoice.payment_failed") {
            const invoiceId = data.object.id;
            if (!invoiceId) {
                console.log("Não foi possivel extrair o identificador da fatura do evento recebido!");
                throw new AppError("Erro ao atualizar status da assinatura!", 500);
            }

            const { paymentIntentId } = await this.stripeService.retrieveInvoice(invoiceId);

            // Update subscription at multidrop
            console.log(paymentIntentId, invoiceId);
            await this.multidropRestClient.updateSubscriptionStatus(paymentIntentId, invoiceId);
        }
    }

    private async initializeSinglePaymentCheckout(checkoutData: CheckoutDataInterface) {
        // create the payment intent
        const { value, currency } = checkoutData.offer;
        const amount = value * this.TO_CENTS;
        const { client_secret, id } = await this.stripeService.createPaymentIntent({ amount, currency });

        // Save at redis
        const newSession: RedisSessionInterface = {
            checkoutData: {
                ...checkoutData,
                strategy: {
                    ...checkoutData.strategy,
                    downsell: checkoutData.strategy.upsell,
                },
            },
            checkoutStatus: {
                amount: 1,
                orderBumpItens: [],
                status: "initial",
            },
            customerMetadata: {
                acceptedCookies: false,
                userIpAddress: null,
            },
            paymentData: {
                id,
                client_secret,
                paymentType: "unique",
                amount,
            },
        };
        const sessionId = await this.redisService.createSession(newSession);

        const { customerMetadata, ...response } = newSession;
        return {
            sessionData: response,
            sessionId,
        };
    }

    private async initializeSubscriptionCheckout(checkoutData: CheckoutDataInterface) {
        // Save at redis
        const newSession: RedisSessionInterface = {
            checkoutData,
            checkoutStatus: {
                amount: 1,
                orderBumpItens: [],
                status: "pending_data",
            },
            customerMetadata: {
                acceptedCookies: false,
                userIpAddress: null,
            },
        };
        const sessionId = await this.redisService.createSession(newSession);

        const { customerMetadata, ...response } = newSession;
        return {
            sessionData: response,
            sessionId,
        };
    }
}
