#!/bin/sh
set -xe

cargo run

rustup target add wasm32-unknown-unknown

INSTALLS=$(cargo install --list)
echo ${INSTALLS}

if [ -z "$( echo ${INSTALLS} | grep wasm-pack)" ]
then
  cargo install wasm-pack 
fi

if [ $1 = "prod" ]
then wasm-pack build --target nodejs --release
else wasm-pack build --target nodejs
fi

cd www
npm install
npm run dev
