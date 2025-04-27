// Importação do React e dos hooks para gestão de estado
import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
// Importação dos ícones da biblioteca react-icons/fi
import {
  FiBell,
  FiMessageCircle,
  FiUser,
  FiLogOut,
  FiPlus,
  FiEdit,
  FiSettings,
  FiChevronLeft,
  FiChevronRight,
  FiX
} from 'react-icons/fi';
// Importação da API para comunicação com o servidor
import api from './services/api';
// Importação do ficheiro de estilos CSS
import './App.css';
// Adiciona o import do logotipo
import iptLogo from './ipt.png';

// importação dos modais
import UserModal from './components/UserModal';
import CreateArticleModal from './components/CreateArticleModal';
import MessagesModal from './components/MessagesModal';
import useImageLoader from './hooks/useImageLoader';
import SendMessageModal from './components/SendMessageModal';
import EditArticleModal from './components/EditArticleModal';
import ArticleDetailModal from './components/ArticleDetailModal';
// Componente de formulário do login que recebe a função onLogin como propriedade
const LoginForm = ({ onLogin }) => {
  // Estado para armazenar o email introduzido pelo utilizador
  const [email, setEmail] = useState('');
  // Estado para armazenar a password introduzida pelo utilizador
  const [password, setPassword] = useState('');

  // Função que trata o evento da submissão do formulário
  const handleSubmit = (e) => {
    // Previne o comportamento padrão de recarregar a página
    e.preventDefault();
    // Chama a função onLogin passando as credenciais
    onLogin({ email, password });
  };

  // Renderização do componente de formulário
  return (
    // Inicia o elemento principal com a classe "main-content" para estilização
    <main className="main-content">
      {/* Título principal da página que dá as boas-vindas ao utilizador*/}
      <h1>Bem-vindo à Plataforma de Trocas IPT</h1>
      {/* Formulário de autenticação com classe "login-form" e função handleSubmit para processar a submissão*/}
      <form onSubmit={handleSubmit} className="login-form">
        {/* Div que agrupa o campo de email, usando a classe "form-group" para estilização*/}
        <div className="form-group">
          {/*Campo de introdução de email com as seguintes propriedades:
        // - type="email": define que o campo deve aceitar apenas emails válidos
        // - className="search-input": aplica estilos de entrada de pesquisa ao campo
        // - placeholder="Email institucional": texto de ajuda visível quando o campo está vazio
        // - value={email}: liga o valor do campo à variável de estado "email"
        // - onChange: atualiza o estado "email" cada vez que o utilizador digita algo
        // - required: torna o preenchimento deste campo obrigatório*/}
          <input
            type="email"
            className="search-input"
            placeholder="Email institucional"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {/*Div que agrupa o campo de password, usando a classe "form-group" para estilização*/}
        <div className="form-group">
          {/* Campo de introdução de password com as seguintes propriedades:
        // - type="password": oculta os caracteres digitados para proteger a senha
        // - className="search-input": aplica estilos de entrada de pesquisa ao campo
        // - placeholder="Password": texto de ajuda visível quando o campo está vazio
        // - value={password}: liga o valor do campo à variável de estado "password"
        // - onChange: atualiza o estado "password" cada vez que o utilizador digita algo
        // - required: torna o preenchimento deste campo obrigatório*/}
          <input
            type="password"
            className="search-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="view-details">Entrar</button>
      </form>
    </main>
  );
};

// Componente para exibir a imagem do artigo
// Usa memo para evitar renderizações desnecessárias
const ArticleImage = memo(({ foto }) => {
  // Utiliza um hook personalizado para carregar a imagem
  const imageUrl = useImageLoader(foto?.caminho_foto);

  return (
    <div className="article-image-container">
      {imageUrl ? (
        // Renderiza a imagem se estiver disponível
        <img
          src={imageUrl}
          alt={foto?.titulo}
          className="article-image"
          loading="lazy" // Carregamento "preguiçoso" para melhor performance
        />
      ) : (
        // Mostra um placeholder se não houver imagem
        <div className="image-placeholder">Sem imagem</div>
      )}
    </div>
  );
});

