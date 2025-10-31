# --- Estágio 1: Build da Aplicação Node.js ---
# Usa uma imagem Node.js para instalar dependências e construir o projeto.
FROM node:20-alpine AS builder

WORKDIR /app

# Copia o package.json e o lockfile primeiro para aproveitar o cache do Docker.
COPY package.json package-lock.json ./

# Instala as dependências de produção e desenvolvimento.
RUN npm install

# Copia o resto do código-fonte da aplicação.
# O arquivo types.ts já existente será copiado junto.
COPY . .

# Executa o script de build (Vite, Next.js, etc.).
RUN npm run build


# --- Estágio 2: Servidor de Produção ---
# Usa uma imagem Nginx leve para servir os arquivos estáticos.
FROM nginx:1.27-alpine AS production

# Copia os arquivos estáticos gerados no estágio de build para a pasta do Nginx.
# O 'dist' é o diretório de saída padrão do Vite. Se o seu for diferente, ajuste aqui.
COPY --from=builder /app/dist /usr/share/nginx/html

# Expõe a porta 80 para o tráfego web.
EXPOSE 80

# O comando padrão do Nginx já é iniciado, então não precisamos de um CMD.