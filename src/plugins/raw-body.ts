import fastifyRawBody from "fastify-raw-body";
import { FastifyTypedWithZod } from "../types/types";




export default function registerRawBodyPluggin(app: FastifyTypedWithZod){
    app.register(fastifyRawBody, {
        global: false,
        encoding: "utf8",
        field: "rawBody",
        runFirst: true
    })
}