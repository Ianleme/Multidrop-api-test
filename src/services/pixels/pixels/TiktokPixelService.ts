import BasePixelSender from "../types/BasePixelSender";

import { TiktokApi } from "../config/PixelsApi";

// SCHEMAS AND TYPES
import { PixelInterface, SendPixelEventInterface } from "../types/interfaces/pixel-interfaces";

export default class TiktokPixelService extends BasePixelSender {
    supports(type: string): boolean {
        return type === "tiktok";
    }

    buildPayload({ event, pixel }: SendPixelEventInterface) {
        const eventMap: Record<string, { tiktokEvent: string; description: string }> = {
            initiate_checkout: { tiktokEvent: "InitiateCheckout", description: "Iniciou o checkout" },
            coupon_add: { tiktokEvent: "AddToCart", description: "Adicionou cupom de desconto" },
            coupon_remove: { tiktokEvent: "RemoveFromCart", description: "Removeu cupom de desconto" },
            order_bump_add: { tiktokEvent: "AddToCart", description: "Adicionou item do order bump" },
            order_bump_remove: { tiktokEvent: "RemoveFromCart", description: "Removeu item do order bump" },
            increase_amount: { tiktokEvent: "AddToCart", description: "Aumentou a quantidade do produto principal" },
            decrease_amount: {
                tiktokEvent: "RemoveFromCart",
                description: "Diminuiu a quantidade do produto principal",
            },
        };

        const eventMapping = eventMap[event];

        if (!eventMapping) {
            console.error("ERRO AO CADASTRAR PIXEL DO TIKTOK: Evento desconhecido -> ", event);
            return null;
        }

        let payload = {
            event_source: "web",
            event_source_id: pixel.pixelId,
            data: [
                {
                    event: eventMapping.tiktokEvent,
                    event_time: Math.floor(Date.now() / 1000),
                },
            ],
        };

        return payload;
    }

    async send(payload: any, pixelData: PixelInterface) {
        try {
            const accessToken = pixelData.accessToken;

            if (!accessToken) {
                console.log("Erro ao emitir evento pixel do facebook: ACCESS_TOKEN NÃO INFORMADO!");
                return;
            }

            const response = await TiktokApi.post("/event/track/", payload, {
                headers: {
                    "Access-Token": accessToken,
                },
            });
        } catch (e: any) {
            console.log(payload);
            console.log("Erro ao emitir pixel do tiktok --> ", e);
        }
    }
}
