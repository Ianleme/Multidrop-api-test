import { errorMonitor } from "events";
import { FastifyError, FastifyReply, FastifyRequest } from "fastify";

import { ZodError } from "zod";
import { SessionNotFound } from "./errors/SessionNotFound";

export default async function errorHandler(error: FastifyError, req: FastifyRequest, res: FastifyReply) {
    console.log(error);

    if (Array.isArray((error as any).validation)) {
        // Cada entry de validation vem com { path: string, message: string }
        const issues = (error as any).validation.map((e: any) => ({
            path: e.path, // ou e.instancePath, conforme a versão do Fastify
            message: e.message,
        }));

        return res.status(422).send({
            error: "Erro de validação",
            issues,
        });
    }

    if (error instanceof ZodError) {
        return res.status(422).send({
            error: "Erro de validação",
            issues: error.issues.map((e) => ({
                path: e.path.join("."),
                message: e.message,
            })),
        });
    }

    if (error instanceof SessionNotFound) {
        // Expira o cookie da sessão
        return res.status(error.statusCode).send({ error: error.message });
    }

    const statusCode = error.statusCode && typeof error.statusCode === "number" ? error.statusCode : 500;

    const message = error.message || "Erro interno no servidor";

    res.status(statusCode).send({ error: message });
}
