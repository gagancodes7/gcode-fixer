import { useState, useEffect } from 'react';
import { Play, Pause, Square, Activity, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import TemperatureCard from '@/components/TemperatureCard';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const Dashboard = () => {
  const [printerState, setPrinterState] = useState({
    status: 'Disconnected',
    bedTemp: { actual: 0, target: 0 },
    toolTemp: { actual: 0, target: 0 },
  });

  const [jobState, setJobState] = useState({
    file: null as string | null,
    progress: 0,
    printTime: 0,
    printTimeLeft: 0,
    state: 'Operational',
  });

  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = async () => {
    try {
      setRefreshing(true);
      const [printer, job] = await Promise.all([
        api.getPrinterStatus(),
        api.getJobStatus(),
      ]);

      setPrinterState({
        status: printer.state?.text || 'Unknown',
        bedTemp: printer.temperature?.bed || { actual: 0, target: 0 },
        toolTemp: printer.temperature?.tool0 || { actual: 0, target: 0 },
      });

      setJobState({
        file: job.job?.file?.name || null,
        progress: job.progress?.completion || 0,
        printTime: job.progress?.printTime || 0,
        printTimeLeft: job.progress?.printTimeLeft || 0,
        state: job.state || 'Operational',
      });
    } catch (error) {
      console.error('Failed to fetch status:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    if (!seconds) return '--:--:--';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handlePause = async () => {
    try {
      await api.pauseJob();
      await fetchStatus();
    } catch (error) {
      console.error('Pause failed:', error);
    }
  };

  const handleResume = async () => {
    try {
      await api.resumeJob();
      await fetchStatus();
    } catch (error) {
      console.error('Resume failed:', error);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel the current print job?')) return;
    try {
      await api.cancelJob();
      await fetchStatus();
    } catch (error) {
      console.error('Cancel failed:', error);
    }
  };

  const handleSetTemp = async (tool: string, temp: number) => {
    try {
      await api.setTemperature(tool, temp);
      toast.success(`${tool} temperature set to ${temp}°C`);
    } catch (error) {
      console.error('Set temperature failed:', error);
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Monitor your 3D printer</p>
          </div>
          <Button 
            onClick={fetchStatus} 
            variant="outline" 
            size="sm" 
            className="gap-2 w-fit"
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Printer Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{printerState.status}</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50 md:col-span-2 lg:col-span-2">
            <CardHeader>
              <CardTitle>Current Job</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {jobState.file ? (
                <>
                  <div>
                    <div className="text-lg font-medium truncate">{jobState.file}</div>
                    <div className="text-sm text-muted-foreground">{jobState.state}</div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-medium">{jobState.progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={jobState.progress} />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Print Time</div>
                      <div className="font-medium flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTime(jobState.printTime)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Time Left</div>
                      <div className="font-medium flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTime(jobState.printTimeLeft)}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {jobState.state === 'Printing' && (
                      <Button onClick={handlePause} variant="outline" size="sm" className="gap-2 flex-1">
                        <Pause className="w-4 h-4" />
                        Pause
                      </Button>
                    )}
                    {jobState.state === 'Paused' && (
                      <Button onClick={handleResume} size="sm" className="gap-2 flex-1">
                        <Play className="w-4 h-4" />
                        Resume
                      </Button>
                    )}
                    <Button onClick={handleCancel} variant="destructive" size="sm" className="gap-2 flex-1">
                      <Square className="w-4 h-4" />
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No active print job
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <TemperatureCard
            title="Hotend"
            icon={<Activity className="w-5 h-5 text-primary" />}
            actual={printerState.toolTemp.actual}
            target={printerState.toolTemp.target}
            onSetTemp={(temp) => handleSetTemp('tool0', temp)}
            presets={[0, 180, 200, 220, 240]}
          />

          <TemperatureCard
            title="Bed"
            icon={<Activity className="w-5 h-5 text-primary" />}
            actual={printerState.bedTemp.actual}
            target={printerState.bedTemp.target}
            onSetTemp={(temp) => handleSetTemp('bed', temp)}
            presets={[0, 50, 60, 70, 80]}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
