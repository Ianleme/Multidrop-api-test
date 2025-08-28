import fastifyCors from "@fastify/cors";
import { FastifyTypedWithZod } from "../types/types";

import { AppError } from "../exceptions/errors/AppError";

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGIN;
if (!ALLOWED_ORIGINS) {
    throw new AppError("Erro ao carregar ALLOWED_ORIGIN nas variáveis de ambiente!", 500);
}
const allowedOrigins = ALLOWED_ORIGINS.split(",")
    .map((o) => o.trim())
    .filter((o) => o);

export default function registerCorsPlugin(app: FastifyTypedWithZod) {
    return app.register(fastifyCors, {
        origin: allowedOrigins,
        methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
        credentials: true,
    });
}
