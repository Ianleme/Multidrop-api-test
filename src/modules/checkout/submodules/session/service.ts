import { AppError } from "../../../../exceptions/errors/AppError";

// SCHEMAS AND TYPES
import StripeService from "../../../../services/payment/stripe/service";
import PixelsService from "../../../../services/pixels/service";
import MultidropRestClient from "../../../../services/rest-clients/multidrop/service";
import RedisService from "../../../../services/storage/redis/service";
import { RedisSessionInterface } from "../../types/interfaces/checkout-interfaces";
import {
    CustomerBillingDataInterface,
    CustomerDataInterface,
    CustomerMetadadaInterface,
    RetrieveSessionInterface,
    UpdateCustomerBillingDataInterface,
} from "./types/interfaces/session-interfaces";

export default class SessionService {
    constructor(
        private redisService: RedisService,
        private pixelService: PixelsService,
        private paymentService: StripeService,
        private multidropRestClient: MultidropRestClient
    ) {}

    async acceptTracking(sessionId: string, customerMetadata: CustomerMetadadaInterface & { userIpAddress: string }) {
        // Retrieve redis's session
        const foundSession = await this.getSession({ sessionId });
        const { checkoutData } = foundSession;

        // Verify if there is any google pixel registered, and apply some validations if there is
        if (!checkoutData.pixels) return;
        const googlePixel = checkoutData.pixels.some((pixel) => pixel.typePixel === "google");
        if (googlePixel && !customerMetadata.googleClientId)
            throw new AppError(
                "O campo 'googleClientId' deve ser preenchido, essa oferta conta com pixel de trackeamento do google! ",
                422
            );

        // Updated the redis's
        await this.redisService.updateSession(sessionId, {
            ...foundSession,
            checkoutData,
            customerMetadata: {
                ...customerMetadata,
                acceptedCookies: true,
            },
        });

        // Send checkout initiate event pixel
        await this.pixelService.sendEvent({
            event: "initiate_checkout",
            customerMetadata: {
                ...customerMetadata,
                acceptedCookies: true,
            },
            checkoutData,
        });
    }

    async getSession(sessionData: RetrieveSessionInterface & { sessionId: string }) {
        const foundSession = await this.redisService.retrieveSession(sessionData);
        const { paymentData } = foundSession;

        // Validations
        if (!paymentData || (paymentData.paymentType === "recurrence" && !paymentData.lastInvoice)) return foundSession;

        // Searchs for the updated payment status
        const paymentIntentId = paymentData.paymentType === "recurrence" ? paymentData.lastInvoice! : paymentData.id;
        const { status } = await this.paymentService.fetchPaymentIntentStatus({ paymentIntentId });

        const response: RedisSessionInterface = {
            ...foundSession,
            checkoutStatus: {
                ...foundSession.checkoutStatus,
                status:
                    status === "succeeded" ? "concluded" : status === "processing" ? "processing" : foundSession.checkoutStatus.status,
            },
        };

        return response;
    }

    async addCoupon(sessionId: string, coupon: string) {
        // Retrieve the checkout's data from redis
        const foundSession = await this.getSession({ sessionId });
        const { checkoutData, checkoutStatus, paymentData } = foundSession;

        if (checkoutData.offer.paymentType === "recurrence")
            throw new AppError("Não é possível adicionar cupom em ofertas recorrentes!", 422);
        if (!paymentData || !paymentData.amount)
            throw new AppError("Não foi possível adicionar cupom nessa sessão, pois ela ainda não foi iniciada!", 422);

        // Fetch the coupon at multidrop api
        const validCoupon = await this.multidropRestClient.fetchDiscountCoupon(checkoutData.offerId, coupon);
        if (!validCoupon) throw new AppError("Cupom inválido", 422);

        let updatedPaymentData;
        // Update the payment intent
        let finalValue;
        const { valueDiscount } = validCoupon;
        finalValue = paymentData.amount - valueDiscount * 100;
        if (checkoutStatus.coupon) {
            finalValue += checkoutStatus.coupon.valueDiscount * 100;
        }
        const { amount } = await this.paymentService.updatePaymentIntent(paymentData.id, {
            amount: finalValue,
        });

        // Update redis
        await this.redisService.updateSession(sessionId, {
            ...foundSession,
            paymentData: {
                ...paymentData,
                amount,
            },
            checkoutStatus: {
                ...checkoutStatus,
                coupon: validCoupon,
            },
        });

        // Emit pixel event for sale tracking
        const { acceptedCookies, userIpAddress } = foundSession.customerMetadata;
        if (acceptedCookies && userIpAddress) {
            await this.pixelService.sendEvent({
                event: "coupon_add",
                customerMetadata: {
                    ...foundSession.customerMetadata,
                    acceptedCookies,
                    userIpAddress,
                },
                checkoutData,
            });
        }

        return {
            coupon: validCoupon,
        };
    }

