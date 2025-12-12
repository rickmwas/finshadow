import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fraudFindings } from "@/lib/mockData";
import { Search, Filter, Download, MoreHorizontal, Eye } from "lucide-react";

export default function FraudFindings() {
  return (
    <Layout>
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Fraud Findings</h1>
            <p className="text-muted-foreground mt-1">Detailed log of detected anomalies and security events.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Run New Scan
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
                {fraudFindings.map((finding) => (
                  <TableRow key={finding.id} className="hover:bg-muted/50 border-border">
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
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
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
