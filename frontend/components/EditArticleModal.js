import React, { useState, useEffect } from 'react';
// Importação de ícones da biblioteca react-icons
import { FiX, FiTrash2, FiUpload } from 'react-icons/fi';
// Serviço para comunicação com a API
import api from '../services/api';
// Hook personalizado para carregar imagens
import useImageLoader from '../hooks/useImageLoader';
// Importação do ficheiro CSS para estilização
import '../styles/EditArticleModal.css';
// Componente Thumbnail: Apresenta uma miniatura de uma imagem com opção de eliminar
// Recebe: a foto, função para eliminar e função de clique
const Thumbnail = ({ foto, onDelete, onClick }) => {
  // Utiliza hook para carregar a imagem
  const imageUrl = useImageLoader(foto.caminho_foto);

  return (
    <div className="thumbnail-item">
      <img
        src={imageUrl}
        alt={`Thumbnail ${foto.id}`}
        className="thumbnail-image"
        // Carregamento "preguiçoso" para melhorar desempenho
        loading="lazy"
        // Ao clicar, define esta como imagem principal
        onClick={() => onClick(foto.caminho_foto)}
      />
      <button
        className="delete-photo-btn"
        onClick={(e) => {
          // Impede que o evento se propague para o elemento pai
          e.stopPropagation();
          // Chama a função para eliminar a foto
          onDelete(foto.id);
        }}
      >
        <FiTrash2 size={14} />
      </button>
    </div>
  );
};

