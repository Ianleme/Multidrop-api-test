import fastifyCookie from "@fastify/cookie";

import { FastifyTypedWithZod } from "../types/types";
import { AppError } from "../exceptions/errors/AppError";

const COOKIE_SECRET = process.env.COOKIE_SECRET;
if (!COOKIE_SECRET)
    throw new AppError("Erro ao recuperar a chave secreta de assinatura de cookies nas variáveis de ambiente!", 500);

export default async function registerCookiesPlugins(app: FastifyTypedWithZod) {
    app.register(fastifyCookie, {
        secret: COOKIE_SECRET,
    });
}
