import { useState } from "react";
import { Youtube, BarChart3, Twitter, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface Video {
  title: string;
  id: string;
}

const Index = () => {
  const [youtubeChannelId, setYoutubeChannelId] = useState("");
  const [videos, setVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isYoutubeModalOpen, setIsYoutubeModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [isTwitterModalOpen, setIsTwitterModalOpen] = useState(false);
  const { toast } = useToast();

  const handleYoutubeSearch = async () => {
    if (!youtubeChannelId.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um ID de canal válido.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("https://api.teste.onlinecenter.com.br/webhook/buscar-videos-instagram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: youtubeChannelId }),
      });

      if (!response.ok) {
        throw new Error("Erro na requisição");
      }

      const data = await response.json();
      const videoList = Array.isArray(data) ? data : data.videos || [];
      
      setVideos(videoList);
      setFilteredVideos(videoList);
      setSearchTerm("");
      
      toast({
        title: "Sucesso",
        description: `${videoList.length} vídeos encontrados!`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao buscar vídeos. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim() === "") {
      setFilteredVideos(videos);
    } else {
      const filtered = videos.filter((video) =>
        video.title.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredVideos(filtered);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      {/* Título Principal */}
      <div className="mb-16">
        <h1 className="text-6xl md:text-8xl font-bold text-center neon-text mb-4">
          SENTINELA
        </h1>
        <div className="w-32 h-1 bg-primary mx-auto glow"></div>
      </div>

      {/* Ícones das Redes Sociais */}
      <div className="flex gap-8 mb-12">
        {/* YouTube */}
        <Dialog open={isYoutubeModalOpen} onOpenChange={setIsYoutubeModalOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-16 w-16 cyber-border hover:glow transition-all duration-300"
            >
              <Youtube className="h-8 w-8 text-red-500" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl cyber-border">
            <DialogHeader>
              <DialogTitle className="text-xl neon-text">YouTube</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="channelId">ID do Canal</Label>
                <div className="flex gap-2">
                  <Input
                    id="channelId"
                    placeholder="Digite o ID do canal"
                    value={youtubeChannelId}
                    onChange={(e) => setYoutubeChannelId(e.target.value)}
                    className="cyber-border"
                  />
                  <Button 
                    onClick={handleYoutubeSearch} 
                    disabled={isLoading}
                    className="glow"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Buscar"
                    )}
                  </Button>
                </div>
              </div>

              {videos.length > 0 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="videoSearch">Pesquisar vídeos</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="videoSearch"
                        placeholder="Pesquisar por título..."
                        value={searchTerm}
                        onChange={(e) => handleVideoSearch(e.target.value)}
                        className="pl-10 cyber-border"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Vídeos encontrados ({filteredVideos.length})</Label>
                    <ScrollArea className="h-64 w-full cyber-border rounded-md p-4">
                      <div className="flex gap-4 overflow-x-auto pb-4">
                        {filteredVideos.map((video, index) => (
                          <div
                            key={index}
                            className="min-w-64 p-3 cyber-border rounded-lg hover:glow transition-all duration-300"
                          >
                            <p className="text-sm font-medium line-clamp-3">
                              {video.title}
                            </p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* YouTube Analytics */}
        <Dialog open={isAnalyticsModalOpen} onOpenChange={setIsAnalyticsModalOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-16 w-16 cyber-border hover:glow transition-all duration-300"
            >
              <BarChart3 className="h-8 w-8 text-primary" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl cyber-border">
            <DialogHeader>
              <DialogTitle className="text-xl neon-text">YouTube Analytics</DialogTitle>
            </DialogHeader>
            <div className="p-8 text-center text-muted-foreground">
              <p>Funcionalidade em desenvolvimento...</p>
            </div>
          </DialogContent>
        </Dialog>

        {/* X (Twitter) */}
        <Dialog open={isTwitterModalOpen} onOpenChange={setIsTwitterModalOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-16 w-16 cyber-border hover:glow transition-all duration-300"
            >
              <Twitter className="h-8 w-8 text-blue-400" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl cyber-border">
            <DialogHeader>
              <DialogTitle className="text-xl neon-text">X (Twitter)</DialogTitle>
            </DialogHeader>
            <div className="p-8 text-center text-muted-foreground">
              <p>Funcionalidade em desenvolvimento...</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Elementos decorativos */}
      <div className="absolute top-20 left-20 w-2 h-2 bg-primary rounded-full glow animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-3 h-3 bg-accent rounded-full glow animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-10 w-1 h-16 bg-gradient-to-b from-primary to-transparent"></div>
      <div className="absolute top-1/2 right-10 w-1 h-16 bg-gradient-to-b from-accent to-transparent"></div>
    </div>
  );
};

export default Index;