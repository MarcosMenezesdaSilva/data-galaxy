import { useEffect } from "react";
import { useApp } from "@/lib/store";

export function ThemeInit() {
  const theme = useApp((s) => s.theme);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
  }, [theme]);
  return null;
}
