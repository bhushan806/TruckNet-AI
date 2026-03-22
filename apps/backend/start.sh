#!/bin/bash
cd /opt/render/project/src/apps/backend/api && API_PORT=5000 npm run start &
cd /opt/render/project/src/apps/backend/ai-node-engine && AI_ENGINE_PORT=5001 npm run start &
wait