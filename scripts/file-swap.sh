#!/bin/bash

# Assign parameters to descriptive variables
file1="$1"
file2="$2"

# 1. Create a unique, safe temporary file name in the current directory
tmp_file=$(mktemp --tmpdir=.)

# 2. Perform the three-way switch
mv "$file1" "$tmp_file" && \
mv "$file2" "$file1" && \
mv "$tmp_file" "$file2"