#!/bin/bash

# Check if environment is production, beta, or playground
if [[ "$VERCEL_ENV" == "production" || "$VERCEL_ENV" == "beta" || "$VERCEL_ENV" == "playground" ]] ; then
    # Proceed with build
    echo "🎉 - Environment is production, beta, or playground - proceeding with build"
    exit 1;
else
    # Skip build
    echo "🛑 - Environment is not production, beta, or playground - skipping build"
    exit 0;
fi