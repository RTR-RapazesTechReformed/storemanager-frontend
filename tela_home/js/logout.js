// Logout helper: clears sessionStorage and redirects to login page
async function logout() {
  try {
    // Optionally inform backend about logout if endpoint exists
    const sessionId = sessionStorage.getItem("session-id");
    const userId = sessionStorage.getItem("user-id");

    if (sessionId) {
      // Best-effort notify server (doesn't block logout if it fails)

      // ====== CONFIGURAÇÃO DA API ======
      // Para produção/deploy, use os caminhos relativos (proxy Nginx):
      //   API_BASE_URL: "/api/store-manager-api"
      // Para rodar local, use os endpoints locais, por exemplo:
      //   API_BASE_URL: "http://localhost:8080"

      fetch("http://localhost:8080/api/store-manager-api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "user-id": userId || "",
        },
        body: JSON.stringify({ sessionId }),
      }).catch(() => {});
    }
  } finally {
    // Clear known session keys
    ["session-id", "user-id", "auth-response"].forEach((k) =>
      sessionStorage.removeItem(k)
    );
    // Redirect to login (relative to Tela home/html/loja.html)
    window.location.href = "index.html";
  }
}

// Expose globally
window.logout = logout;
