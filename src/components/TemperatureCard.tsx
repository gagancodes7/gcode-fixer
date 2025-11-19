import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Flame } from 'lucide-react';

interface TemperatureCardProps {
  title: string;
  icon: React.ReactNode;
  actual: number;
  target: number;
  onSetTemp: (temp: number) => void;
  presets: number[];
}

const TemperatureCard = ({ title, icon, actual, target, onSetTemp, presets }: TemperatureCardProps) => {
  const [customTemp, setCustomTemp] = useState('');

  const handleSetCustom = () => {
    const temp = parseInt(customTemp);
    if (!isNaN(temp) && temp >= 0 && temp <= 300) {
      onSetTemp(temp);
      setCustomTemp('');
    }
  };

  return (
    <Card className="bg-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-primary">{actual.toFixed(1)}°C</div>
          <div className="text-sm text-muted-foreground">Target: {target.toFixed(1)}°C</div>
        </div>

        <div className="flex flex-wrap gap-2">
          {presets.map((temp) => (
            <Button
              key={temp}
              variant="outline"
              size="sm"
              onClick={() => onSetTemp(temp)}
              className="flex-1"
            >
              {temp}°
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Custom"
            value={customTemp}
            onChange={(e) => setCustomTemp(e.target.value)}
            min="0"
            max="300"
          />
          <Button onClick={handleSetCustom} size="icon">
            <Flame className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TemperatureCard;
