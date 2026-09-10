import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          // Card elevado do sistema: superfície acima do fundo, borda do DS e
          // sombra de elevação — o status vem do ícone, não de um bloco de cor.
          toast: [
            "group toast",
            "group-[.toaster]:bg-popover group-[.toaster]:text-foreground",
            "group-[.toaster]:border-[color:var(--border-default)]",
            "group-[.toaster]:rounded-md",
            "group-[.toaster]:shadow-[var(--shadow-card-elevated)]",
          ].join(" "),
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-pill",
          cancelButton:
            "group-[.toast]:bg-[color:var(--surface-03)] group-[.toast]:text-muted-foreground group-[.toast]:rounded-pill",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
