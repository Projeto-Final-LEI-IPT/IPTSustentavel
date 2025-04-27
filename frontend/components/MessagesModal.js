import React, { useState, useEffect, useRef } from 'react';
import '../styles/MessagesModal.css';

// Função auxiliar para formatar datas no formato português (DD/MM/AAAA)
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Componente principal do modal de mensagens
const MessagesModal = ({ onClose, utilizadorLogadoId, onMessagesRead }) => {
  // Estado para controlar a conversa selecionada
  const [selectedConversation, setSelectedConversation] = useState(null);
  // Estado para controlar o texto da nova mensagem a ser enviada
  const [newMessage, setNewMessage] = useState('');
  // Estado para controlar a pesquisa de conversas
  const [searchQuery, setSearchQuery] = useState('');
  // Estado para armazenar todas as conversas do utilizador
  const [conversations, setConversations] = useState([]);
  // Estado para controlar o carregamento de dados
  const [loading, setLoading] = useState(true);
  // Estado para controlar mensagens de erro
  const [error, setError] = useState(null);
  
  // Referência para o contentor de mensagens (para scroll automático)
  const chatMessagesRef = useRef(null);

  // Efeito para selecionar automaticamente a primeira conversa quando os dados são carregados
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0]);
    }
  }, [conversations]);

  // Função para validar IDs e garantir que são valores numéricos válidos
  const validateIds = (...ids) => {
    ids.forEach(id => {
      if (id === null || id === undefined || id === '') {
        throw new Error('IDs inválidos: valor ausente');
      }
      const numericId = Number(id);
      if (isNaN(numericId)) {
        throw new Error(`ID inválido: ${id}`);
      }
    });
  };

  // Efeito para fazer scroll automático para a última mensagem quando a conversa muda
  useEffect(() => {
    if (chatMessagesRef.current && selectedConversation) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [selectedConversation?.messages]);

  // Função para inserir divisores de data entre mensagens de dias diferentes
  const getMessagesWithDates = (messages) => {
    let lastDate = null;
    return messages.reduce((acc, message) => {
      const currentDate = formatDate(message.data);
      
      // Se a data mudou, adiciona um divisor de data
      if (currentDate !== lastDate) {
        acc.push({
          type: 'dateDivider',
          date: currentDate,
          id: `divider-${message.id}`
        });
        lastDate = currentDate;
      }
      
      // Adiciona a mensagem com tipo especificado
      acc.push({
        type: 'message',
        ...message
      });
      
      return acc;
    }, []);
  };

 useEffect(() => {
    // Marca mensagens como lidas quando uma conversa é selecionada
    const markMessagesAsRead = async () => {
      if (!selectedConversation) return;

      try {
        const token = localStorage.getItem('token');
        await fetch(`http://localhost:3001/api/mensagens/marcar-lidas/${selectedConversation.user.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // Atualiza o contador de mensagens não lidas para zero na conversa selecionada
        setConversations(prev => prev.map(conv => {
          if (conv.id === selectedConversation.id) {
            return { ...conv, unreadCount: 0 };
          }
          return conv;
        }));

        // Se a função onMessagesRead for fornecida, chame-a para atualizar o contador
        if (onMessagesRead) {
          onMessagesRead();
        }
      } catch (error) {
        console.error('Erro ao marcar mensagens como lidas:', error);
      }
    };

    markMessagesAsRead();
  }, [selectedConversation]);
  
  // Efeito para procurar as conversas do utilizador ao carregar o componente
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        // Obtém o token de autenticação do armazenamento local
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3001/api/mensagens', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
        
        const mensagens = await response.json();
        
        // Agrupa as mensagens por conversa (destinatário/remetente)
        const grouped = mensagens.reduce((acc, msg) => {
          try {
            validateIds(msg.remetente_id, msg.destinatario?.id);
            // Ignora mensagens enviadas para si mesmo
            if (msg.remetente_id === msg.destinatario.id) return acc;

            // Determina se a mensagem foi enviada pelo utilizador logado
            const isFromLoggedUser = Number(msg.remetente_id) === Number(usuarioLogadoId);
            // Identifica o outro interveniente na conversa
            const partner = isFromLoggedUser ? msg.destinatario : msg.remetente;
            // Ignora mensagens para si mesmo (verificação adicional)
            if (partner.id === usuarioLogadoId) return acc;

            const partnerId = partner.id;
            // Cria uma nova entrada para o parceiro se ainda não existir
            if (!acc[partnerId]) {
              acc[partnerId] = {
                id: partnerId,
                user: {
                  id: partner.id,
                  nome: partner.nome,
                  initials: partner.nome.substring(0, 2).toUpperCase(),
                },
                messages: []
              };
            }

            // Adiciona a mensagem à conversa correspondente
            acc[partnerId].messages.push({
              id: msg.id,
              content: msg.conteudo,
              data: msg.data,
              time: new Date(msg.data).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isSent: isFromLoggedUser
            });

            return acc;
          } catch (error) {
            console.error('Erro ao processar mensagem:', error);
            return acc;
          }
        }, {});

        // Organiza as conversas por data (mais recente primeiro) e ordena as mensagens cronologicamente
        const sortedConversations = Object.values(grouped)
          .map(conv => ({
            ...conv,
            messages: conv.messages.sort((a, b) => new Date(a.data) - new Date(b.data))
          }))
          .sort((a, b) => {
            const lastMsgA = a.messages[a.messages.length - 1]?.data || 0;
            const lastMsgB = b.messages[b.messages.length - 1]?.data || 0;
            return new Date(lastMsgB) - new Date(lastMsgA);
          });

        setConversations(sortedConversations);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [utilizadorLogadoId]);

  // Função para enviar uma nova mensagem
  const handleSendMessage = async () => {
    try {
      if (!newMessage.trim()) throw new Error('Digite uma mensagem');
      if (!selectedConversation) throw new Error('Selecione uma conversa');
      
      validateIds(utilizadorLogadoId, selectedConversation.user.id);

      // Envia a mensagem para a API
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/mensagens', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conteudo: newMessage.trim(),
          remetente_id: utilizadorLogadoId,
          destinatario_id: selectedConversation.user.id
        })
      });

      const novaMensagem = await response.json();
      
      // Atualiza a lista de conversas com a nova mensagem
      setConversations(prev => prev.map(conv => {
        if (conv.id === selectedConversation.id) {
          const updatedMessages = [
            ...conv.messages,
            {
              id: novaMensagem.id,
              content: novaMensagem.conteudo,
              data: novaMensagem.data,
              time: new Date(novaMensagem.data).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isSent: true
            }
          ].sort((a, b) => new Date(a.data) - new Date(b.data));

          return {
            ...conv,
            messages: updatedMessages
          };
        }
        return conv;
      }));
      
      // Limpa o campo de nova mensagem
      setNewMessage('');
      onClose(); // Fecha o modal após enviar a mensagem
    } catch (error) {
      setError(error.message);
    }
  };

  // Renderização do componente
  return (
    <div className="messages-modal-overlay">
      <div className="messages-modal-content">
        <button className="close-modal-button" onClick={onClose}>&times;</button>
        
        <h2 className="modal-title">Mensagens</h2>

        {/* Exibe mensagens de erro quando ocorrem */}
        {error && <div className="error-message">{error}</div>}

        {loading ? (
          // Exibe indicador de carregamento
          <div className="loading-container">Carregando...</div>
        ) : (
          // Exibe o conteúdo principal quando os dados estão carregados
          <div className="messages-content-wrapper">
            {/* Lista de conversas (painel lateral esquerdo) */}
            <div className="conversations-list">
              <input
                type="text"
                placeholder="Procurar conversas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              
              {/* Filtra e mapeia as conversas com base na pesquisa */}
              {conversations
                .filter(conv => conv.user.nome.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(conversation => (
                  <div
                    key={conversation.id}
                    className={`conversation-item ${selectedConversation?.id === conversation.id ? 'active' : ''}`}
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <div className="user-avatar">{conversation.user.initials}</div>
                    <p>{conversation.user.nome}</p>
                  </div>
                ))}
            </div>

            {/* Área de chat (painel direito) - exibida apenas quando há uma conversa selecionada */}
            {selectedConversation && (
              <div className="chat-area">
                {/* Cabeçalho do chat mostrando o interlocutor atual */}
                <div className="chat-header">
                  <div className="user-avatar">{selectedConversation.user.initials}</div>
                  <h3>{selectedConversation.user.nome}</h3>
                </div>

                {/* Área de mensagens com scroll automático */}
                <div className="chat-messages" ref={chatMessagesRef}>
                  {getMessagesWithDates(selectedConversation.messages).map((item) => {
                    // Renderiza separadores de data
                    if (item.type === 'dateDivider') {
                      return (
                        <div key={item.id} className="date-divider">
                          <span>{item.date}</span>
                        </div>
                      );
                    }
                    
                    // Renderiza bolhas de mensagem
                    return (
                      <div
                        key={item.id}
                        className={`message-bubble ${item.isSent ? 'sent' : 'received'}`}
                      >
                        {item.content && <p>{item.content}</p>}
                        <span>{item.time}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Área de entrada para enviar novas mensagens */}
                <div className="chat-input">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Escreva uma mensagem..."
                  />
                  <button onClick={handleSendMessage}>Enviar</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesModal;
