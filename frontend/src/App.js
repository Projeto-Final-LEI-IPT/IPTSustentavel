// Importação do React e do hook useState para gestão de estado
import React, { useState } from 'react';
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

// Componente principal da aplicação
function App() {
  // Estado para controlar se o utilizador está autenticado
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Função assíncrona para processar o login
  const handleLogin = async (credentials) => {
    try {
      // Envia as credenciais para o servidor e aguarda a resposta
      const response = await api.post('/auth/login', credentials);
      const { token, userId, userTypeId } = response.data;

      // Armazena os dados de autenticação no localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId);
      localStorage.setItem('userTypeId', userTypeId);
      // Atualiza o estado para indicar que o utilizador está autenticado
      setIsAuthenticated(true);

    } catch (error) {
      // Exibe um alerta em caso de erro no processo de login
      alert(`Erro no login: ${error.response?.data?.message || error.message}`);
    }
  };

  // Função para processar o logout
  const handleLogout = () => {
    // Limpa todos os dados do localStorage
    localStorage.clear();
    // Atualiza o estado para indicar que o utilizador não está mais autenticado
    setIsAuthenticated(false);
  };

  // Renderização do componente principal
  return (
    <div className="App">
      <header className="header" style={{backgroundColor: '#4CAF50'}}>
        <div className="header-title">IPT Sustentável</div>
        {isAuthenticated && (
          // Mostra o botão de logout apenas se o utilizador estiver autenticado
          <div className="header-icons">
            <button 
              onClick={handleLogout}
              className="search-button"
              style={{backgroundColor: '#45a049'}}
            >
              Logout
            </button>
          </div>
        )}
      </header>

      {/* Renderização condicional baseada no estado de autenticação */}
      {isAuthenticated ? (
        <main className="main-content">
          <h2>Bem-vindo!</h2>
          <p>Login realizado com sucesso</p>
        </main>
      ) : (
        // Exibe o formulário de login se o utilizador não estiver autenticado
        <LoginForm onLogin={handleLogin} />
      )}
    </div>
  );
}

// Exporta o componente App para ser utilizado noutros ficheiros
export default App;