import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Music2 } from "lucide-react";

interface Song {
  id: string;
  title: string;
  artist: string;
  addedAt: string;
}

export default function RecentSongs() {
  const { data: songs, isLoading, error } = useQuery<Song[]>({
    queryKey: ["/api/music-portal/recent-songs"],
    retry: 2,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music2 className="w-5 h-5" />
            Recent Songs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            Loading recent songs...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music2 className="w-5 h-5" />
            Recent Songs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6 text-destructive">
            Unable to load recent songs. Please try again later.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!songs?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music2 className="w-5 h-5" />
            Recent Songs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            No recent songs found
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music2 className="w-5 h-5" />
          Recent Songs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {songs.map((song) => (
              <div key={song.id} className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{song.title}</div>
                  <div className="text-sm text-muted-foreground">{song.artist}</div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(song.addedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}