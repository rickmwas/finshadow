import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fraudFindings as initialFindings, FraudFinding } from "@/lib/mockData";
import { Search, Filter, Download, MoreHorizontal, Eye, Loader2, ShieldCheck } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";

export default function FraudFindings() {
  const [findings, setFindings] = useState<FraudFinding[]>(initialFindings);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<FraudFinding | null>(null);

  const runNewScan = () => {
    setIsScanning(true);
    toast.info("Scanning recent transactions...");
    
    setTimeout(() => {
        setIsScanning(false);
        const newFinding: FraudFinding = {
            id: `FR-2024-${Math.floor(8900 + Math.random() * 100)}`,
            timestamp: new Date().toLocaleString(),
            source: "Real-time Monitor",
            type: "Anomalous Geolocation",
            severity: "High",
            status: "New",
            details: "Login attempt from suspended region (Sanctioned IP block)."
        };
        setFindings(prev => [newFinding, ...prev]);
        toast.error("New Fraud Pattern Detected", { description: "High severity anomaly added to queue." });
    }, 2000);
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Fraud Findings</h1>
            <p className="text-muted-foreground mt-1">Detailed log of detected anomalies and security events.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.success("Export started")}>
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button 
                size="sm" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[130px]"
                onClick={runNewScan}
                disabled={isScanning}
            >
              {isScanning ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Scanning...</> : "Run New Scan"}
            </Button>
          </div>
        </div>

        <Card className="bg-card/50 backdrop-blur-sm border-border">
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search finding ID, source or type..." 
                  className="pl-9 bg-secondary/50"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" /> Filter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {findings.map((finding) => (
                  <TableRow key={finding.id} className="hover:bg-muted/50 border-border group cursor-pointer" onClick={() => setSelectedFinding(finding)}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{finding.id}</TableCell>
                    <TableCell className="font-medium">{finding.type}</TableCell>
                    <TableCell>{finding.source}</TableCell>
                    <TableCell>
                      <Badge variant={
                        finding.severity === 'Critical' ? 'destructive' : 
                        finding.severity === 'High' ? 'default' : 
                        finding.severity === 'Medium' ? 'secondary' : 'outline'
                      } className={
                        finding.severity === 'High' ? 'bg-orange-500/20 text-orange-500 hover:bg-orange-500/30' : ''
                      }>
                        {finding.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${
                          finding.status === 'New' ? 'bg-blue-500' :
                          finding.status === 'Investigating' ? 'bg-orange-500' : 'bg-green-500'
                        }`} />
                        <span className="text-sm">{finding.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{finding.timestamp}</TableCell>
                    <TableCell className="text-right">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent>
                                <SheetHeader>
                                <SheetTitle className="flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5 text-primary" />
                                    Investigation Details
                                </SheetTitle>
                                <SheetDescription>
                                    Case ID: <span className="font-mono">{finding.id}</span>
                                </SheetDescription>
                                </SheetHeader>
                                <div className="mt-6 space-y-6">
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium text-muted-foreground">Detection Type</h4>
                                        <p className="text-lg font-semibold">{finding.type}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium text-muted-foreground">Severity Assessment</h4>
                                        <Badge variant={finding.severity === 'Critical' ? 'destructive' : 'secondary'}>
                                            {finding.severity} Severity
                                        </Badge>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium text-muted-foreground">Technical Details</h4>
                                        <div className="p-4 rounded-md bg-secondary/50 text-sm font-mono leading-relaxed">
                                            {finding.details}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium text-muted-foreground">Recommended Action</h4>
                                        <div className="flex flex-col gap-2">
                                            <Button className="w-full bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20">
                                                Freeze Account
                                            </Button>
                                            <Button variant="outline" className="w-full">
                                                Contact User
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
