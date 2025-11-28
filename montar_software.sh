#!/bin/bash

# Atualiza pacotes e instala Docker e Docker Compose
sudo apt-get update
sudo apt-get install -y docker.io git

# Instala Docker Compose (caso não esteja presente)
sudo curl -L "https://github.com/docker/compose/releases/download/v2.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Inicia e habilita Docker
sudo systemctl start docker
sudo systemctl enable docker

# Adiciona usuário atual ao grupo docker (evita sudo)
sudo usermod -aG docker $USER

# Clona o repositório
git clone -b feature/deploy-init-actions https://github.com/RTR-RapazesTechReformed/storemanager-frontend.git
cd storemanager-frontend

# Sobe os serviços com Docker Compose
sudo docker-compose up -d --build

echo "Frontend disponível em http://$(curl -s http://checkip.amazonaws.com)/"