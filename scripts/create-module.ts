#!/usr/bin/env tsx

import { promises as fs } from 'fs';
import path from 'path';

async function main() {
  const [,, moduleName] = process.argv;
  if (!moduleName) {
    console.error('Usage: create-module <module-name>');
    process.exit(1);
  }

  const root = path.resolve(__dirname, '../src/modules', moduleName);
  await fs.mkdir(root, { recursive: true });

  const files: Record<string, string> = {
    'index.ts': `import { FastifyTypedWithZod } from "../../types";
      
import { ${capitalize(moduleName)}Service } from './service';
import { ${capitalize(moduleName)}Controller } from './controller';
import { ${moduleName}Routes } from './routes';

export function register${capitalize(moduleName)}Module(app: FastifyTypedWithZod){
  const ${moduleName}Service = new ${capitalize(moduleName)}Service()
  const ${moduleName}Controller = new ${capitalize(moduleName)}Controller(${moduleName}Service)

  app.register(async (fastify) => {
    await ${moduleName}Routes(fastify, ${moduleName}Controller);
  }, { prefix: '/api/${moduleName}' })
}`,
    'service.ts': `export class ${capitalize(moduleName)}Service{}`,
    'controller.ts': `import { FastifyRequest, FastifyReply } from "fastify";
    
import { ${capitalize(moduleName)}Service } from './service';

export class ${capitalize(moduleName)}Controller{
  constructor(private ${moduleName}Service: ${capitalize(moduleName)}Service) { }
}`,
    'routes.ts': `import { FastifyRequest, FastifyReply } from "fastify"
    
import { FastifyTypedWithZod } from "../../types";      
import { ${capitalize(moduleName)}Controller } from './controller';

export async function ${moduleName}Routes(app: FastifyTypedWithZod, ${moduleName}Controller: ${capitalize(moduleName)}Controller ){

  app.get("/test", async (req: FastifyRequest, res: FastifyReply) => {
    res.send("rota de teste do módulo de ${moduleName}")
  })

}`};

  // grava cada arquivo
  await Promise.all(
    Object.entries(files).map(([file, content]) =>
      fs.writeFile(path.join(root, file), content, 'utf8')
    )
  );

  const errors = path.resolve(__dirname, `../src/modules/${moduleName}`, "errors")
  const types = path.resolve(__dirname, `../src/modules/${moduleName}`, "types")
  await fs.mkdir(errors, { recursive: true });
  await fs.mkdir(types, { recursive: true });


  console.log(`Módulo "${moduleName}" criado em src/modules/${moduleName}`);
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
