import { randomUUID } from "crypto";

// EXCEPTIONS
import { SessionNotFound } from "../../../exceptions/errors/SessionNotFound";

// SCHEMAS AND TYPES
import { RedisClientType } from "redis";
import { RedisSessionInterface } from "./types/interfaces/redis-interfaces";

export default class RedisService {
    constructor(private redis: RedisClientType) {}

    async createSession({ checkoutData, paymentData, checkoutStatus, customerData, customerMetadata }:  RedisSessionInterface) {
        const sessionToken = this.generateUniqueToken();

        const redisPayload = JSON.stringify({
            paymentData,
            checkoutData,
            checkoutStatus,
            customerMetadata,
            customerData
        });

        await this.redis.set(sessionToken, redisPayload, {
            expiration: {
                type: "EX",
                value: 1800,
            },
        });

        return sessionToken;
    }

    async updateSession(sessionId: string, newValues: RedisSessionInterface) {
        const redisPayload = JSON.stringify(newValues);

        await this.redis.set(sessionId, redisPayload, {
            expiration: {
                type: "EX",
                value: 1800,
            },
        });

        return newValues
    }

    async retrieveSession(sessionData: { sessionId: string, offerId?: string, sellerId?: string }) {
        const { sessionId, offerId, sellerId } = sessionData
        const redisResponse = await this.redis.get(sessionId);
        const sessionContent: RedisSessionInterface = redisResponse && JSON.parse(redisResponse)        
        
        if (!sessionContent) throw new SessionNotFound("Sessão não encontrada!", 404);    
        if (offerId && sessionContent.checkoutData.offerId !== offerId) throw new SessionNotFound("Sessão não encontrada!", 404);    
        if (sellerId && sessionContent.checkoutData.sellerId !== sellerId) throw new SessionNotFound("Sessão não encontrada!", 404);    
        

        return sessionContent;
    }

    private generateUniqueToken() {
        return randomUUID();
    }
}