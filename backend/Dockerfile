FROM node:18

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install --build-from-source bcrypt

COPY . .

WORKDIR /app/src

# Port megnyitása
EXPOSE 3000

# Szerver indítása
CMD ["node", "server.js"]
