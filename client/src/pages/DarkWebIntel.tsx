import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { darkWebIntel } from "@/lib/mockData";
import { Globe, AlertOctagon, Terminal, Lock } from "lucide-react";

export default function DarkWebIntel() {
  return (
    <Layout>
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dark Web Intel</h1>
            <p className="text-muted-foreground mt-1">Monitoring encrypted networks (Tor/I2P) for leaks and chatter.</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 bg-black border-border font-mono text-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50"></div>
                <CardHeader>
                    <CardTitle className="text-green-500 flex items-center gap-2">
                        <Terminal className="h-5 w-5" /> Live Feed
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {darkWebIntel.map((item, i) => (
                        <div key={item.id} className="p-4 border border-green-900/30 bg-green-900/5 rounded-md relative group">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-green-600 text-xs">[{item.timestamp}]</span>
                                <Badge variant="outline" className="border-green-900 text-green-500 text-[10px] uppercase">
                                    {item.source}
                                </Badge>
                            </div>
                            <p className="text-gray-300 mb-3">{item.content}</p>
                            <div className="flex gap-2">
                                {item.tags.map(tag => (
                                    <span key={tag} className="text-xs text-green-700 bg-green-950/50 px-1.5 py-0.5 rounded">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                            {item.severity === 'Critical' && (
                                <div className="absolute right-2 bottom-2 text-destructive animate-pulse">
                                    <AlertOctagon className="h-4 w-4" />
                                </div>
                            )}
                        </div>
                    ))}
                    
                    {/* Fake extra items to fill space */}
                    <div className="p-4 border border-border/20 bg-card/20 rounded-md opacity-50">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-muted-foreground text-xs">[2 hours ago]</span>
                            <Badge variant="outline" className="text-[10px]">RAID FORUMS</Badge>
                        </div>
                        <p className="text-muted-foreground">Scanning for relevant keywords...</p>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-6">
                <Card className="bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="h-5 w-5 text-primary" /> Credential Leaks
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm">Corporate Emails</span>
                                <span className="font-bold text-destructive">2 Found</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm">Customer PII</span>
                                <span className="font-bold text-green-500">0 Found</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm">API Keys</span>
                                <span className="font-bold text-green-500">0 Found</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Source Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                    <span>Tor Marketplaces</span>
                                    <span>45%</span>
                                </div>
                                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                    <div className="h-full bg-primary w-[45%]" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                    <span>Telegram Channels</span>
                                    <span>30%</span>
                                </div>
                                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                    <div className="h-full bg-primary w-[30%]" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                    <span>Hacking Forums</span>
                                    <span>25%</span>
                                </div>
                                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                    <div className="h-full bg-primary w-[25%]" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </Layout>
  );
}
