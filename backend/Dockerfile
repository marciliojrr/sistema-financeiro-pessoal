FROM node:20-alpine

WORKDIR /app

# Instalar dependências primeiro (cache layer)
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copiar código da aplicação
COPY . .

# Instalar dependências de desenvolvimento para hot reload
RUN npm ci

EXPOSE 3001

CMD ["npm", "run", "start:dev"]
