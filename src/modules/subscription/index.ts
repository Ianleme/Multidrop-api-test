import { FastifyTypedWithZod } from "../../types/types";

// SERVICES
import SubscriptionService from "./service";
import SubscriptionController from "./controller";
import subscriptionRoutes from "./routes";

export default async function registerSubscriptionModule(app: FastifyTypedWithZod){

    // COMPLEMENTARIES LAYERS
    const paymentService = app.stripeService
    const multidropRestClient = app.multidropRestClient

    // CORE LAYERS
    const subscriptionService = new SubscriptionService(paymentService, multidropRestClient)
    const subscriptionController = new SubscriptionController(subscriptionService)
    

    app.register(async fastify => {
        await subscriptionRoutes(fastify, subscriptionController)
    })

}