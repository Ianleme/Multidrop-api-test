import { AppError } from "../../exceptions/errors/AppError";
import StripeService from "../../services/payment/stripe/service";
import MultidropRestClient from "../../services/rest-clients/multidrop/service";

export default class SubscriptionService {
    constructor(private paymentService: StripeService, private multidropRestClient: MultidropRestClient) {}

    async fetchSubscription(token: string) {
        // Fetch the session at multidrop
        const { customerId, product } = await this.multidropRestClient.fetchSubscriptionManagementSession(token);

        // Fetch the subscription data at stripe
        const { id: priceId } = await this.paymentService.fetchPricesByProduct(product.productStripeID);
        const subscription = await this.paymentService.fetchSubscription({ customerId, priceId });
        if (!subscription) throw new AppError("Assinatura não encontrada!", 404);

        // Fetch the invoices
        const invoices = await this.paymentService.fetchInvoices(subscription.id);

        // Fetch user data at stripe
        const customerData = await this.paymentService.retrieveCustomer(customerId);
        const customerSavedPaymentMethods = await this.paymentService.fetchCustomerPaymentMethods(customerId);

        return {
            customerData: {
                ...customerData,
                paymentMethods: customerSavedPaymentMethods,
            },
            subscription: {
                ...subscription,
                product
            },
            invoices,
        };
    }

    async createPaymentSetupIntent({ customerId, paymentType }: { customerId: string; paymentType: string }) {
        const { client_secret } = await this.paymentService.createSetupIntent({ customerId, paymentType });

        return client_secret;
    }

    async updateSubscriptionPaymentMethod({
        subscriptionId,
        paymentMethodId,
    }: {
        paymentMethodId: string;
        subscriptionId: string;
    }) {
        await this.paymentService.updateSubscriptionPaymentMethod({ paymentMethodId, subscriptionId });
    }

    async cancelSubscription(subscriptionId: string){
        // Submit the cancel request to stripe
        await this.paymentService.cancelSubscription(subscriptionId)

        // Update multidrop base
        // await this.multidropRestClient.updateSaleStatus()
    }
}
