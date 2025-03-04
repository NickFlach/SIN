import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWebSocket } from "@/lib/useWebSocket";
import { type Application, type Integration } from "@shared/schema";
import { AppWindow, Activity, Box, Music2, Plus, Network, Globe2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import DemoDisclaimer from "@/components/DemoDisclaimer";
import { ApiIntegrationResults } from "@/components/ApiIntegrationResults";
import { useMusicPlayer } from "@/lib/MusicPlayerContext";

interface AppMetrics {
  cpu: number;
  memory: number;
  requestsPerSecond: number;
  maxRequests: number;
  uptime: number;
}

interface Song {
  id: string;
  title: string;
  artist: string;
  addedAt: string;
}

const applicationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  version: z.string().min(1, "Version is required"),
});

const integrationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  config: z.object({
    url: z.string().url("Must be a valid URL"),
    method: z.string().min(1, "Method is required"),
    baseUrl: z.string().url("Must be a valid URL"),
  }).required(),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;
type IntegrationFormData = z.infer<typeof integrationSchema>;

interface EndpointDiscovery {
  baseUrl: string;
  available: boolean;
  error?: string;
  sampleData?: any;
  detectedEndpoints?: Array<{
    path: string;
    method: string;
    sampleResponse: any;
  }>;
}

interface SystemIntegratorNode {
  id: string;
  name: string;
  status: string;
  lastSync: string;
  metrics: {
    throughput: number;
    latency: number;
    errorRate: number;
  };
}

interface SystemIntegratorStatus {
  nodes: SystemIntegratorNode[];
  systemStatus: string;
}

