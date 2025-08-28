import fastifySwaggerUi from "@fastify/swagger-ui";
import { FastifyTypedWithZod } from "../types/types";
import fastifySwagger from "@fastify/swagger";
import { jsonSchemaTransform } from "fastify-type-provider-zod";

export default function registerSwaggerPlugin(app: FastifyTypedWithZod) {
    app.register(fastifySwagger, {
        openapi: {
            info: {
                title: "Multidrop Checkout API",
                description: "API completa do sistema de vendas Multidrop",
                version: "1.0.0",
            },
            servers: [
                {
                    url: "http://localhost:3333/api",
                    description: "Ambiente de desenvolvimento"
                },
            ],
        },
        transform: jsonSchemaTransform,
    });

    app.register(fastifySwaggerUi, {
        routePrefix: "/docs",
    });
}
