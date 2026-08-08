#!/usr/bin/env bash

if [ -z "$1" ]; then
  echo 'Error: commit message required.'
  echo 'Usage: npm run git:push -- "Your commit message"'
  exit 1
fi

git add --all &&
git commit -m "$1" &&
git push origin "$(git branch --show-current)"