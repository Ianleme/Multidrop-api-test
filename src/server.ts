import "./plugins/env"
import { buildApp } from "./app";

const startServer = async () => {   
    const app = await buildApp();

    const port = 3333

    app.listen({
        port,
        host: "0.0.0.0"
    })
        .then(() => {
            console.log(`Servidor HTTP rodando na porta ${port}`);
        })
        .catch((error) => {
            console.log("Erro ao subir servidor ", error);
        });
};

startServer();