// Componente principal EditArticleModal: Modal para edição de um artigo existente
// Recebe: o artigo a editar, categorias disponíveis, funções para fechar o modal e salvar alterações
const EditArticleModal = ({ article, categorias, onClose, onSave }) => {
  // Estado para os dados do formulário com valores predefinidos
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    estado: 'Novo',
    categoria_id: '',
    disponivel: true,
    validade_meses: 6
  });
   // Estado para ficheiros carregados mas ainda não enviados
  const [uploadedFiles, setUploadedFiles] = useState([]);
  // Estado para fotos já existentes no servidor
  const [existingPhotos, setExistingPhotos] = useState([]);
  // URL da imagem principal selecionada
  const [selectedMainImageUrl, setSelectedMainImageUrl] = useState('');
  // Carrega a imagem principal
  const mainImageUrl = useImageLoader(selectedMainImageUrl);
  // Calcula espaços disponíveis para fotos (máximo 5)
  const remainingSlots = 5 - (existingPhotos.length + uploadedFiles.length);

  // Effect para limpar URLs de objetos quando o componente é desmontado, evitando fugas de memória
  useEffect(() => {
    return () => {
      uploadedFiles.forEach(file => URL.revokeObjectURL(file.preview));
    };
  }, [uploadedFiles]);

   // Effect para inicializar o formulário com os dados do artigo quando este é carregado
  useEffect(() => {
    if (article) {
      setFormData({
        titulo: article.titulo,
        descricao: article.descricao,
        estado: article.estado,
        categoria_id: article.categoria?.id, // Operador opcional para evitar erro se categoria for null
        disponivel: article.disponivel,
        validade_meses: article.validade_meses
      });
      // Define fotos existentes ou array vazio se não houver
      setExistingPhotos(article.fotos || []);
      // Define primeira foto como principal, se existir
      setSelectedMainImageUrl(article.fotos[0]?.caminho_foto || '');
    }
  }, [article]);

   // Effect para garantir que há sempre uma imagem principal selecionada quando existem foto
  useEffect(() => {
    const exists = existingPhotos.some(foto => foto.caminho_foto === selectedMainImageUrl) ||
      uploadedFiles.some(file => file.preview === selectedMainImageUrl);
    // Se a imagem principal atual não existir e houver outras fotos disponíveis, escolher uma nova
    if (!exists && (existingPhotos.length > 0 || uploadedFiles.length > 0)) {
      const newSelected = existingPhotos[0]?.caminho_foto || uploadedFiles[0]?.preview || '';
      setSelectedMainImageUrl(newSelected);
    }
  }, [existingPhotos, uploadedFiles]);

  const handleFileUpload = (e) => {
     // Converte FileList para array
    const files = Array.from(e.target.files);
    // Calcula slots disponíveis
    const availableSlots = 5 - (existingPhotos.length + uploadedFiles.length);
    // Limita o número de ficheiros ao espaço disponível e cria previews
    const newFiles = files.slice(0, availableSlots).map(file => ({
      file,
      // Cria URL para preview da imagem
      preview: URL.createObjectURL(file)
    }));
     // Adiciona novos ficheiros ao estado
    setUploadedFiles(prev => [...prev, ...newFiles]);
     // Se houver novos ficheiros e não houver imagem principal, define a primeira como principal
    if (newFiles.length > 0 && !selectedMainImageUrl) {
      setSelectedMainImageUrl(newFiles[0].preview);
    }
  };
  // Handle para eliminar fotos existentes (já guardadas no servidor)
  const handleDeleteExistingPhoto = async (photoId) => {
    try {
      // Enviar pedido DELETE para a API
      await api.delete(`/artigos/${article.id}/fotos/${photoId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      // Atualizar estado local após eliminação bem-sucedida
      setExistingPhotos(prev => {
        const newPhotos = prev.filter(photo => photo.id !== photoId);
         // Se a foto eliminada era a principal, selecionar outra
        if (selectedMainImageUrl === prev.find(p => p.id === photoId)?.caminho_foto) {
          setSelectedMainImageUrl(newPhotos[0]?.caminho_foto || uploadedFiles[0]?.preview || '');
        }
        return newPhotos;
      });
    } catch (error) {
      alert('Erro ao apagar foto: ' + (error.response?.data?.message || error.message));
    }
  };
  // Handle para eliminar fotos recém-carregadas (ainda não enviadas ao servidor)
  const handleDeleteNewPhoto = (index) => {
    setUploadedFiles(prev => {
      const fileToDelete = prev[index];
      URL.revokeObjectURL(fileToDelete.preview);
      const newFiles = prev.filter((_, i) => i !== index);
       // Se a foto eliminada era a principal, selecionar outra
      if (fileToDelete.preview === selectedMainImageUrl) {
        setSelectedMainImageUrl(newFiles[0]?.preview || existingPhotos[0]?.caminho_foto || '');
      }
      return newFiles;
    });
  };
   // Handle de submissão do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Atualizar dados básicos
      await api.put(`/artigos/${article.id}`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      // Upload de novas fotos
      if (uploadedFiles.length > 0) {
        // FormData para envio de ficheiros
        const formDataPhotos = new FormData();
        uploadedFiles.forEach(uploadedFile => {
           // Adiciona cada ficheiro ao FormData
          formDataPhotos.append('fotos', uploadedFile.file);
        });
        // Envia fotos para o servidor
        const response = await api.post(
          `/artigos/${article.id}/fotos`,
          formDataPhotos,
          {
            headers: {
              // Necessário para upload de ficheiros
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
         // Atualiza estado com novas fotos retornadas pelo servidor
        if (response.data.fotos) {
          setExistingPhotos(prev => [...prev, ...response.data.fotos]);
        }
      }
      // Limpa ficheiros carregados, executa callbacks de sucesso e fecha moda
      setUploadedFiles([]);
      onSave();
      onClose();
    } catch (error) {
      alert('Erro ao atualizar: ' + (error.response?.data?.message || error.message));
    }
  };
  // Renderização do componente
  return (
    <div className="modal-overlay"> {/* Fundo escurecido do modal */}
      <div className="article-detail-modal"> {/* Conteúdo do modal */}
        <button className="close-button" onClick={onClose}>
          <FiX size={20} />  {/* Botão de fechar com ícone X */}
        </button>

        <div className="product-container">
           {/* Secção do formulário */}
          <div className="form-section">
            <h2 className="product-title">Editar Artigo</h2>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group required full-width">
                  <label>
                    Título
                    <span className="char-count">({formData.titulo.length}/25)</span> {/* Contador de caracteres */}
                  </label>
                  <input
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    maxLength="25"  // Limita a 25 caracteres
                    required // Campo obrigatório
                  />
                </div>

                <div className="form-group full-width">
                  <label>
                    Descrição
                    <span className="char-count">({formData.descricao.length}/100)</span> {/* Contador de caracteres */}
                  </label>
                  <div className="textarea-container">
                    <textarea
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      maxLength="100" // Limita a 100 caracteres
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Estado</label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  >
                    <option value="Novo">Novo</option>
                    <option value="Usado">Usado</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Disponibilidade</label>
                  <select
                    value={formData.disponivel}
                    onChange={(e) => setFormData({ ...formData, disponivel: e.target.value === 'true' })}// Converte string para booleano
                  >
                    <option value={true}>Disponível</option>
                    <option value={false}>Indisponível</option>
                  </select>
                </div>

                <div className="form-group required">
                  <label>Categoria</label>
                  <select
                    value={formData.categoria_id}
                    onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                    required
                  >
                    {categorias.map(categoria => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Validade (meses)</label>
                  <input
                    type="number"
                    min="1" // Valor mínimo de 1 mês
                    value={formData.validade_meses}
                    onChange={(e) => setFormData({ ...formData, validade_meses: parseInt(e.target.value, 10) })} // Converte para inteiro
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={onClose}>
                  Cancelar
                </button>
                <button type="submit" className="btn-save">
                  Guardar Alterações
                </button>
              </div>
            </form>
          </div>
          {/* Secção da galeria de imagens */}         
          <div className="gallery-section">
            <h1 className="gallery-title">
              Fotos do Artigo
              <span className="char-count">({existingPhotos.length + uploadedFiles.length}/5)</span> {/* Contador de fotos */}
            </h1>

            <div className="main-image">
              {mainImageUrl ? (
                <img
                  src={mainImageUrl}
                  alt="Imagem principal"
                  className="product-image"
                />
              ) : (
                <div className="image-placeholder">Sem imagens</div> // Placeholder quando não há imagens
              )}
            </div>

            <div className="thumbnail-grid">
              {/* Renderiza miniaturas para fotos existentes */}
              {existingPhotos.map((foto) => (
                <Thumbnail
                  key={foto.id}
                  foto={foto}
                  onDelete={handleDeleteExistingPhoto}
                  onClick={(caminho) => setSelectedMainImageUrl(caminho)}
                />
              ))}
              {/* Renderiza miniaturas para fotos recém-carregadas */}
              {uploadedFiles.map((uploadedFile, index) => (
                <div 
                  key={`new-${index}`} 
                  className="thumbnail-item"
                  onClick={() => setSelectedMainImageUrl(uploadedFile.preview)}
                >
                  <img
                    src={uploadedFile.preview}
                    alt={`Nova imagem ${index}`}
                    className="thumbnail-image"
                  />
                  <button
                    className="delete-photo-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNewPhoto(index);
                    }}
                  >
                    <FiTrash2 size={14} /> {/* Ícone de lixo */}
                  </button>
                </div>
              ))}
               {/* Botão para adicionar mais fotos se houver espaço disponível */}
              {remainingSlots > 0 && (
                <label className="upload-thumbnail">
                  <input
                    type="file"
                    multiple  // Permite selecionar múltiplos ficheiros
                    onChange={handleFileUpload}
                    accept="image/*" // Aceita apenas imagens
                    style={{ display: 'none' }} // Esconde o input nativo
                  />
                  <FiUpload size={20} /> {/* Ícone de upload */}
                  Adicionar Fotos
                </label>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditArticleModal; // Exporta o componente para uso noutros ficheiros