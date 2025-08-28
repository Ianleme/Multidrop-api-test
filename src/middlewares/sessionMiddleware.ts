import { FastifyReply, FastifyRequest } from "fastify";

import { AppError } from "../exceptions/errors/AppError";

export async function sessionMiddleware(req: FastifyRequest, res: FastifyReply) {
    // If the request is on initialize sessions, the request just bypass the middleware

    const rawToken = req.headers.authorization;
    const token = rawToken?.replace("Bearer ", "")
    
    if (!token) throw new AppError("Informe o ID da sessão via bearer token ('sessionId')", 401);

    req.sessionId = token;

    return;
}