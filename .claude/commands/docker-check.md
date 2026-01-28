---
name: docker-check
description: Check Docker installation and pull required images
---

1. Check if Docker is installed: `docker --version`
2. Check if Docker is running: `docker ps`
3. Pull required images:
   - `docker pull python:3.11-alpine`
   - `docker pull node:20-alpine`
   - `docker pull openjdk:17-alpine`
4. Test single execution with hello world
5. Report status to user
