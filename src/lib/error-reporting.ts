// Reporte de erros local — o Data Galaxy roda 100% no navegador, sem backend
// e sem qualquer serviço de telemetria externo. Esta função apenas loga o
// erro no console local do navegador para fins de depuração.

export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const message =
    error instanceof Response
      ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`
      : error instanceof Error
        ? error.message
        : String(error);
  console.error("[data-galaxy]", message, {
    route: window.location.pathname,
    stack: error instanceof Error ? error.stack : undefined,
    ...context,
  });
}
