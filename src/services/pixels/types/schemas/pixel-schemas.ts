import z from "zod";

const customerMetadataSchema = z.object({
    acceptedCookies: z.boolean().describe("Uusário autorizou"),
    userBrowserAgent: z.string().optional().describe("Agente do navegador do usuário"),
    googleClientId: z.string().optional().describe("Id do cliente final, gerado pelo serviço Google Analytcs"),
    userIpAddress: z.union([z.string().describe("Endereço ip público do cliente"), z.null()]),
});

export { customerMetadataSchema }
