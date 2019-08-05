# Ouxe

Basic configuration tool for my common setup.

It ~is~ _will be_ able to handle:

- [yarn](https://yarnpkg.com)
- [prettier](https://prettier.io)
- [jest](https://jestjs.io) (not available yet)
- [eslint](https://eslint.org) (not available yet)
- [babel](https://babeljs.io) (not available yet)

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

If I could, I would change the way it organizes some operators, though. Check https://github.com/prettier/prettier/pull/5108.

## Running locally

Run an instance of `npm start` so microbundle watches the src folder while building.

From there, you may run `npm run ouxe` to execute the command.

As of this version, we don't have tests. PRs are welcome!
