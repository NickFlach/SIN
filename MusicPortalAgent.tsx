import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Music, Sparkles, Zap, MessageCircle, HelpCircle, ArrowRight, Check, Settings } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface MusicPortalAgentProps {
  onSongSelect?: (songId: number) => void;
}

const AGENT_STATES = {
  IDLE: 'idle',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  SUGGESTING: 'suggesting',
  LEARNING: 'learning'
};

const MusicPortalAgent: React.FC<MusicPortalAgentProps> = ({ onSongSelect }) => {
  const [agentState, setAgentState] = useState(AGENT_STATES.IDLE);
  const [userInput, setUserInput] = useState('');
  const [aiResponse, setAiResponse] = useState<string>('');
  const [conversation, setConversation] = useState<{role: string, content: string}[]>([
    {role: 'system', content: 'I am the Ninja Portal Music Agent. I can help you discover music and integrate it with SINet applications.'}
  ]);
  const [agentSettings, setAgentSettings] = useState({
    useQuantumTeleport: false,
    creativeMode: true,
    nullIslandAccess: true,
    autonomyLevel: 70
  });

  const { toast } = useToast();

  // Simulated agent guidance
  const agentGuidance = [
    "Suggest tracks from NULL_ISLAND artists",
    "Recommend quantum-inspired music",
    "Explore decentralized audio formats",
    "Connect to SINet music visualization",
    "Transfer audio features via quantum teleport",
    "Analyze musical patterns for AI training"
  ];

  // Mock function to simulate AI agent response
  const simulateAgentResponse = async (input: string) => {
    setAgentState(AGENT_STATES.PROCESSING);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate a contextual response based on input
    let response = '';

    if (input.toLowerCase().includes('quantum') || input.toLowerCase().includes('teleport')) {
      response = "I recommend using quantum teleportation for secure audio transfer. This will create an entangled state between source and destination, allowing for zero-knowledge verification of music data integrity across regions.";
    } else if (input.toLowerCase().includes('null island') || input.toLowerCase().includes('experimental')) {
      response = "NULL_ISLAND hosts our most experimental music collections. These tracks use advanced algorithmic composition techniques and quantum-inspired randomness to create unique audio experiences.";
    } else if (input.toLowerCase().includes('recommend') || input.toLowerCase().includes('suggest')) {
      response = "Based on SINet analytics, I recommend 'Quantum Harmony' by Neural Beats. This track has high resonance with quantum computing themes and would integrate well with your applications.";
    } else if (input === '') {
      response = "I'm ready to assist with music integration. Would you like recommendations for quantum-inspired tracks or help with integrating audio elements into your SINet applications?";
    } else {
      response = `I've analyzed your request about "${input}". I can help integrate relevant music content with your SINet applications through quantum-secure channels or standard APIs. Would you like me to demonstrate how the teleportation protocol works for music data?`;
    }

    setAiResponse(response);
    setConversation(prev => [...prev, {role: 'user', content: input}, {role: 'assistant', content: response}]);
    setAgentState(AGENT_STATES.SUGGESTING);

    return response;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const input = userInput;
    setUserInput('');
    setAgentState(AGENT_STATES.LISTENING);
    await simulateAgentResponse(input);
  };

  const handleQuickPrompt = async (prompt: string) => {
    setUserInput(prompt);
    setAgentState(AGENT_STATES.LISTENING);
    await simulateAgentResponse(prompt);
  };

  const handleSongSelection = (songId: number) => {
    toast({
      title: "Song Selected for Integration",
      description: `Song #${songId} has been selected for integration with SINet.`,
    });

    if (onSongSelect) {
      onSongSelect(songId);
    }
  };

  const toggleSetting = (setting: string) => {
    setAgentSettings(prev => ({
      ...prev,
      [setting]: !prev[setting as keyof typeof agentSettings]
    }));

    toast({
      title: "Agent Setting Updated",
      description: `${setting} has been ${!agentSettings[setting as keyof typeof agentSettings] ? 'enabled' : 'disabled'}.`,
    });
  };

  return (
    <Card className="w-full shadow-md border-t-4 border-t-purple-500">
      <CardHeader className="bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-950 dark:to-indigo-950">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center">
              <Music className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle>Music Portal Agent</CardTitle>
              <CardDescription>NULL_ISLAND Advanced Audio Interface</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="gap-1 border-purple-500">
            <div className={`h-2 w-2 rounded-full ${agentState === AGENT_STATES.IDLE ? 'bg-slate-400' : 
              agentState === AGENT_STATES.LISTENING ? 'bg-blue-500' : 
              agentState === AGENT_STATES.PROCESSING ? 'bg-amber-500 animate-pulse' : 
              agentState === AGENT_STATES.SUGGESTING ? 'bg-green-500' : 
              'bg-purple-500'}`} />
            <span className="text-xs">
              {agentState === AGENT_STATES.IDLE ? 'Standby' : 
              agentState === AGENT_STATES.LISTENING ? 'Listening' : 
              agentState === AGENT_STATES.PROCESSING ? 'Processing' : 
              agentState === AGENT_STATES.SUGGESTING ? 'Suggesting' : 
              'Learning'}
            </span>
          </Badge>
        </div>
      </CardHeader>

      <Tabs defaultValue="interact">
        <TabsList className="grid grid-cols-3 mx-6 mt-2">
          <TabsTrigger value="interact">
            <MessageCircle className="h-4 w-4 mr-2" />
            Interact
          </TabsTrigger>
          <TabsTrigger value="guidance">
            <HelpCircle className="h-4 w-4 mr-2" />
            Guidance
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="interact">
          <CardContent className="p-6">
            <ScrollArea className="h-48 rounded-md border p-4 mb-4">
              {conversation.slice(1).map((message, index) => (
                <div key={index} className={`mb-3 ${message.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block max-w-[85%] px-3 py-2 rounded-lg 
                    ${message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'}`}>
                    {message.content}
                  </div>
                </div>
              ))}
              {agentState === AGENT_STATES.PROCESSING && (
                <div className="mb-3">
                  <div className="inline-block max-w-[85%] px-3 py-2 rounded-lg bg-muted">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                </div>
              )}
              {conversation.length === 1 && agentState !== AGENT_STATES.PROCESSING && (
                <div className="text-center text-muted-foreground py-4">
                  Ask the Music Portal Agent for guidance or recommendations
                </div>
              )}
            </ScrollArea>

            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                placeholder="Ask about music integration..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="sm">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex-col gap-2">
            <p className="text-sm text-muted-foreground mb-2">Quick prompts:</p>
            <div className="flex flex-wrap gap-2">
              {agentGuidance.slice(0, 3).map((prompt, index) => (
                <Button 
                  key={index} 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleQuickPrompt(prompt)}
                  className="text-xs"
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </CardFooter>
        </TabsContent>

        <TabsContent value="guidance">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-md">
                <h4 className="font-medium flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  Agent Capabilities
                </h4>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Quantum teleportation of audio data between regions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>NULL_ISLAND exclusive content discovery</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>AI-powered music recommendations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Cross-app music integration</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Integration Tips</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  To integrate music with your SINet applications:
                </p>
                <ol className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      1
                    </div>
                    <div>
                      <p>Select a song from the Ninja Portal collection</p>
                      <p className="text-xs text-muted-foreground">Use the agent to find recommended tracks</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      2
                    </div>
                    <div>
                      <p>Choose integration method (Standard or Quantum)</p>
                      <p className="text-xs text-muted-foreground">Quantum offers enhanced security for NULL_ISLAND content</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      3
                    </div>
                    <div>
                      <p>Verify integration with Zero Knowledge Proof</p>
                      <p className="text-xs text-muted-foreground">Required for experimental tracks</p>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          </CardContent>
        </TabsContent>

        <TabsContent value="settings">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="quantum-teleport">Quantum Teleportation</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable Zero Knowledge Proof teleportation
                  </p>
                </div>
                <Switch
                  id="quantum-teleport"
                  checked={agentSettings.useQuantumTeleport}
                  onCheckedChange={() => toggleSetting('useQuantumTeleport')}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="creative-mode">Creative Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Allow agent to suggest experimental content
                  </p>
                </div>
                <Switch
                  id="creative-mode"
                  checked={agentSettings.creativeMode}
                  onCheckedChange={() => toggleSetting('creativeMode')}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="null-island">NULL_ISLAND Access</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable access to experimental NULL_ISLAND content
                  </p>
                </div>
                <Switch
                  id="null-island"
                  checked={agentSettings.nullIslandAccess}
                  onCheckedChange={() => toggleSetting('nullIslandAccess')}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="autonomy">Agent Autonomy Level</Label>
                  <span className="text-xs text-muted-foreground">{agentSettings.autonomyLevel}%</span>
                </div>
                <input
                  id="autonomy"
                  type="range"
                  min="0"
                  max="100"
                  value={agentSettings.autonomyLevel}
                  onChange={(e) => setAgentSettings(prev => ({ ...prev, autonomyLevel: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Guided</span>
                  <span>Balanced</span>
                  <span>Autonomous</span>
                </div>
              </div>
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>

      <div className="px-6 py-3 bg-muted/30">
        <p className="text-xs text-muted-foreground flex items-center">
          <Zap className="h-3 w-3 mr-1 text-purple-500" />
          NULL_ISLAND Protocol: Advanced music integration through quantum-inspired channels
        </p>
      </div>
    </Card>
  );
};

export default MusicPortalAgent;