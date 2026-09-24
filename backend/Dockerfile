FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --chown=node:node . .
# La carpeta uploads trae las imágenes iniciales; al montarse como volumen
# nuevo, Docker copia este contenido dentro del volumen la primera vez.
RUN chown -R node:node /app/uploads
USER node
ENV PORT=4000
EXPOSE 4000
CMD ["node", "server.js"]
