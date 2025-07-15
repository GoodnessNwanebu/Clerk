#!/bin/bash

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "ImageMagick is required but not installed. Please install it first."
    exit 1
fi

# Base icon size (should be the largest one)
BASE_ICON="icon-512x512.png"

# Array of sizes to generate
SIZES=(72 96 128 144 152 192 384 512)

# Generate icons for each size
for size in "${SIZES[@]}"; do
    convert "$BASE_ICON" -resize "${size}x${size}" "icon-${size}x${size}.png"
done

echo "Icons generated successfully!" 