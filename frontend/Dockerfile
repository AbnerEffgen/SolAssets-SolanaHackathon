# --- Estágio 1: Geração de Tipos do Supabase ---
# Usa a imagem oficial da CLI do Supabase para gerar os tipos.
FROM supabase/cli:latest AS typegen

# Argumento de build para o ID do projeto, que será passado pelo Railway.
ARG SUPABASE_PROJECT_ID
ENV SUPABASE_PROJECT_ID=$SUPABASE_PROJECT_ID

WORKDIR /app

RUN supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" > /tmp/types.ts


FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY --from=typegen /tmp/types.ts ./src/integrations/supabase/types.ts

COPY . .

RUN npm run build


FROM nginx:1.27-alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80