    async removeCoupon(sessionId: string) {
        // Retrieve the checkout's data from redis
        const foundSession = await this.getSession({ sessionId });
        const { checkoutData, checkoutStatus, paymentData } = foundSession;

        if (checkoutData.offer.paymentType === "recurrence")
            throw new AppError("Recorrências não possuem cupons!", 422);
        if (!paymentData || !paymentData.amount)
            throw new AppError("Essa sessão teve um pagamento iniciado ainda!", 422);
        if (!checkoutStatus.coupon) throw new AppError("Nenhum cupom de desconto foi usado nessa sessão ainda!", 422);

        // Update the payment intent
        const finalValue = checkoutStatus.coupon.valueDiscount * 100 + paymentData.amount;
        const { amount } = await this.paymentService.updatePaymentIntent(paymentData.id, {
            amount: finalValue,
        });

        // Update the redis's session
        await this.redisService.updateSession(sessionId, {
            ...foundSession,
            paymentData: {
                ...paymentData,
                amount,
            },
            checkoutStatus: {
                ...checkoutStatus,
                coupon: undefined,
            },
        });

        // Submit pixel event
        const { acceptedCookies, userIpAddress } = foundSession.customerMetadata;
        if (acceptedCookies && userIpAddress) {
            await this.pixelService.sendEvent({
                event: "coupon_remove",
                customerMetadata: {
                    ...foundSession.customerMetadata,
                    acceptedCookies,
                    userIpAddress,
                },
                checkoutData,
            });
        }

        return {
            coupon: null,
        };
    }

    async addOrderBump(sessionId: string, offerId: string) {
        // Retrieve redis session
        const foundSession = await this.getSession({ sessionId });
        const { checkoutData, checkoutStatus, paymentData } = foundSession;

        // Validations
        if (!paymentData)
            throw new AppError(
                "Essa sessão não esta processando nenhuma pagamento ainda, falta dados do usuário!",
                422
            );
        if (!checkoutData.strategy.orderBump) throw new AppError("Essa sessão não oferece nenhum item adicional!", 422);

        if (checkoutStatus.orderBumpItens.some((item) => item.id === offerId)) {
            throw new AppError("Item de order bump já adicionado", 422);
        }

        // Try to find the option
        const { orderBump: orderBumpList } = checkoutData.strategy;
        const orderBump = orderBumpList.find((options) => options.id === offerId);
        if (!orderBump) throw new AppError("Opção de order bump não localizada na oferta!", 404);

        if (checkoutData.offer.paymentType === "unique") {
            if (!paymentData || !paymentData.amount)
                throw new AppError(
                    "Não é possível adicionar order bumps, essa sessão não teve nenhum pagamento iniciado ainda!",
                    422
                );

            // Update the payment intent
            const newPaymentAmount = orderBump.offer.value * 100 + paymentData.amount;
            const { amount } = await this.paymentService.updatePaymentIntent(paymentData.id, {
                amount: newPaymentAmount,
            });

            // Save at redis
            await this.redisService.updateSession(sessionId, {
                ...foundSession,
                paymentData: {
                    ...paymentData,
                    amount,
                },
                checkoutStatus: {
                    ...checkoutStatus,
                    orderBumpItens: [...checkoutStatus.orderBumpItens, { id: orderBump.id }],
                },
            });
        } else {
            const { customerData } = foundSession;

            if (!customerData)
                throw new AppError("Não é possível adicionar um order bump, o cliente ainda não foi definido!", 422);
            if (!customerData.id)
                throw new AppError(
                    "Não é possível adicionar um order bump, o cliente ainda foi cadastrado na stripe!",
                    422
                );

            if (orderBump.offer.paymentType === "unique") {
                const amount = orderBump.offer.value * 100;
                const orderBumpPaymentData = await this.paymentService.createPaymentIntent({
                    amount,
                    currency: orderBump.offer.currency,
                    customerId: customerData.id,
                });

                // Save at redis
                await this.redisService.updateSession(sessionId, {
                    ...foundSession,
                    checkoutStatus: {
                        ...foundSession.checkoutStatus,
                        orderBumpItens: [
                            ...foundSession.checkoutStatus.orderBumpItens,
                            {
                                id: orderBump.id,
                                paymentData: {
                                    paymentType: "unique",
                                    id: orderBumpPaymentData.id,
                                    client_secret: orderBumpPaymentData.client_secret,
                                    amount: orderBumpPaymentData.amount,
                                },
                            },
                        ],
                    },
                });
            }
        }

        // Submit pixel event
        const { acceptedCookies, userIpAddress } = foundSession.customerMetadata;
        if (acceptedCookies && userIpAddress) {
            await this.pixelService.sendEvent({
                event: "order_bump_add",
                customerMetadata: {
                    ...foundSession.customerMetadata,
                    acceptedCookies,
                    userIpAddress,
                },
                checkoutData,
            });
        }

        return;
    }

