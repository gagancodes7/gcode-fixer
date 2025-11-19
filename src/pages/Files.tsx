import { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, Play, File, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface FileData {
  name: string;
  size?: number;
  date?: number;
}

const Files = () => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      // Simulated fetch - replace with actual API call
      const savedFiles = localStorage.getItem('gcodeFiles');
      if (savedFiles) {
        setFiles(JSON.parse(savedFiles));
      }
    } catch (error) {
      console.error('Failed to fetch files:', error);
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.gcode') && !file.name.endsWith('.gco')) {
      toast.error('Please upload a G-code file (.gcode or .gco)');
      return;
    }

    try {
      const newFile: FileData = {
        name: file.name,
        size: file.size,
        date: Date.now()
      };
      
      const updatedFiles = [...files, newFile];
      setFiles(updatedFiles);
      localStorage.setItem('gcodeFiles', JSON.stringify(updatedFiles));
      toast.success(`${file.name} uploaded successfully`);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Upload failed');
    }
  };

  const handleDelete = (filename: string) => {
    if (!confirm(`Delete ${filename}?`)) return;

    try {
      const updatedFiles = files.filter(f => f.name !== filename);
      setFiles(updatedFiles);
      localStorage.setItem('gcodeFiles', JSON.stringify(updatedFiles));
      toast.success('File deleted');
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete file');
    }
  };

  const handlePrint = (filename: string) => {
    toast.success(`Starting print: ${filename}`);
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return mb > 1 ? `${mb.toFixed(2)} MB` : `${(bytes / 1024).toFixed(2)} KB`;
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Files</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your G-code files</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={fetchFiles} 
              variant="outline" 
              size="sm" 
              className="gap-2"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button 
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".gcode,.gco"
              onChange={handleUpload}
              className="hidden"
            />
          </div>
        </div>

        {files.length === 0 ? (
          <Card className="bg-card border-border/50">
            <CardContent className="py-12 sm:py-16">
              <div className="text-center text-muted-foreground">
                <File className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 opacity-50" />
                <p className="text-base sm:text-lg font-medium">No files uploaded yet</p>
                <p className="text-xs sm:text-sm mt-1">Upload a G-code file to get started</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {files.map((file) => (
              <Card key={file.name} className="bg-card border-border/50 hover:shadow-lg transition-all">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <File className="w-5 h-5 text-primary flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base sm:text-lg truncate">{file.name}</CardTitle>
                        <div className="flex flex-wrap gap-2 sm:gap-4 mt-1 text-xs sm:text-sm text-muted-foreground">
                          <span>{formatSize(file.size)}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{formatDate(file.date)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handlePrint(file.name)}
                        className="gap-2"
                      >
                        <Play className="w-4 h-4" />
                        <span className="hidden sm:inline">Print</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(file.name)}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Files;
