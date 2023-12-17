#!/usr/bin/env bash

yarn build:full && yarn bundle && cd dist && yarn publish
