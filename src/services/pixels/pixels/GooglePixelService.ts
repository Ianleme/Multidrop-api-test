import BasePixelSender from "../types/BasePixelSender";

import { GoogleAnalytcsApi } from "../config/PixelsApi";

// SCHEMAS AND TYPES
import { PixelInterface, SendPixelEventInterface } from "../types/interfaces/pixel-interfaces";

export default class GooglePixelService extends BasePixelSender {
    supports(type: string): boolean {
        return type === "google";
    }

    buildPayload({ customerMetadata, event, pixel, checkoutData }: SendPixelEventInterface) {
        if (!customerMetadata.googleClientId) {
            console.log("Evento do google nao foi enviado pois googleClientId não esta definido");
            return;
        }

        let eventName: string = "";
        let eventDescription: string = "";

        switch (event) {
            case "initiate_checkout":
                eventName = "begin_checkout";
                eventDescription = "Iniciou o checkout";
                break;

            case "coupon_add":
                eventName = "add_coupon";
                eventDescription = "Adicionou cupom de desconto";
                break;

            case "coupon_remove":
                eventName = "remove_coupon";
                eventDescription = "Removeu cupom de desconto";
                break;

            case "order_bump_add":
                eventName = "add_order_bump";
                eventDescription = "Adicionou item do order bump";
                break;

            case "order_bump_remove":
                eventName = "remove_order_bump";
                eventDescription = "Removeu item do order bump";
                break;

            case "increase_amount":
                eventName = "increase_amount";
                eventDescription = "Aumentou a quantidade do produto principal";
                break;

            case "decrease_amount":
                eventName = "decrease_amount";
                eventDescription = "Diminuiu a quantidade do produto principal";
                break;
            default:
                console.log("ERRO AO CADASTRAR PIXEL DO GOOGLE: Evento desconhecido -> ", event);
        }

        let payload = {
            client_id: customerMetadata.googleClientId,
            timestamp_micros: Math.floor(Date.now() * 1000),
            events: [
                {
                    name: eventName,
                    params: {
                        description: eventDescription,
                        debug_mode: 1,
                        value: checkoutData.offer.value,
                        currency: checkoutData.offer.currency.toUpperCase(),
                        items: [
                            {
                                item_name: checkoutData.product.name,
                                quantity: 1,
                                price: checkoutData.offer.value,
                            },
                        ],
                    },
                },
            ],
        };

        return payload;
    }

    async send(payload: any, pixelData: PixelInterface) {
        // USAR VALORES PARAMETRIZADOS DE ACCESS_TOKEN E PIXEL ID
        try {
            const accessToken = "mHkvTbIJTO2MzTN8huNNyw"
            const pixelId = "G-4FSEKFQ8PH"

            await GoogleAnalytcsApi.post(
                `/mp/collect?api_secret=${accessToken}&measurement_id=${pixelId}`,
                payload
            );
        } catch (e: any) {
            console.log(e.response);
            console.log("Erro ao enviar pixel do Google Analytcs. ", e.response);
        }
    }
}
