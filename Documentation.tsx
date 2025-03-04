import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, BookOpen, Calendar, Music, Star, Trophy, Award, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface DocumentationFile {
  title: string;
  content: string;
}

interface DocumentationProgress {
  whitepaper: number;
  api: number;
  roadmap: number;
  musicPortal: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
}

// Separate the achievement definitions from their storage format
const achievementDefinitions = [
  {
    id: "first_read",
    title: "First Steps",
    description: "Start reading your first documentation",
    icon: <Award className="h-6 w-6 text-yellow-500" />,
  },
  {
    id: "api_master",
    title: "API Master",
    description: "Read 100% of the API documentation",
    icon: <Trophy className="h-6 w-6 text-purple-500" />,
  },
  {
    id: "roadmap_explorer",
    title: "Future Visionary",
    description: "Explore the complete development roadmap",
    icon: <Star className="h-6 w-6 text-blue-500" />,
  },
  {
    id: "documentation_guru",
    title: "Documentation Guru",
    description: "Read all documentation sections",
    icon: <CheckCircle className="h-6 w-6 text-green-500" />,
  }
];

export default function Documentation() {
  const [activeTab, setActiveTab] = useState("whitepaper");
  const [xp, setXp] = useState(() => {
    const savedXp = localStorage.getItem("documentation_xp");
    return savedXp ? parseInt(savedXp, 10) : 0;
  });
  const [level, setLevel] = useState(1);
  const [progress, setProgress] = useState<DocumentationProgress>(() => {
    const savedProgress = localStorage.getItem("documentation_progress");
    return savedProgress ? JSON.parse(savedProgress) : {
      whitepaper: 0,
      api: 0,
      roadmap: 0,
      musicPortal: 0
    };
  });

  // Load achievements from localStorage without the icon property
  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    const savedAchievements = localStorage.getItem("documentation_achievements");
    if (savedAchievements) {
      return JSON.parse(savedAchievements);
    }
    // Initialize with unlocked = false for all achievements
    return achievementDefinitions.map(({ id, title, description }) => ({
      id,
      title,
      description,
      unlocked: false
    }));
  });

  const [showAchievement, setShowAchievement] = useState<string | null>(null);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<any>(null);
  const [quizAnswered, setQuizAnswered] = useState(false);

  // Calculate level based on XP
  useEffect(() => {
    const newLevel = Math.floor(xp / 100) + 1;
    if (newLevel !== level) {
      setLevel(newLevel);
      toast({
        title: "Level Up!",
        description: `You've reached documentation level ${newLevel}!`,
        variant: "default"
      });
    }
    localStorage.setItem("documentation_xp", xp.toString());
  }, [xp, level]);

  // Save progress
  useEffect(() => {
    localStorage.setItem("documentation_progress", JSON.stringify(progress));
  }, [progress]);

  // Save achievements (without icon property)
  useEffect(() => {
    localStorage.setItem("documentation_achievements", JSON.stringify(achievements));
  }, [achievements]);

  const { data: whitepaper, isLoading: whitepaperLoading } = useQuery<DocumentationFile>({
    queryKey: ["/api/documentation/whitepaper"],
    retry: 2
  });

  const { data: apiDocs, isLoading: apiDocsLoading } = useQuery<DocumentationFile>({
    queryKey: ["/api/documentation/api"],
    retry: 2
  });

  const { data: roadmap, isLoading: roadmapLoading } = useQuery<DocumentationFile>({
    queryKey: ["/api/documentation/roadmap"],
    retry: 2
  });

  const { data: musicPortal, isLoading: musicPortalLoading } = useQuery<DocumentationFile>({
    queryKey: ["/api/documentation/music-portal"],
    retry: 2
  });

  // Track reading progress
  useEffect(() => {
    const trackScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      const scrollArea = target.closest('.scroll-area');
      if (!scrollArea) return;

      const scrollHeight = scrollArea.scrollHeight;
      const scrollTop = scrollArea.scrollTop;
      const clientHeight = scrollArea.clientHeight;

      // Calculate percentage scrolled
      const scrollPercentage = Math.min(100, Math.ceil((scrollTop + clientHeight) / scrollHeight * 100));

      // Update progress based on active tab
      if (activeTab === "whitepaper" && progress.whitepaper < scrollPercentage) {
        const addXp = scrollPercentage - progress.whitepaper;
        setXp(prev => prev + addXp);
        setProgress(prev => ({ ...prev, whitepaper: scrollPercentage }));

        // Check for first read achievement
        if (!achievements.find(a => a.id === "first_read")?.unlocked) {
          unlockAchievement("first_read");
        }
      } else if (activeTab === "api" && progress.api < scrollPercentage) {
        const addXp = scrollPercentage - progress.api;
        setXp(prev => prev + addXp);
        setProgress(prev => ({ ...prev, api: scrollPercentage }));

        // Check for API master achievement
        if (scrollPercentage >= 100 && !achievements.find(a => a.id === "api_master")?.unlocked) {
          unlockAchievement("api_master");
        }
      } else if (activeTab === "roadmap" && progress.roadmap < scrollPercentage) {
        const addXp = scrollPercentage - progress.roadmap;
        setXp(prev => prev + addXp);
        setProgress(prev => ({ ...prev, roadmap: scrollPercentage }));

        // Check for roadmap explorer achievement
        if (scrollPercentage >= 100 && !achievements.find(a => a.id === "roadmap_explorer")?.unlocked) {
          unlockAchievement("roadmap_explorer");
        }
      } else if (activeTab === "music-portal" && progress.musicPortal < scrollPercentage) {
        const addXp = scrollPercentage - progress.musicPortal;
        setXp(prev => prev + addXp);
        setProgress(prev => ({ ...prev, musicPortal: scrollPercentage }));
      }

      // Check for documentation guru achievement
      if (
        progress.whitepaper >= 100 &&
        progress.api >= 100 &&
        progress.roadmap >= 100 &&
        progress.musicPortal >= 100 &&
        !achievements.find(a => a.id === "documentation_guru")?.unlocked
      ) {
        unlockAchievement("documentation_guru");
      }
    };

    // Attach scroll event listener to all scroll areas
    const scrollAreas = document.querySelectorAll('.scroll-area');
    scrollAreas.forEach(area => {
      area.addEventListener('scroll', trackScroll);
    });

    return () => {
      scrollAreas.forEach(area => {
        area.removeEventListener('scroll', trackScroll);
      });
    };
  }, [activeTab, progress, achievements]);

  const unlockAchievement = (achievementId: string) => {
    const updatedAchievements = achievements.map(achievement => 
      achievement.id === achievementId ? { ...achievement, unlocked: true } : achievement
    );

    setAchievements(updatedAchievements);

    // Display achievement notification
    setShowAchievement(achievementId);

    // Add bonus XP for achievements
    setXp(prev => prev + 50);

    setTimeout(() => {
      setShowAchievement(null);
    }, 3000);
  };

  // Random quizzes to test knowledge
  const quizzes = [
    {
      question: "What is the primary purpose of the SINet Dashboard?",
      options: [
        "Social media management",
        "Monitoring distributed AI compute resources",
        "Online shopping platform",
        "Video game streaming"
      ],
      correctAnswer: 1,
      section: "whitepaper"
    },
    {
      question: "Which authentication method is supported by the API?",
      options: [
        "Basic Auth",
        "OAuth2",
        "Developer Keys",
        "No authentication"
      ],
      correctAnswer: 2,
      section: "api"
    },
    {
      question: "When is the System Integrator V2.0 planned for release?",
      options: [
        "Q2 2025",
        "Q3 2025",
        "Q4 2025",
        "Q1 2026"
      ],
      correctAnswer: 1,
      section: "roadmap"
    },
    {
      question: "What feature does the Music Portal integration demonstrate?",
      options: [
        "Database management",
        "User authentication",
        "Rich media management and API integration",
        "Game development"
      ],
      correctAnswer: 2,
      section: "music-portal"
    }
  ];

  const triggerRandomQuiz = () => {
    // Filter quizzes for current section
    const sectionQuizzes = quizzes.filter(quiz => quiz.section === activeTab);
    if (sectionQuizzes.length > 0) {
      const randomQuiz = sectionQuizzes[Math.floor(Math.random() * sectionQuizzes.length)];
      setCurrentQuiz(randomQuiz);
      setIsQuizActive(true);
      setQuizAnswered(false);
    }
  };

  const handleQuizAnswer = (answerIndex: number) => {
    if (!currentQuiz || quizAnswered) return;

    setQuizAnswered(true);

    if (answerIndex === currentQuiz.correctAnswer) {
      toast({
        title: "Correct Answer!",
        description: "You earned 25 XP for your knowledge!",
        variant: "default"
      });
      setXp(prev => prev + 25);
    } else {
      toast({
        title: "Incorrect Answer",
        description: "Try again after reviewing the documentation!",
        variant: "destructive"
      });
    }

    setTimeout(() => {
      setIsQuizActive(false);
      setCurrentQuiz(null);
    }, 2000);
  };

  // Function to render markdown content
  const renderMarkdown = (content: string) => {
    if (!content) return <div className="py-4">Loading content...</div>;

    // Simple parsing for headings and paragraphs
    const lines = content.split('\n');
    return (
      <div className="space-y-4">
        {lines.map((line, index) => {
          if (line.startsWith('# ')) {
            return <h1 key={index} className="text-3xl font-bold mt-8 animate-fadeIn">{line.substring(2)}</h1>;
          } else if (line.startsWith('## ')) {
            return <h2 key={index} className="text-2xl font-bold mt-6 animate-fadeIn">{line.substring(3)}</h2>;
          } else if (line.startsWith('### ')) {
            return <h3 key={index} className="text-xl font-bold mt-4 animate-fadeIn">{line.substring(4)}</h3>;
          } else if (line.startsWith('- ')) {
            return <li key={index} className="ml-4 animate-slideInRight">{line.substring(2)}</li>;
          } else if (line.match(/^\d+\. /)) {
            const listItem = line.match(/^\d+\. (.*)/);
            return <li key={index} className="ml-8 list-decimal animate-slideInRight">{listItem ? listItem[1] : ''}</li>;
          } else if (line.length === 0) {
            return <div key={index} className="h-4"></div>;
          } else if (line.startsWith('```json')) {
            return <div key={index} className="font-mono text-sm bg-muted p-2 rounded my-2 overflow-x-auto animate-fadeIn">Code block start</div>;
          } else if (line.startsWith('```')) {
            return <div key={index} className="font-mono text-sm bg-muted p-2 rounded my-2 overflow-x-auto animate-fadeIn">Code block end</div>;
          } else if (line.includes('|') && line.includes('-')) {
            return <div key={index} className="font-mono text-sm bg-muted/50 p-2 rounded my-1 animate-fadeIn">{line}</div>;
          } else {
            return <p key={index} className="animate-fadeIn">{line}</p>;
          }
        })}
      </div>
    );
  };

  // Get total completion percentage
  const totalCompletion = Math.round(
    (progress.whitepaper + progress.api + progress.roadmap + progress.musicPortal) / 4
  );

  // Function to get the icon for a given achievement ID
  const getAchievementIcon = (id: string) => {
    const definition = achievementDefinitions.find(def => def.id === id);
    return definition ? definition.icon : <Award className="h-6 w-6" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Documentation Quest</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-primary/10 rounded-lg p-2 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <span className="font-semibold">Level {level}</span>
          </div>

          <div className="flex flex-col gap-1 max-w-[200px] w-full">
            <div className="flex justify-between text-xs">
              <span>XP: {xp}</span>
              <span>Next: {level * 100}</span>
            </div>
            <Progress value={(xp % 100)} max={100} className="h-2" />
          </div>
        </div>
      </div>

      {showAchievement && (
        <div className="fixed top-20 right-4 bg-black/80 text-white p-4 rounded-lg shadow-lg z-50 animate-slideInTop">
          <div className="flex items-center gap-3">
            {getAchievementIcon(showAchievement)}
            <div>
              <h4 className="font-bold text-yellow-400">Achievement Unlocked!</h4>
              <p className="font-semibold">{achievements.find(a => a.id === showAchievement)?.title}</p>
              <p className="text-sm opacity-80">{achievements.find(a => a.id === showAchievement)?.description}</p>
              <p className="text-xs text-green-400 mt-1">+50 XP</p>
            </div>
          </div>
        </div>
      )}

      {isQuizActive && currentQuiz && (
        <Card className="border-primary animate-fadeIn">
          <CardHeader className="bg-primary/10">
            <CardTitle className="text-xl">Knowledge Check!</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="font-medium mb-4">{currentQuiz.question}</p>
            <div className="space-y-2">
              {currentQuiz.options.map((option: string, idx: number) => (
                <Button
                  key={idx}
                  variant={quizAnswered ? (idx === currentQuiz.correctAnswer ? "default" : "outline") : "outline"}
                  className={cn(
                    "w-full justify-start text-left",
                    quizAnswered && idx === currentQuiz.correctAnswer && "bg-green-500 hover:bg-green-600",
                    quizAnswered && idx !== currentQuiz.correctAnswer && "opacity-50"
                  )}
                  onClick={() => handleQuizAnswer(idx)}
                  disabled={quizAnswered}
                >
                  {option}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="bg-primary/5 border-b pb-4">
          <div className="flex justify-between items-center">
            <CardTitle>Documentation Journey</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Overall Progress:</span>
              <Badge variant="outline" className="px-2">
                {totalCompletion}%
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 w-full rounded-none">
              <TabsTrigger value="whitepaper" className="flex items-center gap-2 relative py-4">
                <BookOpen className="h-4 w-4" />
                <span>Whitepaper</span>
                <Badge variant="outline" className="absolute top-1 right-1 h-5 w-5 p-0 flex items-center justify-center">
                  {progress.whitepaper}%
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="api" className="flex items-center gap-2 relative py-4">
                <FileText className="h-4 w-4" />
                <span>API Reference</span>
                <Badge variant="outline" className="absolute top-1 right-1 h-5 w-5 p-0 flex items-center justify-center">
                  {progress.api}%
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="roadmap" className="flex items-center gap-2 relative py-4">
                <Calendar className="h-4 w-4" />
                <span>Roadmap</span>
                <Badge variant="outline" className="absolute top-1 right-1 h-5 w-5 p-0 flex items-center justify-center">
                  {progress.roadmap}%
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="music-portal" className="flex items-center gap-2 relative py-4">
                <Music className="h-4 w-4" />
                <span>Music Portal</span>
                <Badge variant="outline" className="absolute top-1 right-1 h-5 w-5 p-0 flex items-center justify-center">
                  {progress.musicPortal}%
                </Badge>
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center justify-between border-t border-b p-2 px-4 bg-muted/20">
              <div className="text-sm text-muted-foreground">
                Earn XP by reading documentation and completing knowledge checks!
              </div>
              <Button variant="ghost" size="sm" onClick={triggerRandomQuiz} className="gap-2">
                <Star className="h-4 w-4" /> Take a Quiz
              </Button>
            </div>

            <TabsContent value="whitepaper" className="m-0">
              <ScrollArea className="h-[60vh] w-full p-4 scroll-area">
                {whitepaperLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  whitepaper && renderMarkdown(whitepaper.content)
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="api" className="m-0">
              <ScrollArea className="h-[60vh] w-full p-4 scroll-area">
                {apiDocsLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  apiDocs && renderMarkdown(apiDocs.content)
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="roadmap" className="m-0">
              <ScrollArea className="h-[60vh] w-full p-4 scroll-area">
                {roadmapLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  roadmap && renderMarkdown(roadmap.content)
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="music-portal" className="m-0">
              <ScrollArea className="h-[60vh] w-full p-4 scroll-area">
                {musicPortalLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  musicPortal && renderMarkdown(musicPortal.content)
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="justify-between border-t p-4 bg-muted/10">
          <div className="flex gap-2">
            {achievements.map(achievement => (
              <div 
                key={achievement.id}
                className={cn(
                  "relative group",
                  achievement.unlocked ? "opacity-100" : "opacity-40"
                )}
              >
                <div className="p-2 bg-muted rounded-full">
                  {getAchievementIcon(achievement.id)}
                </div>
                <div className="absolute bottom-full mb-2 hidden group-hover:block bg-black/80 text-white p-2 rounded min-w-[150px] z-10">
                  <p className="font-bold">{achievement.title}</p>
                  <p className="text-xs">{achievement.description}</p>
                  {!achievement.unlocked && <p className="text-xs text-yellow-400 mt-1">+50 XP when unlocked</p>}
                </div>
              </div>
            ))}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              Completed {achievements.filter(a => a.unlocked).length} of {achievements.length} achievements
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}