export default function Applications() {
  const { toast } = useToast();
  const queryClientInstance = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<number | null>(null);
  const [isIntegrationDialogOpen, setIsIntegrationDialogOpen] = useState(false);
  const [discoveredEndpoints, setDiscoveredEndpoints] = useState<EndpointDiscovery | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<Integration | null>(null);
  const { openPlayer } = useMusicPlayer();

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      name: "",
      type: "service",
      version: "1.0.0",
    },
  });

  const integrationForm = useForm<IntegrationFormData>({
    resolver: zodResolver(integrationSchema),
    defaultValues: {
      name: "",
      type: "api",
      config: {
        url: "",
        method: "GET",
        baseUrl: "",
      },
    },
  });

  const { data: apps = [] } = useQuery<Application[]>({
    queryKey: ["/api/applications"]
  });

  const { data: integrations = {} } = useQuery<Record<number, Integration[]>>({
    queryKey: ["/api/integrations"],
    queryFn: async () => {
      const appIntegrations: Record<number, Integration[]> = {};
      for (const app of apps) {
        const response = await fetch(`/api/applications/${app.id}/integrations`);
        if (response.ok) {
          appIntegrations[app.id] = await response.json();
        } else {
          console.error("Failed to fetch integrations for app", app.id);
        }
      }
      return appIntegrations;
    },
    enabled: apps.length > 0,
  });

  const { 
    data: songs, 
    isLoading: songsLoading, 
    error: songsError,
    refetch: refetchSongs
  } = useQuery<Song[]>({
    queryKey: ["/api/music-portal/recent-songs"],
    retry: 2,
    staleTime: 30000,
    enabled: apps.some(app => app.name === "MusicPortal"),
  });

  const { 
    data: systemIntegratorStatus, 
    isLoading: systemIntegratorLoading, 
    error: systemIntegratorError,
    refetch: refetchSystemIntegrator
  } = useQuery<SystemIntegratorStatus>({
    queryKey: ["/api/system-integrator/status"],
    retry: 2,
    staleTime: 30000,
    enabled: apps.some(app => app.name === "System Integrator Network"),
  });

  const { lastMessage } = useWebSocket();

  useEffect(() => {
    if (lastMessage) {
      try {
        const message = typeof lastMessage === 'string' ? lastMessage : lastMessage.data;
        if (typeof message !== 'string') {
          console.warn('Received non-string message:', message);
          return;
        }

        const update = JSON.parse(message);

        if (!update || typeof update !== 'object' || !update.type || !update.data) {
          console.warn('Invalid message format:', update);
          return;
        }

        if (update.type === 'app_update' && queryClient.getQueryData(['/api/applications'])) {
          queryClient.setQueryData<Application[]>(['/api/applications'], (oldData) => {
            if (!oldData) return oldData;
            return oldData.map(app => {
              if (app.id === update.data.id) {
                return {
                  ...app,
                  metrics: update.data.metrics,
                  lastUpdated: update.data.lastUpdated
                };
              }
              return app;
            });
          });
        }

        if (update.type === 'integration_update') {
          queryClient.setQueryData(['/api/integrations'], (oldData: any) => {
            if (!oldData) return oldData;
            const newData = { ...oldData };
            Object.keys(newData).forEach(appId => {
              newData[appId] = newData[appId].map((integration: Integration) => {
                if (integration.id === update.data.id) {
                  return {
                    ...integration,
                    metrics: update.data.metrics
                  };
                }
                return integration;
              });
            });
            return newData;
          });
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    }
  }, [lastMessage, queryClient]);


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'maintenance':
        return 'secondary';
      case 'offline':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatMetric = (value: number) => {
    if (typeof value !== 'number') return '0';
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  const formatUptime = (seconds: number) => {
    if (typeof seconds !== 'number') return '0s';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const onSubmit = async (data: ApplicationFormData) => {
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          status: 'active',
          location: {
            lat: Math.random() * 180 - 90, // Random latitude
            lng: Math.random() * 360 - 180, // Random longitude
            region: "Global Demo Region",
          },
          metrics: {
            cpu: 0,
            memory: 0,
            requestsPerSecond: 0,
            maxRequests: 10000,
            uptime: 0,
          },
          lastUpdated: new Date().toISOString(),
          isDemo: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create application: ${JSON.stringify(errorData)}`);
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      toast({
        title: "Success",
        description: "Application created successfully",
      });
      form.reset();
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to create application: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };

  const onSubmitIntegration = async (data: IntegrationFormData) => {
    if (!selectedApp) return;

    try {
      const response = await fetch(`/api/applications/${selectedApp}/integrations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          appId: selectedApp,
          status: 'active',
          metrics: {
            latency: 0,
            successRate: 100,
            requestCount: 0
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create integration: ${JSON.stringify(errorData)}`);
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
      toast({
        title: "Success",
        description: "Integration endpoint added successfully",
      });
      integrationForm.reset();
      setIsIntegrationDialogOpen(false);
      setSelectedApp(null);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to create integration: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };

  const exploreEndpoints = async (baseUrl: string) => {
    try {
      const response = await fetch('/api/discover-endpoints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: baseUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to discover endpoints');
      }

      const discovery = await response.json();
      setDiscoveredEndpoints(discovery);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to discover endpoints",
        variant: "destructive",
      });
    }
  };

  const handleSongClick = (song: Song) => {
    openPlayer(song);
    toast({
      title: "Playing Song",
      description: `Now playing: ${song.title} by ${song.artist}`,
    });
  };

  const renderSongItem = (song: Song) => (
    <div className="flex justify-between items-center p-3 rounded-md bg-secondary/10 hover:bg-secondary/20 cursor-pointer" onClick={() => handleSongClick(song)}>
      <div>
        <div className="font-medium">{song.title}</div>
        <div className="text-sm text-muted-foreground">{song.artist}</div>
      </div>
      <div className="text-sm text-muted-foreground">
        {new Date(song.addedAt).toLocaleDateString()}
      </div>
    </div>
  );

  const renderSystemIntegratorNode = (node: SystemIntegratorNode) => (
    <div className="flex justify-between items-center p-3 rounded-md bg-secondary/10 hover:bg-secondary/20">
      <div>
        <div className="font-medium">{node.name}</div>
        <div className="text-sm text-muted-foreground">
          Last sync: {new Date(node.lastSync).toLocaleString()}
        </div>
      </div>
      <div className="space-y-1 text-right">
        <Badge variant={node.status === 'active' ? 'default' : 'destructive'}>
          {node.status}
        </Badge>
        <div className="text-sm text-muted-foreground">
          Throughput: {formatMetric(node.metrics.throughput)}/s
        </div>
        <div className="text-sm text-muted-foreground">
          Latency: {node.metrics.latency}ms
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <DemoDisclaimer />
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Applications</h1>
        <div className="flex items-center gap-4">
          <Badge variant="outline">
            <AppWindow className="w-4 h-4 mr-2" />
            {apps?.length || 0} Apps
          </Badge>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Application
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Application</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Application name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="service">Service</SelectItem>
                            <SelectItem value="plugin">Plugin</SelectItem>
                            <SelectItem value="extension">Extension</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="version"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Version</FormLabel>
                        <FormControl>
                          <Input placeholder="1.0.0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    Create Application
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={isIntegrationDialogOpen} onOpenChange={setIsIntegrationDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add Integration Endpoint</DialogTitle>
          </DialogHeader>
          <Form {...integrationForm}>
            <form onSubmit={integrationForm.handleSubmit(onSubmitIntegration)} className="space-y-4">
              <FormField
                control={integrationForm.control}
                name="config.baseUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base URL</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          placeholder="https://api.example.com"
                          {...field}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        onClick={() => exploreEndpoints(field.value)}
                      >
                        Explore
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {discoveredEndpoints && (
                <div className="border rounded-md p-4 space-y-4">
                  <h3 className="font-medium">Discovered Endpoints</h3>
                  {discoveredEndpoints.available ? (
                    <>
                      <div className="space-y-2">
                        {discoveredEndpoints.detectedEndpoints?.map((endpoint, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 bg-secondary/10 rounded-md"
                          >
                            <div>
                              <div className="font-medium">
                                {endpoint.method} {endpoint.path}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Sample data available
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                integrationForm.setValue('config.url',
                                  `${discoveredEndpoints.baseUrl}${endpoint.path}`);
                                integrationForm.setValue('config.method', endpoint.method);
                              }}
                            >
                              Use Endpoint
                            </Button>
                          </div>
                        ))}
                      </div>
                      <div className="pt-4 border-t">
                        <div className="text-sm text-muted-foreground mb-2">Sample Response:</div>
                        <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                          <pre className="text-sm">
                            {JSON.stringify(discoveredEndpoints.sampleData, null, 2)}
                          </pre>
                        </ScrollArea>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      {discoveredEndpoints.error || 'No endpoints discovered'}
                    </div>
                  )}
                </div>
              )}

              <FormField
                control={integrationForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Integration name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={integrationForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="api">API</SelectItem>
                        <SelectItem value="webhook">Webhook</SelectItem>
                        <SelectItem value="streaming">Streaming</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={integrationForm.control}
                name="config.url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://api.example.com/endpoint" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={integrationForm.control}
                name="config.method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Add Integration
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {apps?.map(app => {
          const metrics = app.metrics as AppMetrics;
          const isMusicPortal = app.name === "MusicPortal";
          const appIntegrations = integrations[app.id] || [];
          const isSystemIntegrator = app.name === "System Integrator Network";

          return (
            <Card key={app.id} className={isMusicPortal || isSystemIntegrator ? "col-span-2" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isMusicPortal ? (
                      <Music2 className="w-5 h-5" />
                    ) : isSystemIntegrator ? (
                      <Network className="w-5 h-5" />
                    ) : (
                      <Box className="w-5 h-5" />
                    )}
                    <span>{app.name}</span>
                    <Badge variant="secondary" className="ml-2">
                      v{app.version}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                    <Globe2 className="w-4 h-4" />
                    {app.location?.region || 'Unknown Region'}
                    {app.isDemo && <span className="text-xs">(Demo)</span>}
                  </div>
                  <Badge variant={getStatusColor(app.status)}>
                    {app.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">CPU Usage</span>
                        <span>{metrics?.cpu?.toFixed(1) || 0}%</span>
                      </div>
                      <Progress value={metrics?.cpu || 0} className="bg-blue-200" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Memory</span>
                        <span>{metrics?.memory?.toFixed(1) || 0}%</span>
                      </div>
                      <Progress value={metrics?.memory || 0} className="bg-green-200" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Requests/sec</span>
                        <span>{formatMetric(metrics?.requestsPerSecond || 0)}</span>
                      </div>
                      <Progress
                        value={((metrics?.requestsPerSecond || 0) / (metrics?.maxRequests || 1)) * 100}
                        className="bg-purple-200"
                      />
                    </div>
                  </div>

                  {isMusicPortal && (
                    <ApiIntegrationResults
                      title="Recent Songs"
                      data={songs}
                      isLoading={songsLoading}
                      error={songsError}
                      renderItem={renderSongItem}
                      filterKey="title"
                      countLabel="Songs"
                      emptyMessage="No recent songs found"
                      loadingMessage="Loading recent songs..."
                      errorMessage="Unable to load recent songs"
                      showChartView={false}
                      onRefresh={() => refetchSongs()}
                      onItemClick={handleSongClick}
                    />
                  )}

                  {isSystemIntegrator && (
                    <ApiIntegrationResults
                      title="Integration Nodes"
                      data={systemIntegratorStatus?.nodes}
                      isLoading={systemIntegratorLoading}
                      error={systemIntegratorError}
                      renderItem={renderSystemIntegratorNode}
                      filterKey="name"
                      countLabel="Nodes"
                      emptyMessage="No integration nodes found"
                      loadingMessage="Loading system integrator status..."
                      errorMessage="Unable to load system integrator status"
                      showChartView={true}
                      onRefresh={() => refetchSystemIntegrator()}
                    />
                  )}

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Network className="w-4 h-4" />
                        <h3 className="font-semibold">Integrations</h3>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedApp(app.id);
                          setIsIntegrationDialogOpen(true);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Endpoint
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {appIntegrations.map((integration) => (
                        <div
                          key={integration.id}
                          className="space-y-2"
                        >
                          <div
                            className="flex items-center justify-between p-2 rounded-md bg-secondary/10 cursor-pointer"
                            onClick={() => setSelectedEndpoint(integration)}
                          >
                            <div>
                              <div className="font-medium">{integration.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {integration.config?.method} {integration.config?.url}
                              </div>
                            </div>
                            <Badge variant={integration.status === 'active' ? 'default' : 'destructive'}>
                              {integration.status}
                            </Badge>
                          </div>

                          {selectedEndpoint?.id === integration.id && (
                            <div className="p-4 rounded-md border mt-2">
                              <div className="space-y-4">
                                <div>
                                  <div className="text-sm font-medium mb-2">Metrics</div>
                                  <div className="grid grid-cols-3 gap-4">
                                    <div>
                                      <div className="text-sm text-muted-foreground">Latency</div>
                                      <div className="text-xl font-medium">
                                        {integration.metrics?.latency?.toFixed(1) || 0}ms
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-sm text-muted-foreground">Success Rate</div>
                                      <div className="text-xl font-medium">
                                        {integration.metrics?.successRate?.toFixed(1) || 0}%
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-sm text-muted-foreground">Requests</div>
                                      <div className="text-xl font-medium">
                                        {formatMetric(integration.metrics?.requestCount || 0)}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {integration.sampleData && (
                                  <div>
                                    <div className="text-sm font-medium mb-2">Sample Response</div>
                                    <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                                      <pre className="text-sm">
                                        {JSON.stringify(integration.sampleData, null, 2)}
                                      </pre>
                                    </ScrollArea>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {appIntegrations.length === 0 && (
                        <div className="text-center py-4 text-muted-foreground">
                          No integrations added yet
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}