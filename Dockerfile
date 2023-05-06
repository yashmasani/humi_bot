# syntax = docker/dockerfile:1.3

#BUILD
FROM rust:1.69 as wasm-builder
LABEL maintainer="https://github.com/yashmasani"

RUN rustup target add wasm32-unknown-unknown
RUN rustup default nightly 
RUN cargo install wasm-pack
WORKDIR /bot
COPY src ./src
COPY Cargo.toml ./Cargo.toml
RUN wasm-pack build --target nodejs --release
RUN mkdir www
COPY www/app ./www/app
COPY www/app.js ./www/app.js
COPY www/package.json ./www/package.json
COPY www/package-lock.json ./www/package-lock.json

#RUN
FROM node:16.17.0-bullseye-slim
COPY --from=wasm-builder /bot .
RUN cd www
WORKDIR www

RUN --mount=type=cache,target=./.cache npm ci
EXPOSE 8100
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*
CMD npm run prod