    async removeOrderBump(sessionId: string, offerId: string) {
        // Retrive the redis's session
        const foundSession = await this.getSession({ sessionId });
        const { checkoutData, checkoutStatus, paymentData } = foundSession;

        // Validations
        if (!paymentData)
            throw new AppError(
                "Essa sessão não esta processando nenhuma pagamento ainda, falta dados do usuário!",
                422
            );
        if (!checkoutData.strategy.orderBump)
            throw new AppError("Não possui nenhum item extra adicionado nessa sessão!", 422);

        const { orderBumpItens } = checkoutStatus;

        if (checkoutStatus.orderBumpItens.some((item) => item.id !== offerId)) {
            throw new AppError("Item de order bump não encontrado!", 422);
        }

        const orderBump = checkoutData.strategy.orderBump.find((option) => option.id === offerId);
        if (!orderBump) throw new AppError("Opção de order bump não localizada na oferta!", 404);

        if (checkoutData.offer.paymentType === "unique") {
            if (!paymentData || !paymentData.amount)
                throw new AppError("Nao é possível remover order bump, não foi iniciado nenhum pagamento ainda!", 422);

            // Update payment intent
            const finalValue = paymentData.amount - orderBump.offer.value * 100;
            const { amount } = await this.paymentService.updatePaymentIntent(paymentData.id, {
                amount: finalValue,
            });

            // Update redis's session
            const updatedOrderBumpList = orderBumpItens.filter((orderBump) => orderBump.id !== offerId);
            await this.redisService.updateSession(sessionId, {
                ...foundSession,
                paymentData: {
                    ...paymentData,
                    amount,
                },
                checkoutStatus: {
                    ...checkoutStatus,
                    orderBumpItens: updatedOrderBumpList,
                },
            });
        } else {
            await this.paymentService.cancelPaymentIntent(
                checkoutStatus.orderBumpItens.find((item) => item.id === offerId)?.paymentData!.id!
            );
            const updatedOrderBumpList = orderBumpItens.filter((orderBump) => orderBump.id !== offerId);
            await this.redisService.updateSession(sessionId, {
                ...foundSession,
                checkoutStatus: {
                    ...foundSession.checkoutStatus,
                    orderBumpItens: updatedOrderBumpList,
                },
            });
        }

        // Emit pixels events
        const { acceptedCookies, userIpAddress } = foundSession.customerMetadata;
        if (acceptedCookies && userIpAddress) {
            await this.pixelService.sendEvent({
                event: "order_bump_remove",
                customerMetadata: {
                    ...foundSession.customerMetadata,
                    acceptedCookies,
                    userIpAddress,
                },
                checkoutData,
            });
        }

        return;
    }

