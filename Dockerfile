# syntax = docker/dockerfile:1.3

#BUILD
FROM rust:1.69 as wasm-builder
LABEL maintainer="https://github.com/yashmasani"

WORKDIR /bot
COPY src ./src
COPY Cargo.toml ./Cargo.toml
RUN mkdir www
COPY www/app ./www/app
COPY www/app.js ./www/app.js
COPY www/package.json ./www/package.json
COPY www/package-lock.json ./www/package-lock.json
RUN rustup target add wasm32-unknown-unknown
RUN rustup default nightly 
RUN cargo install wasm-pack
RUN wasm-pack build --target nodejs --release

#RUN
FROM node:16.17.0-bullseye-slim
COPY --from=wasm-builder /bot .
RUN cd www
WORKDIR www

RUN npm ci
EXPOSE 80/tcp
RUN --mount=type=secret,id=www/.env,dst=./.env npm run prod
