import z from "zod";
import { FastifyReply, FastifyRequest } from "fastify";

import { CheckoutService } from "./service";
import { initializeCheckoutSchema } from "./types/schemas/checkout-schemas";

export class CheckoutController {
    constructor(private checkoutService: CheckoutService) {}

    async initializeCheckoutSession(req: FastifyRequest, res: FastifyReply) {
        const { offerId, sellerId } = initializeCheckoutSchema.parse(req.query);

        const response = await this.checkoutService.initializeCheckoutSession({
            offerId,
            sellerId,
        });

        res.status(201).send({
            message: "Sessão do checkout iniciada com sucesso!",
            ...response
        });
    }    

    async updatedSaleStatus(req: FastifyRequest, res: FastifyReply){
        const sig = req.headers["stripe-signature"]
        if(!sig) {
            console.log("ERRRO AO RECEBER EVENTO DA STRIPE")
            return
        }

        const payload = req.rawBody
        const status = await this.checkoutService.updateSaleStatus(sig, payload)    

    }
}