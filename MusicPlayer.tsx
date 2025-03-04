import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, Volume2, Volume1, VolumeX, SkipForward, SkipBack } from "lucide-react";

interface MusicPlayerProps {
  songUrl?: string;
  songTitle?: string;
  songArtist?: string;
  coverUrl?: string;
  onClose?: () => void;
}

export function MusicPlayer({ 
  songUrl,
  songTitle = "Not Playing",
  songArtist = "Unknown Artist",
  coverUrl,
  onClose
}: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();

      audioRef.current.addEventListener('loadedmetadata', () => {
        if (audioRef.current) {
          setDuration(audioRef.current.duration);
          setIsLoading(false);
        }
      });

      audioRef.current.addEventListener('timeupdate', () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
      });

      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });

      audioRef.current.addEventListener('error', (e) => {
        console.error("Audio playback error:", e);
        setError("Failed to play audio. Please try again.");
        setIsLoading(false);
        setIsPlaying(false);
      });

      audioRef.current.addEventListener('canplay', () => {
        setError(null);
        setIsLoading(false);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current.remove();
        audioRef.current = null;
      }
    };
  }, []);

  // Update audio when songUrl changes
  useEffect(() => {
    if (audioRef.current && songUrl) {
      setIsLoading(true);
      setError(null);

      // Stop current playback
      audioRef.current.pause();
      setIsPlaying(false);

      // Update source and reload
      audioRef.current.src = songUrl;
      audioRef.current.load();

      // Automatically play when loaded
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(error => {
          console.error("Error playing audio:", error);
          setIsPlaying(false);
          setError("Failed to play this song. Please try another one.");
        });
    }
  }, [songUrl]);

  // Handle play/pause
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(error => {
          console.error("Error playing audio:", error);
          setIsPlaying(false);
          setError("Playback error. Please try again.");
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleTimeChange = (newValue: number[]) => {
    if (audioRef.current) {
      const newTime = newValue[0];
      setCurrentTime(newTime);
      audioRef.current.currentTime = newTime;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const VolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX />;
    if (volume < 50) return <Volume1 />;
    return <Volume2 />;
  };

  // Mock functions for previous/next that would be connected to a playlist
  const handlePrevious = () => {
    if (audioRef.current && currentTime > 3) {
      // If we're more than 3 seconds in, restart the song
      audioRef.current.currentTime = 0;
    } else {
      // Otherwise go to previous song (not implemented)
      console.log("Previous song would play here");
    }
  };

  const handleNext = () => {
    console.log("Next song would play here");
  };

  // If no song URL is provided, display a message
  if (!songUrl) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-center h-20">
            <p className="text-muted-foreground">Select a song to play</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="py-4">
        <div className="flex items-center space-x-4">
          {/* Album cover or placeholder */}
          <div className="w-12 h-12 bg-secondary flex items-center justify-center rounded-md overflow-hidden flex-shrink-0">
            {coverUrl ? (
              <img src={coverUrl} alt={songTitle} className="w-full h-full object-cover" />
            ) : (
              <div className="text-2xl">🎵</div>
            )}
          </div>

          {/* Song info */}
          <div className="flex-grow min-w-0">
            <div className="font-medium truncate">{songTitle}</div>
            <div className="text-sm text-muted-foreground truncate">{songArtist}</div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={handlePrevious}>
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button 
              onClick={handlePlayPause} 
              variant="default" 
              size="icon" 
              className="h-8 w-8"
              disabled={isLoading || !!error}
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>

            <Button variant="ghost" size="icon" onClick={handleNext}>
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Progress bar */}
        <div className="mt-3 space-y-1">
          <Slider 
            value={[currentTime]} 
            min={0} 
            max={duration || 100} 
            step={0.1} 
            onValueChange={handleTimeChange}
            className="cursor-pointer"
            disabled={isLoading || !!error}
          />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume control */}
        <div className="mt-2 flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={toggleMute} className="h-8 w-8">
            <VolumeIcon />
          </Button>

          <Slider
            value={[isMuted ? 0 : volume]}
            min={0}
            max={100}
            step={1}
            onValueChange={(val) => {
              setVolume(val[0]);
              if (val[0] > 0 && isMuted) setIsMuted(false);
            }}
            className="w-24 cursor-pointer"
          />
        </div>
      </CardContent>
    </Card>
  );
}