// Componente principal do artigo
// Otimizado com memo para prevenir renderizações desnecessárias
const MemoizedArticle = memo(({ artigo, userId, onEditClick, onMessageClick, onArticleClick }) => {
  return (
    <div className="item-card">
      {/* Renderiza a primeira foto do artigo, se existir */}
      <ArticleImage foto={artigo.fotos?.[0]} />
      <div className="title-container">
        <h3>{artigo.titulo}</h3>
        <div className="icons-container">
          {/* Mostra ícone de edição apenas se o utilizador atual for o autor */}
          {artigo.utilizador?.id.toString() === userId && (
            <FiEdit
              className="icon edit-icon"
              onClick={() => onEditClick(artigo)}
              title="Editar artigo"
            />
          )}
          {/* Mostra ícone de mensagem apenas se o utilizador atual NÃO for o autor */}
          {artigo.utilizador?.id.toString() !== userId && (
            <FiMessageCircle
              className="icon message-icon-title"
              onClick={() => onMessageClick(artigo.utilizador?.id, artigo.titulo)} // Passa ID e título
              title="Enviar mensagem"
            />
          )}
        </div>
      </div>
      {/* Informação sobre o estado do artigo (com valor predefinido) */}
      <p>Estado: {artigo.estado || 'Indisponível'}</p>
      {/* Informação sobre a categoria do artigo (com valor predefinido) */}
      <p>Categoria: {artigo.categoria?.nome || 'Sem categoria'}</p>
      <div className="item-actions">
        {/* Botão para ver mais detalhes sobre o artigo */}
        <button
          className="view-details"
          onClick={() => onArticleClick(artigo)}
        >
          Ver Detalhes
        </button>
      </div>
    </div>
  );
});

