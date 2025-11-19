import { useState, useEffect } from 'react';
import { Printer, Check, Settings, Plus } from 'lucide-react';
import { usePrinter } from '@/contexts/PrinterContext';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const PrinterSelector = () => {
  const { printers, activePrinterId, setActivePrinter, getActivePrinter } = usePrinter();
  const navigate = useNavigate();
  const activePrinter = getActivePrinter();

  if (printers.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start gap-2"
        onClick={() => navigate('/settings')}
      >
        <Plus className="w-4 h-4" />
        Add Printer
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-start gap-2">
          <Printer className="w-4 h-4" />
          <span className="truncate flex-1 text-left">
            {activePrinter?.name || 'Select Printer'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Switch Printer</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {printers.map((printer) => (
          <DropdownMenuItem
            key={printer.id}
            onClick={() => setActivePrinter(printer.id)}
            className="gap-2"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: printer.color }}
            />
            <span className="flex-1">{printer.name}</span>
            {printer.id === activePrinterId && <Check className="w-4 h-4" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/settings')} className="gap-2">
          <Settings className="w-4 h-4" />
          Manage Printers
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PrinterSelector;
