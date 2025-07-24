import { useState, useEffect } from "react";
import { Youtube, BarChart3, Search, Loader2, Play, BarChart, PieChart as PieChartIcon, Calendar, TrendingUp, Plus, Settings, Trash2, Sun, Moon, Eye } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart as RechartsBarChart, Bar, XAxis, YAxis, LineChart, Line, CartesianGrid } from "recharts";

interface Video {
  title: string;
  id_video: string;
  thumbnail?: string;
}

interface CommentData {
  id: string;
  classificacao: string;
  palavras_chaves: string;
  tema: string;
  rede_social: string;
  data_hora: string;
  autor_comentario?: string;
  comentario?: string;
}

interface SentimentData {
  id: string;
  sugestao: string;
  tema: string;
  rede_social: string;
  data: string;
}

interface AnalyticsData {
  day: string;
  views: number;
  estimatedMinutesWatched: number;
}

interface Channel {
  id: string;
  name: string;
  apiKey: string;
  channelId: string;
  createdAt: string;
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
  const [analyticsApiKey, setAnalyticsApiKey] = useState("");
  const [commentData, setCommentData] = useState<CommentData[]>([]);
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([]);
  const [selectedVideoTitle, setSelectedVideoTitle] = useState("");
  const [selectedVideoId, setSelectedVideoId] = useState("");
  const [chartType, setChartType] = useState<"pie" | "bar">("pie");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [analyticsChartType, setAnalyticsChartType] = useState<"line">("line");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [isChannelFormOpen, setIsChannelFormOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelApiKey, setNewChannelApiKey] = useState("");
  const [newChannelId, setNewChannelId] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [selectedSentiment, setSelectedSentiment] = useState<string | null>(null);
  const [isAnalyzingComments, setIsAnalyzingComments] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  // Carregar canais do localStorage
  useEffect(() => {
    const savedChannels = localStorage.getItem('youtube-channels');
    if (savedChannels) {
      const parsedChannels = JSON.parse(savedChannels);
      setChannels(parsedChannels);
      // Se houver canais salvos, selecionar o primeiro automaticamente
      if (parsedChannels.length > 0) {
        setSelectedChannel(parsedChannels[0]);
        setYoutubeApiKey(parsedChannels[0].apiKey);
        setYoutubeChannelId(parsedChannels[0].channelId);
      }
    }
  }, []);

  // Salvar canais no localStorage
  const saveChannelsToStorage = (channelsToSave: Channel[]) => {
    localStorage.setItem('youtube-channels', JSON.stringify(channelsToSave));
  };

