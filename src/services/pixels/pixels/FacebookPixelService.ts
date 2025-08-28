import BasePixelSender from "../types/BasePixelSender";

import { FacebookAdsApi } from "../config/PixelsApi";
import { PixelInterface, SendPixelEventInterface } from "../types/interfaces/pixel-interfaces";

export default class FacebookPixelService extends BasePixelSender {
    supports(type: string): boolean {
        return type === "facebook";
    }

    buildPayload(data: SendPixelEventInterface) {
        const { event, customerMetadata } = data;

        let eventName: "InitiateCheckout" | "AddToCart" | "RemoveFromCart" = "InitiateCheckout";
        let eventDescription: string = "";

        switch (event) {
            case "initiate_checkout":
                eventName = "InitiateCheckout";
                eventDescription = "Iniciou o checkout";
                break;

            case "coupon_add":
                eventName = "AddToCart"; // O evento "AddToCart" é mais adequado para a adição de cupons
                eventDescription = "Adicionou cupom de desconto";
                break;

            case "coupon_remove":
                eventName = "RemoveFromCart"; // O evento "RemoveFromCart" é mais adequado para a remoção de cupons
                eventDescription = "Removeu cupom de desconto";
                break;

            case "order_bump_add":
                eventName = "AddToCart"; // O evento "AddToCart" pode ser usado para adicionar itens ao carrinho, incluindo order bumps
                eventDescription = "Adicionou item do order bump";
                break;

            case "order_bump_remove":
                eventName = "RemoveFromCart"; // O evento "RemoveFromCart" pode ser usado para remover itens do carrinho, incluindo order bumps
                eventDescription = "Removeu item do order bump";
                break;

            case "increase_amount":
                eventName = "AddToCart"; // O evento "AddToCart" pode ser usado para adicionar mais unidades de um produto ao carrinho
                eventDescription = "Aumentou a quantidade do produto principal";
                break;

            case "decrease_amount":
                eventName = "RemoveFromCart"; // O evento "RemoveFromCart" pode ser usado para remover unidades de um produto do carrinho
                eventDescription = "Diminuiu a quantidade do produto principal";
                break;

            default:
                console.log("ERRO AO CADASTRAR PIXEL DO FACEBOOK: Evento desconhecido -> ", event);
        }

        let payload = {
            data: [
                {
                    event_name: eventName,
                    event_time: Math.floor(Date.now() / 1000),
                    action_source: "website",
                    user_data: {
                        client_ip_address: customerMetadata.userIpAddress,
                        client_user_agent: customerMetadata.userBrowserAgent,
                    },
                    custom_data: {
                        description: eventDescription,
                    },
                },
            ],
        };

        return payload;
    }

    async send(payload: any, pixelData: PixelInterface) {
        // USAR VALORES PARAMETRIZADOS DE ACCESS_TOKEN E PIXEL ID
        const pixelId = pixelData.pixelId
        const accessToken = pixelData.accessToken;
        
        if(!accessToken){
            console.log("Erro ao emitir evento pixel do facebook: ACCESS_TOKEN NÃO INFORMADO!")
            return
        }

        try {
            await FacebookAdsApi.post(`/${pixelId}/events?access_token=${accessToken}`, payload);
        } catch (e: any) {
            console.log("Erro ao enviar pixel do Facebook Ads.", e.response.data);
            console.log(payload);
        }
    }
}
