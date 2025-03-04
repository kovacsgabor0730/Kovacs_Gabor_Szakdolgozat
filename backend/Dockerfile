FROM node:18

# Mappa beállítása
WORKDIR /app

# package.json és package-lock.json másolása
COPY package.json package-lock.json ./

# Szükséges build eszközök telepítése
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Függőségek telepítése
# Először törölj minden node_modules mappát, ha esetleg már létezne
RUN rm -rf node_modules
# Majd telepítsd tisztán, a bcrypt-et is a forrásból fordítva
RUN npm ci

# Teljes kód másolása (kivéve node_modules)
COPY . .

# Port megnyitása
EXPOSE 3000

# Szerver indítása
CMD ["node", "src/server.js"]