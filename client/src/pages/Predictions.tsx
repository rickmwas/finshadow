import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Sparkles, MapPin, AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import { usePredictions } from "@/hooks/useAPI";
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip
} from "recharts";

export default function Predictions() {
  const { data: predictions, isLoading, error } = usePredictions();
  const predictionsList = predictions || [];

  // Build radar data from predictions
  const radarData = predictionsList.map((pred: any) => ({
    subject: (pred.target || 'Unknown').substring(0, 15),
    A: pred.riskScore || 50,
    fullMark: 150
  })).slice(0, 6);

  // Fallback radar data
  const displayRadarData = radarData.length > 0 ? radarData : [
    { subject: 'DDoS', A: 120, fullMark: 150 },
    { subject: 'Phishing', A: 98, fullMark: 150 },
    { subject: 'Malware', A: 86, fullMark: 150 },
    { subject: 'Insider', A: 40, fullMark: 150 },
    { subject: 'API Abuse', A: 110, fullMark: 150 },
    { subject: 'Zero-day', A: 65, fullMark: 150 },
  ];

  return (
    <Layout>
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Predictions</h1>
            <p className="text-muted-foreground mt-1">Machine Learning models forecasting potential attack vectors.</p>
          </div>
          <div className="flex gap-2">
            <Button 
                variant="secondary" 
                size="sm" 
                disabled={isLoading}
                className="gap-2"
            >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Refresh Models
            </Button>
            <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/50 gap-2 px-3 py-1">
                <Sparkles className="h-3 w-3" /> Model v2.4 Active
            </Badge>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-card/50 backdrop-blur-sm border-border">
                <CardHeader>
                    <CardTitle>Threat Vector Radar</CardTitle>
                    <CardDescription>Predicted intensity of attack types for next 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={displayRadarData}>
                                <PolarGrid stroke="hsl(var(--border))" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                                <Radar
                                    name="Risk Intensity"
                                    dataKey="A"
                                    stroke="hsl(var(--primary))"
                                    fill="hsl(var(--primary))"
                                    fillOpacity={0.3}
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-6">
                {isLoading ? (
                  <Card className="bg-card/50 backdrop-blur-sm">
                    <CardContent className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </CardContent>
                  </Card>
                ) : error ? (
                  <Card className="bg-destructive/10 border border-destructive/20">
                    <CardContent className="pt-6">
                      <p className="text-destructive">Failed to load predictions</p>
                    </CardContent>
                  </Card>
                ) : predictionsList.length === 0 ? (
                  <Card className="bg-card/50 backdrop-blur-sm">
                    <CardContent className="pt-6">
                      <p className="text-muted-foreground text-center">No predictions available</p>
                    </CardContent>
                  </Card>
                ) : (
                  predictionsList.map((pred: any) => (
                    <Card key={pred.id} className="bg-card/50 backdrop-blur-sm border-l-4 border-l-purple-500 hover:bg-card/80 transition-colors">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <Badge variant="outline" className="mb-2 text-purple-400 border-purple-500/30">
                                        {pred.aiConfidence || 85}% AI Confidence
                                    </Badge>
                                    <CardTitle className="text-lg">{pred.target}</CardTitle>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-bold text-purple-500">{pred.riskScore || 75}</span>
                                    <span className="text-xs text-muted-foreground block">/ 100 Risk</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Risk Probability</span>
                                </div>
                                <Progress value={pred.riskScore || 75} className="h-2 bg-secondary" indicatorClassName="bg-gradient-to-r from-blue-500 to-purple-600" />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Likely Attack</p>
                                    <p className="text-sm font-medium flex items-center gap-1.5">
                                        <AlertTriangle className="h-3 w-3 text-destructive" />
                                        {pred.likelyAttackType || 'Unknown'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Region</p>
                                    <p className="text-sm font-medium flex items-center gap-1.5">
                                        <MapPin className="h-3 w-3" />
                                        {pred.region || 'Global'}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="bg-secondary/30 p-2 rounded text-xs text-muted-foreground mt-2">
                                <span className="font-semibold text-foreground">Impact:</span> {pred.projectedImpact || 'Unknown'}
                            </div>
                        </CardContent>
                    </Card>
                  ))
                )}
            </div>
        </div>
      </div>
    </Layout>
  );
}
