import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFraudFindings, useUpdateFraudFinding, useInvestigateFraud, useResolveFraud } from "@/hooks/useAPI";
import { Search, Filter, Download, MoreHorizontal, Eye, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
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
  const [statusFilter, setStatusFilter] = useState<string>();
  const { data: findings = [], isLoading } = useFraudFindings(statusFilter);
  const [selectedFinding, setSelectedFinding] = useState<any | null>(null);
  const updateMutation = useUpdateFraudFinding();
  const investigateMutation = useInvestigateFraud();
  const resolveMutation = useResolveFraud();

  const handleInvestigate = async (id: string) => {
    try {
      await investigateMutation.mutateAsync(id);
      toast.success("Investigation started");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await resolveMutation.mutateAsync(id);
      toast.success("Finding resolved");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

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
                {findings.length > 0 ? (
                  findings.map((finding: any) => (
                    <TableRow key={finding.id} className="hover:bg-muted/50 border-border group cursor-pointer" onClick={() => setSelectedFinding(finding)}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{finding.id}</TableCell>
                      <TableCell className="font-medium">{finding.type}</TableCell>
                      <TableCell>{finding.severity}</TableCell>
                      <TableCell>
                        <Badge variant={
                          finding.severity === 'critical' ? 'destructive' : 
                          finding.severity === 'high' ? 'default' : 
                        finding.severity === 'critical' ? 'destructive' : 
                        finding.severity === 'high' ? 'default' : 
                        'secondary'
                      }>
                        {finding.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${
                          finding.status === 'new' ? 'bg-blue-500' :
                          finding.status === 'investigating' ? 'bg-orange-500' : 'bg-green-500'
                        }`} />
                        <span className="text-sm">{finding.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{new Date(finding.createdAt).toLocaleString()}</TableCell>
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
                                        <h4 className="text-sm font-medium text-muted-foreground">Actions</h4>
                                        <div className="flex flex-col gap-2">
                                            {finding.status !== 'resolved' && (
                                              <>
                                                <Button 
                                                  className="w-full" 
                                                  onClick={() => handleInvestigate(finding.id)}
                                                  disabled={investigateMutation.isPending}
                                                >
                                                  Start Investigation
                                                </Button>
                                                <Button 
                                                  variant="outline" 
                                                  className="w-full"
                                                  onClick={() => handleResolve(finding.id)}
                                                  disabled={resolveMutation.isPending}
                                                >
                                                  Resolve
                                                </Button>
                                              </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </TableCell>
                  </TableRow>
                ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No fraud findings found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
