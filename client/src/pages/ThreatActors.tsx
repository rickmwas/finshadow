import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { threatActors } from "@/lib/mockData";
import { Globe, Crosshair, Zap, ExternalLink, Shield } from "lucide-react";

export default function ThreatActors() {
  return (
    <Layout>
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Threat Intelligence</h1>
            <p className="text-muted-foreground mt-1">Known APT groups and financially motivated threat actors.</p>
          </div>
          <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Update Feed
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {threatActors.map((actor) => (
            <Card key={actor.id} className="bg-card/50 backdrop-blur-sm border-border hover:border-primary/50 transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Shield className="h-32 w-32" />
              </div>
              
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className="font-mono text-xs">{actor.id}</Badge>
                  <Badge variant={actor.riskLevel === 'Critical' ? 'destructive' : 'default'} className="uppercase text-[10px] tracking-wider">
                    {actor.riskLevel}
                  </Badge>
                </div>
                <CardTitle className="mt-2 text-xl group-hover:text-primary transition-colors">{actor.name}</CardTitle>
                <CardDescription className="flex flex-wrap gap-1 mt-1">
                  {actor.alias.map(alias => (
                    <span key={alias} className="text-xs bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">
                      AKA: {alias}
                    </span>
                  ))}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Globe className="h-4 w-4" />
                    <span className="text-foreground">{actor.origin}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap className="h-4 w-4" />
                    <span className="text-foreground">Active: {actor.lastActive}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1">
                    <Crosshair className="h-3 w-3" /> Targets
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {actor.targets.map(target => (
                      <Badge key={target} variant="secondary" className="text-xs font-normal">
                        {target}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Capabilities</h4>
                  <div className="flex flex-wrap gap-1">
                    {actor.capabilities.map(cap => (
                      <span key={cap} className="text-xs border border-border px-2 py-0.5 rounded-full text-muted-foreground bg-background/50">
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button variant="ghost" className="w-full text-xs gap-1 hover:text-primary hover:bg-primary/5">
                  View Full Profile <ExternalLink className="h-3 w-3" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
