#!/bin/bash

# Change directory to TrustChain
cd /Users/jonathon/TrustChain

# Start backend server in a new terminal window
osascript -e 'tell application "Terminal" to activate' -e 'tell application "Terminal" to do script "yarn dev" in selected tab of the front window' &

# Open new terminal windows in the respective directories
open -a Terminal backend
open -a Terminal frontend

# Wait for a short delay (e.g., 2 seconds)
sleep 2

# Start frontend server in a new terminal window
osascript -e 'tell application "Terminal" to activate' -e 'tell application "Terminal" to do script "yarn start" in selected tab of the front window'