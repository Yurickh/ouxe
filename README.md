# Ouxe

Basic configuration tool for my common setup

It should be able to handle:

- yarn
- prettier
- jest [todo]
- eslint [todo]
- basic babel [todo]

Running linters and prettier with husky with precommit hooks.

## Usage

Usage is as simple as `npx ouxe`. The only prerequisite being having `git` installed and available.

## Commands

You can skip some prompts by passing commands and flags.

### ouxe prettier

Opinionated prettier configuration.

By default, it will create a `.prettierignore` and a `.prettierrc`. With preloaded configuration, which you can later edit.

#### --write

Run prettier on all files of the project.

#### --commit

Commit written changes. Depends on `--write`.

#### --lint-staged

Setup prettier to run on every commit with husky and lint-staged.

Will create a `.huskyrc` and a `.lintstagedrc` with pre-loaded configuration you can later edit.

## Running locally

Run an instance of `yarn start` so microbundle watches the src folder while building.

From there, you run `yarn ouxe` to execute the command.
