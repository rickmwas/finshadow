import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { stats as initialStats, fraudFindings, predictions } from "@/lib/mockData";
import { 
  ShieldAlert, 
  Activity, 
  BrainCircuit, 
  ArrowUpRight, 
  TrendingUp,
  AlertTriangle,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  Cell
} from "recharts";

const data = [
  { time: "00:00", attacks: 45, prevented: 40 },
  { time: "04:00", attacks: 30, prevented: 28 },
  { time: "08:00", attacks: 85, prevented: 80 },
  { time: "12:00", attacks: 120, prevented: 110 },
  { time: "16:00", attacks: 90, prevented: 88 },
  { time: "20:00", attacks: 60, prevented: 58 },
  { time: "24:00", attacks: 50, prevented: 48 },
];

const riskDistribution = [
  { name: 'Critical', value: 15, color: 'hsl(var(--destructive))' },
  { name: 'High', value: 35, color: 'hsl(var(--chart-4))' },
  { name: 'Medium', value: 40, color: 'hsl(var(--chart-1))' },
  { name: 'Low', value: 10, color: 'hsl(var(--chart-2))' },
];

export default function Dashboard() {
  const [isScanning, setIsScanning] = useState(false);
  const [stats, setStats] = useState(initialStats);

  const handleLiveScan = () => {
    setIsScanning(true);
    toast.info("Initiating deep system scan...");
    
    setTimeout(() => {
      setIsScanning(false);
      setStats(prev => ({
        ...prev,
        activeThreats: prev.activeThreats + 1,
        fraudAttemptsBlocked: prev.fraudAttemptsBlocked + 5
      }));
      toast.error("Threat Detected!", {
        description: "1 critical anomaly found in transaction stream.",
        action: {
          label: "View",
          onClick: () => window.location.href = '/fraud-findings'
        }
      });
    }, 2500);
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Security Overview</h1>
            <p className="text-muted-foreground mt-1">Real-time threat monitoring and system health.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => toast.success("Report generated", { description: "PDF download started." })}>
              Download Report
            </Button>
            <Button 
              size="sm" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 min-w-[120px]"
              onClick={handleLiveScan}
              disabled={isScanning}
            >
              {isScanning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Scanning...
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4" /> Live Scan
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-destructive bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
              <ShieldAlert className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeThreats}</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <span className="text-destructive flex items-center mr-1">
                  +2 <ArrowUpRight className="h-3 w-3" />
                </span>
                from last hour
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-primary bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fraud Blocked</CardTitle>
              <ShieldAlert className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.fraudAttemptsBlocked}</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <span className="text-emerald-500 flex items-center mr-1">
                  +12% <TrendingUp className="h-3 w-3" />
                </span>
                efficiency rate
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Confidence</CardTitle>
              <BrainCircuit className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.aiConfidenceAvg}%</div>
              <div className="w-full bg-secondary h-1.5 mt-2 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full" style={{ width: `${stats.aiConfidenceAvg}%` }} />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-orange-500 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Risk</CardTitle>
              <Activity className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.systemRiskScore}/100</div>
              <p className="text-xs text-muted-foreground mt-1">
                Moderate Level
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts & Recent Activity */}
        <div className="grid gap-4 md:grid-cols-7">
          <Card className="col-span-4 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Attack Traffic vs Prevention</CardTitle>
              <CardDescription>24-hour monitoring window</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="colorAttacks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorPrevented" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Area type="monotone" dataKey="attacks" stroke="hsl(var(--destructive))" fillOpacity={1} fill="url(#colorAttacks)" strokeWidth={2} />
                    <Area type="monotone" dataKey="prevented" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorPrevented)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-3 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Recent Findings</CardTitle>
              <CardDescription>Latest flagged transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fraudFindings.slice(0, 4).map((finding) => (
                  <div key={finding.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-transparent hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        finding.severity === 'Critical' ? 'bg-destructive/20 text-destructive' :
                        finding.severity === 'High' ? 'bg-orange-500/20 text-orange-500' :
                        'bg-primary/20 text-primary'
                      }`}>
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none">{finding.type}</p>
                        <p className="text-xs text-muted-foreground mt-1">{finding.source}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={finding.severity === 'Critical' ? 'destructive' : 'secondary'} className="text-[10px]">
                        {finding.severity}
                      </Badge>
                      <p className="text-[10px] text-muted-foreground mt-1">{finding.timestamp.split(' ')[1]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Predictions Summary */}
        <div className="grid gap-4 md:grid-cols-2">
           <Card className="bg-gradient-to-br from-card to-purple-950/20 border-border">
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <BrainCircuit className="h-5 w-5 text-purple-500" />
                 AI Threat Forecast
               </CardTitle>
               <CardDescription>Predictive analysis for the next 24 hours</CardDescription>
             </CardHeader>
             <CardContent>
               <div className="space-y-4">
                 {predictions.slice(0, 2).map((pred) => (
                   <div key={pred.id} className="space-y-2">
                     <div className="flex justify-between text-sm">
                       <span>{pred.target}</span>
                       <span className="font-mono text-purple-400">{pred.riskScore}/100 Risk</span>
                     </div>
                     <div className="h-2 bg-secondary rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-gradient-to-r from-blue-500 to-purple-500" 
                         style={{ width: `${pred.riskScore}%` }}
                       />
                     </div>
                     <p className="text-xs text-muted-foreground">Likely vector: {pred.likelyAttackType}</p>
                   </div>
                 ))}
               </div>
             </CardContent>
           </Card>

           <Card className="bg-card/50">
             <CardHeader>
               <CardTitle>Risk Severity Distribution</CardTitle>
               <CardDescription>Current active alerts by level</CardDescription>
             </CardHeader>
             <CardContent>
                <div className="h-[150px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={riskDistribution} layout="vertical" barSize={20}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={80} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} axisLine={false} tickLine={false} />
                      <Tooltip 
                        cursor={{fill: 'hsl(var(--muted/0.2))'}}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {riskDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
             </CardContent>
           </Card>
        </div>
      </div>
    </Layout>
  );
}
