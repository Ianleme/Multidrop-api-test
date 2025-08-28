import axios from "axios"
import { AppError } from "../../../../exceptions/errors/AppError"

const baseURL = process.env.MULTIDROP_API_URL;

if(!baseURL) throw new AppError("Erro ao carregar url da api Multidrop das variavies de ambiente", 500)

const MultidropApi = axios.create({
    baseURL,
})

export { MultidropApi }