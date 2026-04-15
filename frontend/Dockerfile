FROM node:24-alpine
WORKDIR /app
COPY ./frontend/package.json /app
RUN npm install
COPY ./frontend /app
ENTRYPOINT ng serve