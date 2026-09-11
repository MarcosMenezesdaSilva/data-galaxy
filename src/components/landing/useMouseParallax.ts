import { useEffect, useRef } from "react";

/**
 * Parallax de ponteiro para a cena do hero.
 *
 * Escreve apenas --dg-mx e --dg-my (de -1 a 1) no contêiner; quem decide
 * amplitude é cada camada, via --dg-depth na classe .dg-parallax. O JS não
 * anima nada quadro a quadro — só publica as duas variáveis, coalescidas em um
 * requestAnimationFrame, e o compositor faz o resto.
 *
 * Normaliza contra a viewport em vez do retângulo do elemento de propósito:
 * getBoundingClientRect() a cada mousemove forçaria leitura de layout, que é
 * exatamente o reflow que a cena inteira evita.
 *
 * Não liga em toque nem sob prefers-reduced-motion.
 */
export function useMouseParallax<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const pointerFino = window.matchMedia("(hover: hover) and (pointer: fine)");
    const movimentoReduzido = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!pointerFino.matches || movimentoReduzido.matches) return;

    let frame = 0;
    let x = 0;
    let y = 0;

    const publicar = () => {
      frame = 0;
      el.style.setProperty("--dg-mx", x.toFixed(3));
      el.style.setProperty("--dg-my", y.toFixed(3));
    };

    const aoMover = (e: MouseEvent) => {
      x = (e.clientX / window.innerWidth) * 2 - 1;
      y = (e.clientY / window.innerHeight) * 2 - 1;
      if (!frame) frame = requestAnimationFrame(publicar);
    };

    window.addEventListener("mousemove", aoMover, { passive: true });

    return () => {
      window.removeEventListener("mousemove", aoMover);
      if (frame) cancelAnimationFrame(frame);
      el.style.removeProperty("--dg-mx");
      el.style.removeProperty("--dg-my");
    };
  }, []);

  return ref;
}
