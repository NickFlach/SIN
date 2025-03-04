import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider } from "@/components/ui/sidebar";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import NodeMap from "@/pages/NodeMap";
import Training from "@/pages/Training";
import SCADA from "@/pages/SCADA";
import Governance from "@/pages/Governance";
import NotFound from "@/pages/not-found";
import Applications from "@/pages/Applications";
import Documentation from "@/pages/Documentation";
import Partners from "@/pages/Partners";
import Integration from "@/pages/Integration";
import Login from "@/pages/Login";
import { IdentityProvider, AuthProtection } from "@/lib/IdentityContext";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />

      <Route>
        <AuthProtection>
          <Layout>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/nodes" component={NodeMap} />
              <Route path="/training" component={Training} />
              <Route path="/scada" component={SCADA} />
              <Route path="/governance" component={Governance} />
              <Route path="/applications" component={Applications} />
              <Route path="/partners" component={Partners} />
              <Route path="/documentation" component={Documentation} />
              <Route path="/integration" component={Integration} />
              <Route component={NotFound} />
            </Switch>
          </Layout>
        </AuthProtection>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <IdentityProvider>
        <SidebarProvider>
          <Router />
          <Toaster />
        </SidebarProvider>
      </IdentityProvider>
    </QueryClientProvider>
  );
}

export default App;