  // Cadastrar novo canal
  const handleAddChannel = () => {
    if (!newChannelName.trim() || !newChannelApiKey.trim() || !newChannelId.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos para cadastrar o canal.",
        variant: "destructive",
      });
      return;
    }

    const newChannel: Channel = {
      id: Date.now().toString(),
      name: newChannelName.trim(),
      apiKey: newChannelApiKey.trim(),
      channelId: newChannelId.trim(),
      createdAt: new Date().toISOString()
    };

    const updatedChannels = [...channels, newChannel];
    setChannels(updatedChannels);
    saveChannelsToStorage(updatedChannels);

    // Limpar formulário
    setNewChannelName("");
    setNewChannelApiKey("");
    setNewChannelId("");
    setIsChannelFormOpen(false);

    toast({
      title: "Sucesso",
      description: "Canal cadastrado com sucesso!",
    });
  };

  // Selecionar canal
  const handleSelectChannel = (channel: Channel) => {
    setSelectedChannel(channel);
    setYoutubeApiKey(channel.apiKey);
    setYoutubeChannelId(channel.channelId);
    
    // Limpar dados anteriores
    setVideos([]);
    setFilteredVideos([]);
    setCommentData([]);
    setSentimentData([]);
    setAnalyticsData([]);
    setSelectedPlatform(null);

    toast({
      title: "Canal Selecionado",
      description: `Agora usando o canal: ${channel.name}`,
    });
  };

  // Excluir canal
  const handleDeleteChannel = (channelId: string) => {
    const updatedChannels = channels.filter(channel => channel.id !== channelId);
    setChannels(updatedChannels);
    saveChannelsToStorage(updatedChannels);

    // Se o canal excluído estava selecionado, limpar seleção
    if (selectedChannel?.id === channelId) {
      setSelectedChannel(null);
      setYoutubeApiKey("");
      setYoutubeChannelId("");
      setVideos([]);
      setFilteredVideos([]);
      setCommentData([]);
      setSentimentData([]);
      setAnalyticsData([]);
      setSelectedPlatform(null);
    }

    toast({
      title: "Canal Excluído",
      description: "Canal removido com sucesso.",
    });
  };

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
    setIsAnalyzingComments(true);
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
          if (item.id && item.classificacao && item.autor_comentario) {
            console.log(`✅ COMENTÁRIO ${index}:`, item);
            
            const commentObj: CommentData = {
              id: item.id,
              classificacao: item.classificacao,
              palavras_chaves: item.palavras_chaves || '',
              tema: item.tema || '',
              rede_social: item.rede_social || 'YouTube',
              data_hora: item.data_hora || new Date().toISOString(),
              autor_comentario: item.autor_comentario || '',
              comentario: item.comentario || ''
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
    } finally {
      setIsAnalyzingComments(false);
    }
  };

  const handleSuggestionsClick = async () => {
    setIsLoadingSuggestions(true);
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
    } finally {
      setIsLoadingSuggestions(false);
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
    if (!analyticsApiKey.trim()) {
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

    setIsLoadingAnalytics(true);
    try {
      const response = await fetch("https://api.teste.onlinecenter.com.br/webhook/buscar-youtube-analytics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey: analyticsApiKey.trim(),
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
      
      // Processar dados do analytics
      const processedData: AnalyticsData[] = [];
      
      if (Array.isArray(data) && data.length > 0) {
        const analyticsResult = data[0];
        if (analyticsResult.rows && Array.isArray(analyticsResult.rows)) {
          analyticsResult.rows.forEach((row: any[]) => {
            if (row.length >= 3) {
              processedData.push({
                day: row[0],
                views: row[1] || 0,
                estimatedMinutesWatched: row[2] || 0
              });
            }
          });
        }
      }
      
      setAnalyticsData(processedData);
      setSelectedPlatform("analytics");
      setIsAnalyticsModalOpen(false);
      
      toast({
        title: "Sucesso",
        description: `Analytics carregados! ${processedData.length} dias de dados.`,
      });
    } catch (error) {
      console.error("Erro ao buscar analytics:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao carregar analytics.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAnalytics(false);
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

  const getCommentsBySentiment = (sentiment: string) => {
    return commentData.filter(comment => 
      comment.classificacao?.toLowerCase() === sentiment.toLowerCase()
    );
  };

  const handleShowComments = () => {
    setShowComments(!showComments);
    setSelectedSentiment(null); // Reset the sentiment filter when toggling
  };

  const scrollToTools = () => {
    const toolsSection = document.getElementById('tools-section');
    if (toolsSection) {
      toolsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen hero-gradient">
      {/* Header */}
      <header className="border-b border-border/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Eye className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold text-foreground">SENTINELA</span>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              {/* Botões removidos por serem inativos */}
            </nav>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Sun className="h-4 w-4 text-muted-foreground" />
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                />
                <Moon className="h-4 w-4 text-muted-foreground" />
              </div>
              {/* Botão removido por ser inativo */}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-5xl md:text-6xl font-bold">
            <span className="gradient-text">Investigação Digital</span>
            <br />
            <span className="text-foreground">Alimentada por IA</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Sistema avançado de investigação digital com análises alimentadas por IA para monitoramento de redes sociais, 
            análise de sentimentos e insights abrangentes de dados.
          </p>
          
          <div className="flex justify-center items-center">
            <Button 
              size="lg" 
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 text-lg"
              onClick={scrollToTools}
            >
              Iniciar Investigação
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Conecte suas plataformas • Obtenha insights instantâneos • Análise avançada de IA
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20" id="tools-section">
        {/* Analysis Tools Section */}
        <div className="glass-card rounded-lg p-8 mb-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Ferramentas de Investigação</h2>
            <p className="text-muted-foreground text-lg">
              Escolha uma plataforma para começar sua investigação digital
            </p>
          </div>

          {/* Cards das Ferramentas */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* YouTube Card */}
            <Dialog open={isYoutubeModalOpen} onOpenChange={setIsYoutubeModalOpen}>
              <DialogTrigger asChild>
                 <div className={`icon-button rounded-xl p-8 transition-all duration-300 relative ${
                  selectedPlatform === 'youtube' 
                    ? 'ring-2 ring-primary bg-primary/10 shadow-xl shadow-primary/25 scale-105 cursor-pointer' 
                    : 'hover:shadow-lg cursor-pointer'
                }`}>
                   {selectedPlatform === 'youtube' && (
                    <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                      ✓
                    </div>
                  )}
                  <div className="flex flex-col items-center text-center space-y-6">
                    <div className={`p-6 rounded-full transition-all duration-300 ${
                      selectedPlatform === 'youtube' 
                        ? 'bg-primary/20 shadow-lg' 
                        : 'bg-red-500/10'
                    }`}>
                      <Youtube className={`h-12 w-12 transition-all duration-300 ${
                        selectedPlatform === 'youtube' ? 'text-primary scale-110' : 'text-red-500'
                      }`} />
                    </div>
                    <h3 className={`text-2xl font-semibold ${
                      selectedPlatform === 'youtube' ? 'text-primary' : 'text-foreground'
                    }`}>YouTube</h3>
                    <p className="text-muted-foreground">
                      Busque e analise vídeos de canais com insights alimentados por IA
                    </p>
                    {selectedPlatform === 'youtube' && (
                      <div className="text-sm text-primary font-medium">
                        Plataforma Conectada
                      </div>
                    )}
                  </div>
                </div>
              </DialogTrigger>
                 <DialogContent className="sm:max-w-5xl card-modern">
                <DialogHeader>
                  <DialogTitle className="text-xl flex items-center gap-2">
                    <Youtube className="h-5 w-5 text-red-500" />
                    {selectedChannel ? `Análise do Canal: ${selectedChannel?.name}` : 'Gerenciar Canais YouTube'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Seção de Canais Cadastrados */}
                  {!selectedChannel ? (
                    <div>
                      <div className="text-center mb-6">
                        <h3 className="text-lg font-semibold mb-2">Canais Cadastrados</h3>
                        <p className="text-muted-foreground">
                          Gerencie os canais para análise de comentários
                        </p>
                      </div>

                      {/* Botão para adicionar novo canal */}
                      <div className="flex justify-center mb-4">
                        <Dialog open={isChannelFormOpen} onOpenChange={setIsChannelFormOpen}>
                          <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/90 flex items-center gap-2">
                              <Plus className="h-4 w-4" />
                              Cadastrar Novo Canal
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md card-modern">
                            <DialogHeader>
                              <DialogTitle className="text-xl flex items-center gap-2">
                                <Youtube className="h-5 w-5 text-red-500" />
                                Cadastrar Canal
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6">
                              <div className="space-y-2">
                                <Label htmlFor="channelName">Nome do Canal</Label>
                                <Input
                                  id="channelName"
                                  placeholder="Digite o nome do canal"
                                  value={newChannelName}
                                  onChange={(e) => setNewChannelName(e.target.value)}
                                  className="bg-input border-border"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="newApiKey">API Key do YouTube</Label>
                                <Input
                                  id="newApiKey"
                                  placeholder="Digite sua API key do YouTube"
                                  value={newChannelApiKey}
                                  onChange={(e) => setNewChannelApiKey(e.target.value)}
                                  className="bg-input border-border"
                                  type="password"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="newChannelId">ID do Canal</Label>
                                <Input
                                  id="newChannelId"
                                  placeholder="Digite o ID do canal"
                                  value={newChannelId}
                                  onChange={(e) => setNewChannelId(e.target.value)}
                                  className="bg-input border-border"
                                />
                              </div>

                              <div className="flex gap-2">
                                <Button 
                                  onClick={handleAddChannel}
                                  className="flex-1 bg-primary hover:bg-primary/90"
                                  disabled={!newChannelName.trim() || !newChannelApiKey.trim() || !newChannelId.trim()}
                                >
                                  Cadastrar Canal
                                </Button>
                                <Button 
                                  variant="outline" 
                                  onClick={() => setIsChannelFormOpen(false)}
                                  className="flex-1"
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>

                      {/* Lista de canais */}
                      {channels.length > 0 ? (
                        <div className="grid md:grid-cols-2 gap-4 max-h-80 overflow-y-auto">
                          {channels.map((channel) => (
                            <div
                              key={channel.id}
                              className={`card-modern rounded-lg p-4 cursor-pointer transition-all duration-200 relative ${
                                selectedChannel?.id === channel.id
                                  ? 'ring-2 ring-primary bg-primary/5 shadow-lg'
                                  : 'hover:shadow-md border border-border'
                              }`}
                              onClick={() => handleSelectChannel(channel)}
                            >
                              <div className="flex flex-col space-y-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="p-2 bg-red-500/10 rounded-full">
                                      <Youtube className="h-4 w-4 text-red-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-sm truncate">{channel.name}</h4>
                                      <p className="text-xs text-muted-foreground truncate">
                                        {channel.channelId}
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteChannel(channel.id);
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Cadastrado em {new Date(channel.createdAt).toLocaleDateString('pt-BR')}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center p-8 border border-dashed border-border rounded-lg bg-card/50">
                          <Youtube className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h4 className="text-lg font-medium mb-2">Nenhum canal cadastrado</h4>
                          <p className="text-muted-foreground mb-4">
                            Cadastre seu primeiro canal para começar a análise
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-500/10 rounded-full">
                            <Youtube className="h-4 w-4 text-red-500" />
                          </div>
                          <div>
                            <p className="font-medium">{selectedChannel?.name}</p>
                            <p className="text-sm text-muted-foreground">{selectedChannel?.channelId}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline"
                            onClick={() => {
                              setSelectedChannel(null);
                              setVideos([]);
                              setFilteredVideos([]);
                            }}
                            size="sm"
                          >
                            Trocar Canal
                          </Button>
                          <Button 
                            onClick={handleYoutubeSearch} 
                            disabled={isLoading}
                            className="bg-primary hover:bg-primary/90"
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Buscar Vídeos"
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
                         <ScrollArea className="h-80 w-full border border-border rounded-md bg-card">
                           <div className="p-4">
                             <div className="space-y-4">
                               {filteredVideos.map((video, index) => (
                                  <div
                                     key={index}
                                     className={`w-full p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors bg-card cursor-pointer ${isAnalyzingComments ? 'opacity-50 cursor-not-allowed' : ''}`}
                                     onClick={() => !isAnalyzingComments && handleVideoClick(video)}
                                   >
                                     <div className="flex items-start gap-4">
                                       <div className="flex-shrink-0">
                                         <img
                                           src={video.thumbnail || `https://i.ytimg.com/vi/${video.id_video}/hqdefault.jpg`}
                                           alt={video.title}
                                           className="w-20 h-15 object-cover rounded"
                                         />
                                       </div>
                                       <div className="flex items-start gap-2 flex-1 min-w-0">
                                         {isAnalyzingComments ? (
                                           <Loader2 className="h-4 w-4 text-primary mt-1 flex-shrink-0 animate-spin" />
                                         ) : (
                                           <Play className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                                         )}
                                         <div className="flex-1 min-w-0">
                                           <p className="text-sm font-medium leading-relaxed break-words line-clamp-3">
                                             {video.title}
                                           </p>
                                           {isAnalyzingComments && (
                                             <p className="text-xs text-primary mt-1">
                                               Analisando comentários...
                                             </p>
                                           )}
                                         </div>
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
                  )}
                 </div>
               </DialogContent>
            </Dialog>

            {/* Analytics Card */}
            <Dialog open={isAnalyticsModalOpen} onOpenChange={setIsAnalyticsModalOpen}>
              <DialogTrigger asChild>
                 <div className={`icon-button rounded-xl p-8 transition-all duration-300 relative ${
                  selectedPlatform === 'analytics' 
                    ? 'ring-2 ring-primary bg-primary/10 shadow-xl shadow-primary/25 scale-105 cursor-pointer' 
                    : 'hover:shadow-lg cursor-pointer'
                }`}>
                  {selectedPlatform === 'analytics' && (
                    <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                      ✓
                    </div>
                  )}
                  <div className="flex flex-col items-center text-center space-y-6">
                    <div className={`p-6 rounded-full transition-all duration-300 ${
                      selectedPlatform === 'analytics' 
                        ? 'bg-primary/20 shadow-lg' 
                        : 'bg-blue-500/10'
                    }`}>
                      <BarChart3 className={`h-12 w-12 transition-all duration-300 ${
                        selectedPlatform === 'analytics' ? 'text-primary scale-110' : 'text-blue-500'
                      }`} />
                    </div>
                    <h3 className={`text-2xl font-semibold ${
                      selectedPlatform === 'analytics' ? 'text-primary' : 'text-foreground'
                    }`}>Analytics</h3>
                    <p className="text-muted-foreground">
                      Análises estatísticas avançadas e insights de desempenho
                    </p>
                    {selectedPlatform === 'analytics' && (
                      <div className="text-sm text-primary font-medium">
                        Plataforma Conectada
                      </div>
                    )}
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl card-modern">
                <DialogHeader>
                  <DialogTitle className="text-xl flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    Analytics do YouTube
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="analyticsApiKey">API Key do YouTube</Label>
                    <Input
                      id="analyticsApiKey"
                      placeholder="Digite sua API key do YouTube"
                      value={analyticsApiKey}
                      onChange={(e) => setAnalyticsApiKey(e.target.value)}
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
                    disabled={isLoadingAnalytics || !analyticsApiKey.trim() || !analyticsStartDate || !analyticsEndDate}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    {isLoadingAnalytics ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Carregando Analytics...
                      </>
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
          {selectedPlatform && (commentData.length > 0 || sentimentData.length > 0 || analyticsData.length > 0) && (
            <div className="mt-8 space-y-6 animate-fade-in">
              {selectedPlatform === "analytics" && analyticsData.length > 0 ? (
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2">Visualizações por Conteúdo</h2>
                  <p className="text-muted-foreground">
                    Analytics do canal - {analyticsData.length} dias de dados
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2">{selectedVideoTitle}</h2>
                  <h3 className="text-xl font-semibold mb-2">Análise de Sentimentos</h3>
                  <p className="text-muted-foreground">
                    Classificação de {commentData.length} comentários analisados
                  </p>
                </div>
              )}
              
              {selectedPlatform === "analytics" && analyticsData.length > 0 ? (
                <div className="space-y-6 col-span-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Visualizações por Conteúdo</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <TrendingUp className="h-4 w-4" />
                        Gráfico de linhas
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        Diária
                      </Button>
                    </div>
                  </div>
                  <div className="h-80 bg-card rounded-lg p-4 border border-border">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analyticsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="day" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return `${date.getDate()}/${date.getMonth() + 1}`;
                          }}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          labelFormatter={(value) => {
                            const date = new Date(value);
                            return `${date.getDate()} de ${date.toLocaleString('pt-BR', { month: 'long' })} de ${date.getFullYear()}`;
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="views" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          name="Visualizações"
                          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="estimatedMinutesWatched" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          name="Minutos Assistidos"
                          dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
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
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleShowComments}
                        className="bg-blue-500 hover:bg-blue-600"
                        size="sm"
                      >
                        {showComments ? "Ocultar Comentários" : "Ver Comentários"}
                      </Button>
                      <Button 
                        onClick={handleSuggestionsClick}
                        className="bg-primary hover:bg-primary/90"
                        size="sm"
                        disabled={isLoadingSuggestions}
                      >
                        {isLoadingSuggestions ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Carregando...
                          </>
                        ) : (
                          "Sugestões"
                        )}
                      </Button>
                    </div>
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
                  
                  {/* Comentários por Sentimento */}
                  {showComments && commentData.length > 0 && (
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <Button
                          onClick={() => setSelectedSentiment(selectedSentiment === 'positivo' ? null : 'positivo')}
                          variant={selectedSentiment === 'positivo' ? "default" : "outline"}
                          className="flex items-center gap-2"
                          size="sm"
                        >
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          Positivos ({getCommentsBySentiment('positivo').length})
                        </Button>
                        <Button
                          onClick={() => setSelectedSentiment(selectedSentiment === 'negativo' ? null : 'negativo')}
                          variant={selectedSentiment === 'negativo' ? "default" : "outline"}
                          className="flex items-center gap-2"
                          size="sm"
                        >
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          Negativos ({getCommentsBySentiment('negativo').length})
                        </Button>
                        <Button
                          onClick={() => setSelectedSentiment(selectedSentiment === 'neutro' ? null : 'neutro')}
                          variant={selectedSentiment === 'neutro' ? "default" : "outline"}
                          className="flex items-center gap-2"
                          size="sm"
                        >
                          <div className="w-3 h-3 rounded-full bg-gray-500" />
                          Neutros ({getCommentsBySentiment('neutro').length})
                        </Button>
                      </div>
                      
                      {selectedSentiment && (
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                          <h4 className="font-medium text-lg text-center">
                            Comentários {selectedSentiment === 'positivo' ? 'Positivos' : selectedSentiment === 'negativo' ? 'Negativos' : 'Neutros'}
                          </h4>
                          {getCommentsBySentiment(selectedSentiment).map((comment, index) => (
                            <div key={comment.id || index} className="p-4 border border-border rounded-lg bg-card">
                              <div className="flex items-start gap-3">
                                <div 
                                  className={`w-3 h-3 rounded-full mt-1 ${
                                    selectedSentiment === 'positivo' ? 'bg-green-500' : 
                                    selectedSentiment === 'negativo' ? 'bg-red-500' : 'bg-gray-500'
                                  }`}
                                />
                                <div className="flex-1">
                                  <p className="font-medium text-sm text-primary mb-1">
                                    {comment.comentario || 'Autor desconhecido'}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {comment.autor_comentario || 'Comentário não disponível'}
                                  </p>
                                  {comment.data_hora && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                      {new Date(comment.data_hora).toLocaleDateString('pt-BR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          {getCommentsBySentiment(selectedSentiment).length === 0 && (
                            <div className="text-center p-4 text-muted-foreground">
                              Nenhum comentário {selectedSentiment} encontrado.
                            </div>
                          )}
                        </div>
                      )}
                      
                      {!selectedSentiment && (
                        <div className="text-center p-4 border border-dashed border-border rounded-lg bg-card/50">
                          <p className="text-muted-foreground">
                            Selecione um tipo de sentimento para ver os comentários.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                 </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;