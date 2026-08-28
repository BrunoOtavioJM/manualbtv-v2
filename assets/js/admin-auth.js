import { auth } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

let currentUser = null;

export function checkAuth() {
  const currentPath = window.location.pathname;
  const isLoginPage = currentPath.endsWith('admin/index.html') || currentPath.endsWith('admin/');

  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user;
      
      // Se está logado e tentou acessar o login, redireciona para dashboard
      if (isLoginPage) {
        window.location.href = '/admin/dashboard.html';
      }
      
      // Atualiza interface com email do usuário
      const emailDisplays = document.querySelectorAll('.admin-user-email');
      emailDisplays.forEach(el => {
        el.textContent = user.email;
      });
      
    } else {
      currentUser = null;
      // Se não está logado e NÃO está na página de login, redireciona para login
      if (!isLoginPage) {
        window.location.href = '/admin/index.html';
      }
    }
  });
}

export async function logout() {
  try {
    await signOut(auth);
    window.location.href = '/admin/index.html';
  } catch (error) {
    console.log('Erro ao fazer logout:', error);
    alert('Erro ao sair. Tente novamente.');
  }
}

export function getCurrentUser() {
  return currentUser;
}

// Inicializa checagem ao carregar página admin
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  
  const logoutBtns = document.querySelectorAll('.btn-logout');
  logoutBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  });
});
