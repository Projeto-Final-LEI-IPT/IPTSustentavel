import React, { useState, useEffect } from 'react';
import api from '../services/api';
import '../styles/CreateArticleModal.css';

// Componente modal para criação de novos artigos
// Recebe como props a função para fechar o modal e o ID do utilizador
const CreateArticleModal = ({ onClose, userId }) => {
  // Estado para armazenar os dados do formulário
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    categoria_id: '',
    estado: 'NOVO',
    fotos: []
  });

  // Estados para armazenar categorias, pré-visualizações de imagens e ficheiros selecionados
  const [categories, setCategories] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Hook de efeito para carregar as categorias quando o componente é elaborado
  useEffect(() => {
    const loadCategories = async () => {
      try {
        // Chama a API para obter a lista de categorias
        const response = await api.get('/categorias');
        setCategories(response.data);
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        alert('Erro ao carregar categorias');
      }
    };
    
    loadCategories();
  }, []);

  // Função para tratar a mudança de imagens
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Verifica se o número total de imagens não excede o limite de 5
    if (files.length + previewImages.length > 5) {
      alert('Máximo de 5 imagens permitido!');
      return;
    }

    // Cria URLs para pré-visualização das imagens selecionadas
    const newPreviews = files.map(file => ({
      url: URL.createObjectURL(file),
      file
    }));
    
    // Atualiza o estado com os novos ficheiros e pré-visualizações
    setSelectedFiles(prev => [...prev, ...files]);
    setPreviewImages(prev => [...prev, ...newPreviews]);
  };

  // Função para remover uma imagem da lista
  const handleRemoveImage = (index) => {
    URL.revokeObjectURL(previewImages[index].url); // Liberta a memória
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Função para fazer upload das imagens para o servidor
  const uploadImages = async () => {
    const uploadedImages = [];
    
    // Itera sobre cada ficheiro e faz o upload individualmente
    for (const file of selectedFiles) {
      const formPayload = new FormData();
      formPayload.append('foto', file);
      
      try {
        // Envia o ficheiro para a API
        const response = await api.post('/pictures', formPayload);
        uploadedImages.push(response.data.caminho);
      } catch (error) {
        console.error('Erro no upload da imagem:', error);
        alert('Erro ao enviar imagens');
      }
    }
    
    // Retorna as URLs das imagens carregadas
    return uploadedImages;
  };

  // Função para tratar o envio do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Verifica se os campos obrigatórios estão preenchidos
    if (!formData.titulo.trim() || !formData.categoria_id) {
      alert('Preencha todos os campos obrigatórios!');
      setLoading(false);
      return;
    }

    try {
      // Faz o upload das imagens primeiro
      const imagensUpload = await uploadImages();
      
      // Prepara o payload com todos os dados do artigo
      const artigoPayload = {
        ...formData,
        categoria_id: Number(formData.categoria_id),
        utilizador_id: userId,
        data_publicacao: new Date(),
        fotos: imagensUpload
      };

      // Envia os dados do artigo para a API
      await api.post('/artigos', artigoPayload);
      onClose();
    } catch (error) {
      console.error('Erro detalhado:', error.response?.data);
      alert('Erro ao criar artigo: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Renderização do componente
  return (
    <div className="user-modal-overlay">
      <div className="user-modal article-modal">
        {/* Botão para fechar o modal */}
        <button 
          className="close-button" 
          onClick={onClose} 
          aria-label="Fechar modal"
        >&times;</button>
        
        <h2>Criar Novo Artigo</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-container">
            {/* Coluna Esquerda - Formulário */}
            <div className="left-column">
              <div className="form-grid">
                <div className="form-row">
                  {/* Campo de título com contador de caracteres restantes */}
                  <div className="form-group title-group">
                  <label>Título*  ({25 - formData.titulo.length} restantes)</label>
                    <input
                      type="text"
                      value={formData.titulo}
                      onChange={(e) => {
                        if (e.target.value.length <= 25) {
                          setFormData({...formData, titulo: e.target.value})
                        }
                      }}
                      placeholder="Ex: Sofá em couro sintético"
                      className="article-input"
                      required
                      maxLength="25"
                    />
                  </div>

                  <div className="right-aligned-group">
                    {/* Dropdown para selecionar categoria */}
                    <div className="form-group category-group">
                      <label>Categoria*</label>
                      <select
                        value={formData.categoria_id}
                        onChange={(e) => setFormData({...formData, categoria_id: e.target.value})}
                        className="article-select"
                        required
                      >
                        <option value="">Selecione</option>
                        {categories.map(categoria => (
                          <option key={categoria.id} value={categoria.id}>
                            {categoria.nome}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Dropdown para selecionar estado do artigo (novo/usado) */}
                    <div className="form-group state-group">
                      <label>Estado*</label>
                      <select
                        value={formData.estado}
                        onChange={(e) => setFormData({...formData, estado: e.target.value})}
                        className="article-select"
                        required
                      >
                        <option value="NOVO">Novo</option>
                        <option value="USADO">Usado</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Campo de descrição com contador de caracteres restantes */}
                <div className="form-group full-width">
                  <label>Descrição ({100 - formData.descricao.length} restantes)</label>
                 <div>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => {
                      const text = e.target.value.replace(/[\r\n]/g, ' ');
                      if (text.length <= 100) {
                        setFormData({...formData, descricao: text})
                      }
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') e.preventDefault();
                    }}
                    placeholder="Descreva detalhes do artigo (máx. 100 caracteres)"
                    className="article-textarea"
                    rows="3"
                    maxLength="100"
                  />
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna Direita - Upload de Imagens + Botões */}
            <div className="right-column">
              <div className="form-group">
                <label>Fotos do Artigo (Máx. 5)</label>
                <div className="image-upload-container">
                  {/* Input de ficheiro oculto - acionado pelo label personalizado */}
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={previewImages.length >= 5}
                    style={{ display: 'none' }}
                    id="fileInput"
                  />
                  {/* Label personalizado para seleção de ficheiros */}
                  <label 
                    htmlFor="fileInput" 
                    className="file-upload-label"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      cursor: previewImages.length >= 5 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {/* Ícone de adição */}
                    <svg 
                      width="40" 
                      height="40" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="#007bff" 
                      strokeWidth="2"
                    >
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                    <p style={{ marginTop: '0.5rem', color: '#666', textAlign: 'center' }}>
                      Arraste imagens ou clique para enviar
                    </p>
                  </label>

                  {/* Área de pré-visualização das imagens selecionadas */}
                  <div className="image-previews">
                    {previewImages.map((preview, index) => (
                      <div key={index} className="image-preview">
                        <img 
                          src={preview.url} 
                          alt={`Preview ${index}`}
                          onLoad={() => URL.revokeObjectURL(preview.url)}
                        />
                        {/* Botão para remover imagem */}
                        <button
                          type="button"
                          className="remove-image-button"
                          onClick={() => handleRemoveImage(index)}
                          aria-label="Remover imagem"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Botões na coluna direita */}
              <div className="modal-actions">
                {/* Botão para cancelar e fechar o modal */}
                <button 
                  type="button" 
                  className="btn-cancel" 
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancelar
                </button>
                {/* Botão para submeter o formulário */}
                <button 
                  type="submit" 
                  className="btn-save"
                  disabled={loading}
                >
                  {loading ? 'Publicando...' : 'Publicar Artigo'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateArticleModal;