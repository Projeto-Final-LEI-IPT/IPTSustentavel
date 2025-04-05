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
  FiChevronRight
} from 'react-icons/fi';
// Importação da API para comunicação com o servidor
import api from './services/api';
// Importação do ficheiro de estilos CSS
import './App.css';

import UserModal from './components/UserModal';
import CreateArticleModal from './components/CreateArticleModal';
import MessagesModal from './components/MessagesModal';
import useImageLoader from './hooks/useImageLoader';
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

const ArticleImage = memo(({ foto }) => {
  const imageUrl = useImageLoader(foto?.caminho_foto);

  return (
    <div className="article-image-container">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={foto?.titulo}
          className="article-image"
          loading="lazy"
        />
      ) : (
        <div className="image-placeholder">Sem imagem</div>
      )}
    </div>
  );
});

const MemoizedArticle = memo(({ artigo, userId, onEditClick, onMessageClick, onArticleClick }) => {
  return (
    <div className="item-card">
      <ArticleImage foto={artigo.fotos?.[0]} />
      <div className="title-container">
        <h3>{artigo.titulo}</h3>
        <div className="icons-container">
          {artigo.utilizador?.id.toString() === userId && (
            <FiEdit
              className="icon edit-icon"
              onClick={() => onEditClick(artigo)}
              title="Editar artigo"
            />
          )}
          {artigo.utilizador?.id.toString() !== userId && (
            <FiMessageCircle
              className="icon message-icon-title"
              onClick={() => onMessageClick(artigo.utilizador?.id)}
              title="Enviar mensagem"
            />
          )}
        </div>
      </div>
      <p>Estado: {artigo.estado || 'Indisponível'}</p>
      <p>Categoria: {artigo.categoria?.nome || 'Sem categoria'}</p>
      <div className="item-actions">
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
  onSearch
}) => {
  // Estado para armazenar a categoria selecionada
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [tempSearchTerm, setTempSearchTerm] = useState(searchTerm);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [groupIndex, setGroupIndex] = useState(0);

  const itemsPerPage = 10;
  const maxCategories = 15;
  const categoriesPerGroup = 4;

  const limitedCategories = useMemo(() =>
    categorias.slice(0, maxCategories),
    [categorias]
  );

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

  const handleSearchClick = useCallback(() => {
    onSearch(tempSearchTerm);
    setSearchTerm(tempSearchTerm);
    setCurrentPage(1);
    setIsSearching(!!tempSearchTerm.trim());
  }, [tempSearchTerm, setSearchTerm, onSearch]);

  const handleNext = useCallback(() => {
    setGroupIndex(prev => Math.min(prev + 1, totalGroups - 1));
  }, [totalGroups]);

  const handlePrev = useCallback(() => {
    setGroupIndex(prev => Math.max(prev - 1, 0));
  }, []);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentArticles = filteredArtigos.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredArtigos.length / itemsPerPage);

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
        <input
          type="text"
          className="search-input"
          placeholder="Pesquisar artigos..."
          value={tempSearchTerm}
          onChange={(e) => setTempSearchTerm(e.target.value)}
        />
        <button className="search-button" onClick={handleSearchClick}
          type="button">
          Pesquisar
        </button>
      </div>

      {/*Comentário JavaScript XML que indica o início da secção que mostra as categorias disponíveis*/}
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


      {/* Comentário JavaScript XML que indica o início da secção que mostra os artigos recente*/}
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
          {currentArticles.map((artigo) => (
            <MemoizedArticle
              // Cria um cartão para cada artigo, com uma chave única baseada no ID do artigo e a classe "item-card"
              key={artigo.id}
              artigo={artigo}
              userId={userId}
            />
          ))}
        </div>

        <div className="pagination">
          <button
            className="page-button"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              className={`page-button ${currentPage === i + 1 ? 'active' : ''}`}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}

          <button
            className="page-button"
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
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
  const [showUserModal, setShowUserModal] = useState(false);
  const [userId, setUserId] = useState('');
  const [showCreateArticle, setShowCreateArticle] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  
  // Função para carregar dados da API (loadData) - Define uma função para obter dados de artigos e categorias da API
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
          titulo: term },
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
        <div className="header-title">IPT Sustentável</div>
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
              
              <FiMessageCircle className="icon" onClick={() => setShowMessages(true)} />
              <FiPlus className="icon" onClick={() => setShowCreateArticle(true)} />
              <FiUser className="icon" onClick={() => setShowUserModal(true)} />
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
        />
      ) : (
        <LoginForm onLogin={handleLogin} />
      )}

      {showUserModal && (
        <UserModal
          userId={userId}
          token={localStorage.getItem('token')}
          onClose={() => setShowUserModal(false)}
          onUpdate={(updatedData) => console.log('Dados atualizados:', updatedData)}
        />
      )}

      {showMessages && (
        <MessagesModal
          onClose={() => {
            setShowMessages(false);
            setSelectedRecipient(null);
          }}
          usuarioLogadoId={Number(userId)}
        />
      )}

      {showCreateArticle && (
        <CreateArticleModal
          onClose={() => setShowCreateArticle(false)}
          userId={userId}
        />
      )}

    </div>
  );
}

// Exporta o componente App para ser utilizado noutros ficheiros
export default App;