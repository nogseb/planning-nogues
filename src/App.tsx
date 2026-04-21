import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Header from "./components/Header";
import Home from "./pages/Home";
import Calendrier from "./pages/Calendrier";
import Liste from "./pages/Liste";
import Carte from "./pages/Carte";
import Planning from "./pages/Planning";
import Stats from "./pages/Stats";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Planning} />
      <Route path="/agenda" component={Home} />
      <Route path="/calendrier" component={Calendrier} />
      <Route path="/liste" component={Liste} />
      <Route path="/carte" component={Carte} />
      <Route path="/stats" component={Stats} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              <Router />
            </main>
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