    async changeAmount(sessionId: string, amount: number) {
        // Retrieve the redis's session
        const session = await this.getSession({ sessionId });
        const { checkoutData, checkoutStatus, paymentData } = session;

        if (checkoutData.offer.paymentType === "recurrence")
            throw new AppError("Não é possivel modificar a quantidade do produto em uma assinatura", 422);

        // If the request amount is equal to the current aount, just return the current session
        if (checkoutStatus.amount === amount) return { updatedAmount: amount };
        if (!paymentData || !paymentData.amount)
            throw new AppError("Não é possivel modificar a quantidade, não foi iniciada nenhum pagamento ainda!", 422);
        // If the session hadn't initialized the payment yet, just update redis and return updated session
        if (!paymentData) {
            // Update redis's session
            await this.redisService.updateSession(sessionId, {
                ...session,
                checkoutStatus: {
                    ...checkoutStatus,
                    amount,
                },
            });

            return { updatedAmount: amount };
        }

        // Update the payment intent
        const couponValue = checkoutStatus.coupon ? checkoutStatus.coupon.valueDiscount * 100 : 0;
        const previousUnitOfferValue = checkoutStatus.amount * 100 * checkoutData.offer.value;
        const orderBumpItensValue = paymentData.amount - previousUnitOfferValue - couponValue;

        const unitOfferValue = amount * 100 * checkoutData.offer.value;
        const finalAmount = couponValue + unitOfferValue + orderBumpItensValue;
        const { amount: updatedAmount } = await this.paymentService.updatePaymentIntent(paymentData.id, {
            amount: finalAmount,
        });

        // Update redis's session
        await this.redisService.updateSession(sessionId, {
            ...session,
            paymentData: {
                ...paymentData,
                amount: updatedAmount,
            },
            checkoutStatus: {
                ...checkoutStatus,
                amount,
            },
        });

        // Emit event
        const { acceptedCookies, userIpAddress } = session.customerMetadata;
        if (acceptedCookies && userIpAddress) {
            await this.pixelService.sendEvent({
                event: checkoutStatus.amount < amount ? "increase_amount" : "decrease_amount",
                customerMetadata: {
                    ...session.customerMetadata,
                    acceptedCookies,
                    userIpAddress,
                },
                checkoutData,
            });
        }

        return { updatedAmount: amount };
    }

    async startSubscription(sessionId: string, customerBillingData: CustomerBillingDataInterface) {
        const foundSession = await this.getSession({ sessionId });
        const { checkoutData, checkoutStatus } = foundSession;

        if (checkoutData.offer.paymentType === "unique")
            throw new AppError(
                "Não é possível cadastrar uma assinatura nessa oferta pois ela é do tipo de pagamento único",
                422
            );
        if (checkoutStatus.status === "initial")
            throw new AppError("Já foi iniciado uma assinatura nessa sessão!", 422);

        // Fetch or creates the customer
        let customer = await this.paymentService.fetchCustomerByEmail(customerBillingData.email);
        if (!customer) customer = await this.paymentService.createCustomer(customerBillingData);

        // Start the subscription
        const { subscription, paymentIntentId } = await this.paymentService.startSubscription({
            customerId: customer.id,
            product: checkoutData.product,
        });

        // Starts the setup intent
        const { client_secret } = await this.paymentService.createSetupIntent({
            customerId: customer.id,
            paymentType: "off_session",
        });
        if (!client_secret) {
            console.log("Erro ao extrair o client secret do setup intent");
            throw new AppError("Erro ao gerar assinatura!", 500);
        }

        // Update redis
        await this.redisService.updateSession(sessionId, {
            ...foundSession,
            paymentData: {
                id: subscription.id,
                client_secret,
                paymentType: "recurrence",
                amount: foundSession.checkoutData.offer.value,
                lastInvoice: paymentIntentId,
            },
            checkoutStatus: {
                ...foundSession.checkoutStatus,
                status: "initial",
            },
            customerData: {
                id: customer.id,
                ...customerBillingData,
            },
        });

        return client_secret;
    }

    async paymentConfirm(sessionId: string, paymentMethodId: string) {
        const session = await this.getSession({ sessionId });
        const { checkoutData, customerData, paymentData } = session;

        if (!paymentData || !paymentData.lastInvoice)
            throw new AppError("Não é possivel confirmar esse pagamento, ele ainda não foi iniciado!", 422);

        if (checkoutData.offer.paymentType === "unique")
            throw new AppError("Esse serviço é destinado a vendas do tipo assinatura!", 422);

        if (!customerData) throw new AppError("Erro ao gerar assinatura, informe os dados do usuário", 422);

        // Confirms the main subscription
        await this.paymentService.confirmPaymentIntent(paymentData.lastInvoice, paymentMethodId);

        // Confirm the order bump payments
        const { orderBumpItens } = session.checkoutStatus;
        if (orderBumpItens.length) {
            orderBumpItens.map(async (orderBump) => {
                const orderBumpPaymentId = orderBump.paymentData?.id;
                if (!orderBumpPaymentId) {
                    return;
                }
                await this.paymentService.confirmPaymentIntent(orderBumpPaymentId, paymentMethodId);
            });
        }
    }

