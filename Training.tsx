import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWebSocket } from "@/lib/useWebSocket";
import { type AIModel } from "@shared/schema";
import { Brain, Search, Activity, Server, Clock, Database, Download, ExternalLink, AlertTriangle, BookOpen, Github, Globe } from "lucide-react";
import { useState, useMemo } from "react";
import { SiHuggingface } from "react-icons/si";
import { FileText } from "lucide-react";

interface ModelDetailsProps {
  model: AIModel;
  onClose: () => void;
}

const ModelDetails = ({ model, onClose }: ModelDetailsProps) => {
  const isHuggingFace = model.trainingData.sourcePlatform === "huggingface";
  const isGithub = model.trainingData.sourcePlatform === "github";

  // Get source URL for "View Source" button
  const getSourceUrl = () => {
    if (isHuggingFace) {
      return `https://huggingface.co/${model.trainingData.sourceRepo}`;
    } else if (isGithub) {
      return `https://github.com/${model.trainingData.sourceRepo}`;
    }
    return "#";
  };

  // Get direct download URL for model file
  const getDownloadUrl = () => {
    return `/api/models/${model.id}/download`;
  };

  // Function to format region name for display
  const formatRegionName = (region: string | null | undefined) => {
    if (!region) return "Global";

    if (region === "null_island") return "Null Island";

    return region.charAt(0).toUpperCase() + region.slice(1);
  };

  // Function to get region badge variant
  const getRegionVariant = (region: string | null | undefined) => {
    if (!region) return "outline";

    switch (region) {
      case "east": return "default";
      case "west": return "secondary";
      case "null_island": return "destructive";
      default: return "outline";
    }
  };

  return (
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-2xl">
          <Brain className="h-6 w-6" />
          {model.name}
          {model.isExperimental && (
            <Badge variant="destructive" className="ml-2">Experimental</Badge>
          )}
        </DialogTitle>
        <DialogDescription>
          {model.description || `Training ${model.trainingData.task} model with advanced architecture`}
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Training Information</h3>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-muted-foreground">Training Progress</span>
              <span>{model.progress}%</span>
            </div>
            <Progress value={model.progress} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-muted-foreground">Accuracy</span>
              <span>{model.accuracy}%</span>
            </div>
            <Progress value={model.accuracy} className="h-2 bg-primary/20" />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <div className="text-sm text-muted-foreground">Dataset Size</div>
              <div className="font-semibold">
                {model.trainingData.datasetSize.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Epochs</div>
              <div className="font-semibold">
                {model.trainingData.epochsCompleted}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Loss Rate</div>
              <div className="font-semibold">
                {model.trainingData.lossRate.toFixed(4)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Model Type</div>
              <div className="font-semibold capitalize">
                {model.trainingData.modelType || "Transformer"}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Usage Information</h3>

          <div className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Best Use Cases</div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{model.trainingData.task}</Badge>
                {model.trainingData.task === "text-generation" && (
                  <>
                    <Badge variant="outline">Content Creation</Badge>
                    <Badge variant="outline">Chatbots</Badge>
                  </>
                )}
                {model.trainingData.task === "text-classification" && (
                  <>
                    <Badge variant="outline">Sentiment Analysis</Badge>
                    <Badge variant="outline">Document Classification</Badge>
                  </>
                )}
                {model.trainingData.task === "translation" && (
                  <>
                    <Badge variant="outline">Multilingual NLP</Badge>
                    <Badge variant="outline">Cross-lingual Transfer</Badge>
                  </>
                )}
                {model.trainingData.task === "vision-language" && (
                  <>
                    <Badge variant="outline">Image Understanding</Badge>
                    <Badge variant="outline">Multimodal Retrieval</Badge>
                  </>
                )}
                {model.trainingData.task === "image-generation" && (
                  <>
                    <Badge variant="outline">Creative Design</Badge>
                    <Badge variant="outline">Content Creation</Badge>
                  </>
                )}
                {model.trainingData.task === "reasoning" && (
                  <>
                    <Badge variant="outline">Logical Reasoning</Badge>
                    <Badge variant="outline">Decision Making</Badge>
                  </>
                )}
                {model.trainingData.task === "general-purpose" && (
                  <>
                    <Badge variant="outline">Multi-domain</Badge>
                    <Badge variant="outline">Assistant</Badge>
                  </>
                )}
                {model.trainingData.task === "3d-generation" && (
                  <>
                    <Badge variant="outline">3D Assets</Badge>
                    <Badge variant="outline">Graphics</Badge>
                  </>
                )}
                {model.trainingData.task === "quantum-enhanced" && (
                  <>
                    <Badge variant="outline">Complex Calculations</Badge>
                    <Badge variant="outline">Research</Badge>
                  </>
                )}
                {model.trainingData.task === "protein-structure" && (
                  <>
                    <Badge variant="outline">Scientific Research</Badge>
                    <Badge variant="outline">Biomedical</Badge>
                  </>
                )}
                {model.trainingData.task === "music-creation" && (
                  <>
                    <Badge variant="outline">Audio Generation</Badge>
                    <Badge variant="outline">Creative Media</Badge>
                  </>
                )}
                {model.trainingData.task === "gaming-analysis" && (
                  <>
                    <Badge variant="outline">Game Development</Badge>
                    <Badge variant="outline">Performance Analysis</Badge>
                  </>
                )}
                {(model.trainingData.task === "bilingual" || model.trainingData.task === "chinese-nlp") && (
                  <>
                    <Badge variant="outline">Multilingual</Badge>
                    <Badge variant="outline">Cultural Context</Badge>
                  </>
                )}
                {model.trainingData.task === "on-device-inference" && (
                  <>
                    <Badge variant="outline">Mobile</Badge>
                    <Badge variant="outline">Edge Computing</Badge>
                  </>
                )}
                {model.trainingData.task === "hardware-optimization" && (
                  <>
                    <Badge variant="outline">Efficiency</Badge>
                    <Badge variant="outline">Low-power Systems</Badge>
                  </>
                )}
                {model.trainingData.task === "large-scale-training" && (
                  <>
                    <Badge variant="outline">Distributed Systems</Badge>
                    <Badge variant="outline">High-performance Computing</Badge>
                  </>
                )}
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-1">Network Region</div>
              <Badge variant={getRegionVariant(model.region)} className="flex items-center gap-1 w-fit">
                <Globe className="h-3.5 w-3.5" />
                {formatRegionName(model.region)}
              </Badge>
            </div>

            {model.trainingData.sourceRepo && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">Repository</div>
                <div className="flex items-center gap-2">
                  {isHuggingFace && <SiHuggingface className="h-4 w-4" />}
                  {isGithub && <Github className="h-4 w-4" />}
                  <a 
                    href={getSourceUrl()} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-primary hover:underline truncate"
                  >
                    {model.trainingData.sourceRepo}
                  </a>
                </div>
              </div>
            )}

            {model.isExperimental && (
              <div className="bg-destructive/10 p-3 rounded-md mt-2">
                <div className="flex gap-2 items-start">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-destructive">Experimental Model</h4>
                    <p className="text-sm text-muted-foreground">
                      This model is in experimental stage and may produce unpredictable results.
                      Use with caution in production environments.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-auto pt-4">
            <div className="text-sm text-muted-foreground mb-1">Implementation Guides</div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="gap-1" asChild>
                <a href={`https://huggingface.co/docs/transformers/model_doc/${model.name.toLowerCase().replace(/-/g, '_')}`} target="_blank" rel="noreferrer">
                  <BookOpen className="h-4 w-4" />
                  <span>Documentation</span>
                </a>
              </Button>
              <Button variant="outline" size="sm" className="gap-1" asChild>
                <a href={`https://paperswithcode.com/search?q=${encodeURIComponent(model.name)}`} target="_blank" rel="noreferrer">
                  <FileText className="h-4 w-4" />
                  <span>Research Papers</span>
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button variant="outline" size="sm" className="gap-1" asChild>
          <a href={getSourceUrl()} target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4" />
            <span>View Source</span>
          </a>
        </Button>
        <Button className="gap-2" asChild>
          <a href={getDownloadUrl()} download={`${model.name.toLowerCase().replace(/\s/g, '_')}_model.zip`}>
            <Download className="h-4 w-4" />
            <span>Download Model</span>
          </a>
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

const ModelCard = ({ model }: { model: AIModel }) => {
  const [showDetails, setShowDetails] = useState(false);

  const getSourceIcon = () => {
    if (model.trainingData.sourcePlatform === "huggingface") {
      return <SiHuggingface className="h-4 w-4 text-muted-foreground" />;
    } else if (model.trainingData.sourcePlatform === "github") {
      return <Github className="h-4 w-4 text-muted-foreground" />;
    }
    return null;
  };

  // Get direct download URL for model file
  const getDownloadUrl = () => {
    return `/api/models/${model.id}/download`;
  };

  // Function to format region name for display
  const formatRegionName = (region: string | null | undefined) => {
    if (!region) return "Global";

    if (region === "null_island") return "Null Island";

    return region.charAt(0).toUpperCase() + region.slice(1);
  };

  // Function to get region badge variant
  const getRegionVariant = (region: string | null | undefined) => {
    if (!region) return "outline";

    switch (region) {
      case "east": return "default";
      case "west": return "secondary";
      case "null_island": return "destructive";
      default: return "outline";
    }
  };

  return (
    <>
      <Card className="relative">
        {model.isExperimental && (
          <Badge variant="destructive" className="absolute right-2 top-2">
            Experimental
          </Badge>
        )}
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              <span>{model.name}</span>
            </div>
            <Badge 
              variant={model.status === "complete" ? "default" : 
                      model.status === "training" ? "secondary" : "destructive"}
            >
              {model.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Training Progress</span>
                <span>{model.progress}%</span>
              </div>
              <Progress value={model.progress} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Accuracy</span>
                <span>{model.accuracy}%</span>
              </div>
              <Progress value={model.accuracy} className="h-2 bg-primary/20" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <div className="text-sm text-muted-foreground">Dataset Size</div>
                <div className="text-xl font-semibold">
                  {model.trainingData.datasetSize.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Epochs</div>
                <div className="text-xl font-semibold">
                  {model.trainingData.epochsCompleted}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Loss Rate</div>
                <div className="text-xl font-semibold">
                  {model.trainingData.lossRate.toFixed(4)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Node</div>
                <div className="text-xl font-semibold">#{model.nodeId}</div>
              </div>
            </div>

            {model.status === "training" && (
              <div className="flex items-center gap-2 pt-4 border-t text-sm text-muted-foreground">
                <Activity className="w-4 h-4 animate-pulse" />
                <span>Training in progress...</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-4 border-t">
              <div className="flex items-center gap-2">
                {getSourceIcon()}
                <Badge variant={getRegionVariant(model.region)} className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {formatRegionName(model.region)}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowDetails(true)}>
                  Details
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="gap-1"
                  asChild
                >
                  <a href={getDownloadUrl()} download={`${model.name.toLowerCase().replace(/\s/g, '_')}_model.zip`}>
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <ModelDetails model={model} onClose={() => setShowDetails(false)} />
      </Dialog>
    </>
  );
};

export default function Training() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("progress");
  const [showExperimental, setShowExperimental] = useState(true);
  const [regionFilter, setRegionFilter] = useState<string>("all");

  const { data: models = [] } = useQuery<AIModel[]>({ 
    queryKey: ["/api/models"]
  });

  const { lastMessage } = useWebSocket();

  const stats = useMemo(() => {
    const totalModels = models.length;
    const training = models.filter(m => m.status === "training").length;
    const completed = models.filter(m => m.status === "complete").length;
    const avgAccuracy = models.reduce((acc, m) => acc + m.accuracy, 0) / totalModels || 0;
    const totalDataPoints = models.reduce((acc, m) => acc + m.trainingData.datasetSize, 0);

    return {
      totalModels,
      training,
      completed,
      avgAccuracy,
      totalDataPoints
    };
  }, [models]);

  const filteredModels = useMemo(() => {
    return models.filter(model => {
      const matchesSearch = model.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || model.status === statusFilter;
      const matchesExperimental = showExperimental || !model.isExperimental;
      const matchesRegion = regionFilter === "all" || model.region === regionFilter;
      return matchesSearch && matchesStatus && matchesExperimental && matchesRegion;
    }).sort((a, b) => {
      switch (sortBy) {
        case "progress":
          return b.progress - a.progress;
        case "accuracy":
          return b.accuracy - a.accuracy;
        case "dataset":
          return b.trainingData.datasetSize - a.trainingData.datasetSize;
        default:
          return 0;
      }
    });
  }, [models, search, statusFilter, sortBy, showExperimental, regionFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">AI Model Training</h1>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="gap-2">
            <Brain className="w-4 h-4" />
            {stats.totalModels} Models
          </Badge>
          <Badge variant="outline" className="gap-2">
            <Activity className="w-4 h-4" />
            {stats.training} Training
          </Badge>
          <Badge variant="outline" className="gap-2">
            <Database className="w-4 h-4" />
            {stats.totalDataPoints.toLocaleString()} Data Points
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgAccuracy.toFixed(1)}%</div>
            <Progress value={stats.avgAccuracy} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Training Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.completed} / {stats.totalModels}
            </div>
            <Progress 
              value={(stats.completed / stats.totalModels) * 100} 
              className="mt-2" 
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search models..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="training">Training</SelectItem>
            <SelectItem value="complete">Complete</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={regionFilter} onValueChange={setRegionFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter by region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            <SelectItem value="east">East</SelectItem>
            <SelectItem value="west">West</SelectItem>
            <SelectItem value="null_island">Null Island</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="progress">Progress</SelectItem>
            <SelectItem value="accuracy">Accuracy</SelectItem>
            <SelectItem value="dataset">Dataset Size</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Button 
            variant={showExperimental ? "default" : "outline"} 
            size="sm"
            onClick={() => setShowExperimental(!showExperimental)}
            className="gap-1"
          >
            <AlertTriangle className="h-4 w-4" />
            {showExperimental ? "Hide Experimental" : "Show Experimental"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredModels.map(model => (
          <ModelCard key={model.id} model={model} />
        ))}
      </div>
    </div>
  );
}