import { useState } from "react";
import { Youtube, BarChart3, Search, Loader2, Play, BarChart, PieChart as PieChartIcon, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart as RechartsBarChart, Bar, XAxis, YAxis } from "recharts";

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
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [analyticsStartDate, setAnalyticsStartDate] = useState("");
  const [analyticsEndDate, setAnalyticsEndDate] = useState("");
  const [commentData, setCommentData] = useState<CommentData[]>([]);
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([]);
  const [selectedVideoTitle, setSelectedVideoTitle] = useState("");
  const [selectedVideoId, setSelectedVideoId] = useState("");
  const [chartType, setChartType] = useState<"pie" | "bar">("pie");
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
    console.log("=== INICIANDO REQUISIÇÃO ===");
    console.log("URL:", "https://api.teste.onlinecenter.com.br/webhook/buscar-videos-youtube");
    console.log("Payload:", { id: youtubeChannelId.trim(), apikey: youtubeApiKey.trim() });
    
    try {
      const response = await fetch("https://api.teste.onlinecenter.com.br/webhook/buscar-videos-youtube", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          id: youtubeChannelId.trim(),
          apikey: youtubeApiKey.trim()
        })
      });

      console.log("=== RESPOSTA RECEBIDA ===");
      console.log("Status:", response.status);
      console.log("Status Text:", response.statusText);
      console.log("Headers:", [...response.headers.entries()]);

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
      
      let errorMessage = "Falha ao buscar vídeos. Verifique sua conexão com a internet.";
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = "Timeout: A requisição demorou muito para responder. Tente novamente.";
        } else if (error.message.includes('fetch')) {
          errorMessage = "Erro de conexão: Verifique se o servidor está acessível e tente novamente.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
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

      console.log("=== RESPOSTA RECEBIDA ===");
      console.log("Status:", response.status);
      console.log("Headers:", [...response.headers.entries()]);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erro na resposta:", errorText);
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      console.log("=== TEXTO DA RESPOSTA ===");
      console.log("Tamanho:", responseText.length);
      console.log("Primeiros 200 chars:", responseText.substring(0, 200));

      if (!responseText || responseText.trim() === '') {
        throw new Error("Resposta vazia do servidor");
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Erro ao fazer parse do JSON:", parseError);
        console.error("Texto completo:", responseText);
        throw new Error("Resposta não é um JSON válido");
      }

      console.log("=== DADOS RECEBIDOS (ANÁLISE DE COMENTÁRIOS) ===");
      console.log("Dados completos:", JSON.stringify(data, null, 2));
      
      // Processar novo formato direto de comentários
      const commentData: CommentData[] = [];
      
      if (Array.isArray(data)) {
        data.forEach((item: any, index: number) => {
          if (item.id && item.classificacao) {
            console.log(`✅ COMENTÁRIO ${index}:`, item);
            
            const commentObj: CommentData = {
              id: item.id,
              classificacao: item.classificacao,
              palavras_chaves: item.palavras_chaves || '',
              tema: item.tema || '',
              rede_social: item.rede_social || 'YouTube',
              data_hora: item.data_hora || new Date().toISOString()
            };
            commentData.push(commentObj);
          }
        });
      } else {
        throw new Error("Formato de dados não reconhecido - esperado array de comentários");
      }
      
      console.log("=== RESULTADO FINAL ===");
      console.log("Comentários encontrados:", commentData.length);
      console.log("Lista de comentários:", commentData);
      
      if (commentData.length === 0) {
        throw new Error("Nenhum comentário foi encontrado");
      }
      
      // Processar dados e marcar plataforma
      setCommentData(commentData);
      setSentimentData([]); // Limpar sugestões antigas
      setSelectedVideoTitle(video.title);
      setSelectedVideoId(video.id_video); // Salvar o ID do vídeo
      setSelectedPlatform("youtube");
      setIsYoutubeModalOpen(false);
      
      toast({
        title: "Sucesso",
        description: `Análise carregada! ${commentData.length} comentários analisados.`,
      });
    } catch (error) {
      console.error("Erro ao enviar dados do vídeo:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao carregar dados do vídeo.",
        variant: "destructive",
      });
    }
  };

  const handleSuggestionsClick = async () => {
    try {
      if (!selectedVideoId) {
        toast({
          title: "Erro",
          description: "Nenhum vídeo selecionado. Por favor, selecione um vídeo primeiro.",
          variant: "destructive",
        });
        return;
      }

      console.log("Buscando sugestões com API Key:", youtubeApiKey, "e ID do vídeo:", selectedVideoId);
      
      const response = await fetch("https://api.teste.onlinecenter.com.br/webhook/buscar-youtube-sugestoes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          apiKey: youtubeApiKey.trim(),
          id_video: selectedVideoId
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erro na resposta:", errorText);
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      if (!responseText || responseText.trim() === '') {
        throw new Error("Resposta vazia do servidor");
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Erro ao fazer parse do JSON:", parseError);
        throw new Error("Resposta não é um JSON válido");
      }

      console.log("=== DADOS RECEBIDOS (SUGESTÕES) ===");
      console.log("Dados completos:", JSON.stringify(data, null, 2));
      
      // Processar sugestões
      const sentimentData: SentimentData[] = [];
      
      if (Array.isArray(data)) {
        data.forEach((item: any, index: number) => {
          if (item.id && item.sugestao) {
            console.log(`✅ SUGESTÃO ${index}:`, item);
            
            const sugestaoObj: SentimentData = {
              id: item.id.toString(),
              sugestao: item.sugestao,
              tema: item.tema || 'Sem tema',
              rede_social: item.rede_social || 'YouTube',
              data: item.data || new Date().toISOString().split('T')[0]
            };
            sentimentData.push(sugestaoObj);
          }
        });
      } else {
        throw new Error("Formato de dados não reconhecido - esperado array de sugestões");
      }
      
      console.log("=== RESULTADO FINAL (SUGESTÕES) ===");
      console.log("Sugestões encontradas:", sentimentData.length);
      console.log("Lista de sugestões:", sentimentData);
      
      if (sentimentData.length === 0) {
        throw new Error("Nenhuma sugestão foi encontrada");
      }
      
      // Atualizar apenas as sugestões
      setSentimentData(sentimentData);
      
      toast({
        title: "Sucesso",
        description: `${sentimentData.length} sugestões carregadas!`,
      });
    } catch (error) {
      console.error("Erro ao buscar sugestões:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao carregar sugestões.",
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

  const handleAnalyticsSearch = async () => {
    if (!youtubeApiKey.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira uma API key válida.",
        variant: "destructive",
      });
      return;
    }

    if (!analyticsStartDate || !analyticsEndDate) {
      toast({
        title: "Erro",
        description: "Por favor, selecione as datas de início e fim.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("https://api.teste.onlinecenter.com.br/webhook/buscar-youtube-analytics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey: youtubeApiKey.trim(),
          data_inicio: analyticsStartDate,
          data_final: analyticsEndDate
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erro na resposta:", errorText);
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Dados de analytics recebidos:", data);
      
      setSelectedPlatform("analytics");
      setIsAnalyticsModalOpen(false);
      
      toast({
        title: "Sucesso",
        description: "Analytics carregados com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao buscar analytics:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao carregar analytics.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSuggestionsByTheme = () => {
    console.log("=== PROCESSANDO SUGESTÕES ===");
    console.log("sentimentData:", sentimentData);
    console.log("sentimentData.length:", sentimentData.length);
    
    const grouped = sentimentData.reduce((acc, item) => {
      const theme = item.tema || 'Sem tema';
      console.log("Processando item:", item, "Tema:", theme);
      if (!acc[theme]) {
        acc[theme] = [];
      }
      acc[theme].push(item.sugestao);
      return acc;
    }, {} as Record<string, string[]>);
    
    console.log("Sugestões agrupadas:", grouped);
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
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* YouTube Card */}
            <Dialog open={isYoutubeModalOpen} onOpenChange={setIsYoutubeModalOpen}>
              <DialogTrigger asChild>
                <div className={`card-modern rounded-lg p-6 cursor-pointer transition-all duration-200 relative ${
                  selectedPlatform === 'youtube' 
                    ? 'ring-4 ring-red-500 bg-red-500/10 shadow-lg shadow-red-500/25 scale-105' 
                    : 'hover:shadow-lg'
                }`}>
                  {selectedPlatform === 'youtube' && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold animate-pulse">
                      ✓
                    </div>
                  )}
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className={`p-4 rounded-full transition-all duration-200 ${
                      selectedPlatform === 'youtube' 
                        ? 'bg-red-500/30 shadow-lg' 
                        : 'bg-red-500/10'
                    }`}>
                      <Youtube className={`h-8 w-8 transition-all duration-200 ${
                        selectedPlatform === 'youtube' ? 'text-red-600 scale-110' : 'text-red-500'
                      }`} />
                    </div>
                    <h3 className={`text-xl font-semibold ${
                      selectedPlatform === 'youtube' ? 'text-red-600' : ''
                    }`}>YouTube</h3>
                    <p className="text-sm text-muted-foreground">
                      Buscar e analisar vídeos de canais
                    </p>
                    {selectedPlatform === 'youtube' && (
                      <div className="text-xs text-red-600 font-medium">
                        ● ANALISANDO
                      </div>
                    )}
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
                <div className={`card-modern rounded-lg p-6 cursor-pointer transition-all duration-200 relative ${
                  selectedPlatform === 'analytics' 
                    ? 'ring-4 ring-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/25 scale-105' 
                    : 'hover:shadow-lg'
                }`}>
                  {selectedPlatform === 'analytics' && (
                    <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold animate-pulse">
                      ✓
                    </div>
                  )}
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className={`p-4 rounded-full transition-all duration-200 ${
                      selectedPlatform === 'analytics' 
                        ? 'bg-blue-500/30 shadow-lg' 
                        : 'bg-blue-500/10'
                    }`}>
                      <BarChart3 className={`h-8 w-8 transition-all duration-200 ${
                        selectedPlatform === 'analytics' ? 'text-blue-600 scale-110' : 'text-blue-500'
                      }`} />
                    </div>
                    <h3 className={`text-xl font-semibold ${
                      selectedPlatform === 'analytics' ? 'text-blue-600' : ''
                    }`}>Analytics</h3>
                    <p className="text-sm text-muted-foreground">
                      Análise estatística de dados
                    </p>
                    {selectedPlatform === 'analytics' && (
                      <div className="text-xs text-blue-600 font-medium">
                        ● ANALISANDO
                      </div>
                    )}
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl card-modern">
                <DialogHeader>
                  <DialogTitle className="text-xl flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    YouTube Analytics
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="analyticsApiKey">API Key do YouTube</Label>
                    <Input
                      id="analyticsApiKey"
                      placeholder="Digite sua API key do YouTube"
                      value={youtubeApiKey}
                      onChange={(e) => setYoutubeApiKey(e.target.value)}
                      className="bg-input border-border"
                      type="password"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Data de Início</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="startDate"
                          type="date"
                          value={analyticsStartDate}
                          onChange={(e) => setAnalyticsStartDate(e.target.value)}
                          className="pl-10 bg-input border-border"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="endDate">Data Final</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="endDate"
                          type="date"
                          value={analyticsEndDate}
                          onChange={(e) => setAnalyticsEndDate(e.target.value)}
                          className="pl-10 bg-input border-border"
                        />
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleAnalyticsSearch} 
                    disabled={isLoading || !youtubeApiKey.trim() || !analyticsStartDate || !analyticsEndDate}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Buscar Analytics
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

          </div>

          {/* Seção de Análise - embaixo dos ícones */}
          {selectedPlatform && (commentData.length > 0 || sentimentData.length > 0) && (
            <div className="mt-8 space-y-6 animate-fade-in">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">{selectedVideoTitle}</h2>
                <h3 className="text-xl font-semibold mb-2">Análise de Sentimentos</h3>
                <p className="text-muted-foreground">
                  Classificação de {commentData.length} comentários analisados
                </p>
              </div>
              
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Gráfico */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Análise de Sentimentos</h3>
                    <div className="flex gap-2">
                      <Button
                        variant={chartType === "pie" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setChartType("pie")}
                        className="flex items-center gap-2"
                      >
                        <PieChartIcon className="h-4 w-4" />
                        Pizza
                      </Button>
                      <Button
                        variant={chartType === "bar" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setChartType("bar")}
                        className="flex items-center gap-2"
                      >
                        <BarChart className="h-4 w-4" />
                        Barras
                      </Button>
                    </div>
                  </div>
                  <div className="h-80 bg-card rounded-lg p-4 border border-border">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === "pie" ? (
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
                      ) : (
                        <RechartsBarChart data={getChartData()}>
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="value" fill="#8884d8">
                            {getChartData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </RechartsBarChart>
                      )}
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    {getChartData().map((item) => (
                      <div key={item.name} className="p-4 border border-border rounded-lg bg-card">
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
                </div>

                {/* Sugestões */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">Sugestões por Tema</h3>
                    <Button 
                      onClick={handleSuggestionsClick}
                      className="bg-primary hover:bg-primary/90"
                      size="sm"
                    >
                      Sugestões
                    </Button>
                  </div>
                   
                   {sentimentData.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
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
                    <div className="p-4 border border-border rounded-lg bg-card text-center">
                      <p className="text-muted-foreground">
                        Nenhuma sugestão encontrada para este vídeo.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;