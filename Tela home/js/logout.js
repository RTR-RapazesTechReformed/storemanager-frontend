// Logout helper: clears sessionStorage and redirects to login page
async function logout() {
  try {
    // Optionally inform backend about logout if endpoint exists
    const sessionId = sessionStorage.getItem('session-id');
    const userId = sessionStorage.getItem('user-id');

    if (sessionId) {
      // Best-effort notify server (doesn't block logout if it fails)
      fetch('http://localhost:8080/store-manager-api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId || ''
        },
        body: JSON.stringify({ sessionId })
      }).catch(() => {});
    }
  } finally {
    // Clear known session keys
    ['session-id', 'user-id', 'auth-response'].forEach(k => sessionStorage.removeItem(k));
    // Redirect to login (relative to Tela home/html/loja.html)
    window.location.href = '../../Tela de Login/html/index.html';
  }
}

// Expose globally
window.logout = logout;
