import { useState } from "react";
import { Youtube, BarChart3, Twitter, Search, Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface Video {
  title: string;
  id_video: string;
}

interface CommentData {
  id: string;
  classificacao: string;
  palavras_chaves: string;
  tema: string;
  rede_social: string;
  data_hora: string;
}

interface SentimentData {
  id: string;
  sugestao: string;
  tema: string;
  rede_social: string;
  data: string;
}

const Index = () => {
  const [youtubeApiKey, setYoutubeApiKey] = useState("");
  const [youtubeChannelId, setYoutubeChannelId] = useState("");
  const [videos, setVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isYoutubeModalOpen, setIsYoutubeModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [isTwitterModalOpen, setIsTwitterModalOpen] = useState(false);
  const [commentData, setCommentData] = useState<CommentData[]>([]);
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([]);
  const [selectedVideoTitle, setSelectedVideoTitle] = useState("");
  const { toast } = useToast();

  const handleYoutubeSearch = async () => {
    if (!youtubeApiKey.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira uma API key válida.",
        variant: "destructive",
      });
      return;
    }

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
      console.log("Enviando requisição para API com ID:", youtubeChannelId, "e API Key:", youtubeApiKey);
      
      const response = await fetch("https://api.teste.onlinecenter.com.br/webhook/buscar-videos-youtube", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ 
          id: youtubeChannelId.trim(),
          apikey: youtubeApiKey.trim()
        }),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erro na resposta:", errorText);
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Dados recebidos:", data);
      
      // Tentar diferentes estruturas possíveis do retorno
      let videoList = [];
      if (Array.isArray(data)) {
        videoList = data;
      } else if (data.videos && Array.isArray(data.videos)) {
        videoList = data.videos;
      } else if (data.data && Array.isArray(data.data)) {
        videoList = data.data;
      } else if (data.items && Array.isArray(data.items)) {
        videoList = data.items;
      }

      console.log("Lista de vídeos processada:", videoList);
      
      setVideos(videoList);
      setFilteredVideos(videoList);
      setSearchTerm("");
      
      toast({
        title: "Sucesso",
        description: `${videoList.length} vídeos encontrados!`,
      });
    } catch (error) {
      console.error("Erro detalhado:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao buscar vídeos. Verifique o ID do canal e tente novamente.",
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

  const handleVideoClick = async (video: Video) => {
    try {
      console.log("Enviando dados do vídeo:", video.id_video, "com API Key:", youtubeApiKey);
      
      const response = await fetch("https://api.teste.onlinecenter.com.br/webhook/buscar-youtube", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          apiKey: youtubeApiKey.trim(),
          id_video: video.id_video
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erro na resposta:", errorText);
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Resposta do webhook:", data);
      
      // Separar dados de comentários e sugestões
      const commentData: CommentData[] = [];
      const sentimentData: SentimentData[] = [];
      
      console.log("Dados recebidos para processamento:", data);
      
      if (Array.isArray(data)) {
        data.forEach((item, index) => {
          console.log(`Item ${index}:`, item);
          
          // Se tem 'classificacao', é um comentário
          if (item.classificacao !== undefined) {
            console.log("Adicionando como comentário:", item);
            commentData.push(item);
          }
          // Se tem 'sugestao', é uma análise de sentimento
          if (item.sugestao !== undefined) {
            console.log("Adicionando como sugestão:", item);
            sentimentData.push(item);
          }
        });
      }
      
      console.log("Comentários processados:", commentData);
      console.log("Sugestões processadas:", sentimentData);
      
      // Processar dados e fechar popup
      setCommentData(commentData);
      setSentimentData(sentimentData);
      setSelectedVideoTitle(video.title);
      setIsYoutubeModalOpen(false);
      setIsAnalyticsModalOpen(true);
      
      toast({
        title: "Sucesso",
        description: "Análise carregada!",
      });
    } catch (error) {
      console.error("Erro ao enviar dados do vídeo:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao enviar dados do vídeo.",
        variant: "destructive",
      });
    }
  };

  const getChartData = () => {
    const counts = commentData.reduce((acc, comment) => {
      const classificacao = comment.classificacao?.toLowerCase() || 'neutro';
      acc[classificacao] = (acc[classificacao] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: 'Positivos', value: counts.positivo || 0, color: '#22c55e' },
      { name: 'Negativos', value: counts.negativo || 0, color: '#ef4444' },
      { name: 'Neutros', value: counts.neutro || 0, color: '#6b7280' }
    ];
  };

  const getSuggestionsByTheme = () => {
    const grouped = sentimentData.reduce((acc, item) => {
      const theme = item.tema || 'Sem tema';
      if (!acc[theme]) {
        acc[theme] = [];
      }
      acc[theme].push(item.sugestao);
      return acc;
    }, {} as Record<string, string[]>);
    
    return grouped;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-8">
          <h1 className="text-5xl md:text-6xl text-center detective-title mb-2">
            SENTINELA
          </h1>
          <p className="text-center text-muted-foreground text-lg">
            Sistema de Investigação Digital
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-semibold mb-4">Ferramentas de Análise</h2>
            <p className="text-muted-foreground">
              Acesse as ferramentas disponíveis para investigação em redes sociais
            </p>
          </div>

          {/* Cards das Ferramentas */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* YouTube Card */}
            <Dialog open={isYoutubeModalOpen} onOpenChange={setIsYoutubeModalOpen}>
              <DialogTrigger asChild>
                <div className="card-modern rounded-lg p-6 cursor-pointer hover:shadow-lg transition-all duration-200">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-4 bg-red-500/10 rounded-full">
                      <Youtube className="h-8 w-8 text-red-500" />
                    </div>
                    <h3 className="text-xl font-semibold">YouTube</h3>
                    <p className="text-sm text-muted-foreground">
                      Buscar e analisar vídeos de canais
                    </p>
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-5xl card-modern">
                <DialogHeader>
                  <DialogTitle className="text-xl flex items-center gap-2">
                    <Youtube className="h-5 w-5 text-red-500" />
                    Análise de Canal YouTube
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">API Key do YouTube</Label>
                    <Input
                      id="apiKey"
                      placeholder="Digite sua API key do YouTube"
                      value={youtubeApiKey}
                      onChange={(e) => setYoutubeApiKey(e.target.value)}
                      className="bg-input border-border"
                      type="password"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="channelId">ID do Canal</Label>
                    <div className="flex gap-2">
                      <Input
                        id="channelId"
                        placeholder="Digite o ID do canal"
                        value={youtubeChannelId}
                        onChange={(e) => setYoutubeChannelId(e.target.value)}
                        className="bg-input border-border"
                      />
                      <Button 
                        onClick={handleYoutubeSearch} 
                        disabled={isLoading || !youtubeApiKey.trim() || !youtubeChannelId.trim()}
                        className="bg-primary hover:bg-primary/90"
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
                        <Label htmlFor="videoSearch">Filtrar vídeos</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="videoSearch"
                            placeholder="Pesquisar por título..."
                            value={searchTerm}
                            onChange={(e) => handleVideoSearch(e.target.value)}
                            className="pl-10 bg-input border-border"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Vídeos encontrados ({filteredVideos.length})</Label>
                        <ScrollArea className="h-40 w-full border border-border rounded-md bg-card">
                          <div className="p-4">
                            <div className="flex gap-4 overflow-x-auto pb-4">
                              {filteredVideos.map((video, index) => (
                                <div
                                   key={index}
                                   className="min-w-80 flex-shrink-0 p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors bg-card cursor-pointer"
                                   onClick={() => handleVideoClick(video)}
                                 >
                                   <div className="flex items-start gap-3">
                                     <Play className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                                     <div className="flex-1 min-w-0">
                                       <p className="text-sm font-medium leading-relaxed break-words line-clamp-3">
                                         {video.title}
                                       </p>
                                     </div>
                                   </div>
                                 </div>
                              ))}
                            </div>
                          </div>
                        </ScrollArea>
                      </div>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Analytics Card */}
            <Dialog open={isAnalyticsModalOpen} onOpenChange={setIsAnalyticsModalOpen}>
              <DialogTrigger asChild>
                <div className="card-modern rounded-lg p-6 cursor-pointer hover:shadow-lg transition-all duration-200">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-4 bg-blue-500/10 rounded-full">
                      <BarChart3 className="h-8 w-8 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-semibold">Analytics</h3>
                    <p className="text-sm text-muted-foreground">
                      Análise estatística de dados
                    </p>
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto card-modern">
                <DialogHeader>
                  <DialogTitle className="text-xl flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    YouTube Analytics
                  </DialogTitle>
                </DialogHeader>
                {commentData.length > 0 ? (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h2 className="text-xl font-bold mb-2">{selectedVideoTitle}</h2>
                      <h3 className="text-lg font-semibold mb-2">Análise de Sentimentos</h3>
                      <p className="text-muted-foreground">
                        Classificação de {commentData.length} comentários analisados
                      </p>
                    </div>
                    
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getChartData()}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                          >
                            {getChartData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      {getChartData().map((item) => (
                        <div key={item.name} className="p-4 border border-border rounded-lg">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="font-medium">{item.name}</span>
                          </div>
                          <p className="text-2xl font-bold">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Seção de Sugestões - sempre visível para teste */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Sugestões por Tema</h3>
                      {sentimentData.length > 0 ? (
                        <div className="space-y-3">
                          {Object.entries(getSuggestionsByTheme()).map(([theme, suggestions]) => (
                            <div key={theme} className="p-4 border border-border rounded-lg bg-card">
                              <h4 className="font-medium mb-2 text-primary">{theme}</h4>
                              <ul className="space-y-1">
                                {suggestions.map((suggestion, index) => (
                                  <li key={index} className="text-sm text-muted-foreground">
                                    • {suggestion}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 border border-border rounded-lg bg-card">
                          <p className="text-sm text-muted-foreground">
                            Nenhuma sugestão encontrada para este vídeo.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <div className="space-y-4">
                      <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto" />
                      <h3 className="text-lg font-semibold">Nenhum dado disponível</h3>
                      <p className="text-muted-foreground">
                        Selecione um vídeo para visualizar a análise de comentários.
                      </p>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Twitter/X Card */}
            <Dialog open={isTwitterModalOpen} onOpenChange={setIsTwitterModalOpen}>
              <DialogTrigger asChild>
                <div className="card-modern rounded-lg p-6 cursor-pointer hover:shadow-lg transition-all duration-200">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-4 bg-gray-500/10 rounded-full">
                      <Twitter className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold">X (Twitter)</h3>
                    <p className="text-sm text-muted-foreground">
                      Análise de posts e perfis
                    </p>
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl card-modern">
                <DialogHeader>
                  <DialogTitle className="text-xl flex items-center gap-2">
                    <Twitter className="h-5 w-5 text-gray-400" />
                    Análise X (Twitter)
                  </DialogTitle>
                </DialogHeader>
                <div className="p-8 text-center">
                  <div className="space-y-4">
                    <Twitter className="h-16 w-16 text-muted-foreground mx-auto" />
                    <h3 className="text-lg font-semibold">Em Desenvolvimento</h3>
                    <p className="text-muted-foreground">
                      Esta funcionalidade está sendo desenvolvida e estará disponível em breve.
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;