document.getElementById('loginForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch("http://localhost:8080/login", {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        });
        if (response.ok) {
            window.location.href = "../Tela%20home/estoque.html";
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