    async updateCustomerData(sessionId: string, newCustomerData: UpdateCustomerBillingDataInterface) {
        // Fetch the session at redis
        const foundSession = await this.getSession({ sessionId });
        const { customerData } = foundSession;

        if (!customerData)
            throw new AppError("Não é possível editar os dados do usuário, eles ainda não foram informados!", 422);

        if (customerData.id) {
            // Update the customer at stripe
            await this.paymentService.updateCustomerData(customerData.id, newCustomerData);
        }

        // Update redis's session
        const updatedUser = {
            ...customerData,
            ...newCustomerData,
        };
        await this.redisService.updateSession(sessionId, {
            ...foundSession,
            customerData: updatedUser,
        });

        return updatedUser;
    }

    async registerSale(sessionId: string, personalInfo: CustomerDataInterface) {
        // Fetch the session at redis
        const foundSession = await this.getSession({ sessionId });
        const { checkoutData, checkoutStatus, customerData, paymentData } = foundSession;

        // validations
        if (!paymentData) throw new AppError("Essa venda não pode ser registrada, ela não foi iniciada!", 422);
        const IS_RECURRENCE = paymentData.paymentType === "recurrence";

        if (IS_RECURRENCE && !customerData)
            throw new AppError(
                "Não foi possível cadastrar essa venda pois não foi informado os dados do cliente!",
                422
            );

        // Fetch the payment intent status
        const paymentIntentId = IS_RECURRENCE ? paymentData.lastInvoice! : paymentData.id;
        const { status } = await this.paymentService.fetchPaymentIntentStatus({ paymentIntentId });
        // Build the payload to save at multidrop
        const orderBumpList = foundSession.checkoutStatus.orderBumpItens.map((addedOrderBump) => {
            const orderBump = checkoutData.strategy.orderBump?.find((orderBump) => orderBump.id === addedOrderBump.id);
            return {
                productId: Number(orderBump!.product.id),
                value: orderBump!.offer.value,
            };
        });
        const basicPaymentInfo = {
            cupom: checkoutStatus.coupon?.coupon,
            discount: checkoutStatus.coupon?.valueDiscount,
            linkId: Number(checkoutData.offerId),
            paymentIntentStripe: IS_RECURRENCE ? paymentData.lastInvoice! : paymentData.id,
            subscriptionIdStripe: IS_RECURRENCE ? paymentData.id : undefined,
            paymentType: checkoutData.offer.paymentType,
            productId: Number(checkoutData.product.id),
            profileCode: checkoutData.sellerId,
            statusStripe: status === "succeeded" ? "concluded" : "processing",
            totalPrice:
                checkoutData.offer.value + orderBumpList.reduce((total, orderBump) => total + orderBump.value, 0),
        };
        const { name, email, ...rawAddressData } = IS_RECURRENCE ? customerData! : personalInfo;
        const zipCode = "zipCode" in rawAddressData ? rawAddressData.zipCode : rawAddressData.postalCode;
        const addressData = {
            ...rawAddressData,
            zipCode,
        };
        const personalPaymentInfo = {
            name,
            email,
            personalAddress: addressData,
            shippingAddress: addressData,
        };

        // Save at multidrop
        await this.multidropRestClient.registerSale({
            basicPaymentInfo,
            orderBump: orderBumpList,
            personalPaymentInfo,
        });

        // Update redis
        const { checkoutStatus: updatedCheckoutStatus } = await this.redisService.updateSession(sessionId, {
            ...foundSession,
            checkoutStatus: {
                ...checkoutStatus,
                status:
                    status === "succeeded" ? "concluded" : status === "processing" ? "processing" : "requires_payment",
            },
            customerData: {
                ...personalInfo,
                id: null,
                postalCode: personalInfo.zipCode,
            },
        });

        return updatedCheckoutStatus.status;
    }

    async initializeUpsell(sessionId: string) {
        // Fetch redis's session
        const foundSession = await this.getSession({ sessionId });
        const { checkoutData, checkoutStatus } = foundSession;
        const { upsell } = checkoutData.strategy;

        // Validations
        if (!upsell) throw new AppError("Essa oferta não conta com estratégia de venda!", 422);
        if (checkoutStatus.status !== "concluded") {
            throw new AppError(
                "Não foi possível iniciar a sessão do upsell, a sessão principal ainda não foi processada",
                422
            );
        }

        // Create the payment intent
        const { value, currency } = upsell.offer;
        const paymentData = await this.paymentService.createPaymentIntent({
            amount: value * 100,
            currency,
        });

        // Update redis
        await this.redisService.updateSession(sessionId, {
            ...foundSession,
            checkoutStatus: {
                ...checkoutStatus,
                upsell: {
                    value: upsell.offer.value,
                    id: upsell.id,
                    paymentIntentId: paymentData.id,
                    status: "initial",
                },
            },
        });

        return {
            upsellData: upsell,
            paymentData,
        };
    }