// Componente principal do conteúdo após login
// Esta linha define o nome e a função do componente, indicando que este é o componente principal 
// que será apresentado depois do utilizador fazer login
const MainContent = ({
  searchTerm,
  setSearchTerm,
  // categorias: array com as categorias de artigos disponíveis na plataforma
  categorias,
  // artigos: array com os artigos que estão disponíveis na plataforma e serão mostrados ao utilizador
  artigos,
  // userId: identificador único do utilizador que está autenticado na sessão atual
  userId,
  // onSearch: função que será executada quando o utilizador clicar no botão de pesquisa
  onSearch,
  // onMessageClick: função que será executada quando o utilizador clicar para enviar mensagem, a mensagem é enviada do utilizador logado, para o proprietario do artigo
  onMessageClick,
  // onEditClick: função que será executada quando o utilizador(autor) clicar para edita o artigo
  onEditClick,
  // onArticleClick: função que será executada quando o utilizador clicar no botão de "Ver Detalhes" do artigo
  onArticleClick
}) => {
  // Estado para armazenar a categoria selecionada
  const [selectedCategory, setSelectedCategory] = useState(null);
  // Estado para armazenar temporariamente o termo de pesquisa enquanto o utilizador digita
  const [tempSearchTerm, setTempSearchTerm] = useState(searchTerm);
  // Estado para controlar a paginação dos resultados
  const [currentPage, setCurrentPage] = useState(1);
  // Estado para indicar se uma pesquisa está em curso
  const [isSearching, setIsSearching] = useState(false);
  // Estado para controlar qual grupo de categorias está a ser exibido
  const [groupIndex, setGroupIndex] = useState(0);

  // Constantes de configuração
  const itemsPerPage = 10;      // Número de itens a mostrar por página
  const maxCategories = 15;     // Número máximo de categorias a serem consideradas
  const categoriesPerGroup = 4; // Número de categorias por grupo de visualização

  // Memoriza um subconjunto limitado de categorias para melhorar o desempenho
  // Só é recalculado quando o array 'categorias' muda
  const limitedCategories = useMemo(() =>
    categorias.slice(0, maxCategories),
    [categorias]
  );

  // Função para limpar os termos de pesquisa e reiniciar o estado de pesquisa
  // useCallback evita recriações desnecessárias da função
  const handleClear = useCallback(() => {
    setTempSearchTerm('');
    setSearchTerm('');
    onSearch('');
    setIsSearching(false);
  }, [onSearch, setSearchTerm]);

  // Calcula o número total de grupos de categorias
  // Só é recalculado quando limitedCategories muda
  const totalGroups = useMemo(() =>
    Math.ceil(limitedCategories.length / categoriesPerGroup),
    [limitedCategories]
  );
  // Filtra os artigos com base na categoria selecionada
  const filteredArtigos = useMemo(() =>
    artigos.filter(artigo =>
      (!selectedCategory || artigo.categoria?.id === selectedCategory) &&
      artigo.titulo.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [artigos, selectedCategory, searchTerm]
  );

  // Função para lidar com o clique nas categorias
  const handleCategoryClick = useCallback((categoryId) => {
    setSelectedCategory(prev => prev === categoryId ? null : categoryId);
    setCurrentPage(1);
    setIsSearching(false);
  }, []);

  // Função para executar a pesquisa quando o utilizador clica no botão de pesquisa
  // useCallback evita recriações desnecessárias desta função
  const handleSearchClick = useCallback(() => {
    onSearch(tempSearchTerm); // Executa a pesquisa com o termo temporário
    setSearchTerm(tempSearchTerm); // Atualiza o termo de pesquisa oficial
    setCurrentPage(1); // Volta para a primeira página após uma nova pesquisa
    setIsSearching(!!tempSearchTerm.trim()); // Ativa o estado de pesquisa se existir texto de pesquisa
  }, [tempSearchTerm, setSearchTerm, onSearch]);

  // Função para avançar para o próximo grupo de categorias
  // Impede que o índice ultrapasse o número total de grupos
  const handleNext = useCallback(() => {
    setGroupIndex(prev => Math.min(prev + 1, totalGroups - 1));
  }, [totalGroups]);

  // Função para voltar ao grupo anterior de categorias
  // Impede que o índice seja menor que zero
  const handlePrev = useCallback(() => {
    setGroupIndex(prev => Math.max(prev - 1, 0));
  }, []);

  // Cálculo dos índices para a paginação dos artigos
  const startIndex = (currentPage - 1) * itemsPerPage;  // Índice do primeiro artigo na página atual
  const endIndex = startIndex + itemsPerPage;           // Índice do último artigo na página atual
  const currentArticles = filteredArtigos.slice(startIndex, endIndex);  // Artigos a serem exibidos na página atual
  const totalPages = Math.ceil(filteredArtigos.length / itemsPerPage);  // Total de páginas baseado no número de artigos filtrados

  return (
    // Inicia o elemento principal com a classe "main-content" que contém todo o conteúdo principal da aplicação após o login
    <main className="main-content">
      <h1>Bem-vindo à Plataforma de Trocas IPT</h1>
      {/*Div que contém a barra de pesquisa e o botão, com a classe "search-container" para estilização*/}
      <div className="search-container">
        {/*Campo de introdução de texto para a pesquisa de artigos com as seguintes propriedades:
      - type="text": define que é um campo de texto simples
      - className="search-input": aplica estilos de entrada de pesquisa ao campo
      - placeholder="Pesquisar artigos...": texto de ajuda visível quando o campo está vazio
      - value={searchTerm}: liga o valor do campo à variável de estado "searchTerm" (controlado pelo componente pai)
      - onChange: atualiza o estado "searchTerm" cada vez que o utilizador digita algo, usando a função recebida por props*/}
        <div className="search-input-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Pesquisar artigos..."
            value={tempSearchTerm}
            onChange={(e) => setTempSearchTerm(e.target.value)}
            maxLength={30}
          />

          {/* Exibe um contador de caracteres apenas quando existe texto na caixa de pesquisa */}
          {tempSearchTerm.length > 0 && (
            <div className="char-counter">
              {tempSearchTerm.length}/30 {/* Mostra quantos caracteres foram digitados de um máximo de 30 */}
            </div>
          )}
          {/* Exibe um ícone "X" para limpar a pesquisa apenas quando existe texto na caixa */}
          {tempSearchTerm && (
            <FiX
              className="clear-icon"
              onClick={handleClear}
              title="Limpar pesquisa"
            />
          )}
        </div>
        <button
          className="search-button"
          onClick={handleSearchClick}
          type="button">
          Pesquisar {/* Texto do botão */}
        </button>
      </div>

      {/* Secção de categorias */}
      {/*Contentor principal que agrupa todas as categorias, com a classe "categories" para estilização*/}
      <div className="categories-carousel">
        <button
          className="carousel-button prev"
          onClick={handlePrev}
          disabled={groupIndex === 0}
        >
          <FiChevronLeft />
        </button>
        {/*Utiliza o método map para iterar sobre o array de categorias e criar um elemento div para cada categoria*/}
        {/*A arrow function recebe cada objeto "categoria" e gera um elemento JSX (JavaScript XML) para ele*/}
        <div className="categories-container">
          {limitedCategories
            .slice(
              groupIndex * categoriesPerGroup,
              (groupIndex + 1) * categoriesPerGroup
            )
            .map((categoria) => (
              <div
                // A propriedade key é obrigatória em listas React para otimização de renderização
                // Utiliza o id da categoria como chave única
                key={categoria.id}
                // Define a classe CSS dinâmica para o cartão de categoria:
                // - Sempre aplica a classe "category-card"
                // - Adicionalmente aplica a classe "active" se esta categoria estiver selecionada (selectedCategory === categoria.id)
                // - Caso contrário, não aplica classes adicionais ('')
                className={`category-card ${selectedCategory === categoria.id ? 'active' : ''}`}
                // Define o manipulador de eventos onClick para esta categoria
                // Quando o utilizador clica na categoria, executa a função handleCategoryClick passando o id da categoria como argumento
                onClick={() => handleCategoryClick(categoria.id)}
              >
                {/*Mostra o nome da categoria dentro do div*/}
                {categoria.nome}
              </div>
            ))}
        </div>
        <button
          className="carousel-button next"
          onClick={handleNext}
          disabled={groupIndex === totalGroups - 1}
        >
          <FiChevronRight />
        </button>
      </div>

      {/* Secção de artigos recentes */}
      {/* Contentor principal da secção de artigos recentes, com a classe "recent-section" para estilização*/}
      <div className="recent-section">
        {/* Título da secção de artigos recentes*/}
        <h2>
          {isSearching || searchTerm ?
            `Resultados para "${searchTerm}"` :
            'Artigos Recentes'
          }
        </h2>

        {/* Contentor que agrupa todos os cartões de artigos, com a classe "recent-items" para estilização*/}
        <div className="recent-items">
          {/*Utiliza o método map para iterar sobre o array de artigos filtrados e criar um elemento para cada artigo
        // A arrow function recebe cada objeto "artigo" e gera um elemento JSX para ele*/}
          {/* Mapeia os artigos da página atual para criar um componente para cada um */}
          {currentArticles.map((artigo) => (
            <MemoizedArticle
              // Cria um cartão para cada artigo, com uma chave única baseada no ID do artigo e a classe "item-card"
              key={artigo.id}
              artigo={artigo} // Passa o objeto artigo completo para o componente
              userId={userId} // Passa o ID do utilizador atual para verificar permissões
              onEditClick={onEditClick} // Função para lidar com a edição do artigo
              onMessageClick={onMessageClick} // Função para enviar mensagem ao autor do artigo
              onArticleClick={onArticleClick} // Função para ver detalhes do artigo
            />
          ))}
        </div>

        <div className="pagination">
          {/* Botão para voltar à página anterior */}
          <button
            className="page-button"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}  // Reduz a página atual, mas não permite valor menor que 1
            disabled={currentPage === 1}  // Desativa o botão quando já estamos na primeira página
          >
            Anterior
          </button>

          {/* Cria botões para cada página disponível */}
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}  // Chave única para cada botão de página
              className={`page-button ${currentPage === i + 1 ? 'active' : ''}`}  // Adiciona classe 'active' ao botão da página atual
              onClick={() => setCurrentPage(i + 1)} // Define a página correspondente ao botão quando clicado
            >
              {i + 1}
            </button>
          ))}

          {/* Botão para avançar para a próxima página */}
          <button
            className="page-button"
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}  // Aumenta a página atual, mas não ultrapassa o total de páginas
            disabled={currentPage === totalPages} // Desativa o botão quando já estamos na última página
          >
            Próxima
          </button>
        </div>
      </div>
    </main>
  );
};

