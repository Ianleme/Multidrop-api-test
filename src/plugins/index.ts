import { FastifyTypedWithZod } from "../types/types";

import registerCookiesPlugins from "./cookies";
import registerCorsPlugin from "./cors";
import registerRawBodyPluggin from "./raw-body";
import registerRedisPluggin from "./redis";
import registerSwaggerPlugin from "./swagger";

export default async function registerPlugins(app: FastifyTypedWithZod) {
    registerCorsPlugin(app);
    registerSwaggerPlugin(app);
    await app.register(registerRedisPluggin);
    registerCookiesPlugins(app);
    registerRawBodyPluggin(app);
}
