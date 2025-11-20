import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { usePrinter } from "@/contexts/PrinterContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Dashboard.tsx
 * - Option A layout: two large cards side-by-side (responsive)
 * - Left: Print Status + job controls
 * - Right: Temperature Control (manual set for nozzle and bed)
 *
 * NOTE: Local uploaded asset path included for developer transformation:
 * This path is the uploaded file in the environment and will be transformed to a URL by dev infra.
 */
const LOCAL_ASSET_URL = "/mnt/data/0367c708-d6a3-4de4-9f98-45d0637d8948.png";

const Dashboard = () => {
  const { getActivePrinter } = usePrinter();
  const printer = getActivePrinter();

  const [job, setJob] = useState<any | null>(null);
  const [printerInfo, setPrinterInfo] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const [nozzleTarget, setNozzleTarget] = useState<number | "">("");
  const [bedTarget, setBedTarget] = useState<number | "">("");

  // helper: percent clamp
  const percent = (v?: number) =>
    typeof v === "number" ? Math.min(Math.max(v, 0), 100) : 0;

  // fetch both job and printer info
  const fetchJobAndPrinter = async () => {
    if (!printer) return;
    try {
      const [jobRes, printerRes] = await Promise.all([
        fetch(`${printer.serverUrl.replace(/\/$/, "")}/api/job`, {
          headers: { "X-Api-Key": printer.apiKey || "" },
        }),
        fetch(`${printer.serverUrl.replace(/\/$/, "")}/api/printer`, {
          headers: { "X-Api-Key": printer.apiKey || "" },
        }),
      ]);

      if (jobRes.ok) {
        const j = await jobRes.json();
        setJob(j);
      } else {
        console.debug("job fetch status", jobRes.status);
      }

      if (printerRes.ok) {
        const p = await printerRes.json();
        setPrinterInfo(p);
      } else {
        console.debug("printer fetch status", printerRes.status);
      }
    } catch (err) {
      console.error("fetchJobAndPrinter error:", err);
    }
  };

  useEffect(() => {
    if (!printer) {
      setJob(null);
      setPrinterInfo(null);
      return;
    }

    setLoading(true);
    fetchJobAndPrinter().finally(() => setLoading(false));

    const interval = setInterval(() => {
      fetchJobAndPrinter();
    }, 1500);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [printer?.id]);

  // Generic job POST helper
  const postJobCommand = async (body: any, successMsg = "Command sent") => {
    if (!printer) {
      toast.error("No active printer");
      return;
    }
    try {
      const res = await fetch(`${printer.serverUrl.replace(/\/$/, "")}/api/job`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": printer.apiKey || "",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `status ${res.status}`);
      }
      toast.success(successMsg);
      // refresh quickly
      fetchJobAndPrinter();
    } catch (err) {
      console.error("postJobCommand error:", err);
      toast.error("Command failed");
    }
  };

  const handlePause = () => postJobCommand({ command: "pause", action: "pause" }, "Paused");
  const handleResume = () => postJobCommand({ command: "pause", action: "resume" }, "Resumed");
  const handleCancel = () => {
    if (!confirm("Cancel current print?")) return;
    postJobCommand({ command: "cancel" }, "Print cancelled");
  };

  // Temperature set helper
  const setTemperature = async (tool: "tool0" | "bed", temp: number) => {
    if (!printer) {
      toast.error("No active printer");
      return;
    }
    try {
      const res = await fetch(`${printer.serverUrl.replace(/\/$/, "")}/api/printer/temperature`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": printer.apiKey || "",
        },
        body: JSON.stringify({
          command: "target",
          targets: {
            [tool]: temp,
          },
        }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `status ${res.status}`);
      }
      toast.success(`${tool === "tool0" ? "Nozzle" : "Bed"} target set to ${temp}°C`);
      fetchJobAndPrinter();
    } catch (err) {
      console.error("setTemperature error:", err);
      toast.error("Failed to set temperature");
    }
  };

  const tempStr = (t?: any) =>
    t ? `${t.actual ?? "—"}°C / ${t.target ?? "—"}°C` : "—";

  // simple header area image url from uploaded file (developer will transform path -> url)
  const headerImageUrl = useMemo(() => LOCAL_ASSET_URL, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top header with small image (uses default Card styling) */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Live printer status and manual controls</p>
          </div>
        </div>

        <div>
          <div className="text-sm text-muted-foreground">Active printer</div>
          <div className="mt-1 font-medium">{printer?.name ?? "None"}</div>
        </div>
      </div>

      {/* Two column layout (left: status, right: temps) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left column: Print Status + Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Print Status</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">State</div>
                <div className="text-xl font-semibold">{job?.state ?? "Idle"}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">File</div>
                <div className="font-medium">{job?.job?.file?.name ?? "—"}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Progress</div>
                <div className="mt-2">
                  <Progress value={percent(job?.progress?.completion ?? 0)} />
                  <div className="text-xs mt-1">
                    {(job?.progress?.completion ?? 0).toFixed(1)}% •{" "}
                    {job?.progress?.printTimeLeft
                      ? `${Math.round(job.progress.printTimeLeft / 60)} min left`
                      : job?.progress?.printTime
                      ? `${Math.round(job.progress.printTime / 60)} min elapsed`
                      : "—"}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 flex-wrap mt-3">
                <Button onClick={handlePause} size="sm">⏸ Pause</Button>
                <Button onClick={handleResume} size="sm">▶ Resume</Button>
                <Button onClick={handleCancel} size="sm" variant="destructive">⛔ Cancel</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right column: Temperature Control */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Temperature Control</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-6">
              {/* Nozzle */}
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Nozzle (tool0)</div>
                    <div className="font-medium">{tempStr(printerInfo?.temperature?.tool0)}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">Target / Actual</div>
                </div>

                <div className="mt-3 flex gap-2">
                  <Input
                    type="number"
                    placeholder="°C"
                    value={nozzleTarget}
                    onChange={(e) => setNozzleTarget(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-28"
                  />
                  <Button
                    onClick={() => {
                      if (nozzleTarget !== "") setTemperature("tool0", Number(nozzleTarget));
                    }}
                    size="sm"
                  >
                    Set Nozzle
                  </Button>

                  {/* quick presets */}
                  <div className="flex gap-2 ml-auto">
                    <Button size="sm" onClick={() => setTemperature("tool0", 200)}>200°C</Button>
                    <Button size="sm" onClick={() => setTemperature("tool0", 230)}>230°C</Button>
                  </div>
                </div>
              </div>

              {/* Bed */}
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Bed</div>
                    <div className="font-medium">{tempStr(printerInfo?.temperature?.bed)}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">Target / Actual</div>
                </div>

                <div className="mt-3 flex gap-2">
                  <Input
                    type="number"
                    placeholder="°C"
                    value={bedTarget}
                    onChange={(e) => setBedTarget(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-28"
                  />
                  <Button
                    onClick={() => {
                      if (bedTarget !== "") setTemperature("bed", Number(bedTarget));
                    }}
                    size="sm"
                  >
                    Set Bed
                  </Button>

                  {/* quick presets */}
                  <div className="flex gap-2 ml-auto">
                    <Button size="sm" onClick={() => setTemperature("bed", 60)}>60°C</Button>
                    <Button size="sm" onClick={() => setTemperature("bed", 70)}>70°C</Button>
                  </div>
                </div>
              </div>

              {/* Extra info */}
              {/* Live Temperature Status */}
<Card className="mt-6">
  <CardHeader>
    <CardTitle className="text-md">Live Temperature Status</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">

      {/* Nozzle */}
      <div>
        <div className="text-sm text-muted-foreground">Nozzle (tool0)</div>
        <div className="text-lg font-semibold">
          {printerInfo?.temperature?.tool0
            ? `${printerInfo.temperature.tool0.actual}°C / ${printerInfo.temperature.tool0.target}°C`
            : "—"}
        </div>
      </div>

      {/* Bed */}
      <div>
        <div className="text-sm text-muted-foreground">Bed</div>
        <div className="text-lg font-semibold">
          {printerInfo?.temperature?.bed
            ? `${printerInfo.temperature.bed.actual}°C / ${printerInfo.temperature.bed.target}°C`
            : "—"}
        </div>
      </div>

    </div>
  </CardContent>
</Card>

            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
