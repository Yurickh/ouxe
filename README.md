# Ouxe

![CI](https://github.com/Yurickh/ouxe/workflows/CI/badge.svg)
![npm version](https://img.shields.io/npm/v/ouxe?label=npm+version&logo=npm)
[![MIT](https://img.shields.io/github/license/Yurickh/ouxe)](https://github.com/Yurickh/ouxe/blob/master/LICENSE)

Basic configuration tool for my common setup.

It ~is~ _will be_ able to handle:

- [yarn](https://yarnpkg.com)
- [prettier](https://prettier.io)
- [eslint](https://eslint.org) (partially available)
- [jest](https://jestjs.io) (not available yet)
- builders (not available yet)
  - [microbundle](https://github.com/developit/microbundle) for packages
  - [parcel](https://parceljs.org) for apps
  - [babel](https://babeljs.io) for something in between
- frameworks (not available yet)
  - [React](https://reactjs.org) for apps
  - [yargs](http://yargs.js.org) for clis

Running linters and prettier on precommit with [husky](https://github.com/typicode/husky).

## Usage

Be sure to have both [git](https://git-scm.com) and [node](https://nodejs.org/en/) installed and available. node _must_ be 5.2.0 or later.

In your command line, write:

```bash
npx ouxe
```

## Commands

You can skip some prompts by providing commands and flags.

### ouxe prettier

Opinionated prettier configuration.

By default, it will create a `.prettierignore` and a `.prettierrc` with preloaded configuration, which you can later edit.

#### --write, -w

Run prettier on all files of the project.

#### --lint-staged, -l

Setup prettier to run on every commit with husky and lint-staged.

Will create a `.huskyrc` and a `.lintstagedrc` with pre-loaded configuration you can later edit.

## Rationale

### Prettier

Prettier is a great code formatter. It produces readable and organized code most times, and it has nice defaults.

You'll notice I chose to override three configs for it: `semi`, `trailingComma` and `singleQuote`. This is basically personal preference, and I agree with most other prettier patterns.

You'll notice that rather than installing the prettier npm package, we actually alias it through [this fork](https://www.npmjs.com/package/@btmills/prettier). This is done so operators are aligned in the beggining of the line, rather than in the end, and the prettier team has been [pretty vocal](https://github.com/prettier/prettier/pull/5108#issuecomment-423278455) about it not coming to a prettier version.

## Running locally

Run an instance of `npm start` so microbundle watches the src folder while building.

From there, you may run `npm run ouxe` to execute the command.

As of this version, we don't have tests. PRs are welcome!
