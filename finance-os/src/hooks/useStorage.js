import { useState, useEffect } from "react";

// Teste se localStorage está disponível
const isLocalStorageAvailable = () => {
  try {
    const test = "__test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

const hasLocalStorage = isLocalStorageAvailable();

export function useStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    if (!hasLocalStorage) {
      console.warn("⚠️ localStorage não disponível. Dados podem não ser salvos permanentemente.");
      return defaultValue;
    }
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (err) {
      console.error("Erro ao ler localStorage:", err);
      return defaultValue;
    }
  });

  useEffect(() => {
    if (!hasLocalStorage) return;
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      if (err.name === "QuotaExceededError") {
        console.error("❌ localStorage cheio! Não é possível salvar dados.");
        alert("Aviso: Seus dados podem não estar sendo salvos. O localStorage está cheio.");
      } else if (err.name === "SecurityError") {
        console.error("❌ Acesso negado ao localStorage (modo privado?)");
      } else {
        console.error("Erro ao salvar no localStorage:", err);
      }
    }
  }, [key, value]);

  return [value, setValue];
}
