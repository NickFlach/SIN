import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useWebSocket } from "@/lib/useWebSocket";
import { useEffect } from "react";
import { type Node, type AIModel, type SCADADevice } from "@shared/schema";
import { Activity, Server, Brain, AlertTriangle } from "lucide-react";

export default function Dashboard() {
  const { data: nodes } = useQuery<Node[]>({ 
    queryKey: ["/api/nodes"]
  });

  const { data: models } = useQuery<AIModel[]>({ 
    queryKey: ["/api/models"]
  });

  const { data: devices } = useQuery<SCADADevice[]>({ 
    queryKey: ["/api/devices"]
  });

  const { lastMessage } = useWebSocket();

  const activeNodes = nodes?.filter(n => n.status === "online").length || 0;
  const averagePerformance = nodes?.reduce((acc, n) => acc + n.performance, 0) / (nodes?.length || 1);
  const trainingModels = models?.filter(m => m.status === "training").length || 0;
  const deviceAlerts = devices?.filter(d => d.status === "warning").length || 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">System Overview</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Nodes</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeNodes}</div>
            <p className="text-xs text-muted-foreground">
              {((activeNodes / (nodes?.length || 1)) * 100).toFixed(0)}% online
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averagePerformance.toFixed(1)}%</div>
            <Progress value={averagePerformance} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Training Models</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trainingModels}</div>
            <p className="text-xs text-muted-foreground">
              {models?.length || 0} total models
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SCADA Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deviceAlerts}</div>
            <p className="text-xs text-muted-foreground">
              {devices?.length || 0} connected devices
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
