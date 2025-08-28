import z from "zod"

import { redisSessionSchema } from "../schemas/redis-schemas"

type RedisSessionInterface = z.infer<typeof redisSessionSchema>

export type { RedisSessionInterface }