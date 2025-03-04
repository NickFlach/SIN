import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useWebSocket } from "@/lib/useWebSocket";
import { type GovernanceProposal, Region, REGIONS } from "@shared/schema";
import { Vote, Check, X, AlertTriangle, Wrench, Code, Network, Zap, ThumbsUp, Link2, Shield, 
         BarChart4, FileCode2, ArrowRight, BarChart3, Database, RefreshCw,
         Eye, FileJson, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import DemoDisclaimer from "@/components/DemoDisclaimer";
import { cn } from "@/lib/utils";

interface BlockchainTransaction {
  id: string;
  type: 'proposal' | 'vote' | 'execution';
  data: any;
  signature: string;
  timestamp: number;
  address: string;
}

const proposalFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  region: z.enum([REGIONS.EAST, REGIONS.WEST, REGIONS.NULL_ISLAND]),
  isGlobal: z.boolean().default(false),
  threshold: z.number().min(1, "Threshold must be at least 1").max(1000, "Threshold must be less than 1000"),
  impact: z.enum(['low', 'medium', 'high']).default('medium')
});

type ProposalFormValues = z.infer<typeof proposalFormSchema>;

export default function Governance() {
  const [activeTab, setActiveTab] = useState("proposals");
  const [isNewProposalOpen, setIsNewProposalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<GovernanceProposal | null>(null);
  const [showBlockchainDetails, setShowBlockchainDetails] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<BlockchainTransaction | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const refetchTransactions = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/blockchain/transactions"] });
    toast({
      title: "Refreshing blockchain data",
      description: "Fetching the latest transactions from the blockchain",
    });
  };
  
  const { data: proposals } = useQuery<GovernanceProposal[]>({ 
    queryKey: ["/api/proposals"]
  });

  const { data: transactions } = useQuery<BlockchainTransaction[]>({
    queryKey: ["/api/blockchain/transactions"],
    enabled: activeTab === "blockchain"
  });

  const { data: globalProposals } = useQuery<GovernanceProposal[]>({
    queryKey: ["/api/proposals/global"],
    enabled: activeTab === "proposals"
  });

  const { lastMessage } = useWebSocket();

  // Form setup
  const form = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalFormSchema),
    defaultValues: {
      title: "",
      description: "",
      region: REGIONS.EAST,
      isGlobal: false,
      threshold: 10,
      impact: 'medium'
    }
  });
  
  // Create proposal mutation
  const createProposal = useMutation({
    mutationFn: (data: ProposalFormValues) => 
      apiRequest("/api/proposals", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/proposals/global"] });
      toast({
        title: "Proposal created",
        description: "Your proposal has been created and submitted to the blockchain",
      });
      setIsNewProposalOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error creating proposal",
        description: "There was a problem creating your proposal. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Vote mutation
  const voteOnProposal = useMutation({
    mutationFn: (proposalId: number) => 
      apiRequest(`/api/proposals/${proposalId}/vote`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/proposals/global"] });
      toast({
        title: "Vote submitted",
        description: "Your vote has been recorded on the blockchain",
      });
      setSelectedProposal(null);
    }
  });

  function onSubmit(data: ProposalFormValues) {
    console.log('Submitting proposal data:', data);
    
    // Convert threshold to number if it's a string
    const formattedData = {
      ...data,
      threshold: typeof data.threshold === 'string' ? parseInt(data.threshold, 10) : data.threshold
    };
    
    console.log('Formatted data for submission:', formattedData);
    createProposal.mutate(formattedData);
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'secondary';
      case 'passed':
        return 'default';
      case 'failed':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getProposalIcon = (title: string) => {
    if (title.toLowerCase().includes('bug') || title.toLowerCase().includes('issue')) {
      return <AlertTriangle className="w-4 h-4" />;
    }
    if (title.toLowerCase().includes('infrastructure') || title.toLowerCase().includes('system')) {
      return <Wrench className="w-4 h-4" />;
    }
    if (title.toLowerCase().includes('feature') || title.toLowerCase().includes('development')) {
      return <Code className="w-4 h-4" />;
    }
    if (title.toLowerCase().includes('network') || title.toLowerCase().includes('connection')) {
      return <Network className="w-4 h-4" />;
    }
    return <Vote className="w-4 h-4" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <Check className="w-4 h-4" />;
      case 'failed':
        return <X className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'proposal':
        return <FileCode2 className="w-4 h-4" />;
      case 'vote':
        return <ThumbsUp className="w-4 h-4" />;
      case 'execution':
        return <Zap className="w-4 h-4" />;
      default:
        return <Link2 className="w-4 h-4" />;
    }
  };

  const getRegionBadge = (region: Region) => {
    const colors: Record<Region, string> = {
      'east': 'bg-blue-100 text-blue-800',
      'west': 'bg-purple-100 text-purple-800',
      'null_island': 'bg-orange-100 text-orange-800',
    };
    
    return (
      <span className={`text-xs px-2.5 py-0.5 rounded-full ${colors[region]}`}>
        {region}
      </span>
    );
  };

  const getImpactBadge = (impact: string) => {
    const colors: Record<string, string> = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-red-100 text-red-800',
    };
    
    return (
      <span className={`text-xs px-2.5 py-0.5 rounded-full ${colors[impact || 'medium']}`}>
        {impact || 'medium'} impact
      </span>
    );
  };

  const ProposalDetails = ({ proposal }: { proposal: GovernanceProposal }) => (
    <Dialog open={!!proposal} onOpenChange={() => setSelectedProposal(null)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getProposalIcon(proposal.title)}
            {proposal.title}
          </DialogTitle>
          <div className="flex gap-2 mt-2">
            <Badge variant={getStatusColor(proposal.status)}>
              {proposal.status}
            </Badge>
            {getRegionBadge(proposal.region as Region)}
            {getImpactBadge(proposal.impact || 'medium')}
            {proposal.isGlobal && (
              <Badge variant="outline">Global</Badge>
            )}
          </div>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-muted-foreground">{proposal.description}</p>
          
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-muted-foreground">
                Votes ({proposal.votes} / {proposal.threshold})
              </span>
              <span>
                {((proposal.votes / proposal.threshold) * 100).toFixed(1)}%
              </span>
            </div>
            <Progress value={(proposal.votes / proposal.threshold) * 100} />
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Required:</span>
              <span className="ml-2">{proposal.threshold} votes</span>
            </div>
            <div>
              <span className="text-muted-foreground">Proposed by:</span>
              <span className="ml-2">{proposal.proposedBy}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Created:</span>
              <span className="ml-2">
                {new Date(proposal.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Expires:</span>
              <span className="ml-2">
                {proposal.expiresAt ? new Date(proposal.expiresAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
          
          {proposal.blockchainTxId && (
            <div className="border rounded-md p-3 mt-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Blockchain Verification
                </h4>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowBlockchainDetails(!showBlockchainDetails)}
                >
                  {showBlockchainDetails ? "Hide Details" : "Show Details"}
                </Button>
              </div>
              
              {showBlockchainDetails && (
                <div className="space-y-2 mt-3 text-xs font-mono bg-muted p-2 rounded">
                  <div>
                    <span className="text-muted-foreground">Transaction ID:</span>
                    <span className="ml-2 break-all">{proposal.blockchainTxId}</span>
                  </div>
                  {proposal.blockchainAddress && (
                    <div>
                      <span className="text-muted-foreground">Address:</span>
                      <span className="ml-2 break-all">{proposal.blockchainAddress}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter>
          {proposal.status === 'active' && (
            <Button 
              onClick={() => voteOnProposal.mutate(proposal.id)}
              disabled={voteOnProposal.isPending}
            >
              {voteOnProposal.isPending ? "Processing..." : "Vote For Proposal"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">System Governance</h1>
          <p className="text-muted-foreground">Blockchain-based Transparent Decision Making</p>
        </div>
        <Button onClick={() => setIsNewProposalOpen(true)}>
          <FileCode2 className="mr-2 h-4 w-4" />
          New Proposal
        </Button>
      </div>
      
      <DemoDisclaimer />
      
      <Tabs defaultValue="proposals" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="proposals">
            <Vote className="mr-2 h-4 w-4" />
            Proposals
          </TabsTrigger>
          <TabsTrigger value="blockchain">
            <Link2 className="mr-2 h-4 w-4" />
            Blockchain Ledger
          </TabsTrigger>
          <TabsTrigger value="global">
            <BarChart4 className="mr-2 h-4 w-4" />
            Global Proposals
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="proposals" className="space-y-4">
          <div className="grid gap-4">
            {proposals?.map(proposal => (
              <Card key={proposal.id} className="hover:bg-accent/50 cursor-pointer transition-colors" onClick={() => setSelectedProposal(proposal)}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getProposalIcon(proposal.title)}
                      <span>{proposal.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getRegionBadge(proposal.region as Region)}
                      <Badge 
                        variant={getStatusColor(proposal.status)}
                        className="flex items-center gap-1"
                      >
                        {getStatusIcon(proposal.status)}
                        {proposal.status}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-muted-foreground line-clamp-2">{proposal.description}</p>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-muted-foreground text-sm">
                          Votes: {proposal.votes} / {proposal.threshold}
                        </span>
                        <span className="text-sm">
                          {((proposal.votes / proposal.threshold) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress 
                        value={(proposal.votes / proposal.threshold) * 100}
                        className={
                          proposal.status === 'passed' 
                            ? 'bg-primary/20' 
                            : proposal.status === 'failed'
                            ? 'bg-destructive/20'
                            : ''
                        }
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="text-xs text-muted-foreground flex justify-between">
                  <div>Proposed by: {proposal.proposedBy}</div>
                  {proposal.blockchainTxId && (
                    <div className="flex items-center">
                      <Shield className="w-3 h-3 mr-1" /> Blockchain verified
                    </div>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="blockchain" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Blockchain Explorer</CardTitle>
                <CardDescription>
                  SINet Governance Blockchain - Immutable transaction ledger
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  <span className="text-xs">
                    {transactions?.length || 0} Transactions
                  </span>
                </Badge>
                <Button variant="outline" size="sm" onClick={() => refetchTransactions()}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="ledger">
                <TabsList className="mb-4">
                  <TabsTrigger value="ledger">
                    <Database className="mr-1 h-4 w-4" />
                    Transaction Ledger
                  </TabsTrigger>
                  <TabsTrigger value="chain">
                    <Link2 className="mr-1 h-4 w-4" />
                    Blockchain Visualization
                  </TabsTrigger>
                  <TabsTrigger value="stats">
                    <BarChart4 className="mr-1 h-4 w-4" />
                    Network Stats
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="ledger">
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium">Type</th>
                          <th className="px-4 py-2 text-left text-xs font-medium">TX ID</th>
                          <th className="px-4 py-2 text-left text-xs font-medium">Address</th>
                          <th className="px-4 py-2 text-left text-xs font-medium">Data</th>
                          <th className="px-4 py-2 text-left text-xs font-medium">Timestamp</th>
                          <th className="px-4 py-2 text-left text-xs font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {transactions?.map((tx) => (
                          <tr key={tx.id} className="hover:bg-muted/50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {getTransactionIcon(tx.type)}
                                <span className="capitalize">{tx.type}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs truncate max-w-[140px]">
                              {tx.id}
                            </td>
                            <td className="px-4 py-3 font-mono text-xs truncate max-w-[120px]">
                              {tx.address}
                            </td>
                            <td className="px-4 py-3 text-xs max-w-[200px] truncate">
                              {tx.data ? (
                                <div className="truncate">
                                  {tx.type === 'proposal' ? (
                                    <span>Proposal: {tx.data.title || tx.data.proposalId}</span>
                                  ) : tx.type === 'vote' ? (
                                    <span>Vote: {tx.data.vote} on #{tx.data.proposalId}</span>
                                  ) : tx.type === 'execution' ? (
                                    <span>Execution of #{tx.data.proposalId}</span>
                                  ) : (
                                    <span>{JSON.stringify(tx.data).substring(0, 50)}...</span>
                                  )}
                                </div>
                              ) : "No data"}
                            </td>
                            <td className="px-4 py-3 text-xs whitespace-nowrap">
                              {new Date(tx.timestamp).toLocaleString()}
                            </td>
                            <td className="px-4 py-3">
                              <Button variant="ghost" size="icon" 
                                onClick={() => setSelectedTransaction(tx)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                        
                        {!transactions?.length && (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                              No transactions found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
                
                <TabsContent value="chain">
                  <Card className="relative overflow-hidden">
                    <CardHeader className="pb-0">
                      <CardTitle className="text-base">Blockchain Visualization</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="flex flex-wrap items-stretch gap-2 mt-2">
                        {transactions?.slice(0, 10).map((tx, index) => (
                          <div key={tx.id} className="flex items-center">
                            <div 
                              className={cn(
                                "px-3 py-2 rounded-md text-xs font-mono flex items-center",
                                tx.type === 'proposal' ? 'bg-blue-100 dark:bg-blue-950' :
                                tx.type === 'vote' ? 'bg-green-100 dark:bg-green-950' :
                                'bg-purple-100 dark:bg-purple-950'
                              )}
                            >
                              <span className="mr-2">{index}</span>
                              <span className="mr-2">{getTransactionIcon(tx.type)}</span>
                              <span 
                                className="truncate max-w-[80px]" 
                                title={`${tx.type}: ${tx.id}`}
                              >
                                {tx.id.substring(0, 8)}
                              </span>
                            </div>
                            {index < 9 && (
                              <ArrowRight className="h-4 w-4 mx-1 text-muted-foreground" />
                            )}
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-8 text-center text-sm">
                        <p className="text-muted-foreground italic">
                          {transactions?.length 
                            ? `Displaying ${Math.min(transactions.length, 10)} out of ${transactions.length} total transactions`
                            : "No transactions found in the blockchain"
                          }
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="stats">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Blockchain Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <p className="text-muted-foreground text-xs">Total Transactions</p>
                          <p className="text-2xl font-bold">{transactions?.length || 0}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground text-xs">Proposals</p>
                          <p className="text-2xl font-bold">
                            {transactions?.filter(tx => tx.type === 'proposal').length || 0}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground text-xs">Votes</p>
                          <p className="text-2xl font-bold">
                            {transactions?.filter(tx => tx.type === 'vote').length || 0}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground text-xs">Executions</p>
                          <p className="text-2xl font-bold">
                            {transactions?.filter(tx => tx.type === 'execution').length || 0}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-8 pt-4 border-t">
                        <h4 className="text-sm font-medium mb-3">Transaction Types Distribution</h4>
                        <div className="h-[120px] w-full">
                          {transactions?.length ? (
                            <div className="relative h-full">
                              <div className="absolute inset-0 flex">
                                {['proposal', 'vote', 'execution'].map((type, i) => {
                                  const count = transactions.filter(tx => tx.type === type).length;
                                  const percentage = Math.round((count / transactions.length) * 100);
                                  return (
                                    <div 
                                      key={type}
                                      className={cn(
                                        "h-full relative group",
                                        type === 'proposal' ? 'bg-blue-500' : 
                                        type === 'vote' ? 'bg-green-500' : 
                                        'bg-purple-500',
                                      )}
                                      style={{ width: `${percentage}%` }}
                                    >
                                      <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium">
                                        {percentage > 15 ? `${percentage}%` : ''}
                                      </div>
                                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-background shadow-md rounded p-2 text-xs z-10 whitespace-nowrap">
                                        {count} {type}s ({percentage}%)
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
                              No data available
                            </div>
                          )}
                        </div>
                        <div className="flex justify-center mt-4 gap-6">
                          {['proposal', 'vote', 'execution'].map(type => (
                            <div key={type} className="flex items-center gap-2 text-xs">
                              <div
                                className={cn(
                                  "w-3 h-3 rounded",
                                  type === 'proposal' ? 'bg-blue-500' : 
                                  type === 'vote' ? 'bg-green-500' : 
                                  'bg-purple-500'
                                )}
                              />
                              <span className="capitalize">{type}s</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="global" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Global Governance Proposals</CardTitle>
              <CardDescription>
                Proposals that affect all regions of the SINet ecosystem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {globalProposals?.map(proposal => (
                  <div 
                    key={proposal.id} 
                    className="border rounded-md p-4 hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedProposal(proposal)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        {getProposalIcon(proposal.title)}
                        <span className="font-medium">{proposal.title}</span>
                      </div>
                      <Badge variant={getStatusColor(proposal.status)}>
                        {proposal.status}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {proposal.description}
                    </p>
                    
                    <div className="flex justify-between text-xs">
                      <span>Votes: {proposal.votes}/{proposal.threshold}</span>
                      <span>Created: {new Date(proposal.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
                
                {!globalProposals?.length && (
                  <div className="text-center py-8 text-muted-foreground">
                    No global proposals found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* New Proposal Dialog */}
      <Dialog open={isNewProposalOpen} onOpenChange={setIsNewProposalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Governance Proposal</DialogTitle>
            <DialogDescription>
              Submit a new proposal to the SINet governance system. This will be recorded on the blockchain.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proposal Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enhance node communication protocol" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detailed description of the proposed changes..." 
                        className="min-h-[120px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Region</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a region" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={REGIONS.EAST}>East Region</SelectItem>
                          <SelectItem value={REGIONS.WEST}>West Region</SelectItem>
                          <SelectItem value={REGIONS.NULL_ISLAND}>Null Island</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="impact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Impact Level</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select impact level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low Impact</SelectItem>
                          <SelectItem value="medium">Medium Impact</SelectItem>
                          <SelectItem value="high">High Impact</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="threshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vote Threshold</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1} 
                          max={1000} 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value))} 
                        />
                      </FormControl>
                      <FormDescription>Votes needed to pass</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isGlobal"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between space-x-3 space-y-0 rounded-md border p-4 mt-8">
                      <div className="space-y-1 leading-none">
                        <FormLabel>Global Proposal</FormLabel>
                        <FormDescription>
                          Affects all regions
                        </FormDescription>
                      </div>
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="accent-primary h-4 w-4 rounded"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button type="submit" disabled={createProposal.isPending}>
                  {createProposal.isPending ? "Submitting..." : "Submit Proposal"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {selectedProposal && <ProposalDetails proposal={selectedProposal} />}
      
      {/* Transaction details modal */}
      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-1 rounded bg-muted">
                {getTransactionIcon(selectedTransaction?.type || 'proposal')}
              </div>
              <span className="capitalize">
                {selectedTransaction?.type || ''} Transaction Details
              </span>
            </DialogTitle>
            <DialogDescription>
              Blockchain transaction record with cryptographic verification
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Transaction Information
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-3 gap-1 items-center">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="capitalize col-span-2 flex items-center gap-1">
                      {getTransactionIcon(selectedTransaction?.type || 'proposal')}
                      {selectedTransaction?.type}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 items-start">
                    <span className="text-muted-foreground">TX ID:</span>
                    <code className="bg-muted px-1 py-0.5 rounded text-xs col-span-2 break-all">
                      {selectedTransaction?.id}
                    </code>
                  </div>
                  <div className="grid grid-cols-3 gap-1 items-start">
                    <span className="text-muted-foreground">Address:</span>
                    <code className="bg-muted px-1 py-0.5 rounded text-xs col-span-2 break-all">
                      {selectedTransaction?.address}
                    </code>
                  </div>
                  <div className="grid grid-cols-3 gap-1 items-center">
                    <span className="text-muted-foreground">Timestamp:</span>
                    <span className="col-span-2">
                      {selectedTransaction 
                        ? new Date(selectedTransaction.timestamp).toLocaleString() 
                        : '-'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 items-start">
                    <span className="text-muted-foreground">Signature:</span>
                    <code className="bg-muted px-1 py-0.5 rounded text-xs col-span-2 break-all">
                      {selectedTransaction?.signature}
                    </code>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <FileJson className="h-4 w-4" />
                  Transaction Data
                </h4>
                <div className="bg-muted p-3 rounded-md text-xs font-mono h-[220px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap">
                    {selectedTransaction?.data 
                      ? JSON.stringify(selectedTransaction.data, null, 2)
                      : '{}'}
                  </pre>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Blockchain Verification
              </h4>
              <div className="bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-300 p-3 rounded-md text-sm">
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 mt-0.5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-medium">Transaction verified on SINet governance blockchain</p>
                    <p className="text-xs mt-1 text-green-700 dark:text-green-400">
                      This transaction has been cryptographically verified and permanently
                      recorded on the immutable SINet governance blockchain. It cannot be altered or deleted.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTransaction(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}