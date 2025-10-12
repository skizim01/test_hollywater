FROM node:18-alpine AS dist
COPY package.json package-lock.json ./
COPY tsconfig.json ./

RUN apk add --no-cache python3 make g++ && \
    npm rebuild bcrypt --build-from-source && \
    apk del python3 make g++

RUN npm ci
COPY . ./

RUN npm run build

FROM node:18-alpine AS node_modules
COPY package.json package-lock.json tsconfig.json ./

RUN npm pkg delete scripts.prepare
RUN npm ci --production
RUN npm install tsconfig-paths


FROM node:18-alpine

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

COPY --from=dist dist /usr/src/app/dist
COPY --from=node_modules node_modules /usr/src/app/node_modules
COPY package.json ./
COPY tsconfig.json ./

EXPOSE 8000

CMD  npm start
