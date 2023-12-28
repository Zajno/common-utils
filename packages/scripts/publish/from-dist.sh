#!/usr/bin/env bash

npm run build:full && npm run bundle && cd dist && npm run publish
