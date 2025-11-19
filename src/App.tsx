import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PrinterProvider } from "./contexts/PrinterContext";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Control from "./pages/Control";
import Files from "./pages/Files";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <PrinterProvider>
        <Toaster />
        <Sonner position="top-right" />
        <BrowserRouter>
          <div className="flex min-h-screen w-full bg-background">
            <Sidebar />
            <main className="flex-1 overflow-auto">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/control" element={<Control />} />
                <Route path="/files" element={<Files />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </PrinterProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
