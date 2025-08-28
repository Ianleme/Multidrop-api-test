import { FastifyTypedWithZod } from "../../types/types";

import { checkoutRoutes } from "./routes";
import { CheckoutService } from "./service";
import { CheckoutController } from "./controller";

import RedisService from "../../services/storage/redis/service";
import registerSessionModule from "./submodules/session";

export async function registerCheckoutModule(app: FastifyTypedWithZod) {
    // COMPLEMENTARIES LAYERS
    const multidropRestClient = app.multidropRestClient
    const redisService = new RedisService(app.redis);
    const stripeService = app.stripeService 

    // CORE LAYERS
    const checkoutService = new CheckoutService(stripeService, redisService, multidropRestClient, app.pixelService);
    const checkoutController = new CheckoutController(checkoutService);

    app.register(async (fastify) => {
        await checkoutRoutes(fastify, checkoutController);
    });

    // SUBMODULES REGISTRATION
    await app.register(registerSessionModule)
}