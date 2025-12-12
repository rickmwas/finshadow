import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Shield, Zap, BrainCircuit, Globe, Terminal, Lock } from "lucide-react";

export default function Documentation() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto flex flex-col gap-8 animate-in fade-in duration-500 pb-20">
        
        {/* Hero Section */}
        <div className="text-center space-y-4 py-8">
          <Badge variant="outline" className="mb-2 border-primary/50 text-primary bg-primary/10 px-4 py-1">
            System Architecture v1.0
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
            How Fin-Shadow Works
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A comprehensive guide to the AI-driven fraud defense platform: monitoring, detection, and predictive response.
          </p>
        </div>

        {/* 1. What is it? */}
        <Card className="bg-card/50 backdrop-blur-sm border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Shield className="h-6 w-6 text-primary" />
              What is Fin-Shadow?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-base leading-relaxed text-muted-foreground">
            <p>
              <strong className="text-foreground">Fin-Shadow</strong> is a next-generation security platform designed for modern fintech infrastructure. Unlike traditional rule-based systems, it uses <strong>Machine Learning</strong> and <strong>Generative AI</strong> to identify threats before they impact the system.
            </p>
            <p>
              It serves as a central "Command Center" for security analysts, aggregating data from transaction logs, user behavior, and the dark web to provide a holistic threat score.
            </p>
          </CardContent>
        </Card>

        {/* 2. Core Modules Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                Real-Time Fraud Detection
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Ingests live transaction streams and uses anomaly detection to flag suspicious patterns (e.g., impossible travel, velocity checks).
              <div className="mt-2 p-2 bg-secondary/50 rounded border border-border">
                <span className="text-xs font-mono text-foreground">Access via: <strong>Fraud Findings</strong> page</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-green-500" />
                Dark Web Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Scrapes Tor/I2P marketplaces and hacker forums for mentions of your company assets, leaked credentials, or specific API exploit kits.
              <div className="mt-2 p-2 bg-secondary/50 rounded border border-border">
                <span className="text-xs font-mono text-foreground">Access via: <strong>Dark Web Intel</strong> page</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-purple-500" />
                Predictive AI Scoring
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Uses historical data to forecast <em>future</em> attack vectors. It tells you not just what is happening, but what is <em>likely</em> to happen next.
              <div className="mt-2 p-2 bg-secondary/50 rounded border border-border">
                <span className="text-xs font-mono text-foreground">Access via: <strong>Predictions</strong> page</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-blue-500" />
                Threat Actor Profiling
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Maintains a database of known APT (Advanced Persistent Threat) groups, their TTPs (Tactics, Techniques, Procedures), and active campaigns.
              <div className="mt-2 p-2 bg-secondary/50 rounded border border-border">
                <span className="text-xs font-mono text-foreground">Access via: <strong>Threat Actors</strong> page</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 3. User Guide / FAQ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Analyst Workflow Guide</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>How do I investigate a new alert?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                1. Navigate to the <strong>Dashboard</strong> to see the high-level alert status.<br/>
                2. Click on "Live Scan" or go to <strong>Fraud Findings</strong>.<br/>
                3. Locate the "High" or "Critical" severity finding.<br/>
                4. Click the row to open the <strong>Investigation Sheet</strong>.<br/>
                5. Review the AI-generated analysis and click "Freeze Account" if the threat is verified.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>How does the Dark Web feed work?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                The <strong>Dark Web Intel</strong> page connects to our scraping engine. It updates in real-time. You can pause the feed to inspect specific messages. If you see a "Critical" tag, it means a direct match for company assets (e.g., BIN numbers or employee emails) was found.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>What do the Risk Scores mean?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                In the <strong>Predictions</strong> tab, the Risk Score (0-100) indicates the probability of an attack in the next 24 hours.
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li><strong>0-30:</strong> Low Risk (Normal traffic)</li>
                  <li><strong>31-70:</strong> Elevated Risk (Suspicious probing detected)</li>
                  <li><strong>71-100:</strong> Critical Risk (Imminent attack or active exploit)</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

      </div>
    </Layout>
  );
}
