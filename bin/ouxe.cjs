#!/usr/bin/env node

var devMode = require('fs').existsSync(`${__dirname}/../src`)
let path = require('path')
var wantsCompiled = process.argv.indexOf('--compiled-build') >= 0

if (wantsCompiled || !devMode) {
  require(path.join(__dirname, '../lib/ouxe')).run(process.argv)
} else {
  require('@babel/register')({
    presets: ['@babel/preset-typescript'],
    extensions: ['.es6', '.es', '.jsx', '.js', '.mjs', '.ts'],
  })
  require(path.join(__dirname, '../src/index.ts')).run(process.argv)
}
