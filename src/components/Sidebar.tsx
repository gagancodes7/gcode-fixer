import { Home, Settings, Folder, Gamepad2, Moon, Sun } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import PrinterSelector from './PrinterSelector';
import { usePrinter } from '@/contexts/PrinterContext';

const Sidebar = () => {
  const [isDark, setIsDark] = useState(true);
  const { getActivePrinter } = usePrinter();
  const activePrinter = getActivePrinter();

  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'dark';
    setIsDark(theme === 'dark');
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const navItems = [
    { to: '/', icon: Home, label: 'Dashboard' },
    { to: '/control', icon: Gamepad2, label: 'Control' },
    { to: '/files', icon: Folder, label: 'Files' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">
          K3G Print
        </h1>
        <p className="text-xs text-muted-foreground mt-1">3D Printer Control</p>
        {activePrinter && (
          <p className="text-xs text-muted-foreground mt-2 font-medium">
            {activePrinter.name}
          </p>
        )}
      </div>

      <div className="p-4 border-b border-sidebar-border">
        <PrinterSelector />
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            activeClassName="bg-sidebar-accent text-primary font-medium"
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleTheme}
          className="w-full justify-start gap-3"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
