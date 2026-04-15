FROM node:24-alpine
WORKDIR /app
COPY ./backend/package.json /app
RUN npm install
COPY ./backend /app
ENTRYPOINT npm start