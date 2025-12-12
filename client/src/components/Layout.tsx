import React from 'react';
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  ShieldAlert, 
  Users, 
  Globe, 
  BrainCircuit, 
  Bell, 
  Search,
  Menu,
  Shield,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/" },
    { label: "Fraud Findings", icon: ShieldAlert, href: "/fraud-findings" },
    { label: "Threat Actors", icon: Users, href: "/threat-actors" },
    { label: "Dark Web Intel", icon: Globe, href: "/dark-web-intel" },
    { label: "AI Predictions", icon: BrainCircuit, href: "/predictions" },
    { label: "System Guide", icon: FileText, href: "/docs" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-8">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight hover:opacity-80 transition-opacity">
              <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center border border-primary/20">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <span className="hidden md:inline-block">Fin<span className="text-primary">Shadow</span></span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <div className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2
                    ${location === item.href 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}>
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </div>
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search threat intel..." 
                className="pl-9 bg-secondary/50 border-transparent focus:border-primary/50 focus:bg-background transition-all"
              />
            </div>
            
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive animate-pulse" />
            </Button>

            <Avatar className="h-8 w-8 border border-border">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 bg-background border-r border-border">
                <div className="flex flex-col gap-6 mt-6">
                  <div className="flex items-center gap-2 font-bold text-xl">
                    <Shield className="h-6 w-6 text-primary" />
                    <span>FinShadow</span>
                  </div>
                  <nav className="flex flex-col gap-2">
                    {navItems.map((item) => (
                      <Link key={item.href} href={item.href}>
                        <div className={`px-3 py-3 rounded-md text-sm font-medium transition-colors flex items-center gap-3
                          ${location === item.href 
                            ? "bg-primary/10 text-primary" 
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          }`}>
                          <item.icon className="h-5 w-5" />
                          {item.label}
                        </div>
                      </Link>
                    ))}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 pb-20">
        {children}
      </main>
    </div>
  );
}
