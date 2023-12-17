#!/usr/bin/env zsh

yarn build:full && yarn bundle && cd dist && yalc push --replace --update
