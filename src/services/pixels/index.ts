import { FastifyTypedWithZod } from "../../types/types";
import FacebookPixelService from "./pixels/FacebookPixelService";
import GooglePixelService from "./pixels/GooglePixelService";
import TiktokPixelService from "./pixels/TiktokPixelService";
import PixelsService from "./service";

export default async function registerPixelsService(app: FastifyTypedWithZod) {
    const senders = [new TiktokPixelService(), new FacebookPixelService(), new GooglePixelService()];

    app.decorate("pixelService", new PixelsService(senders));
}
