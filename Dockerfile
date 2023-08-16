FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /usr/app
COPY package.json package-lock.json ./
RUN npm install --ci && mv ./node_modules ../
COPY main.mjs ./
USER node
ENTRYPOINT [ "node", "main.mjs" ]