import { useEffect, useRef, useState } from "react";
import { Upload, Trash2, Play, File, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { usePrinter } from "@/contexts/PrinterContext";

// File shape
interface FileData {
  name: string;
  size?: number;
  date?: number;
  refs?: any;
  path?: string;
}

const Files = () => {
  const { getActivePrinter } = usePrinter();
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const getPrinterOrNotify = () => {
    const p = getActivePrinter();
    if (!p) {
      toast.error("No active printer. Set one in Settings.");
      return null;
    }
    return p;
  };

  // ============================================================
  // FETCH FILES (working with your OctoPrint response)
  // ============================================================
  const fetchFiles = async () => {
    const printer = getPrinterOrNotify();
    if (!printer) return;

    try {
      setLoading(true);

      const res = await fetch(
        `${printer.serverUrl.replace(/\/$/, "")}/api/files?recursive=true`,
        {
          headers: { "X-Api-Key": printer.apiKey },
        }
      );

      if (!res.ok) {
        toast.error("Failed to fetch file list");
        console.error(await res.text());
        return;
      }

      const data = await res.json();

      // OctoPrint returns: { files: [] }
      const fileList = Array.isArray(data.files)
        ? data.files
        : data.files?.local || [];

      const mapped = fileList.map((f: any) => ({
        name: f.name,
        size: f.size,
        date: f.date,
        refs: f.refs,
        path: f.path,
      }));

      setFiles(mapped);
    } catch (err) {
      console.error(err);
      toast.error("Cannot load files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getActivePrinter()]);

  // ============================================================
  // UPLOAD FILE
  // ============================================================
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".gcode") && !file.name.endsWith(".gco")) {
      toast.error("Upload .gcode or .gco files only");
      return;
    }

    const printer = getPrinterOrNotify();
    if (!printer) return;

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("filename", file.name); // CRITICAL
      fd.append("select", "false");
      fd.append("print", "false");

      const res = await fetch(
        `${printer.serverUrl.replace(/\/$/, "")}/api/files/local`,
        {
          method: "POST",
          headers: {
            "X-Api-Key": printer.apiKey,
          },
          body: fd,
        }
      );

      if (!res.ok) {
        console.error(await res.text());
        toast.error("Upload failed");
        return;
      }

      toast.success(`${file.name} uploaded successfully`);
      setTimeout(fetchFiles, 700);
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ============================================================
  // PRINT FILE
  // ============================================================
  const handlePrint = async (file: FileData) => {
    const printer = getPrinterOrNotify();
    if (!printer) return;

    try {
      const res = await fetch(
        `${printer.serverUrl.replace(/\/$/, "")}/api/files/local/${encodeURIComponent(file.name)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": printer.apiKey,
          },
          body: JSON.stringify({ command: "select", print: true }),
        }
      );

      if (!res.ok) throw new Error(await res.text());

      toast.success("Print started");
    } catch (err) {
      console.error(err);
      toast.error("Failed to start print");
    }
  };

  // ============================================================
  // PAUSE PRINT
  // ============================================================
  const handlePause = async () => {
    const printer = getPrinterOrNotify();
    if (!printer) return;

    try {
      const res = await fetch(
        `${printer.serverUrl.replace(/\/$/, "")}/api/job`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": printer.apiKey,
          },
          body: JSON.stringify({
            command: "pause",
            action: "pause",
          }),
        }
      );

      if (!res.ok) throw new Error(await res.text());
      toast.success("Print paused");
    } catch (err) {
      console.error(err);
      toast.error("Failed to pause");
    }
  };

  // ============================================================
  // RESUME PRINT
  // ============================================================
  const handleResume = async () => {
    const printer = getPrinterOrNotify();
    if (!printer) return;

    try {
      const res = await fetch(
        `${printer.serverUrl.replace(/\/$/, "")}/api/job`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": printer.apiKey,
          },
          body: JSON.stringify({
            command: "pause",
            action: "resume",
          }),
        }
      );

      if (!res.ok) throw new Error(await res.text());
      toast.success("Print resumed");
    } catch (err) {
      console.error(err);
      toast.error("Failed to resume");
    }
  };

  // ============================================================
  // STOP PRINT
  // ============================================================
  const handleStop = async () => {
    const printer = getPrinterOrNotify();
    if (!printer) return;

    if (!confirm("Stop this print?")) return;

    try {
      const res = await fetch(
        `${printer.serverUrl.replace(/\/$/, "")}/api/job`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": printer.apiKey,
          },
          body: JSON.stringify({
            command: "cancel",
          }),
        }
      );

      if (!res.ok) throw new Error(await res.text());
      toast.success("Print stopped");
    } catch (err) {
      console.error(err);
      toast.error("Failed to stop");
    }
  };

  // ============================================================
  // DELETE FILE
  // ============================================================
  const handleDelete = async (name: string) => {
    if (!confirm(`Delete ${name}?`)) return;

    const printer = getPrinterOrNotify();
    if (!printer) return;

    try {
      const res = await fetch(
        `${printer.serverUrl.replace(/\/$/, "")}/api/files/local/${encodeURIComponent(name)}`,
        {
          method: "DELETE",
          headers: {
            "X-Api-Key": printer.apiKey,
          },
        }
      );

      if (!res.ok) throw new Error(await res.text());

      toast.success("File deleted");
      fetchFiles();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete");
    }
  };

  // Utilities
  const formatSize = (bytes?: number) =>
    !bytes
      ? "N/A"
      : bytes > 1024 * 1024
      ? `${(bytes / 1024 / 1024).toFixed(2)} MB`
      : `${(bytes / 1024).toFixed(2)} KB`;

  const formatDate = (t?: number) =>
    t ? new Date(t).toLocaleString() : "N/A";

  // ============================================================
  // UI
  // ============================================================
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Files</h1>
          <p className="text-muted-foreground">
            Upload, list and print your G-code files.
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={fetchFiles} variant="outline" className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".gcode,.gco"
            className="hidden"
            onChange={handleUpload}
          />
        </div>
      </div>

      {/* File List */}
      <div ref={listRef} className="space-y-3">
        {files.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <File className="w-14 h-14 mx-auto mb-2 opacity-40" />
              No files found on printer.
            </CardContent>
          </Card>
        ) : (
          files.map((file) => (
            <Card key={file.name} className="hover:shadow-md transition">
              <CardHeader className="flex justify-between items-center">
                <div>
                  <CardTitle>{file.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {formatSize(file.size)} • {formatDate(file.date)}
                  </p>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" className="gap-2" onClick={() => handlePrint(file)}>
                    <Play className="w-4 h-4" />
                    Print
                  </Button>

                  <Button
                    size="sm"
                    className="gap-2 bg-yellow-500 hover:bg-yellow-600 text-black"
                    onClick={handlePause}
                  >
                    ⏸ Pause
                  </Button>

                  <Button
                    size="sm"
                    className="gap-2 bg-green-600 hover:bg-green-700"
                    onClick={handleResume}
                  >
                    ▶ Resume
                  </Button>

                  <Button
                    size="sm"
                    className="gap-2 bg-red-600 hover:bg-red-700"
                    onClick={handleStop}
                  >
                    ⛔ Stop
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(file.name)}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Files;
