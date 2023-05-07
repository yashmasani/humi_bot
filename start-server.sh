#!/bin/sh
set -xe

if [ $1 = "test" ]
then cargo test
fi

rustup target add wasm32-unknown-unknown

INSTALLS=$(cargo install --list)
echo ${INSTALLS}

if [ -z "$( echo ${INSTALLS} | grep wasm-pack)" ]
then
  cargo install wasm-pack 
fi

wasm-pack build --target nodejs --release

cd www
npm install
if [ $1 = "prod" ]
  then
    npm run prod
  else
    npm run dev
fi
