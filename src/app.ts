import fastify from "fastify";

import { serializerCompiler, validatorCompiler, ZodTypeProvider } from "fastify-type-provider-zod";

import registerPlugins from "./plugins";
import { registerCheckoutModule } from "./modules/checkout";
import errorHandler from "./exceptions/ErrorHandler";
import registerStripeService from "./services/payment/stripe";
import registerMultidropRestClient from "./services/rest-clients/multidrop";
import registerPixelsService from "./services/pixels";
import registerSubscriptionModule from "./modules/subscription";

export async function buildApp() {
    const app = fastify().withTypeProvider<ZodTypeProvider>();

    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    // Registra o handler de exceptions
    app.setErrorHandler(errorHandler);

    // Registra os plugins
    await registerPlugins(app);
    await registerStripeService(app);
    await registerMultidropRestClient(app);
    await registerPixelsService(app);

    // Registrar os modules
    await app.register(registerCheckoutModule, { prefix: "/api/checkout" });
    await app.register(registerSubscriptionModule, { prefix: "/api/subscription" });

    return app;
}
