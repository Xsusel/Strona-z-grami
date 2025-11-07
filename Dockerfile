# Użyj oficjalnego obrazu Node.js jako bazy
FROM node:18-alpine

# Ustaw katalog roboczy w kontenerze
WORKDIR /usr/src/app

# Skopiuj pliki package.json i package-lock.json
COPY package*.json ./

# Zainstaluj zależności aplikacji
RUN npm install

# Skopiuj resztę plików aplikacji
COPY . .

# Zdefiniuj port, na którym aplikacja będzie nasłuchiwać
EXPOSE 3000

# Zdefiniuj polecenie do uruchomienia aplikacji
CMD [ "node", "server.js" ]
