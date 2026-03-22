#!/bin/bash
cd /opt/render/project/src/apps/backend/api && npm run start &
cd /opt/render/project/src/apps/backend/ai-node-engine && npm run start &
wait