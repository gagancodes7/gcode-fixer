import { toast } from 'sonner';

class OctoPrintAPI {
  private getConfig() {
    const printers = localStorage.getItem('printers');
    const activePrinterId = localStorage.getItem('activePrinterId');
    
    if (!printers || !activePrinterId) {
      throw new Error('No printer configured');
    }
    
    const parsedPrinters = JSON.parse(printers);
    const activePrinter = parsedPrinters.find((p: any) => p.id === activePrinterId);
    
    if (!activePrinter) {
      throw new Error('Active printer not found');
    }
    
    return {
      baseUrl: activePrinter.serverUrl.replace(/\/$/, ''),
      apiKey: activePrinter.apiKey,
    };
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    try {
      const config = this.getConfig();
      const url = `${config.baseUrl}${endpoint}`;
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'X-Api-Key': config.apiKey,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('API request failed:', error);
      toast.error(error.message || 'API request failed');
      throw error;
    }
  }

  async testConnection(serverUrl: string, apiKey: string) {
    const url = `${serverUrl.replace(/\/$/, '')}/api/version`;
    const response = await fetch(url, {
      headers: { 'X-Api-Key': apiKey },
    });
    
    if (!response.ok) {
      throw new Error('Connection failed');
    }
    
    return await response.json();
  }

  async getPrinterStatus() {
    return await this.request('/api/printer');
  }

  async getJobStatus() {
    return await this.request('/api/job');
  }

  async getFiles() {
    return await this.request('/api/files');
  }

  async uploadFile(file: File) {
    const config = this.getConfig();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${config.baseUrl}/api/files/local`, {
      method: 'POST',
      headers: { 'X-Api-Key': config.apiKey },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    toast.success(`${file.name} uploaded successfully`);
    return await response.json();
  }

  async deleteFile(filename: string) {
    return await this.request(`/api/files/local/${filename}`, {
      method: 'DELETE',
    });
  }

  async startPrint(filename: string) {
    toast.success(`Starting print: ${filename}`);
    return await this.request(`/api/files/local/${filename}`, {
      method: 'POST',
      body: JSON.stringify({ command: 'select', print: true }),
    });
  }

  async pauseJob() {
    return await this.request('/api/job', {
      method: 'POST',
      body: JSON.stringify({ command: 'pause', action: 'pause' }),
    });
  }

  async resumeJob() {
    return await this.request('/api/job', {
      method: 'POST',
      body: JSON.stringify({ command: 'pause', action: 'resume' }),
    });
  }

  async cancelJob() {
    return await this.request('/api/job', {
      method: 'POST',
      body: JSON.stringify({ command: 'cancel' }),
    });
  }

  async sendCommand(commands: string[]) {
    return await this.request('/api/printer/command', {
      method: 'POST',
      body: JSON.stringify({ commands }),
    });
  }

  async setTemperature(tool: string, target: number) {
    const command = tool === 'bed' ? `M140 S${target}` : `M104 S${target}`;
    return await this.sendCommand([command]);
  }
}

export const api = new OctoPrintAPI();
