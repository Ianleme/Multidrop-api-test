import Stripe from "stripe";

import { AppError } from "../../../exceptions/errors/AppError";

// SCHEMAS AND TYPES
import { CreatePaymentIntentInterface, UpdatePaymentIntentInterface } from "./types/interfaces/payment-interfaces";
import {
    CustomerBillingDataInterface,
    UpdateCustomerBillingDataInterface,
} from "./types/interfaces/customer-interfaces";
import { ProductInterface } from "../../rest-clients/multidrop/types/interface/offer-interfaces";

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export default class StripeService {
    private stripe: Stripe;
    private webhookSecret: string;

    constructor() {
        if (!STRIPE_KEY) throw new AppError("[.env] faltando variável de ambiente: STRIPE_SECRET_KEY", 500);
        this.stripe = new Stripe.Stripe(STRIPE_KEY);

        if (!STRIPE_WEBHOOK_SECRET)
            throw new AppError("[.env] faltando variável de ambiente: STRIPE_WEBHOOK_SECRET", 500);
        this.webhookSecret = STRIPE_WEBHOOK_SECRET;
    }

    // ADICIONAR TRY CATCH EM CADA METODO PARA TRATAMENTO DE ERROS

    // PAYMENT
    async createPaymentIntent({ amount, currency, customerId }: CreatePaymentIntentInterface) {
        const { client_secret, id } = await this.stripe.paymentIntents.create({
            amount,
            currency,
            payment_method_types: ["card", "paypal", "klarna"],
            customer: customerId,
        });
        if (!client_secret) {
            console.log("erro ao gerar client_secret!");

            throw new AppError("Erro ao inciar pagamento com a stripe!", 500);
        }

        const createdPaymentIntent = {
            amount,
            currency,
            client_secret: client_secret!,
            id,
        };

        return createdPaymentIntent;
    }

    async confirmPaymentIntent(paymentIntentId: string, paymentMethodId: string) {
        try {
            const {} = await this.stripe.paymentIntents.confirm(paymentIntentId, {
                payment_method: paymentMethodId,
            });

            console.log("PAGO COM SUCESSO");
        } catch (e: any) {
            console.log("Erro ao tentar confirmar intenção de pagamento");
            console.log(e.raw);
        }
    }

    async cancelPaymentIntent(paymentIntentId: string) {
        try {
            await this.stripe.paymentIntents.cancel(paymentIntentId);
            console.log("Payment intent cancelado!");
        } catch (e: any) {
            console.log("Erro ao tentar cancelar uma intenção de pagamento na stripe");
            console.log(e)
        }
    }

    async updatePaymentIntent(paymentIntentId: string, newValues: UpdatePaymentIntentInterface) {
        const { currency, amount, id, client_secret } = await this.stripe.paymentIntents.update(paymentIntentId, {
            amount: newValues.amount,
            currency: newValues.currency,
        });
        if (!client_secret) {
            console.log("Erro com o client secret na hora de atualizar a intenção de pagamento");

            throw new AppError("Erro ao atualizar intenção de pagamento!", 500);
        }

        const response = {
            currency,
            amount,
            id,
            client_secret: client_secret!,
        };

        return response;
    }

    async fetchPaymentIntentStatus({ paymentIntentId }: { paymentIntentId: string }) {
        return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    }

    async createSetupIntent({ customerId, paymentType }: { customerId: string; paymentType: string }) {
        try {
            const setupIntent = await this.stripe.setupIntents.create({
                customer: customerId,
                usage: "off_session",
                payment_method_types: ["card"],
            });

            return setupIntent;
        } catch (e: any) {
            console.log("Erro ao tentar criar um setup intent");
            console.log(e);
            throw new AppError("Houve um erro ao tentar inicializar a sessão de pagamento!", 500);
        }
    }

    // SUBSCRIPTIONS AND INVOICES
    async startSubscription({ customerId, product }: { customerId: string; product: ProductInterface }) {
        try {
            const subscription = await this.stripe.subscriptions.create({
                customer: customerId,
                items: [
                    {
                        price: product.priceStripeID,
                    },
                ],
                collection_method: "charge_automatically",
                payment_behavior: "default_incomplete",
                payment_settings: {
                    save_default_payment_method: "on_subscription",
                },
                expand: ["latest_invoice.confirmation_secret"],
            });

            const { confirmation_secret } = subscription.latest_invoice as any;

            let paymentIntentId: string = confirmation_secret.client_secret;
            paymentIntentId = paymentIntentId.split("_secret_")[0];

            return {
                paymentIntentId,
                subscription,
            };
        } catch (e: any) {
            const errorMessage: string = e;
            console.log("Erro ao tentar gerar subscription da stripe -> ", errorMessage);

            if (
                errorMessage.startsWith(
                    "The price specified is set to `type=one_time` but this field only accepts prices with `type=recurring`"
                )
            ) {
                console.log(
                    "O produto interno multidrop é assinatura, porém na stripe esta cadastrado como pagamento único"
                );
            }

            throw new AppError("Ocorreu um erro ao gerar a assinatura, estamoms trabalhando nisso!", 500);
        }
    }

    async fetchSubscription({ customerId, priceId }: { customerId: string; priceId: string }) {
        try {
            const response = await this.stripe.subscriptions.list({
                customer: customerId,
                price: priceId,
                expand: ["data.default_payment_method", "data.pending_setup_intent"],
            });
            const subscription = response.data[0];
            if (!subscription) return null;

            const paymentData = subscription.default_payment_method as any;

            const subscriptionDto = {
                id: subscription.id,
                status: subscription.status,
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
                paymentMethod: paymentData
                    ? {
                          id: paymentData.id,
                          brand: paymentData.card?.brand,
                          last4: paymentData.card?.last4,
                          expMonth: paymentData.card?.exp_month,
                          expYear: paymentData.card?.exp_year,
                      }
                    : null,
            };

            return subscriptionDto;
        } catch (e: any) {
            console.log("Erro ao tentar buscar dados da assinatura -> ", e);
            const errorMessage: string = e.raw.message;

            if (errorMessage.startsWith("No such customer")) {
                console.log("Usuário não encontrado na stripe!");
                throw new AppError("Usuário não encontrado na stripe", 404);
            }

            throw new AppError("Erro ao tentar buscar dados da assinatura", 500);
        }
    }

    async updateSubscriptionPaymentMethod({
        paymentMethodId,
        subscriptionId,
    }: {
        paymentMethodId: string;
        subscriptionId: string;
    }) {
        try {
            await this.stripe.subscriptions.update(subscriptionId, {
                default_payment_method: paymentMethodId,
            });
        } catch (e: any) {
            console.log("Erro ao tentar atualizar o metodo de pagamento");
            const responseMessage: string = e.raw.message;

            if (responseMessage && responseMessage.startsWith("No such PaymentMethod")) {
                throw new AppError("Método de pagamento não encontrado na stripe!", 404);
            }

            throw new AppError(
                "Houve um erro inesperado ao tentar atualizar o metodo de pagamento dessa assinatura, estamos trabalhando nisso",
                500
            );
        }
    }

    async retrieveInvoice(invoiceId: string) {
        try {
            const invoice = await this.stripe.invoices.retrieve(invoiceId, { expand: ["confirmation_secret"] });

            const paymentData = invoice.confirmation_secret as any;
            const { client_secret } = paymentData;

            const invoiceDto = {
                id: invoice.id,
                paymentIntentId: client_secret.split("_secret_")[0],
                number: invoice.number,
                date: new Date(invoice.created * 1000).toISOString(),
                dueDate: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
                status: invoice.status,
                total: invoice.total / 100,
                currency: invoice.currency,
                hostedInvoiceUrl: invoice.hosted_invoice_url,
            };

            return invoiceDto;
        } catch (e: any) {
            const error = e.raw;
            const message: string = error.message;

            if (error && message && message.startsWith("No such invoice")) {
                console.log("Fatura não encontrada!");
                throw new AppError(
                    "Não foi possível encontrar os detalhes da fatura, pois ela não foi encontrada!",
                    404
                );
            }
            console.log(message);
            throw new AppError("Erro ao tentar buscar detalhes da fatura!", 500);
        }
    }

    async fetchInvoices(subscriptionId: string) {
        try {
            const response = await this.stripe.invoices.list({
                subscription: subscriptionId,
                expand: ["data.payment_intent"],
            });

            const invoices = response.data;

            if (invoices.length) {
                const invoiceDtoList = invoices.map((invoice) => ({
                    id: invoice.id,
                    number: invoice.number,
                    date: new Date(invoice.created * 1000).toISOString(),
                    dueDate: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
                    status: invoice.status,
                    total: invoice.total / 100,
                    currency: invoice.currency,
                    hostedInvoiceUrl: invoice.hosted_invoice_url,
                }));

                return invoiceDtoList;
            }

            return invoices;
        } catch (e: any) {
            console.log("Erro ao tentar buscar faturas da assinatura -> ", e);
            throw new AppError("Erro ao tentar buscar faturas da assinatura", 500);
        }
    }

    async cancelSubscription(subscriptionId: string) {
        try {
            const response = await this.stripe.subscriptions.cancel(subscriptionId);
        } catch (e: any) {
            console.log("Erro ao tentar cancelar a assinatura");
            console.log(e.raw);

            throw new AppError("Houve um erro na hora de cancelar sua assinatura, sentimos muito!", 500);
        }
    }

    // CUSTOMER
    async createCustomer(customerBillingData: CustomerBillingDataInterface) {
        try {
            const { address, city, country, state, postalCode, ...personalData } = customerBillingData;

            const createdCustomer = await this.stripe.customers.create({
                ...personalData,
                address: {
                    city,
                    country,
                    line1: address,
                    postal_code: postalCode,
                    state,
                },
            });
            return createdCustomer;
        } catch (e: unknown) {
            console.log("Erro ao tentar cadastrar cliente na stripe --> ", e);

            throw new AppError("Erro ao cadastrar consumidor na stripe!", 500);
        }
    }

    async retrieveCustomer(customerId: string) {
        try {
            const customer: any = await this.stripe.customers.retrieve(customerId);

            const customerData = {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                address: customer.address,
            };
            return customerData;
        } catch (e: any) {
            console.log("Erro ao tentar buscar usuário na stripe utilizando id");
            const errorMessage: string = e.raw.message;

            if (errorMessage.startsWith("No such customer")) {
                throw new AppError("Usuário não encontrado na stripe", 404);
            }

            throw new AppError("Erro ao buscar usuário na stripe", 500);
        }
    }

    async fetchCustomerByEmail(email: string) {
        try {
            const { data } = await this.stripe.customers.list({
                email,
                limit: 1,
            });
            return data[0];
        } catch (e: unknown) {
            console.log("Erro ao buscar cliente na stripe, -> ", e);
        }
    }

    async fetchCustomerPaymentMethods(customerId: string) {
        try {
            const response = await this.stripe.paymentMethods.list({
                customer: customerId,
            });

            const paymentMethodDtoList = response.data.map((paymentData) => ({
                id: paymentData.id,
                type: paymentData.type,
                card: paymentData.card
                    ? {
                          country: paymentData.card.country,
                          brand: paymentData.card.brand,
                          expirationMonth: paymentData.card.exp_month,
                          expirationYear: paymentData.card.exp_year,
                          lastDigits: paymentData.card.last4,
                      }
                    : null,
                paypal: paymentData.paypal
                    ? {
                          country: paymentData.paypal.country,
                          paypalEmail: paymentData.paypal.payer_email,
                      }
                    : null,
            }));

            return paymentMethodDtoList;
        } catch (e: any) {
            console.log("Erro ao tentar buscar os metodos de pagamentos do usuário");
            console.log(e);
            throw new AppError("Erro ao tentar buscar métodos de pagamentos salvos do usuário!", 500);
        }
    }

    async updateCustomerData(customerId: string, newCustomerData: UpdateCustomerBillingDataInterface) {
        try {
            const { address, postalCode, city, country, state, ...customerPersonalData } = newCustomerData;
            const response = await this.stripe.customers.update(customerId, {
                ...customerPersonalData,
                address: {
                    city,
                    country,
                    line1: address,
                    postal_code: postalCode,
                    state,
                },
            });

            const updatedUser = response as any;

            const updatedUserDto: CustomerBillingDataInterface = {
                ...updatedUser.address,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
            };

            return updatedUserDto;
        } catch (e: any) {
            const errorMessage: string = e.raw.message;
            if (errorMessage) {
                if (errorMessage.startsWith("No such custome"))
                    throw new AppError("Cliente não encontrado na stripe!", 404);
            }

            console.log("Erro ao tentar atualizar dados de faturamento do cliente! -> ", e);
            throw new AppError("Erro ao tentar atualizar os dados de faturamento do cliente!", 500);
        }
    }

    // WEB HOOK
    asignWebHook(sig: string | string[], payload: any) {
        try {
            const event = this.stripe.webhooks.constructEvent(payload, sig, this.webhookSecret);

            return event;
        } catch (e: any) {
            console.log("Erro ao tentar assinar webhook -> ", e);
            throw new AppError("Ocorreu um erro ao tentar processar o evento da stripe!", 500);
        }
    }
}
