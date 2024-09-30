#!/usr/bin/env bash

npx cpy --flat ../../LICENSE package.json README.md dist/ && node ../scripts/generate-exports.js
