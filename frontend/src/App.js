// Importação do React e dos hooks para gestão de estado
import React, { useState, useEffect, useCallback } from 'react';
// Importação dos ícones da biblioteca react-icons/fi
import {
  FiBell,
  FiMessageCircle,
  FiUser,
  FiLogOut,
  FiPlus
} from 'react-icons/fi';
// Importação da API para comunicação com o servidor
import api from './services/api';
// Importação do ficheiro de estilos CSS
import './App.css';

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
    <main className="main-content">
      <h1>Bem-vindo à Plataforma de Trocas IPT</h1>
      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <input
            type="email"
            className="search-input"
            placeholder="Email institucional"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
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

// Componente principal do conteúdo após login
const MainContent = ({
  searchTerm,
  setSearchTerm,
  categorias,
  artigos,
  userId,
  onSearch
}) => {
  // Estado para armazenar a categoria selecionada
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Filtra os artigos com base na categoria selecionada
  const filteredArtigos = artigos.filter(artigo => {
    return !selectedCategory || artigo.categoria?.id === selectedCategory;
  });

  // Função para lidar com o clique nas categorias
  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(prev => prev === categoryId ? null : categoryId);
  };

  return (
    <main className="main-content">
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Pesquisar artigos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="search-button" onClick={onSearch}>
          Pesquisar
        </button>
      </div>

      {/* Secção de categorias */}
      <div className="categories">
        {categorias.map((categoria) => (
          <div
            key={categoria.id}
            className={`category-card ${selectedCategory === categoria.id ? 'active' : ''}`}
            onClick={() => handleCategoryClick(categoria.id)}
          >
            {categoria.nome}
          </div>
        ))}
      </div>

      {/* Secção de artigos recentes */}
      <div className="recent-section">
        <h2>Artigos Recentes</h2>
        <div className="recent-items">
          {filteredArtigos.map((artigo) => (
            <div key={artigo.id} className="item-card">
              <div className="title-container">
                <h3>{artigo.titulo}</h3>
              </div>
              <p>Estado: {artigo.estado || 'Indisponível'}</p>
              <p>Categoria: {artigo.categoria?.nome || 'Sem categoria'}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

// Componente principal da aplicação
function App() {
  // Estados para gestão da aplicação
  const [artigos, setArtigos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userTypeId, setUserTypeId] = useState('');

  // Função para carregar dados da API
  const loadData = useCallback(async () => {
    try {
      const [artigosResponse, categoriasResponse] = await Promise.all([
        api.get('/artigos', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        api.get('/categorias', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);
      setArtigos(artigosResponse.data);
      setCategorias(categoriasResponse.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  }, []);

  // Efeito para carregar dados quando autenticado
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  // Função para processar o login
  const handleLogin = async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const { token, userId, userTypeId } = response.data;

      // Armazenamento de dados no localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId);
      localStorage.setItem('userTypeId', userTypeId);
      
      // Atualização dos estados
      setUserTypeId(userTypeId);
      setIsAuthenticated(true);

    } catch (error) {
      alert(`Erro no login: ${error.response?.data?.message || error.message}`);
    }
  };

  // Função para processar o logout
  const handleLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
  };

  // Função para pesquisa de artigos
  const handleSearch = useCallback(async () => {
    try {
      const response = await api.get('/artigos', {
        params: { titulo: searchTerm },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setArtigos(response.data);
    } catch (error) {
      console.error('Erro na pesquisa:', error);
    }
  }, [searchTerm]);

  return (
    <div className="App">
      {/* Cabeçalho da aplicação */}
      <header className="header">
        <div className="header-title">IPT Exchange</div>
        <div className="header-icons">
          {isAuthenticated && (
            <>
              {/* Ícones da barra superior */}
              <FiBell className="icon" title="Notificações" />
              <FiMessageCircle className="icon" title="Mensagens" />
              <FiPlus className="icon" title="Criar novo artigo" />
              <FiUser className="icon" title="Perfil do utilizador" />
              <FiLogOut 
                className="icon" 
                onClick={handleLogout} 
                title="Terminar sessão"
              />
            </>
          )}
        </div>
      </header>

      {/* Conteúdo principal condicional */}
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
    </div>
  );
}

// Exporta o componente App para ser utilizado noutros ficheiros
export default App;