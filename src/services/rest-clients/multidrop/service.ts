import { AppError } from "../../../exceptions/errors/AppError";
import { MultidropApi } from "./config/MultidropApi";

// SCHEMAS AND TYPES
import { CheckoutDataInterface, InitializeCheckoutInterface } from "./types/interface/checkout-interfaces";
import { CouponInterface, SubscriptionInterface } from "./types/interface/offer-interfaces";
import { RegisterSaleInterface } from "./types/interface/sale-interfaces";

export default class MultidropRestClient {
    async fetchCheckoutData({ offerId, sellerId }: InitializeCheckoutInterface) {
        try {
            const response = await MultidropApi.get<{ data: CheckoutDataInterface }>(
                `/detail?linkId=${offerId}&profileCode=${sellerId}`
            );

            const { data: checkoutData } = response.data;

            return {
                ...checkoutData,
                offerId,
                sellerId,
            };
        } catch (e: unknown) {
            console.log("Erro ao buscar produto na base multidrop --> ", e);

            throw e;
        }
    }

    async fetchDiscountCoupon(offerId: string, coupon: string) {
        try {
            const response = await MultidropApi.get<{ data: Omit<CouponInterface, "coupon"> & { cupom: string } }>(
                `/cupom?cupom=${coupon}&linkId=${offerId}`
            );
            const { cupom, ...discount } = response.data.data;

            const responseDTO = {
                ...discount,
                coupon: cupom,
            };

            return responseDTO;
        } catch (e: unknown) {
            return false;
        }
    }

    async registerSale({ basicPaymentInfo, orderBump, personalPaymentInfo }: RegisterSaleInterface) {
        try {
            const response = await MultidropApi.post("/purchase", {
                basicPaymentInfo,
                orderBump,
                personalPaymentInfo,
            });
        } catch (e: any) {
            console.log("Erro ao tentar salvar venda na base multidrop!");
            console.log(e)
            const error = e.response;
            const message: string = error.data;

            if (error.status === 500) {
                console.log("ERRO INTERNO NA MULTIDROP");
                console.log(message);
            }

            throw new AppError("Erro ao registar venda, estamos trabalhando nisso!", 500);
        }
    }

    async updateSaleStatus(paymentIntentId: string, status: string) {
        try {
            const response = await MultidropApi.post(
                `/purchase/async?paymentIntentStripe=${paymentIntentId}&statusStripe=${status}`
            );
        } catch (e: any) {
            console.log("Erro ao tentar atualizar o registro de venda");
            const error = e.response;
            const message = error.data;

            console.log(message);
        }
    }

    async fetchSubscriptionManagementSession(token: string) {
        try {
            const response = await MultidropApi.get<{
                data: { product: SubscriptionInterface; customerStripeId: string };
            }>(`/info/user/recurrence?token=${token}`);

            const product = response.data.data.product;
            const customerId = response.data.data.customerStripeId;

            return {
                product,
                customerId,
            };
        } catch (e: any) {
            const error = e.response;
            const message = error.data;

            if (error && error.status === 500) {
                console.log(message);
                console.log("Erro interno da multidrop na hora de buscar os dados da assinatura");
            }

            throw new AppError("Houve um erro na hora de buscar os dados da sua sessão!", 500);
        }
    }

    async updateSubscriptionStatus(paymentIntentStripe: string, invoiceIdStripe: string) {
        try {
            const response = await MultidropApi.post(
                "/purchase/recurrence/async",
                {},
                {
                    params: {
                        paymentIntentStripe,
                        invoiceIdStripe,
                    },
                }
            );
        } catch (e: any) {
            console.log("Erro ao tentar atualizar status da assinatura na API Multidrop");
            console.log(e.response.data);
        }
    }
}
