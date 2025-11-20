import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";

export interface Printer {
  id: string;
  name: string;
  serverUrl: string;
  apiKey: string;
  color?: string;
}

interface PrinterContextType {
  printers: Printer[];
  activePrinterId: string | null;
  getActivePrinter: () => Printer | null;
  addPrinter: (printer: Omit<Printer, "id">) => string;
  updatePrinter: (id: string, data: Partial<Printer>) => void;
  deletePrinter: (id: string) => void;
  setActivePrinter: (id: string) => void;
}

const PrinterContext = createContext<PrinterContextType | undefined>(undefined);

const LOCAL_PRINTERS_KEY = "printers";
const LOCAL_ACTIVE_KEY = "activePrinterId";

export const usePrinter = (): PrinterContextType => {
  const ctx = useContext(PrinterContext);
  if (!ctx) throw new Error("usePrinter must be used inside PrinterProvider");
  return ctx;
};

export const PrinterProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [printers, setPrinters] = useState<Printer[]>(() => {
    try {
      if (typeof window === "undefined") return [];
      const raw = localStorage.getItem(LOCAL_PRINTERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [activePrinterId, setActivePrinterId] = useState<string | null>(() => {
    try {
      if (typeof window === "undefined") return null;
      return localStorage.getItem(LOCAL_ACTIVE_KEY);
    } catch {
      return null;
    }
  });

  // persist printers
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_PRINTERS_KEY, JSON.stringify(printers));
    } catch (err) {
      console.warn("Unable to save printers to localStorage", err);
    }
  }, [printers]);

  // persist active id
  useEffect(() => {
    try {
      if (activePrinterId) localStorage.setItem(LOCAL_ACTIVE_KEY, activePrinterId);
      else localStorage.removeItem(LOCAL_ACTIVE_KEY);
    } catch (err) {
      console.warn("Unable to save activePrinterId", err);
    }
  }, [activePrinterId]);

  // If printers exist but no active selected, pick first
  useEffect(() => {
    if (printers.length > 0 && !activePrinterId) {
      setActivePrinterId((prev) => prev ?? printers[0].id);
    }
  }, [printers, activePrinterId]);

  const getActivePrinter = useCallback(() => {
    return printers.find((p) => p.id === activePrinterId) ?? null;
  }, [printers, activePrinterId]);

  const addPrinter = useCallback((data: Omit<Printer, "id">) => {
    const id =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `p_${Date.now()}`;
    const newPrinter = { id, ...data };
    setPrinters((prev) => [...prev, newPrinter]);
    setActivePrinterId(id); // auto-select new
    return id;
  }, []);

  const updatePrinter = useCallback((id: string, update: Partial<Printer>) => {
    setPrinters((prev) => prev.map((p) => (p.id === id ? { ...p, ...update } : p)));
  }, []);

  const deletePrinter = useCallback((id: string) => {
    setPrinters((prev) => {
      const next = prev.filter((p) => p.id !== id);
      // if active removed, pick first or null
      setActivePrinterId((current) => {
        if (current !== id) return current;
        return next.length > 0 ? next[0].id : null;
      });
      return next;
    });
  }, []);

  const setActivePrinter = useCallback((id: string) => {
    const exists = printers.some((p) => p.id === id);
    if (!exists) {
      console.warn("Trying to set active printer to unknown id:", id);
      return;
    }
    setActivePrinterId(id);
  }, [printers]);

  const value = useMemo(
    () => ({
      printers,
      activePrinterId,
      getActivePrinter,
      addPrinter,
      updatePrinter,
      deletePrinter,
      setActivePrinter,
    }),
    [printers, activePrinterId, getActivePrinter, addPrinter, updatePrinter, deletePrinter, setActivePrinter]
  );

  return <PrinterContext.Provider value={value}>{children}</PrinterContext.Provider>;
};
