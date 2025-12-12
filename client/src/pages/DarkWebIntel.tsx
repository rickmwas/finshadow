import { useState, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { darkWebIntel, IntelFeedItem } from "@/lib/mockData";
import { Globe, AlertOctagon, Terminal, Lock, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

const NEW_INTEL_MESSAGES = [
  { content: "New bin 414720 detected in dump. originating from US-East.", source: "Carder's Paradise", severity: "High" },
  { content: "User 'ZeroCool' is asking about FinShadow API endpoints.", source: "Exploit.in", severity: "Medium" },
  { content: "Confirmed leak of 500 email/pass combos matching domain list.", source: "RaidForums", severity: "Critical" },
  { content: "New malware signature 'ShadyRat' spotted in wild.", source: "Hybrid Analysis", severity: "High" },
  { content: "Chatter increasing regarding SWIFT gateway vulnerability.", source: "Telegram Encrypted", severity: "Critical" },
  { content: "Looking for drops in EU region. fast payout.", source: "DarkMarket", severity: "Low" },
];

export default function DarkWebIntel() {
  const [feed, setFeed] = useState<IntelFeedItem[]>(darkWebIntel);
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to top when new item arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [feed]);

  // Simulate live feed
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const randomMsg = NEW_INTEL_MESSAGES[Math.floor(Math.random() * NEW_INTEL_MESSAGES.length)];
      const newItem: IntelFeedItem = {
        id: `INT-${Math.floor(Math.random() * 10000)}`,
        timestamp: "Just now",
        source: randomMsg.source,
        content: randomMsg.content,
        tags: ["Live", "Signal"],
        severity: randomMsg.severity as any
      };

      setFeed(prev => [newItem, ...prev].slice(0, 50)); // Keep last 50
    }, 3500);

    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <Layout>
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dark Web Intel</h1>
            <p className="text-muted-foreground mt-1">Monitoring encrypted networks (Tor/I2P) for leaks and chatter.</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsPaused(!isPaused)}
            className="gap-2 border-primary/20 hover:bg-primary/10"
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            {isPaused ? "Resume Feed" : "Pause Feed"}
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 bg-black border-border font-mono text-sm relative overflow-hidden flex flex-col h-[600px]">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50"></div>
                <CardHeader className="pb-2">
                    <CardTitle className="text-green-500 flex items-center gap-2">
                        <Terminal className="h-5 w-5" /> Live Intercept Feed
                        <span className="flex h-2 w-2 relative ml-auto">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3" ref={scrollRef}>
                    {feed.map((item, i) => (
                        <div key={item.id} className="p-3 border border-green-900/30 bg-green-900/5 rounded-md relative group animate-in slide-in-from-left-2 duration-300">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-green-600 text-xs font-bold">[{item.timestamp}]</span>
                                <Badge variant="outline" className="border-green-900/50 text-green-500 text-[10px] uppercase bg-green-950/30">
                                    {item.source}
                                </Badge>
                            </div>
                            <p className="text-gray-300 mb-2 leading-relaxed">{item.content}</p>
                            <div className="flex gap-2">
                                {item.tags.map(tag => (
                                    <span key={tag} className="text-[10px] text-green-600 bg-green-950/40 px-1.5 py-0.5 rounded border border-green-900/20">
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
