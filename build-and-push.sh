#!/bin/bash

# Configuration
DOCKER_USER="karankumar9955"
TAG="latest"
DOCKER_BIN="/usr/local/bin/docker"

# List of services and their directory names
# Format: "dir_name:image_name"
SERVICES=(
    "audioBackend:onemelodyaudiobackend"
    "adminBackend:onemelodyadminbackend"
    "audioFrontend:onemelodyaudiofrontend"
    "adminFrontend:onemelodyadminfrontend"
    "audioProcessing:onemelodyaudioprocessing"
    "audioFeatureExtraction:onemelodyaudiofeaturesextraction"
)

# Start
echo "🚀 Starting build and push for all services..."

# Check connectivity to Docker Hub
if ! nslookup try.docker.com > /dev/null 2>&1; then
    echo "❌ DNS Error: Cannot resolve Docker Hub. Please check your internet connection or use DNS 8.8.8.8"
    exit 1
fi

# Use buildx to build for linux/amd64 (compatible with EC2)
# Check if builder exists, otherwise create it
if ! $DOCKER_BIN buildx inspect onemelody-builder > /dev/null 2>&1; then
    echo "Creating new buildx builder..."
    $DOCKER_BIN buildx create --use --name onemelody-builder --driver docker-container
else
    echo "Using existing buildx builder..."
    $DOCKER_BIN buildx use onemelody-builder
fi

for service in "${SERVICES[@]}"; do
    DIR="${service%%:*}"
    IMAGE="${service##*:}"
    
    echo "--------------------------------------------------------"
    echo "📦 Building $IMAGE from $DIR..."
    
    $DOCKER_BIN buildx build --platform linux/amd64 -t "$DOCKER_USER/$IMAGE:$TAG" "./$DIR" --push
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully built and pushed $IMAGE"
    else
        echo "❌ Failed to build or push $IMAGE"
        exit 1
    fi
done

echo "🎉 All images have been pushed to Docker Hub!"
