document.getElementById('loginForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch("http://localhost:8080/store-manager-api/auth/login", {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        });
        if (response.ok) {
              const data = await response.json();

    // Extrai os campos necessários
    const sessionId = data.session_id;
    const userId = data.user_id;

    // Armazena no sessionStorage
    sessionStorage.setItem("session-id", sessionId);
    sessionStorage.setItem("user-id", userId);

    // Redireciona para a página inicial

    window.location.href = "Tela%home/html/estoque.html";

        } else {
            document.getElementById('errorMessage').textContent = "Usuário ou senha inválidos.";
            document.getElementById('errorMessage').style.display = 'block';
        }
    }
    catch (error) {
        console.error("Erro no login:", error);
        document.getElementById('errorMessage').innerText = "Erro ao conectar ao servidor.";
        document.getElementById('errorMessage').style.display = 'block';
    }
});
