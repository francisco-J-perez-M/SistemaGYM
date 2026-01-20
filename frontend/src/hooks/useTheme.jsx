import { useEffect, useState } from "react";

export default function useTheme() {
  // Leemos del localStorage o por defecto 'dark'
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "dark"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme); // Nota: es mejor usar document.documentElement (etiqueta html) que body, pero body funciona
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Función para cambiar a un tema específico
  const changeTheme = (newTheme) => {
    setTheme(newTheme);
  };

  return { theme, changeTheme };
}