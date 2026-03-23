#!/bin/bash
# Start the API server on Render's $PORT
# NOTE: AI Node Engine should be deployed as a SEPARATE Render service
cd /opt/render/project/src/apps/backend/api && npm run start