import z from "zod"

import { registerSaleSchema, saleSchema } from "../schema/sale-schemas"

type RegisterSaleInterface = z.infer<typeof registerSaleSchema>
type SaleInterface = z.infer<typeof saleSchema>

export { RegisterSaleInterface, SaleInterface }