// Componente principal da aplicação - Define a função principal App que servirá como componente raiz da aplicação
function App() {
  // Estados para gestão da aplicação - Declaração dos vários estados que serão utilizados na aplicação
  const [artigos, setArtigos] = useState([]); // Cria um estado para armazenar a lista de artigos, inicializado como um array vazio
  const [categorias, setCategorias] = useState([]); // Cria um estado para armazenar as categorias, inicializado como um array vazio
  const [searchTerm, setSearchTerm] = useState(''); // Cria um estado para o termo de pesquisa, inicializado como uma string vazia
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Cria um estado para controlar se o utilizador está autenticado, inicializado como falso
  const [userTypeId, setUserTypeId] = useState(''); // Cria um estado para armazenar o tipo de utilizador, inicializado como uma string vazia
  const [showUserModal, setShowUserModal] = useState(false); // Estado para controlar a visibilidade do modal de utilizador
  const [userId, setUserId] = useState(''); // Estado para armazenar o ID do utilizador atual
  const [showCreateArticle, setShowCreateArticle] = useState(false); // Estado para controlar a visibilidade do formulário de criação de artigos
  const [showMessages, setShowMessages] = useState(false);  // Estado para armazenar o destinatário selecionado para envio de mensagem
  const [selectedRecipient, setSelectedRecipient] = useState(null);  // Estado para armazenar o destinatário selecionado para envio de mensagem
  const [showSendMessage, setShowSendMessage] = useState(false);   // Estado para controlar a visibilidade do formulário de envio de mensagens
  const [editingArticle, setEditingArticle] = useState(null); // Estado para armazenar o artigo que está a ser editado
  const [selectedArticle, setSelectedArticle] = useState(null); // Estado para armazenar o artigo selecionado para visualização detalhada
  const [selectedArticleTitle, setSelectedArticleTitle] = useState(null);
  
  const loadData = useCallback(async () => {
    try {
      // Utiliza Promise.all (esta técnica permite fazer múltiplos pedidos à API em paralelo), neste caso duas chamadas á API em paralelo e aguardar que ambas terminem
      const [artigosResponse, categoriasResponse] = await Promise.all([
        // Faz um pedido GET para obter a lista de artigos, incluindo o token de autenticação nos cabeçalhos
        api.get('/artigos', {
          params: { include: ['fotos', 'categoria'] },
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        // Faz um pedido GET para obter a lista de categorias, também incluindo o token de autenticação
        api.get('/categorias', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);
      // Atualiza o estado dos artigos com os dados recebidos da API
      setArtigos(artigosResponse.data);
      // Atualiza o estado das categorias com os dados recebidos da API
      setCategorias(categoriasResponse.data);
    } catch (error) {
      // Em caso de erro, regista uma mensagem de erro na consola
      console.error('Erro ao carregar dados:', error);
    }
  }, []);

  // Efeito para carregar dados quando autenticado
  useEffect(() => {
    // Verifica se o utilizador está autenticado antes de carregar os dados
    if (isAuthenticated) {
      // Chama a função loadData para carregar os artigos e categorias da API
      loadData(); // O efeito será executado quando isAuthenticated ou loadData mudarem
    }
  }, [isAuthenticated, loadData]);

  // Função para processar o login - Define uma função assíncrona que trata do processo de login
  const handleLogin = async (credentials) => {
    try {
      // Envia um pedido POST para a API com as credenciais do utilizador
      const response = await api.post('/auth/login', credentials);
      // Extrai os dados necessários da resposta da API
      const { token, userId, userTypeId } = response.data;

      if (!token || !userId.toString() || !userTypeId.toString()) {
        throw new Error('Dados de autenticação inválidos');
      }
      // Armazenamento de dados no localStorage - - Guarda os dados importantes no armazenamento local do navegador
      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId.toString());
      localStorage.setItem('userTypeId', userTypeId.toString());

      // Atualização dos estados - Atualiza os estados do componente com as informações do utilizador
      setUserId(userId.toString());
      setUserTypeId(userTypeId);
      setIsAuthenticated(true);

      // Em caso de erro, mostra uma mensagem de alerta com os detalhes do erro
    } catch (error) {
      alert(`Erro no login: ${error.response?.data?.message || error.message}`);
    }
  };

  // Função para processar o logout - Define uma função para encerrar a sessão do utilizador
  const handleLogout = () => {
    // Remove todos os dados armazenados no localStorage
    localStorage.clear();
    // Atualiza o estado de autenticação para falso, indicando que o utilizador já não está autenticado
    setIsAuthenticated(false);
    setUserTypeId('');
    setUserId('');
  };

  // Função para pesquisa de artigos - Define uma função para pesquisar artigos com base no termo de pesquisa
  const handleSearch = useCallback(async (term) => {
    try {
      // Faz um pedido GET à API com o termo de pesquisa como parâmetro
      const response = await api.get('/artigos', {
        params: {
          include: ['fotos', 'categoria'],
          titulo: term
        },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      // Atualiza o estado dos artigos com os resultados da pesquisa
      setArtigos(response.data);
      if (!term.trim()) setSearchTerm('');
    } catch (error) {
      console.error('Erro na pesquisa:', error);
    }
  }, [searchTerm]);// A função será recriada sempre que o termo de pesquisa mudar

  return (
    <div className="App">
      {/* Cabeçalho da aplicação - Define a estrutura do cabeçalho da aplicação */}
      <header className="header">

        <div className="header-left">
          <img src="./ipt.png" className="header-logo" alt="IPT Logo" />
          <div className="header-title">IPT Sustentável</div>
        </div>

        <div className="header-icons">
          {isAuthenticated && (
            <>
              {/* Ícones da barra superior - Apresenta ícones na barra superior apenas quando o utilizador está autenticado */}
              <FiBell className="icon" title="Notificações" />
              {userTypeId === '2' && (
                <FiSettings
                  className="icon"
                  title="Backoffice"
                />
              )}

              <FiMessageCircle className="icon" onClick={() => setShowMessages(true)} title="Mensagens" />
              <FiPlus className="icon" onClick={() => setShowCreateArticle(true)}  title="Criar Artigo"  />
              <FiUser className="icon" onClick={() => setShowUserModal(true)}  title="Perfil"/>
              <FiLogOut
                className="icon"
                onClick={handleLogout}
                title="Terminar sessão"
              />
            </>
          )}
        </div>
      </header>

      {/* Conteúdo principal condicional - Renderiza diferentes componentes com base no estado de autenticação*/}
      {isAuthenticated ? (
        <MainContent
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          categorias={categorias}
          artigos={artigos}
          userId={localStorage.getItem('userId')}
          onSearch={handleSearch}
          onEditClick={setEditingArticle}
          onArticleClick={(artigo) => setSelectedArticle(artigo)}
          onMessageClick={(userId, artigo) => {
            setSelectedRecipient(userId);
            setSelectedArticleTitle(artigo); // Armazena o título do artigo
            setShowSendMessage(true);
          }}
        />
      ) : (
        <LoginForm onLogin={handleLogin} />
      )}

      {/* Modal para gestão de dados do utilizador - mostrado apenas quando showUserModal*/}
      {showUserModal && (
        <UserModal
          userId={userId} // ID do utilizador atual
          token={localStorage.getItem('token')}  // Token de autenticação obtido do armazenamento local
          onClose={() => setShowUserModal(false)}  // Função para fechar o modal
          onUpdate={(updatedData) => console.log('Dados atualizados:', updatedData)}  // Função de callback quando os dados são atualizados
        />
      )}

      {/* Modal para visualização de mensagens - mostrado apenas quando showMessages é verdadeiro */}
      {showMessages && (
        <MessagesModal
          onClose={() => {
            setShowMessages(false);  // Fecha o modal de mensagens
            setSelectedRecipient(null); // Limpa o destinatário selecionado
          }}
          usuarioLogadoId={Number(userId)}  // ID do utilizador como número (convertido de string)
        />
      )}

      {/* Modal para criação de artigos - mostrado apenas quando showCreateArticle é verdadeiro */}
      {showCreateArticle && (
        <CreateArticleModal
          onClose={() => setShowCreateArticle(false)}  // Função para fechar o modal
          userId={userId}  // ID do utilizador criador do artigo
          onArticleCreated={loadData}
        />
      )}

      {/* Modal para envio de mensagens - mostrado apenas quando showSendMessage é verdadeiro */}
      {showSendMessage && (
        <SendMessageModal
          recipientId={selectedRecipient}  // ID do destinatário da mensagem
          articleTitle={selectedArticleTitle} // Passa o título do artigo para o modal
          onClose={() => {
            setShowSendMessage(false); // Fecha o modal de envio de mensagem
            setSelectedRecipient(null); // Limpa o destinatário selecionado
            setSelectedArticleTitle(null); // Limpa o título ao fechar
          }}
        />
      )}

      {/* Modal para edição de artigos - mostrado apenas quando editingArticle tem valor */}
      {editingArticle && (
        <EditArticleModal
          article={editingArticle} // Artigo que está a ser editado
          categorias={categorias}  // Lista de categorias disponíveis
          onClose={() => setEditingArticle(null)} // Função para fechar o modal
          onSave={loadData} // Função para recarregar os dados após guardar
        />
      )}

      {/* Modal para visualização detalhada de artigos - mostrado apenas quando selectedArticle tem valor */}
      {selectedArticle && (
        <ArticleDetailModal
          article={selectedArticle}  // Artigo selecionado para visualização
          onClose={() => setSelectedArticle(null)} // Função para fechar o modal
        />
      )}

    </div>
  );
}

// Exporta o componente App para ser utilizado noutros ficheiros
export default App;
