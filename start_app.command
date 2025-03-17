#!/bin/bash

# Define paths
backend_path="/Users/jonathon/TrustChain/backend"
frontend_path="/Users/jonathon/TrustChain/frontend"

# Open backend in a new Terminal window and execute command
osascript -e 'tell application "Terminal" to do script "cd '$backend_path' && yarn start"'

# Open frontend in a new Terminal window and execute command
osascript -e 'tell application "Terminal" to do script "cd '$frontend_path' && yarn start"'

echo "Backend and frontend servers are starting..."