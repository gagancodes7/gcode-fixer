import { useState } from 'react';
import { Save, Server, Key, Plus, Trash2, Check, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { usePrinter } from '@/contexts/PrinterContext';
import { api } from '@/lib/api';

const Settings = () => {
  const { printers, addPrinter, updatePrinter, deletePrinter, setActivePrinter, activePrinterId } = usePrinter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    serverUrl: '',
    apiKey: '',
    color: '#3b82f6',
  });
  const [testing, setTesting] = useState<Record<string, boolean>>({});

  const resetForm = () => {
    setFormData({
      name: '',
      serverUrl: '',
      apiKey: '',
      color: '#3b82f6',
    });
    setEditingPrinter(null);
  };

  const handleOpenDialog = (printer: any = null) => {
    if (printer) {
      setEditingPrinter(printer);
      setFormData({
        name: printer.name,
        serverUrl: printer.serverUrl,
        apiKey: printer.apiKey,
        color: printer.color || '#3b82f6',
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.serverUrl || !formData.apiKey) {
      toast.error('Please fill in all fields');
      return;
    }

    if (editingPrinter) {
      updatePrinter(editingPrinter.id, formData);
    } else {
      addPrinter(formData);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleTest = async (printer: any) => {
    setTesting({ ...testing, [printer.id]: true });
    try {
      await api.testConnection(printer.serverUrl, printer.apiKey);
      toast.success('Connection successful!');
    } catch (error) {
      toast.error('Connection failed');
    } finally {
      setTesting({ ...testing, [printer.id]: false });
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your printer connections</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="gap-2 w-fit">
                <Plus className="w-4 h-4" />
                Add Printer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingPrinter ? 'Edit Printer' : 'Add Printer'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Printer Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="My 3D Printer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serverUrl">Server URL</Label>
                  <Input
                    id="serverUrl"
                    value={formData.serverUrl}
                    onChange={(e) => setFormData({ ...formData, serverUrl: e.target.value })}
                    placeholder="http://192.168.1.100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    placeholder="Your OctoPrint API key"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input value={formData.color} readOnly />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {printers.length === 0 ? (
            <Card className="bg-card border-border/50">
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Server className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-base sm:text-lg font-medium">No printers configured</p>
                  <p className="text-xs sm:text-sm mt-1">Add a printer to get started</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            printers.map((printer) => (
              <Card key={printer.id} className="bg-card border-border/50">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: printer.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base sm:text-lg truncate">{printer.name}</CardTitle>
                        <CardDescription className="text-xs sm:text-sm truncate">{printer.serverUrl}</CardDescription>
                      </div>
                    </div>
                    {printer.id === activePrinterId && (
                      <div className="flex items-center gap-1 text-xs text-primary font-medium">
                        <Check className="w-4 h-4" />
                        Active
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {printer.id !== activePrinterId && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActivePrinter(printer.id)}
                        className="gap-2"
                      >
                        <Check className="w-4 h-4" />
                        <span className="hidden sm:inline">Set Active</span>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTest(printer)}
                      disabled={testing[printer.id]}
                      className="gap-2"
                    >
                      <Server className="w-4 h-4" />
                      <span className="hidden sm:inline">Test</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenDialog(printer)}
                      className="gap-2"
                    >
                      <Pencil className="w-4 h-4" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm(`Delete printer "${printer.name}"?`)) {
                          deletePrinter(printer.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Delete</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
