import { FastifyTypedWithZod } from "../../../../types/types";

import SessionController from "./controller";
import sessionRoutes from "./routes";
import SessionService from "./service";

import RedisService from "../../../../services/storage/redis/service";

import { sessionMiddleware } from "../../../../middlewares/sessionMiddleware";

export default async function registerSessionModule(app: FastifyTypedWithZod) {
    // COMPLEMENTARY LAYERS
    const redisService = new RedisService(app.redis);
    const paymentService = app.stripeService;
    const multidropRestClient = app.multidropRestClient;
    const pixelService = app.pixelService;

    // CORE LAYERS
    const sessionService = new SessionService(redisService, pixelService, paymentService, multidropRestClient);
    const sessionController = new SessionController(sessionService);

    app.addHook("preHandler", sessionMiddleware);

    app.register(async (fastify) => {
        await sessionRoutes(fastify, sessionController);
    }, { prefix: "/session" });
}
