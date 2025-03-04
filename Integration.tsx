import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, FileText, Github, Globe, Code, AlertTriangle, Check, Loader2, Zap, Music } from "lucide-react";
import { REGIONS } from "@shared/schema";
import MusicPortalAgent from "@/components/MusicPortalAgent";

interface Application {
  id: string;
  name: string;
  description: string;
  url: string;
  apis: {
    path: string;
    method: string;
    description: string;
  }[];
  regions: string[];
}

interface Song {
  id: number;
  title: string;
  artist: string;
  ipfsHash: string;
  uploadedBy: string;
  createdAt: string;
  votes: number;
}

interface IntegrationPayload {
  targetApp: string;
  dataType: string;
  dataId: string | number;
  integrationMethod: 'standard' | 'quantum';
}

interface WhitepaperPayload {
  whitepaperUrl: string;
  appId: string;
  sections?: string[];
}

export default function Integration() {
  const [activeTab, setActiveTab] = useState<string>("apps");
  const [integrationPayload, setIntegrationPayload] = useState<IntegrationPayload>({
    targetApp: "",
    dataType: "model",
    dataId: "",
    integrationMethod: "standard"
  });
  const [whitepaperPayload, setWhitepaperPayload] = useState<WhitepaperPayload>({
    whitepaperUrl: "",
    appId: "",
    sections: ["abstract", "methodology", "conclusion"]
  });
  const [selectedSong, setSelectedSong] = useState<number | null>(null);

  const { toast } = useToast();

  // Fetch registered applications
  const { data: appRegistry, isLoading: isLoadingApps } = useQuery<{ registeredApps: Application[] }>({
    queryKey: ["/api/application-registry"],
  });

  // Fetch recent songs from ninja-portal
  const { data: recentSongs, isLoading: isLoadingSongs } = useQuery<Song[]>({
    queryKey: ["/api/music-portal/recent-songs"],
    enabled: activeTab === "ninja-portal"
  });

  // Mutation for cross-app integration
  const integrationMutation = useMutation({
    mutationFn: (payload: IntegrationPayload) => 
      apiRequest('/api/cross-app-integration', {
        method: 'POST',
        body: payload
      }),
    onSuccess: (data) => {
      toast({
        title: "Integration Successful",
        description: `${integrationPayload.dataType} #${integrationPayload.dataId} has been integrated with ${integrationPayload.targetApp}`,
      });

      // If using quantum method, provide more details
      if (integrationPayload.integrationMethod === 'quantum' && data.result?.teleportId) {
        toast({
          title: "Quantum Teleportation Initiated",
          description: `Teleport ID: ${data.result.teleportId}`,
          variant: "default",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Integration Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  // Mutation for whitepaper integration
  const whitepaperMutation = useMutation({
    mutationFn: (payload: WhitepaperPayload) =>
      apiRequest('/api/whitepaper-integration', {
        method: 'POST',
        body: payload
      }),
    onSuccess: () => {
      toast({
        title: "Whitepaper Integrated",
        description: `Whitepaper from ${whitepaperPayload.whitepaperUrl} has been integrated with app ${whitepaperPayload.appId}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Whitepaper Integration Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  // Mutation for ninja portal integration
  const ninjaMutation = useMutation({
    mutationFn: (songId: number) =>
      apiRequest('/api/cross-app-integration', {
        method: 'POST',
        body: {
          targetApp: "sinet-dashboard",
          dataType: "song",
          dataId: songId,
          integrationMethod: "standard"
        }
      }),
    onSuccess: () => {
      toast({
        title: "Ninja Portal Integration Successful",
        description: selectedSong 
          ? `Song #${selectedSong} has been integrated with the SINet Dashboard`
          : "Music has been integrated with SINet Dashboard",
      });
    },
    onError: (error) => {
      toast({
        title: "Ninja Portal Integration Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  // Handle form submissions
  const handleIntegrationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    integrationMutation.mutate(integrationPayload);
  };

  const handleWhitepaperSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    whitepaperMutation.mutate(whitepaperPayload);
  };

  const handleNinjaIntegration = (songId: number) => {
    setSelectedSong(songId);
    ninjaMutation.mutate(songId);
  };

  // Helper function to get region badge color
  const getRegionBadgeColor = (region: string) => {
    switch (region) {
      case REGIONS.EAST:
        return "bg-blue-500";
      case REGIONS.WEST:
        return "bg-purple-500";
      case REGIONS.NULL_ISLAND:
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  // Format date string
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Cross-Application Integration</h1>
        <p className="text-muted-foreground">
          Connect and integrate applications across the SINet ecosystem
        </p>
      </div>

      <Tabs defaultValue="apps" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 w-[800px]">
          <TabsTrigger value="apps" className="flex items-center gap-1">
            <Globe className="h-4 w-4" />
            <span>Registered Applications</span>
          </TabsTrigger>
          <TabsTrigger value="integration" className="flex items-center gap-1">
            <ArrowRight className="h-4 w-4" />
            <span>Cross-App Integration</span>
          </TabsTrigger>
          <TabsTrigger value="whitepapers" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span>Whitepaper Integration</span>
          </TabsTrigger>
          <TabsTrigger value="ninja-portal" className="flex items-center gap-1">
            <Music className="h-4 w-4" />
            <span>Ninja Portal</span>
          </TabsTrigger>
        </TabsList>

        {/* Registered Applications Tab */}
        <TabsContent value="apps" className="space-y-4 mt-6">
          {isLoadingApps ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appRegistry?.registeredApps.map((app) => (
                <Card key={app.id} className="h-full flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-2">
                        {app.regions.map((region) => (
                          <Badge key={region} className={getRegionBadgeColor(region)}>
                            {region === "east" ? "East" : region === "west" ? "West" : region === "null-island" ? "Null Island" : "Global"}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <CardTitle>{app.name}</CardTitle>
                    <CardDescription>{app.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <h4 className="text-sm font-medium mb-2">Available APIs</h4>
                    <Accordion type="single" collapsible className="w-full">
                      {app.apis.map((api, index) => (
                        <AccordionItem key={index} value={`api-${index}`}>
                          <AccordionTrigger>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{api.method}</Badge>
                              <span className="text-sm font-mono">{api.path}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <p className="text-sm text-muted-foreground">{api.description}</p>
                            <div className="mt-2">
                              <code className="text-xs bg-muted p-1 rounded">
                                {api.method === 'GET' 
                                  ? `curl ${app.url}${api.path}` 
                                  : `curl -X ${api.method} ${app.url}${api.path} -d '{}'`}
                              </code>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm" className="gap-1 w-full" asChild>
                      <a href={app.url} target="_blank" rel="noreferrer">
                        <Globe className="h-3.5 w-3.5" />
                        <span>Visit Application</span>
                      </a>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Cross-App Integration Tab */}
        <TabsContent value="integration" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Integrate Across Applications</CardTitle>
              <CardDescription>
                Transfer data and resources between SINet applications using standard or quantum methods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleIntegrationSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetApp">Target Application</Label>
                    <Select 
                      value={integrationPayload.targetApp} 
                      onValueChange={(value) => setIntegrationPayload({...integrationPayload, targetApp: value})}
                    >
                      <SelectTrigger id="targetApp">
                        <SelectValue placeholder="Select application" />
                      </SelectTrigger>
                      <SelectContent>
                        {appRegistry?.registeredApps.map((app) => (
                          <SelectItem key={app.id} value={app.id}>{app.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dataType">Data Type</Label>
                    <Select 
                      value={integrationPayload.dataType} 
                      onValueChange={(value) => setIntegrationPayload({...integrationPayload, dataType: value})}
                    >
                      <SelectTrigger id="dataType">
                        <SelectValue placeholder="Select data type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="model">AI Model</SelectItem>
                        <SelectItem value="node">Compute Node</SelectItem>
                        <SelectItem value="device">SCADA Device</SelectItem>
                        <SelectItem value="application">Application</SelectItem>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="song">Ninja Portal Song</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dataId">Data ID</Label>
                    <Input 
                      id="dataId" 
                      value={integrationPayload.dataId.toString()} 
                      onChange={(e) => setIntegrationPayload({...integrationPayload, dataId: e.target.value})} 
                      placeholder="Enter ID number or identifier"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="integrationMethod">Integration Method</Label>
                    <Select 
                      value={integrationPayload.integrationMethod} 
                      onValueChange={(value: 'standard' | 'quantum') => setIntegrationPayload({...integrationPayload, integrationMethod: value})}
                    >
                      <SelectTrigger id="integrationMethod">
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard API</SelectItem>
                        <SelectItem value="quantum">Quantum Teleportation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {integrationPayload.integrationMethod === 'quantum' && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded border border-yellow-200 dark:border-yellow-800 mt-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800 dark:text-yellow-500">Experimental Feature</h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-400">
                          Quantum teleportation is an experimental feature that uses zero knowledge proofs to
                          simulate secure data transfer between regions. This feature is only available for
                          NULL_ISLAND-connected applications.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={integrationMutation.isPending}
                >
                  {integrationMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing Integration
                    </>
                  ) : integrationPayload.integrationMethod === 'quantum' ? (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Teleport Data
                    </>
                  ) : (
                    <>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Integrate Data
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Whitepaper Integration Tab */}
        <TabsContent value="whitepapers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Integrate Whitepaper Documentation</CardTitle>
              <CardDescription>
                Connect external whitepapers and technical documentation to SINet applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleWhitepaperSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="whitepaperUrl">Whitepaper URL</Label>
                  <Input 
                    id="whitepaperUrl" 
                    value={whitepaperPayload.whitepaperUrl} 
                    onChange={(e) => setWhitepaperPayload({...whitepaperPayload, whitepaperUrl: e.target.value})} 
                    placeholder="https://example.com/whitepaper.pdf"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appId">Target Application</Label>
                  <Select 
                    value={whitepaperPayload.appId} 
                    onValueChange={(value) => setWhitepaperPayload({...whitepaperPayload, appId: value})}
                  >
                    <SelectTrigger id="appId">
                      <SelectValue placeholder="Select application" />
                    </SelectTrigger>
                    <SelectContent>
                      {appRegistry?.registeredApps.map((app) => (
                        <SelectItem key={app.id} value={app.id}>{app.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Sections to Include</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {['abstract', 'introduction', 'methodology', 'results', 'conclusion', 'references'].map((section) => (
                      <div key={section} className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id={`section-${section}`} 
                          checked={whitepaperPayload.sections?.includes(section) || false}
                          onChange={(e) => {
                            const sections = whitepaperPayload.sections || [];
                            if (e.target.checked) {
                              setWhitepaperPayload({
                                ...whitepaperPayload, 
                                sections: [...sections, section]
                              });
                            } else {
                              setWhitepaperPayload({
                                ...whitepaperPayload, 
                                sections: sections.filter(s => s !== section)
                              });
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor={`section-${section}`} className="text-sm capitalize">
                          {section}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={whitepaperMutation.isPending}
                >
                  {whitepaperMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Integrate Whitepaper
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ninja Portal Integration */}
        <TabsContent value="ninja-portal" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Music Portal Agent */}
            <MusicPortalAgent onSongSelect={handleNinjaIntegration} />

            {/* Recent Songs from Ninja Portal */}
            <Card>
              <CardHeader>
                <CardTitle>Ninja Portal Music Integration</CardTitle>
                <CardDescription>
                  Integrate music content from the Ninja Portal into SINet applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSongs ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-700 p-4 rounded-lg text-white mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold mb-1">Ninja Portal</h3>
                          <p className="text-indigo-100 text-sm">Decentralized music streaming and distribution platform</p>
                        </div>
                        <Badge className="bg-white/20 hover:bg-white/30 text-white">NULL_ISLAND</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {recentSongs?.map((song) => (
                        <Card key={song.id} className="overflow-hidden transition-all hover:shadow-md">
                          <div className="flex items-center">
                            <div className="h-16 w-16 bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-white">
                              <Music className="h-8 w-8" />
                            </div>
                            <CardContent className="flex-1 p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-medium">{song.title}</h3>
                                  <p className="text-sm text-muted-foreground">{song.artist}</p>
                                </div>
                                <div className="text-right">
                                  <Badge variant="outline" className="mb-1">{song.votes} votes</Badge>
                                  <p className="text-xs text-muted-foreground">{formatDate(song.createdAt)}</p>
                                </div>
                              </div>
                            </CardContent>
                            <div className="p-4">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleNinjaIntegration(song.id)}
                                disabled={ninjaMutation.isPending && selectedSong === song.id}
                              >
                                {ninjaMutation.isPending && selectedSong === song.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <ArrowRight className="h-4 w-4" />
                                )}
                                <span className="ml-2">Integrate</span>
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                    <div className="bg-muted p-4 rounded mt-4">
                      <h4 className="font-medium mb-2">About Ninja Portal Integration</h4>
                      <p className="text-sm text-muted-foreground">
                        The Ninja Portal is a decentralized music platform operating from NULL_ISLAND. Integration allows
                        you to connect music content with SINet applications through both standard APIs and experimental
                        quantum teleportation methods.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}