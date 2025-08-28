import { FastifyTypedWithZod } from "../../../types/types";

import MultidropRestClient from "./service";

export default async function registerMultidropRestClient(app: FastifyTypedWithZod){
    const multidropRestClient = new MultidropRestClient()

    app.decorate("multidropRestClient", multidropRestClient)   
}