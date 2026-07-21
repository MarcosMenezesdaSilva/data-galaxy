import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

// Configuração Vite standalone, desacoplada do pacote proprietário
// @lovable.dev/vite-tanstack-config. Equivalente funcional dos plugins que
// aquele pacote incluía: tsConfigPaths (alias @/*), tailwindcss (Tailwind v4
// via plugin nativo), tanstackStart (SSR, com o entry do servidor redirecionado
// para src/server.ts) e viteReact (Fast Refresh).
export default defineConfig({
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackStart({
      server: { entry: "server" },
    }),
    viteReact(),
  ],
});
