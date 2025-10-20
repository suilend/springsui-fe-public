#!/bin/bash

echo "Checking if send has changed..."

if [[ "$VERCEL_ENV" == "production" || "$VERCEL_ENV" == "beta" || "$VERCEL_ENV" == "playground" ]] ; then
    # Proceed with the build
    echo "🎉 - Build can proceed"
    exit 1;
else
    # Don't build
    echo "🛑 - Build cancelled"
    exit 0;
fi
