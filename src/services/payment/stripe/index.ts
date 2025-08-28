import { FastifyTypedWithZod } from "../../../types/types";
import StripeService from "./service";



export default async function registerStripeService(app: FastifyTypedWithZod){
    const stripeService = new StripeService()

    app.decorate("stripeService", stripeService)
}