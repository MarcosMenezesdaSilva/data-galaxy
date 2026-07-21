// Data Galaxy é 100% client-side (IndexedDB/Zustand, sem servidor real), então
// buildamos em modo SPA (spa.enabled em vite.config.ts). O TanStack Start gera
// o shell prerenderizado como dist/client/_shell.html; hosts estáticos esperam
// um index.html na raiz servido para qualquer rota (fallback de SPA). Este
// script copia o shell para index.html e garante o arquivo de redirects do
// Netlify. Roda automaticamente após "vite build" (script "postbuild").
import { copyFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const clientDir = join(import.meta.dirname, "..", "dist", "client");
const shell = join(clientDir, "_shell.html");
const index = join(clientDir, "index.html");

if (!existsSync(shell)) {
  console.error(`[postbuild] ${shell} não encontrado — o build de SPA/prerender falhou?`);
  process.exit(1);
}

copyFileSync(shell, index);
writeFileSync(join(clientDir, "_redirects"), "/*    /index.html   200\n");

console.log("[postbuild] index.html + _redirects gerados em dist/client (fallback de SPA).");
