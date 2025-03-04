import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Globe, Star, Zap, ExternalLink, Building, Code, Database, Shield, Sparkles, 
  Cloud, Cpu, Aperture, Brain, Server, Key, Laptop, BookOpen, Check, Box, 
  Search, Monitor, Music, Share2, Radio, Smartphone, BarChart
} from "lucide-react";
import { SiGoogle, SiPalantir, SiX, SiAnthropic, SiCardano, SiSynology, SiNec, SiGithub } from "react-icons/si";
import { REGIONS } from "@shared/schema";

// Define partners for each region
const partners = {
  [REGIONS.EAST]: [
    {
      name: "Oort",
      description: "Decentralized cloud storage platform utilizing excess capacity across the network",
      logo: Building,
      type: "Storage",
      specialization: "Distributed File Systems",
      collaboration: "High-performance distributed storage for training data",
      website: "https://oort.tech",
      color: "bg-blue-100 dark:bg-blue-900"
    },
    {
      name: "NEO",
      description: "Smart economy platform that combines digital assets, digital identities, and smart contracts",
      logo: SiNec,
      type: "Blockchain",
      specialization: "Smart Contracts",
      collaboration: "Secure model verification and attestation",
      website: "https://neo.org",
      color: "bg-green-100 dark:bg-green-900"
    },
    {
      name: "Ontology",
      description: "High-performance public blockchain specialized in digital identity and data",
      logo: SiSynology,
      type: "Identity",
      specialization: "Decentralized Identity",
      collaboration: "User authentication and permissions framework",
      website: "https://ont.io",
      color: "bg-yellow-100 dark:bg-yellow-900"
    },
    {
      name: "IOHK",
      description: "Engineering company that builds cryptocurrencies and blockchains for academic institutions",
      logo: SiCardano,
      type: "Research",
      specialization: "Formal Verification",
      collaboration: "Academic research partnership for model verification",
      website: "https://iohk.io",
      color: "bg-red-100 dark:bg-red-900"
    },
    {
      name: "Sony AI",
      description: "Research division developing AI solutions for entertainment, creativity and gastronomy",
      logo: Music,
      type: "Research",
      specialization: "Creative AI",
      collaboration: "Generative AI models for media production and creative applications",
      website: "https://ai.sony",
      color: "bg-gray-100 dark:bg-gray-900"
    },
    {
      name: "Samsung Research",
      description: "Advanced research lab developing next-generation AI for consumer electronics",
      logo: Smartphone,
      type: "Hardware",
      specialization: "Edge Computing",
      collaboration: "Edge AI implementations for SCADA devices and IoT integration",
      website: "https://research.samsung.com",
      color: "bg-blue-100 dark:bg-blue-900"
    },
    {
      name: "Tsinghua University",
      description: "Premier academic institution conducting cutting-edge AI research in Asia",
      logo: BookOpen,
      type: "Academic",
      specialization: "Computer Vision",
      collaboration: "Computer vision models for SCADA monitoring and industrial applications",
      website: "https://www.tsinghua.edu.cn",
      color: "bg-emerald-100 dark:bg-emerald-900"
    },
    {
      name: "Huawei Cloud",
      description: "Leading provider of cloud computing and AI solutions across Asia and Europe",
      logo: Cloud,
      type: "Cloud",
      specialization: "Edge Computing",
      collaboration: "Distributed hardware infrastructure for East region nodes",
      website: "https://www.huaweicloud.com",
      color: "bg-red-100 dark:bg-red-900"
    }
  ],
  [REGIONS.WEST]: [
    {
      name: "Palantir",
      description: "Software company specializing in big data analytics and AI integration",
      logo: SiPalantir,
      type: "Analytics",
      specialization: "Data Integration",
      collaboration: "Enterprise-scale data processing infrastructure",
      website: "https://palantir.com",
      color: "bg-purple-100 dark:bg-purple-900"
    },
    {
      name: "Google",
      description: "Technology leader with expertise in search, cloud computing, and AI research",
      logo: SiGoogle,
      type: "Cloud",
      specialization: "AI Infrastructure",
      collaboration: "TPU/GPU compute resources and TensorFlow integration",
      website: "https://cloud.google.com",
      color: "bg-blue-100 dark:bg-blue-900"
    },
    {
      name: "Anthropic",
      description: "AI safety company focused on developing reliable, interpretable AI systems",
      logo: SiAnthropic,
      type: "AI Safety",
      specialization: "Language Models",
      collaboration: "Constitutional AI principles and implementation",
      website: "https://anthropic.com",
      color: "bg-teal-100 dark:bg-teal-900"
    },
    {
      name: "X",
      description: "Platform for developing radical new technologies to solve the world's hardest problems",
      logo: SiX,
      type: "Innovation",
      specialization: "Moonshots",
      collaboration: "Advanced research on neural interfaces and quantum AI",
      website: "https://x.company",
      color: "bg-slate-100 dark:bg-slate-900"
    },
    {
      name: "Microsoft Azure",
      description: "Cloud computing platform with advanced AI and quantum computing capabilities",
      logo: Server,
      type: "Cloud",
      specialization: "Enterprise AI",
      collaboration: "Secure model deployment and federated learning infrastructure",
      website: "https://azure.microsoft.com",
      color: "bg-blue-100 dark:bg-blue-900"
    },
    {
      name: "OpenAI",
      description: "Research laboratory developing artificial general intelligence for the benefit of humanity",
      logo: Brain,
      type: "AI Research",
      specialization: "Foundation Models",
      collaboration: "Large language model integration and fine-tuning capabilities",
      website: "https://openai.com",
      color: "bg-emerald-100 dark:bg-emerald-900"
    },
    {
      name: "NVIDIA",
      description: "Leading producer of GPUs and AI computing hardware and software",
      logo: Cpu,
      type: "Hardware",
      specialization: "GPU Computing",
      collaboration: "High-performance computing resources for model training",
      website: "https://nvidia.com",
      color: "bg-green-100 dark:bg-green-900"
    },
    {
      name: "Meta AI",
      description: "AI research division advancing state-of-the-art in machine learning and open-source AI",
      logo: Globe,
      type: "Research",
      specialization: "Open Source AI",
      collaboration: "Contributing to open-source AI model development and standards",
      website: "https://ai.meta.com",
      color: "bg-indigo-100 dark:bg-indigo-900"
    }
  ],
  [REGIONS.NULL_ISLAND]: [
    {
      name: "Quantum Pirates",
      description: "Fringe research group pushing the boundaries of quantum computing and teleportation",
      logo: Zap,
      type: "Quantum",
      specialization: "Quantum Teleportation",
      collaboration: "Quantum-accelerated training and data teleportation",
      website: "#",
      color: "bg-pink-100 dark:bg-pink-900"
    },
    {
      name: "Zero Knowledge Labs",
      description: "Pioneers in zero knowledge proofs and privacy-preserving computation",
      logo: Shield,
      type: "Cryptography",
      specialization: "ZK-Proofs",
      collaboration: "Secure teleportation simulation using cryptographic techniques",
      website: "#",
      color: "bg-orange-100 dark:bg-orange-900"
    },
    {
      name: "Ninja Collective",
      description: "Stealth technology group developing cutting-edge security and quantum adaptability solutions",
      logo: Sparkles,
      type: "Security",
      specialization: "Stealth Computing",
      collaboration: "Advanced encryption and quantum adaptability technologies",
      website: "#",
      color: "bg-zinc-100 dark:bg-zinc-900"
    },
    {
      name: "Shadow Network",
      description: "Mysterious global collective of anonymous AI researchers with quantum expertise",
      logo: Code,
      type: "Research",
      specialization: "Emergent Intelligence",
      collaboration: "Novel architectures for distributed quantum intelligence",
      website: "#",
      color: "bg-indigo-100 dark:bg-indigo-900"
    },
    {
      name: "IBM Quantum",
      description: "Pioneer in quantum computing hardware, software, and cloud access to quantum processors",
      logo: Aperture,
      type: "Quantum",
      specialization: "Quantum Computing",
      collaboration: "Quantum compute resources for advanced simulations",
      website: "https://www.ibm.com/quantum",
      color: "bg-blue-100 dark:bg-blue-900"
    },
    {
      name: "DeepMind",
      description: "World-leading AI research lab solving intelligence to advance science and humanity",
      logo: Brain,
      type: "AI Research",
      specialization: "AGI Development",
      collaboration: "Advanced reasoning and planning algorithms",
      website: "https://deepmind.com",
      color: "bg-teal-100 dark:bg-teal-900"
    },
    {
      name: "AWS Quantum",
      description: "Amazon's quantum computing initiative providing access to quantum hardware and simulators",
      logo: Cloud,
      type: "Cloud",
      specialization: "Quantum-as-a-Service",
      collaboration: "Secure hosting for quantum-resistant encryption",
      website: "https://aws.amazon.com/quantum",
      color: "bg-yellow-100 dark:bg-yellow-900"
    },
    {
      name: "Intel Labs",
      description: "Research division pushing the boundaries of computing technology",
      logo: Cpu,
      type: "Hardware",
      specialization: "Neuromorphic Computing",
      collaboration: "Providing neuromorphic chips for efficient AI model inference",
      website: "https://www.intel.com/labs",
      color: "bg-blue-100 dark:bg-blue-900"
    }
  ]
};