    async initializeDownsell(sessionId: string) {
        // Fetch redis's session
        const foundSession = await this.getSession({ sessionId });
        const { checkoutData, checkoutStatus } = foundSession;
        const { downsell } = checkoutData.strategy;

        // Validations
        if (!downsell) throw new AppError("Essa oferta não conta com estratégia de venda!", 422);
        if (checkoutStatus.status !== "concluded") {
            throw new AppError(
                "Não foi possível iniciar a sessão do upsell, a sessão principal ainda não foi processada",
                422
            );
        }

        // Create the payment intent
        const { value, currency } = downsell.offer;
        const paymentData = await this.paymentService.createPaymentIntent({
            amount: value * 100,
            currency,
        });

        // Update redis
        await this.redisService.updateSession(sessionId, {
            ...foundSession,
            checkoutStatus: {
                ...checkoutStatus,
                downsell: {
                    value: downsell.offer.value,
                    id: downsell.id,
                    paymentIntentId: paymentData.id,
                    status: "initial",
                },
            },
        });

        return {
            upsellData: downsell,
            paymentData,
        };
    }

    async upsellPaymentConfirm(sessionId: string, type: "upsell" | "downsell") {
        // Fetch redis session
        const foundSession = await this.getSession({ sessionId });
        const { customerData, checkoutStatus, checkoutData } = foundSession;

        // validations
        if (!customerData)
            throw new AppError("Não é possível cadastrar a venda, os dados do cliente não foram fornecidos!", 422);

        const IS_UPSELL = type === "upsell";
        if (IS_UPSELL && !checkoutStatus.upsell) {
            throw new AppError(
                "Não é possível processar essa venda, ela não conta com um pagamento de upsell em processo!",
                422
            );
        }
        if (!IS_UPSELL && !checkoutStatus.downsell) {
            throw new AppError(
                "Não é possível processar essa venda, ela não conta com um pagamento de downsell em processo!",
                422
            );
        }

        // Fetch updated payment status at stripe
        const offer = IS_UPSELL ? checkoutStatus.upsell! : checkoutStatus.downsell!;
        const { status } = await this.paymentService.fetchPaymentIntentStatus({
            paymentIntentId: offer.paymentIntentId,
        });

        // Build the payload to save at multdrop
        const basicPaymentInfo = {
            cupom: checkoutStatus.coupon?.coupon,
            discount: checkoutStatus.coupon?.valueDiscount,
            linkId: Number(checkoutData.offerId),
            paymentIntentStripe: offer.id,
            subscriptionIdStripe: undefined,
            paymentType: checkoutData.offer.paymentType,
            productId: Number(checkoutData.product.id),
            profileCode: checkoutData.sellerId,
            statusStripe: status === "succeeded" ? "concluded" : "processing",
            totalPrice: offer.value,
        };
        const { name, email, ...addressData } = customerData;
        const personalPaymentInfo = {
            name,
            email,
            personalAddress: {
                ...addressData,
                zipCode: addressData.postalCode,
            },
            shippingAddress: {
                ...addressData,
                zipCode: addressData.postalCode,
            },
        };

        // Save at multidrop
        await this.multidropRestClient.registerSale({
            basicPaymentInfo,
            orderBump: [],
            personalPaymentInfo,
        });

        // Update redis
        await this.redisService.updateSession(sessionId, {
            ...foundSession,
            checkoutStatus: {
                ...checkoutStatus,
                upsell: IS_UPSELL
                    ? {
                          ...offer,
                          status:
                              status === "succeeded"
                                  ? "concluded"
                                  : status === "processing"
                                  ? "processing"
                                  : "requires_payment",
                      }
                    : offer,
                downsell: !IS_UPSELL
                    ? {
                          ...offer,
                          status:
                              status === "succeeded"
                                  ? "concluded"
                                  : status === "processing"
                                  ? "processing"
                                  : "requires_payment",
                      }
                    : offer,
            },
        });
    }
}
