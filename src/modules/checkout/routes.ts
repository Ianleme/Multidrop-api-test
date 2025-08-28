import z from "zod";

import { FastifyTypedWithZod } from "../../types/types";
import { CheckoutController } from "./controller";

import { initializeCheckoutSchema } from "./types/schemas/checkout-schemas";

export async function checkoutRoutes(app: FastifyTypedWithZod, checkoutController: CheckoutController) {
    app.get(
        "/initialize",
        {
            schema: {
                tags: ["Checkout"],
                description: "Inicializar sessão do checkout",
                querystring: initializeCheckoutSchema,
            },
        },
        checkoutController.initializeCheckoutSession.bind(checkoutController)
    );

    app.post(
        "/update",
        {
            schema: {
                tags: ["Webhook stripe"],
                description: "Endpoint que recebe evento da stripe via webhook",
            },
            config: { rawBody: true },
        },
        checkoutController.updatedSaleStatus.bind(checkoutController)
    );
}
