#!/bin/bash

set -ex

rm -rf js_built
cp -r js js_built
cd js_built
rm -rf *.git* 
rm -rf *.zip* 
rm -rf *.sh
rm -rf *.idea* 
rm -rf *.DS_Store
rm -rf *node_modules* 
rm -rf *manifest-gecko.json* 
rm -rf *gulpfile.js*
rm -rf *package.json*
rm -rf *package-lock.json*
rm -rf *.md*
rm -rf pages/src/*
