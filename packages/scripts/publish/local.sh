#!/usr/bin/env bash

npm run build:full && npm run bundle && cd dist && yalc push --replace --update --sig
