import { useState } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const Control = () => {
  const [distance, setDistance] = useState(10);
  const [extrudeAmount, setExtrudeAmount] = useState(10);

  const moveAxis = async (axis: string, direction: number) => {
    const dist = direction * distance;
    await api.sendCommand([`G91`, `G1 ${axis}${dist} F3000`, `G90`]);
    toast.success(`Moved ${axis} ${dist}mm`);
  };

  const homeAxis = async (axes = 'XYZ') => {
    await api.sendCommand([`G28 ${axes}`]);
    toast.success(`Homed ${axes}`);
  };

  const extrude = async (amount: number) => {
    await api.sendCommand([`G91`, `G1 E${amount} F300`, `G90`]);
    toast.success(`Extruded ${amount}mm`);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Manual Control</h1>
          <p className="text-sm text-muted-foreground mt-1">Control your printer manually</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* XY Movement */}
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle>XY Axis Control</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <div className="grid grid-cols-3 gap-2 w-fit">
                  <div />
                  <Button
                    size="lg"
                    onClick={() => moveAxis('Y', 1)}
                    className="w-16 h-16"
                  >
                    <ArrowUp className="w-6 h-6" />
                  </Button>
                  <div />
                  <Button
                    size="lg"
                    onClick={() => moveAxis('X', -1)}
                    className="w-16 h-16"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => homeAxis('XY')}
                    variant="outline"
                    className="w-16 h-16"
                  >
                    <Home className="w-6 h-6" />
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => moveAxis('X', 1)}
                    className="w-16 h-16"
                  >
                    <ArrowRight className="w-6 h-6" />
                  </Button>
                  <div />
                  <Button
                    size="lg"
                    onClick={() => moveAxis('Y', -1)}
                    className="w-16 h-16"
                  >
                    <ArrowDown className="w-6 h-6" />
                  </Button>
                  <div />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Distance</span>
                  <span className="font-medium">{distance}mm</span>
                </div>
                <Slider
                  value={[distance]}
                  onValueChange={(v) => setDistance(v[0])}
                  min={0.1}
                  max={50}
                  step={0.1}
                />
                <div className="flex gap-2">
                  {[0.1, 1, 10, 50].map((d) => (
                    <Button
                      key={d}
                      size="sm"
                      variant="outline"
                      onClick={() => setDistance(d)}
                      className="flex-1"
                    >
                      {d}mm
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Z Movement */}
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle>Z Axis Control</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center gap-2">
                <Button
                  size="lg"
                  onClick={() => moveAxis('Z', 1)}
                  className="w-full"
                >
                  <ArrowUp className="w-6 h-6 mr-2" />
                  Z Up
                </Button>
                <Button
                  size="lg"
                  onClick={() => homeAxis('Z')}
                  variant="outline"
                  className="w-full"
                >
                  <Home className="w-6 h-6 mr-2" />
                  Home Z
                </Button>
                <Button
                  size="lg"
                  onClick={() => moveAxis('Z', -1)}
                  className="w-full"
                >
                  <ArrowDown className="w-6 h-6 mr-2" />
                  Z Down
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Extruder */}
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle>Extruder Control</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Amount</span>
                  <span className="font-medium">{extrudeAmount}mm</span>
                </div>
                <Slider
                  value={[extrudeAmount]}
                  onValueChange={(v) => setExtrudeAmount(v[0])}
                  min={1}
                  max={100}
                  step={1}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => extrude(extrudeAmount)} className="w-full">
                  Extrude
                </Button>
                <Button
                  onClick={() => extrude(-extrudeAmount)}
                  variant="outline"
                  className="w-full"
                >
                  Retract
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Home All */}
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle>Home All Axes</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                size="lg"
                onClick={() => homeAxis('XYZ')}
                className="w-full"
              >
                <Home className="w-6 h-6 mr-2" />
                Home All
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Control;
