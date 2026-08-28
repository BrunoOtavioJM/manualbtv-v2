import { db } from './firebase-config.js';
import { collection, addDoc, getDocs, query, where, serverTimestamp, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

export function initNav() {
  const navToggle = document.querySelector('.nav-toggle');
  const mainNav = document.querySelector('.main-nav');

  if (navToggle && mainNav) {
    navToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      mainNav.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!mainNav.contains(e.target) && !navToggle.contains(e.target)) {
        mainNav.classList.remove('active');
      }
    });

    const navLinks = mainNav.querySelectorAll('a');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('active');
      });
    });
  }
}

export async function fetchBTCPrice() {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl,usd&include_24hr_change=true');
    if (!response.ok) throw new Error('Erro ao buscar dados da API');
    
    const data = await response.json();
    const btcData = data.bitcoin;
    
    const elementsBRL = document.querySelectorAll('[data-btc-price="brl"]');
    const elementsUSD = document.querySelectorAll('[data-btc-price="usd"]');
    const elementsChange = document.querySelectorAll('[data-btc-change]');
    
    const formatBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatUSD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
    
    elementsBRL.forEach(el => el.textContent = formatBRL.format(btcData.brl));
    elementsUSD.forEach(el => el.textContent = formatUSD.format(btcData.usd));
    
    elementsChange.forEach(el => {
      const change = btcData.brl_24h_change;
      el.textContent = change > 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`;
      el.style.color = change >= 0 ? '#10b981' : '#ef4444'; // verde ou vermelho
    });
  } catch (error) {
    console.log('Erro ao atualizar preço do BTC:', error.message);
  }
}

export function initNewsletterForms() {
  const forms = document.querySelectorAll('.newsletter-form');
  
  forms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const emailInput = form.querySelector('input[type="email"]');
      const email = emailInput.value.trim();
      const btn = form.querySelector('button[type="submit"]');
      
      if (!email) return;
      
      try {
        btn.disabled = true;
        btn.textContent = 'Enviando...';
        
        const q = query(collection(db, 'newsletter'), where('email', '==', email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          showToast('Este e-mail já está cadastrado!', 'info');
          return;
        }
        
        await addDoc(collection(db, 'newsletter'), {
          email: email,
          subscribedAt: serverTimestamp(),
          status: 'active'
        });
        
        showToast('Inscrição realizada com sucesso!', 'success');
        form.reset();
      } catch (error) {
        console.log('Erro na newsletter:', error);
        showToast('Erro ao realizar inscrição. Tente novamente.', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Inscrever-se';
      }
    });
  });
}

export function initCookieBanner() {
  const banner = document.querySelector('.cookie-banner');
  if (!banner) return;
  
  const hasAccepted = localStorage.getItem('manualbtc-cookies');
  if (!hasAccepted) {
    banner.style.display = 'block';
  } else {
    banner.style.display = 'none';
  }
  
  const acceptBtn = banner.querySelector('.btn-accept');
  if (acceptBtn) {
    acceptBtn.addEventListener('click', () => {
      localStorage.setItem('manualbtc-cookies', 'true');
      banner.style.display = 'none';
    });
  }
}

export function initScrollHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 10) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

export async function loadRecentNews() {
  const grid = document.getElementById('news-grid');
  if (!grid) return;
  
  try {
    const q = query(
      collection(db, 'noticias'),
      where('status', '==', 'published'),
      orderBy('publishedAt', 'desc'),
      limit(6)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      grid.innerHTML = '<p>Nenhuma notícia encontrada no momento.</p>';
      return;
    }
    
    grid.innerHTML = '';
    
    snapshot.forEach(docSnap => {
      const news = docSnap.data();
      const articleEl = document.createElement('article');
      articleEl.className = 'news-card';
      
      const dateStr = news.publishedAt ? formatDate(news.publishedAt) : '';
      
      articleEl.innerHTML = `
        <a href="artigo.html?id=${docSnap.id}" class="news-card-link">
          <div class="news-card-image">
            ${news.coverImageUrl ? `<img src="${news.coverImageUrl}" alt="${news.title}" loading="lazy">` : '<div class="img-placeholder"></div>'}
          </div>
          <div class="news-card-content">
            <span class="news-category">${news.category || 'Geral'}</span>
            <h3 class="news-title">${news.title}</h3>
            <div class="news-meta">
              <span class="news-date">${dateStr}</span>
              <span class="news-reading-time">${news.readingTime || 5} min de leitura</span>
            </div>
          </div>
        </a>
      `;
      grid.appendChild(articleEl);
    });
  } catch (error) {
    console.log('Erro ao carregar notícias:', error);
    grid.innerHTML = '<p>Não foi possível carregar as notícias. Tente novamente mais tarde.</p>';
  }
}

export function formatDate(timestamp) {
  if (!timestamp || !timestamp.toDate) return '';
  const date = timestamp.toDate();
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    padding: '12px 24px',
    background: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6',
    color: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    zIndex: '9999',
    transition: 'opacity 0.3s ease',
    fontFamily: 'sans-serif',
    fontSize: '14px'
  });
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initCookieBanner();
  initScrollHeader();
  initNewsletterForms();
  
  fetchBTCPrice();
  setInterval(fetchBTCPrice, 60000);
  
  loadRecentNews();
});
