#!/usr/bin/env bash

yarn build:full && yarn bundle && cd dist && yalc push --replace --update
