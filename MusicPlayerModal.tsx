import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MinimizeIcon, X } from "lucide-react";
import { MusicPlayer } from "@/components/MusicPlayer";
import { useMusicPlayer } from "@/lib/MusicPlayerContext";
import { useState } from "react";

export function MusicPlayerModal() {
  const { isPlayerOpen, currentSong, closePlayer } = useMusicPlayer();
  const [minimized, setMinimized] = useState(false);

  if (!currentSong) return null;

  // URLs for the player
  const songUrl = `/api/music-portal/stream/${currentSong.id}`;
  const coverUrl = `/api/music-portal/artwork/${currentSong.id}`;

  const handleMinimize = () => {
    setMinimized(!minimized);
  };

  return (
    <Dialog open={isPlayerOpen} onOpenChange={(open) => !open && closePlayer()}>
      <DialogContent 
        className={minimized ? "max-w-[300px] p-2 bottom-4 right-4 fixed" : "max-w-md"}
        onInteractOutside={(e) => e.preventDefault()} // Prevent closing when clicking outside
      >
        <div className="flex justify-between items-center mb-2">
          <div className="font-semibold">
            {minimized ? "Now Playing..." : "Music Player"}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleMinimize}
            >
              <MinimizeIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={closePlayer}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {minimized ? (
          <div className="flex items-center gap-2 py-1">
            <div className="text-sm font-medium truncate">
              {currentSong.title} - {currentSong.artist}
            </div>
          </div>
        ) : (
          <MusicPlayer
            songUrl={songUrl}
            songTitle={currentSong.title}
            songArtist={currentSong.artist}
            coverUrl={coverUrl}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
