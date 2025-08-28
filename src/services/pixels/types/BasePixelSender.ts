import { SendPixelEventInterface, PixelInterface } from "./interfaces/pixel-interfaces";

export default abstract class BasePixelSender{
    abstract supports(type: string): boolean;
    abstract buildPayload(data: SendPixelEventInterface): any;
    abstract send(payload: any, pixelData: PixelInterface): any
}