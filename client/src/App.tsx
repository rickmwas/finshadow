import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import FraudFindings from "@/pages/FraudFindings";
import ThreatActors from "@/pages/ThreatActors";
import DarkWebIntel from "@/pages/DarkWebIntel";
import Predictions from "@/pages/Predictions";
import Documentation from "@/pages/Documentation";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard}/>
      <Route path="/fraud-findings" component={FraudFindings}/>
      <Route path="/threat-actors" component={ThreatActors}/>
      <Route path="/dark-web-intel" component={DarkWebIntel}/>
      <Route path="/predictions" component={Predictions}/>
      <Route path="/docs" component={Documentation}/>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
