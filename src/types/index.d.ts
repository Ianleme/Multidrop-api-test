import "fastify";
import PixelsService from "../modules/checkout/services/pixels-services/pixels.service";
import MultidropRestClient from "../services/rest-clients/multidrop/service";
import StripeService from "../services/payment/stripe/service";

declare module "fastify" {
    interface FastifyInstance {
        redis: RedisClientType;
        pixelService: PixelsService;
        multidropRestClient: MultidropRestClient;
        stripeService: StripeService;
    }

    interface FastifyRequest {
        sessionId: string;
    }
}