// Partner Card Component
function PartnerCard({ partner, region }: { partner: any, region: string }) {
  const Logo = partner.logo;
  const regionColors = {
    [REGIONS.EAST]: "bg-blue-500",
    [REGIONS.WEST]: "bg-purple-500",
    [REGIONS.NULL_ISLAND]: "bg-red-500",
  };

  const regionBadgeClass = regionColors[region as keyof typeof regionColors] || "bg-gray-500";

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className={`${partner.color} rounded-t-lg`}>
        <div className="flex justify-between items-center">
          <Badge className={regionBadgeClass}>
            {region === "east" ? "East" : region === "west" ? "West" : "Null Island"}
          </Badge>
          <Badge variant="outline">{partner.type}</Badge>
        </div>
        <div className="flex items-center gap-2 mt-2">
          {typeof Logo === "string" ? (
            <img src={Logo} alt={`${partner.name} logo`} className="h-8 w-8" />
          ) : (
            <Logo className="h-8 w-8" />
          )}
          <CardTitle>{partner.name}</CardTitle>
        </div>
        <CardDescription>{partner.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground">Specialization</h4>
            <p>{partner.specialization}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-muted-foreground">Potential Collaboration</h4>
            <p>{partner.collaboration}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" className="gap-1 w-full" asChild>
          <a href={partner.website} target="_blank" rel="noreferrer">
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Visit {partner.name}</span>
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function Partners() {
  const [activeTab, setActiveTab] = useState<string>("all");

  // Filter partners based on active tab
  const filteredPartners = activeTab === "all" 
    ? Object.entries(partners)
    : Object.entries(partners).filter(([region]) => region === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Regional Partners</h1>
        <p className="text-muted-foreground">
          Explore potential partners for our East-West-NULL_ISLAND regional architecture
        </p>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 w-[500px]">
          <TabsTrigger value="all" className="flex items-center gap-1">
            <Globe className="h-4 w-4" />
            <span>All Regions</span>
          </TabsTrigger>
          <TabsTrigger value={REGIONS.EAST} className="flex items-center gap-1">
            <Star className="h-4 w-4" />
            <span>East</span>
          </TabsTrigger>
          <TabsTrigger value={REGIONS.WEST} className="flex items-center gap-1">
            <Database className="h-4 w-4" />
            <span>West</span>
          </TabsTrigger>
          <TabsTrigger value={REGIONS.NULL_ISLAND} className="flex items-center gap-1">
            <Zap className="h-4 w-4" />
            <span>Null Island</span>
          </TabsTrigger>
        </TabsList>

        {/* All regions content */}
        <TabsContent value="all" className="mt-6">
          <div className="space-y-8">
            {filteredPartners.map(([region, regionPartners]) => (
              <div key={region} className="space-y-4">
                <h2 className="text-2xl font-semibold">
                  {region === "east" ? "East Region" : region === "west" ? "West Region" : "Null Island Region"}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {regionPartners.map((partner, index) => (
                    <PartnerCard key={index} partner={partner} region={region} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Region-specific content */}
        {Object.entries(partners).map(([region, regionPartners]) => (
          <TabsContent key={region} value={region} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {regionPartners.map((partner, index) => (
                <PartnerCard key={index} partner={partner} region={region} />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}