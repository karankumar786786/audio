#!/bin/bash

# Function to build and push with retries
build_and_push() {
    local name=$1
    local path=$2
    local tag="karankumar9955/onemelody${name}:latest"

    echo "------------------------------------------------"
    echo "🚀 Processing $name..."
    echo "------------------------------------------------"

    # Build
    if ! docker build --platform linux/amd64 -t "$tag" "$path"; then
        echo "❌ Build failed for $name"
        return 1
    fi

    # Push with Retries (3 attempts)
    local max_attempts=3
    local attempt=1
    while [ $attempt -le $max_attempts ]; do
        echo "⬆️ Pushing $tag (Attempt $attempt/$max_attempts)..."
        if docker push "$tag"; then
            echo "✅ Successfully pushed $name"
            return 0
        fi
        echo "⚠️ Push failed, retrying in 5 seconds..."
        sleep 5
        attempt=$((attempt + 1))
    done

    echo "❌ Failed to push $name after $max_attempts attempts"
    return 1
}

# 1. Audio Backend
build_and_push "audiobackend" "./audioBackend"

# 2. Admin Backend
build_and_push "adminbackend" "./adminBackend"

# 3. Audio Frontend
build_and_push "audiofrontend" "./audioFrontend"

# 4. Admin Frontend
build_and_push "adminfrontend" "./adminFrontend"

# 5. Audio Processing
build_and_push "audioprocessing" "./audioProcessing"

# 6. Audio Feature Extraction
build_and_push "audiofeaturesextraction" "./audioFeatureExtraction"

echo "------------------------------------------------"
echo "🏁 Final Status Check complete."
echo "If any failed, check your internet and run again."
