---
name: build
description: Build backend and frontend
---

Backend:
```bash
cd backend
./mvnw clean package -DskipTests
```

Frontend:
```bash
cd frontend
npm run build
```

Report build status and artifacts.
```