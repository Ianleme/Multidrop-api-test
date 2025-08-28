import BasePixelSender from "./types/BasePixelSender";

import { CustomerPixelData, PixelInterface, PixelsEventsEnum } from "./types/interfaces/pixel-interfaces"
import { CheckoutDataInterface } from "../../modules/checkout/types/interfaces/checkout-interfaces";

export default class PixelsService {
    constructor(private senders: BasePixelSender[]) {}

    async sendEvent(data: {
        event: PixelsEventsEnum;
        customerMetadata: CustomerPixelData;
        checkoutData: CheckoutDataInterface;
    }) {
        const { customerMetadata, event, checkoutData } = data;
        const { pixels } = checkoutData

        if(!pixels) {
            console.log("Nenhum pixel cadastrado!")
            return 
        }

        const mockedTiktokPixel: PixelInterface[] = [...pixels, {
            idConversionPixel: 0,
            name: "mock tiktok",
            pixelId: "D29RDUBC77U67ECJ411G",
            pixelLabel: "teste",
            typePixel: "tiktok",
            accessToken: "e7e21d17e72cfc01494b9929e7ed923ff01a615e"
        }]

        mockedTiktokPixel.map((pixel) => {
            const sender = this.senders.find((sender) => sender.supports(pixel.typePixel));
            if (!sender) {
                console.log(`Tipo de pixel não disponível! -> ${pixel.typePixel}`);
                return;
            }

            if (pixel.typePixel === "google" && !customerMetadata.googleClientId) {
                console.log("O pixel do google nao foi enviado por que o googleClientId não foi informado!");
                return
            }

            const payload = sender.buildPayload({ event, pixel, customerMetadata, checkoutData });
            sender.send(payload, pixel);
        });
    }
}