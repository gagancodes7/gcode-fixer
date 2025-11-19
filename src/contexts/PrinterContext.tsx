import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

interface Printer {
  id: string;
  name: string;
  serverUrl: string;
  apiKey: string;
  color: string;
}

interface PrinterContextType {
  printers: Printer[];
  activePrinterId: string | null;
  addPrinter: (printer: Omit<Printer, 'id'>) => Printer;
  updatePrinter: (id: string, updates: Partial<Printer>) => void;
  deletePrinter: (id: string) => void;
  setActivePrinter: (id: string) => void;
  getActivePrinter: () => Printer | undefined;
  getPrinterById: (id: string) => Printer | undefined;
}

const PrinterContext = createContext<PrinterContextType | undefined>(undefined);

export const usePrinter = () => {
  const context = useContext(PrinterContext);
  if (!context) {
    throw new Error('usePrinter must be used within PrinterProvider');
  }
  return context;
};

export const PrinterProvider = ({ children }: { children: ReactNode }) => {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [activePrinterId, setActivePrinterId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('printers');
    const savedActiveId = localStorage.getItem('activePrinterId');

    if (saved) {
      const parsed = JSON.parse(saved);
      setPrinters(parsed);
      setActivePrinterId(savedActiveId || (parsed[0]?.id || null));
    }
  }, []);

  useEffect(() => {
    if (printers.length > 0) {
      localStorage.setItem('printers', JSON.stringify(printers));
    }
  }, [printers]);

  useEffect(() => {
    if (activePrinterId) {
      localStorage.setItem('activePrinterId', activePrinterId);
    }
  }, [activePrinterId]);

  const addPrinter = (printer: Omit<Printer, 'id'>) => {
    const newPrinter = {
      ...printer,
      id: Date.now().toString(),
    };
    setPrinters([...printers, newPrinter]);
    if (!activePrinterId) {
      setActivePrinterId(newPrinter.id);
    }
    toast.success(`Printer "${newPrinter.name}" added`);
    return newPrinter;
  };

  const updatePrinter = (id: string, updates: Partial<Printer>) => {
    setPrinters(printers.map(p => p.id === id ? { ...p, ...updates } : p));
    toast.success('Printer updated');
  };

  const deletePrinter = (id: string) => {
    setPrinters(printers.filter(p => p.id !== id));
    if (activePrinterId === id) {
      const remaining = printers.filter(p => p.id !== id);
      setActivePrinterId(remaining[0]?.id || null);
    }
    toast.success('Printer deleted');
  };

  const setActivePrinter = (id: string) => {
    const printer = printers.find(p => p.id === id);
    if (printer) {
      setActivePrinterId(id);
      toast.success(`Switched to ${printer.name}`);
    }
  };

  const getActivePrinter = () => {
    return printers.find(p => p.id === activePrinterId);
  };

  const getPrinterById = (id: string) => {
    return printers.find(p => p.id === id);
  };

  return (
    <PrinterContext.Provider
      value={{
        printers,
        activePrinterId,
        addPrinter,
        updatePrinter,
        deletePrinter,
        setActivePrinter,
        getActivePrinter,
        getPrinterById,
      }}
    >
      {children}
    </PrinterContext.Provider>
  );
};
