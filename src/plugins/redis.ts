// src/plugins/redis.ts
import fp from 'fastify-plugin';
import { createClient, RedisClientType } from 'redis';
import { FastifyInstance } from 'fastify';
import { AppError } from '../exceptions/errors/AppError';

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new AppError(
    'Erro ao carregar URL do Redis nas variáveis de ambiente!',
    500
  );
}

export default fp(async (app: FastifyInstance) => {
  const client: RedisClientType = createClient({ url: redisUrl });

  client.on('error', (err) => {
    app.log.error('Redis error:', err);
    // opcional: lançar ou só logar
  });

  await client.connect();

  app.decorate('redis', client);
});
