# YouTube Analytics Dashboard

## 📝 Descrição do Projeto

Uma aplicação web moderna para análise de comentários e métricas de vídeos do YouTube. A ferramenta permite monitorar sentimentos, extrair insights e gerar sugestões para melhorar o engajamento baseado nos comentários dos vídeos.

## ✨ Funcionalidades Principais

### 🎯 Análise de Comentários
- **Classificação de Sentimentos**: Análise automática de comentários em positivos, negativos e neutros
- **Extração de Palavras-chave**: Identificação automática de temas relevantes
- **Análise de Temas**: Categorização de comentários por assuntos
- **Sugestões de Melhoria**: Geração de recomendações baseadas no feedback dos usuários

### 📊 Visualização de Dados
- **Gráficos Interativos**: Pie chart e bar chart para visualizar distribuição de sentimentos
- **Analytics do Canal**: Gráficos de views e tempo assistido ao longo do tempo
- **Filtros por Sentimento**: Visualização específica por tipo de classificação

### 🔧 Gestão de Canais
- **Múltiplos Canais**: Cadastre e gerencie vários canais do YouTube
- **Armazenamento Local**: Suas configurações são salvas automaticamente
- **Troca Rápida**: Alterne entre canais facilmente

### 🎨 Interface Moderna
- **Dark/Light Mode**: Tema claro e escuro
- **Design Responsivo**: Funciona em desktop e mobile
- **Interface Intuitiva**: Design limpo e fácil de usar

## 🚀 Como Usar

### 1. Configuração Inicial
1. Cadastre um novo canal fornecendo:
   - Nome do canal
   - API Key do YouTube
   - ID do canal

### 2. Analisando Vídeos
1. Selecione um canal cadastrado
2. Busque os vídeos do canal
3. Clique em um vídeo para analisar seus comentários
4. Visualize os dados nos gráficos interativos

### 3. Obtendo Sugestões
1. Após analisar um vídeo, clique em "Buscar Sugestões"
2. Visualize as recomendações geradas pela IA
3. Use os insights para melhorar seu conteúdo

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18 com TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Build Tool**: Vite
- **Charts**: Recharts
- **Icons**: Lucide React
- **Tema**: next-themes
- **Routing**: React Router DOM

## 📋 Pré-requisitos

- API Key do YouTube Data API v3
- ID do canal do YouTube que você deseja analisar

### Como obter uma API Key do YouTube:
1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a YouTube Data API v3
4. Crie credenciais (API Key)
5. Configure as restrições de API conforme necessário

## 🚀 Instalação e Desenvolvimento

```bash
# Clone o repositório
git clone <URL_DO_REPOSITORIO>

# Navegue para o diretório
cd youtube-analytics-dashboard

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

## 📁 Estrutura do Projeto

```
src/
├── components/ui/     # Componentes da interface
├── hooks/            # Custom hooks
├── lib/              # Utilitários
├── pages/            # Páginas da aplicação
│   └── Index.tsx     # Página principal
└── main.tsx          # Ponto de entrada
```

## 🔗 API Endpoints

O projeto se integra com uma API externa para processamento dos dados:

- **Buscar Vídeos**: `POST /webhook/buscar-videos-youtube`
- **Analisar Comentários**: `POST /webhook/buscar-youtube`
- **Gerar Sugestões**: `POST /webhook/buscar-youtube-sugestoes`

## 🤝 Como Contribuir

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 📞 Suporte

Para suporte, entre em contato através do [Lovable](https://lovable.dev/projects/0989be23-148e-441e-ab94-a1979004e9ed) ou abra uma issue no repositório.