import { useState, useEffect, useMemo } from "react";

const modes = {
  LIGHT: "light",
  DARK: "dark",
};

const useTheme = () => {
  const [mode, setMode] = useState();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setMode((prev) => localStorage.getItem("theme") || prev);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && !!mode) {
      localStorage.setItem("theme", mode);

      if (mode === modes.LIGHT) {
        document.body.classList.remove("dark");
      } else {
        document.body.classList.add("dark");
      }
    }
  }, [mode]);

  const actions = useMemo(() => {
    return {
      setMode: setMode,
      toggleMode: () => {
        setMode((prev) => (prev === modes.LIGHT ? modes.DARK : modes.LIGHT));
      },
    };
  }, []);

  return { state: mode, actions, types: modes };
};

export default useTheme;
