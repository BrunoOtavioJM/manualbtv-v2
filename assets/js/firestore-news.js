import { db } from './firebase-config.js';
import { 
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, 
  query, where, limit, orderBy, increment, serverTimestamp, onSnapshot 
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const NEWS_COLLECTION = 'noticias';

export function generateSlug(title) {
  return title
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9 -]/g, "") // Remove caracteres especiais
    .replace(/\s+/g, "-") // Substitui espaços por hífen
    .replace(/-+/g, "-") // Remove hífens múltiplos
    .trim();
}

export function estimateReadingTime(htmlContent) {
  if (!htmlContent) return 1;
  const text = htmlContent.replace(/<[^>]*>?/gm, ''); // Remove tags HTML
  const words = text.trim().split(/\s+/).length;
  const time = Math.ceil(words / 200); // Média de 200 palavras por minuto
  return time > 0 ? time : 1;
}

export async function createArticle(data) {
  try {
    if (!data.title || !data.content || !data.category) {
      throw new Error('Campos obrigatórios ausentes (title, content, category).');
    }

    const slug = data.slug || generateSlug(data.title);
    
    // Verifica se slug já existe
    const slugExists = await getArticleBySlug(slug);
    const finalSlug = slugExists ? `${slug}-${Date.now()}` : slug;

    const docData = {
      ...data,
      slug: finalSlug,
      readingTime: estimateReadingTime(data.content),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      views: 0
    };

    if (data.status === 'published') {
      docData.publishedAt = serverTimestamp();
    }

    const docRef = await addDoc(collection(db, NEWS_COLLECTION), docData);
    return { id: docRef.id, ...docData };
  } catch (error) {
    console.log('Erro ao criar artigo:', error);
    throw error;
  }
}

export async function updateArticle(id, data) {
  try {
    const docRef = doc(db, NEWS_COLLECTION, id);
    
    const updateData = {
      ...data,
      updatedAt: serverTimestamp()
    };
    
    if (data.content) {
      updateData.readingTime = estimateReadingTime(data.content);
    }
    
    if (data.status === 'published' && !data.publishedAt) {
      updateData.publishedAt = serverTimestamp();
    }

    await updateDoc(docRef, updateData);
    return true;
  } catch (error) {
    console.log('Erro ao atualizar artigo:', error);
    throw error;
  }
}

export async function deleteArticle(id) {
  try {
    const confirmDelete = window.confirm("Tem certeza que deseja excluir esta notícia? Esta ação não pode ser desfeita.");
    if (!confirmDelete) return false;
    
    const docRef = doc(db, NEWS_COLLECTION, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.log('Erro ao excluir artigo:', error);
    throw error;
  }
}

export async function getArticleById(id) {
  try {
    const docRef = doc(db, NEWS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.log('Erro ao buscar artigo por ID:', error);
    throw error;
  }
}

export async function getArticleBySlug(slug) {
  try {
    const q = query(collection(db, NEWS_COLLECTION), where('slug', '==', slug), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.log('Erro ao buscar artigo por slug:', error);
    throw error;
  }
}

export async function getArticles(filters = {}) {
  try {
    let constraints = [];
    
    if (filters.status) {
      constraints.push(where('status', '==', filters.status));
    }
    
    if (filters.category) {
      constraints.push(where('category', '==', filters.category));
    }
    
    if (filters.orderByField) {
      constraints.push(orderBy(filters.orderByField, filters.orderDirection || 'desc'));
    } else {
      constraints.push(orderBy('createdAt', 'desc'));
    }
    
    if (filters.limitCount) {
      constraints.push(limit(filters.limitCount));
    }

    const q = query(collection(db, NEWS_COLLECTION), ...constraints);
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.log('Erro ao listar artigos:', error);
    throw error;
  }
}

export async function getLatestArticles(n = 6) {
  return getArticles({
    status: 'published',
    orderByField: 'publishedAt',
    orderDirection: 'desc',
    limitCount: n
  });
}

export async function getFeaturedArticles() {
  try {
    const q = query(
      collection(db, NEWS_COLLECTION),
      where('status', '==', 'published'),
      where('featured', '==', true),
      orderBy('publishedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.log('Erro ao buscar destaques:', error);
    throw error;
  }
}

export async function incrementViews(id) {
  try {
    const docRef = doc(db, NEWS_COLLECTION, id);
    await updateDoc(docRef, {
      views: increment(1)
    });
  } catch (error) {
    console.log('Erro ao incrementar visualizações:', error);
  }
}

export function subscribeToArticles(callback) {
  const q = query(collection(db, NEWS_COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const articles = [];
    snapshot.forEach((doc) => {
      articles.push({ id: doc.id, ...doc.data() });
    });
    callback(articles);
  }, (error) => {
    console.log('Erro no listener de artigos:', error);
  });
}
