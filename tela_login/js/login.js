document
  .getElementById("loginForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("/api/store-manager-api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        sessionStorage.setItem("session-id", data.session_id);
        sessionStorage.setItem("user-id", data.user_id);
        window.location.href = "../estoque.html";
      } else {
        document.getElementById("errorMessage").textContent =
          "Usuário ou senha inválidos.";
        document.getElementById("errorMessage").style.display = "block";
      }
    } catch (error) {
      console.error("Erro no login:", error);
      document.getElementById("errorMessage").innerText =
        "Erro ao conectar ao servidor.";
      document.getElementById("errorMessage").style.display = "block";
    }
  });
