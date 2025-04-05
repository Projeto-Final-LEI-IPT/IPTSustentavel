import { useState, useEffect } from 'react';
import api from '../services/api';

const useImageLoader = (imagePath) => {
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    let objectUrl = '';
    let isMounted = true;

    const loadImage = async () => {
      try {
        if (!imagePath) return;
        
        const response = await api.get(`/pictures/${imagePath}`, {
          responseType: 'blob',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (isMounted) {
          objectUrl = URL.createObjectURL(response.data);
          setImageUrl(objectUrl);
        }
      } catch (error) {
        console.error('Erro ao carregar imagem:', error);
      }
    };

    loadImage();

    return () => {
      isMounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imagePath]);

  return imageUrl;
};

export default useImageLoader;
