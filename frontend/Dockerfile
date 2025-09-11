FROM node:18-alpine

WORKDIR /app

# Instalar dependências primeiro (cache layer)
COPY package*.json ./
RUN npm ci

# Copiar código da aplicação
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
