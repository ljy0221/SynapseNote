# Code Execution Notebook Platform - Technical Specification

## Project Overview

**Service Name**: Code Execution Notebook (Working Title)  
**Tagline**: Executable Notebook Platform for Developers  
**Duration**: 3 weeks  
**Team**: 6 members (3 Frontend, 3 Backend)

---

## Kent Beck's Four Rules of Simple Design

This project follows Kent Beck's principles for maintaining simple, clean design:

### 1. Passes All Tests
- **Unit Tests**: Every Docker execution component must have unit tests
- **Integration Tests**: API endpoints tested with realistic scenarios
- **E2E Tests**: Critical user flows (create note → write code → execute → save)
- **Test Coverage**: Minimum 70% for backend core logic, 60% for frontend components

### 2. Reveals Intent
- **Clear Naming**: `DockerExecutionService` not `DES`, `executeCodeInContainer()` not `exec()`
- **Single Responsibility**: Each class/component does one thing well
- **Self-Documenting Code**: Code reads like well-written prose
- **API Design**: RESTful endpoints follow conventions (`/api/v1/notes/{noteId}/execute`)

### 3. No Duplication (DRY)
- **Shared Utilities**: Common Docker operations in `DockerManager`
- **Error Handling**: Centralized error codes and handlers
- **React Components**: Reusable `CodeBlock`, `ExecutionResult`, `Editor` components
- **Database Queries**: Repository pattern for common CRUD operations

### 4. Minimal Classes/Methods
- **Start Simple**: Build the simplest thing that works
- **Refactor Later**: Extract abstractions when patterns emerge
- **YAGNI**: You Aren't Gonna Need It - don't build features for "maybe later"
- **MVP Focus**: Ship core execution features before optimization

---

## Core Features

### Supported Languages (3)
1. **Python** - Session mode supported
2. **JavaScript (Node.js)** - Session mode supported  
3. **Java** - Single execution only

### Execution Approach
- **Local Docker-based** execution
- **No server transmission** required
- **Fast execution** (0.5-1 second)

### Key Features
- Note creation and management
- Code block execution
- Version control
- Search (Simplified for MVP)
- Collaboration (Permission management)
- Favorites/Bookmarks

---

## Technology Stack

### Frontend (Electron App)
- **Framework**: React 18+ with TypeScript
- **Editor**: Monaco Editor
- **State Management**: Zustand
- **Styling**: TailwindCSS
- **Testing**: Jest + React Testing Library

### Backend (Server)
- **Framework**: Spring Boot 3.x
- **Language**: Java 17
- **Security**: Spring Security + JWT
- **Testing**: JUnit 5 + Mockito

### Database
- **PostgreSQL**: Users, metadata, permissions
- **MongoDB**: Note content, code blocks
- **Search**: PostgreSQL full-text search (ILIKE) for MVP, Elasticsearch later

### Infrastructure
- **Local**: Docker Engine
- **Server**: AWS EC2
- **Database**: AWS RDS (PostgreSQL), MongoDB Atlas
- **Search**: PostgreSQL (Week 1-2), Elasticsearch (Week 3 if time permits)

---

## Database Design

### PostgreSQL Schema

```sql
-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- Note metadata
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    directory_path VARCHAR(500),
    point_x DOUBLE PRECISION,
    point_y DOUBLE PRECISION,
    invitation_url VARCHAR(1000),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notes_created_by ON notes(created_by);
CREATE INDEX idx_notes_title ON notes(title);

-- Note members (permissions)
CREATE TABLE note_members (
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('OWNER', 'EDITOR', 'VIEWER')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (note_id, user_id)
);

CREATE INDEX idx_note_members_user_id ON note_members(user_id);

-- Favorites
CREATE TABLE favorites (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, note_id)
);

-- Bookmarks
CREATE TABLE bookmarks (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, note_id)
);
```

### MongoDB Schema

```javascript
// notes collection
{
    _id: ObjectId,
        note_id: String,  // UUID from PostgreSQL
    type: String, // 'text' | 'code'
    content: String,  // Markdown content
    favorite: Boolean, // True, False
    code_blocks: [
    {
        id: String,  // UUID v4
        language: String,  // 'python' | 'javascript' | 'java'
        version: String,  // '3.11' | '20' | '17'
        code: String,
        execution_mode: String,  // 'single' | 'session'

        output_history: [
            {
                output: String,
                executed_at: Date,
                execution_time_ms: Number,
                status: String  // 'success' | 'error' | 'timeout'
            }
        ],
        last_output: String,
        last_executed_at: Date
    }
],
    checkpoint: Number,  // Auto-increment version number
    updated_at: Date
}{
    _id: ObjectId,
        note_id: String,  // UUID from PostgreSQL
        type: String, // 'text' | 'code'
        content: String,  // Markdown content
        favorite: Boolean, // True, False
        code_blocks: [
        {
            id: String,  // UUID v4
            language: String,  // 'python' | 'javascript' | 'java'
            version: String,  // '3.11' | '20' | '17'
            code: String,
            execution_mode: String,  // 'single' | 'session'

            output_history: [
                {
                    output: String,
                    executed_at: Date,
                    execution_time_ms: Number,
                    status: String  // 'success' | 'error' | 'timeout'
                }
            ],
            last_output: String,
            last_executed_at: Date
        }
    ],
        checkpoint: Number,  // Auto-increment version number
        updated_at: Date
}

// Create indexes
db.notes.createIndex({ "note_id": 1 }, { unique: true });
db.notes.createIndex({ "updated_at": -1 });

// checkpoint collection (snapshots)
{
    _id: ObjectId,
        note_id: String,
    block_id: String,
    checkpoint_number: Number,
    content: String,
    code_blocks: Array,
    created_at: Date
}

db.checkpoint.createIndex({ "note_id": 1, "version_number": -1 });
```

---

## API Specification

### Authentication
```
POST   /api/v1/auth/signup
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh
GET    /api/v1/auth/me
```

### Notes
```
GET    /api/v1/notes              # List all notes for current user
GET    /api/v1/notes/{noteId}    # Get note detail
POST   /api/v1/notes              # Create new note
PUT    /api/v1/notes/{noteId}    # Update note
DELETE /api/v1/notes/{noteId}    # Delete note
PATCH  /api/v1/notes/{noteId}/position  # Update canvas position
```

### Permission Management
```
POST   /api/v1/notes/{noteId}/invitation       # Generate invitation link
POST   /api/v1/notes/invitation/accept         # Accept invitation
GET    /api/v1/notes/{noteId}/members          # List members
PATCH  /api/v1/notes/{noteId}/members/{userId} # Change role
DELETE /api/v1/notes/{noteId}/members/{userId} # Remove member
```

### Favorites & Bookmarks
```
POST   /api/v1/notes/{noteId}/favorite
DELETE /api/v1/notes/{noteId}/favorite
GET    /api/v1/notes/favorites

POST   /api/v1/notes/{noteId}/bookmark
DELETE /api/v1/notes/{noteId}/bookmark
GET    /api/v1/notes/bookmarks
```

### Version Control
```
GET    /api/v1/notes/{noteId}/versions                    # List versions
GET    /api/v1/notes/{noteId}/versions/{versionNumber}    # Get specific version
POST   /api/v1/notes/{noteId}/versions/snapshot           # Create manual snapshot
POST   /api/v1/notes/{noteId}/versions/{versionNumber}/restore  # Restore version
```

### Search
```
GET    /api/v1/search?q={query}&type={type}
# type: 'all' | 'title' | 'content' | 'code'
# Uses PostgreSQL ILIKE for MVP
```

---

## Code Execution Design

### Supported Environments

**Python**
- Versions: 3.9, 3.10, 3.11, 3.12
- Image: `python:3.11-alpine` (default)
- Modes: Single execution + Session mode

**JavaScript**
- Versions: 18 LTS, 20 LTS, 21
- Image: `node:20-alpine` (default)
- Modes: Single execution + Session mode

**Java**
- Versions: 11 LTS, 17 LTS, 21 LTS
- Image: `openjdk:17-alpine` (default)
- Modes: Single execution only

### Execution Modes

**Single Execution**
- Each block runs independently
- Container lifecycle: Create → Execute → Destroy
- All languages supported
- Fast cleanup, no state persistence

**Session Mode** (Python & JavaScript only)
- One long-running container per note
- Variables and functions persist between executions
- Reuses REPL environment
- Auto-timeout after 30 minutes of inactivity

### Docker Manager Architecture

```typescript
interface DockerManager {
  // Health check
  checkDockerInstalled(): Promise<boolean>;
  checkDockerRunning(): Promise<boolean>;
  
  // Image management
  pullImage(language: string, version: string): Promise<void>;
  listImages(): Promise<DockerImage[]>;
  
  // Single execution
  executeSingle(request: ExecutionRequest): Promise<ExecutionResult>;
  
  // Session management
  createSession(noteId: string, language: string, version: string): Promise<string>;
  executeInSession(sessionId: string, code: string): Promise<ExecutionResult>;
  destroySession(sessionId: string): Promise<void>;
  
  // Cleanup
  cleanupOrphanedContainers(): Promise<void>;
}

interface ExecutionRequest {
  language: 'python' | 'javascript' | 'java';
  version: string;
  code: string;
  timeout: number;  // milliseconds
}

interface ExecutionResult {
  output: string;
  error: string | null;
  executionTime: number;  // milliseconds
  exitCode: number;
  status: 'success' | 'error' | 'timeout';
}
```

### Security Constraints

```yaml
Docker Run Parameters:
  --cpus: "1.0"              # 1 CPU core limit
  --memory: "512m"           # 512MB memory limit
  --memory-swap: "512m"      # No swap
  --pids-limit: 50           # Max 50 processes
  --network: "none"          # No network access
  --read-only                # Read-only filesystem
  --tmpfs: "/tmp:size=64m"   # 64MB tmpfs for /tmp
  --security-opt: "no-new-privileges"
  --cap-drop: "ALL"          # Drop all capabilities
  --timeout: 5s              # 5 second execution limit
```

### Error Handling

```java
public enum ExecutionErrorCode {
    // Infrastructure errors
    DOCKER_NOT_INSTALLED(4001, "Docker is not installed"),
    DOCKER_NOT_RUNNING(4002, "Docker is not running"),
    IMAGE_NOT_FOUND(4003, "Docker image not found"),
    IMAGE_PULL_FAILED(4004, "Failed to pull Docker image"),
    
    // Execution errors
    TIMEOUT(4010, "Execution timeout exceeded"),
    MEMORY_LIMIT(4011, "Memory limit exceeded"),
    CPU_LIMIT(4012, "CPU limit exceeded"),
    
    // Code errors
    COMPILATION_ERROR(4020, "Compilation error"),
    RUNTIME_ERROR(4021, "Runtime error"),
    SYNTAX_ERROR(4022, "Syntax error"),
    
    // Session errors
    SESSION_NOT_FOUND(4030, "Session not found"),
    SESSION_EXPIRED(4031, "Session expired"),
    SESSION_CREATION_FAILED(4032, "Failed to create session"),
    
    // Unknown
    UNKNOWN_ERROR(4999, "Unknown error occurred");
    
    private final int code;
    private final String message;
}
```

---

## Development Schedule (3 Weeks)

### Week 1: Core Infrastructure

**Backend Team (3 people)**
- Day 1-2: Database schema creation and setup
- Day 3-4: User authentication API (signup, login, JWT)
- Day 5-7: Note CRUD API with basic tests

**Frontend Team (3 people)**
- Day 1-2: Electron project setup with React + TypeScript
- Day 3-4: Login/Signup UI with form validation
- Day 5-7: Note list and detail UI

**You (Docker Execution Lead)**
- Day 1-2: Docker Manager foundation + Python single execution
- Day 3-5: JavaScript and Java single execution
- Day 6-7: Unit tests and error handling

**Week 1 Goal**: Basic auth + CRUD + Python execution working

---

### Week 2: Core Features

**Backend Team**
- Day 1-2: Permission management API (invitation, roles)
- Day 3-4: Version control API (snapshots, list, restore)
- Day 5-7: PostgreSQL full-text search implementation

**Frontend Team**
- Day 1-2: Monaco Editor integration with syntax highlighting
- Day 3-4: Code block component with language selector
- Day 5-7: Execution result display with ANSI color support

**You**
- Day 1-3: Python session mode (priority)
- Day 4-5: JavaScript session mode
- Day 6-7: Integration testing and performance optimization

**Week 2 Goal**: All languages execute + Session mode + Permissions

---

### Week 3: Polish & Integration

**Backend Team**
- Day 1-2: Favorites/Bookmarks API
- Day 3-4: Integration testing and bug fixes
- Day 5-7: Deployment preparation and API documentation

**Frontend Team**
- Day 1-2: Permission management UI (invite, role changes)
- Day 3-4: Version history UI with restore
- Day 5-7: Search UI and final integration

**You**
- Day 1-2: Image caching and optimization
- Day 3-4: End-to-end integration testing
- Day 5-7: Buffer time (bug fixes, documentation)

**Week 3 Goal**: Fully integrated MVP ready for demo

---

## MVP Scope

### Must Have ✅
- User signup/login with JWT
- Note CRUD operations
- Python, JavaScript, Java execution (single mode)
- Python, JavaScript session mode
- Basic search (PostgreSQL ILIKE)
- Version control (save snapshots, restore)
- Permission management (OWNER, EDITOR, VIEWER)
- Favorites and bookmarks
- Monaco Editor with syntax highlighting

### Nice to Have (If Time Permits)
- Elasticsearch integration
- Version diff comparison
- Real-time collaboration indicators
- Code autocomplete enhancements
- Docker image management UI

### Explicitly Out of Scope ❌
- Real-time collaborative editing (WebSocket)
- Graph view (Neo4j)
- Advanced search filters
- Custom Docker images
- Mobile app
- C++, Go, Rust support

---

## Differentiation

### vs Notion
✅ **Code execution** built-in  
✅ **Multi-language** support  
✅ **Developer-focused** features (syntax highlighting, REPL)

### vs Jupyter Notebook
✅ **Rich text** editing with Markdown  
✅ **Multi-language** in one notebook  
✅ **Version control** integrated  
✅ **Collaboration** with permissions

### vs Replit
✅ **Local execution** (faster, unlimited)  
✅ **Complete privacy** (code never leaves your machine)  
✅ **No account limits** on execution time  
✅ **Offline capable** (except for sync)

---

## Risk Mitigation

### Risk 1: Docker Installation Barrier
**Problem**: Users find Docker installation difficult  
**Mitigation**:
- Detailed installation guide with screenshots
- Video tutorial for each OS
- Fallback to server-side execution (future phase)
- Check Docker status on app startup with clear error messages

### Risk 2: Performance Issues
**Problem**: Container creation/destruction overhead  
**Mitigation**:
- Container pooling for single executions
- Pre-pull images on first launch
- Session mode for repeated executions
- Keep warm containers for popular languages

### Risk 3: Data Synchronization
**Problem**: Conflict resolution complexity  
**Mitigation**:
- Optimistic locking with version numbers
- Last-Write-Wins strategy
- Clear conflict indicators in UI
- Auto-save every 30 seconds with visual feedback

### Risk 4: Scope Creep
**Problem**: 3 weeks is very tight  
**Mitigation**:
- Strict MVP focus (Kent Beck Rule #4: Minimal)
- Weekly milestone reviews
- Ready to cut Elasticsearch if needed
- Buffer time in Week 3

---

## Monaco Editor Configuration

```typescript
const monacoConfig: MonacoConfig = {
  python: {
    language: 'python',
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: false },
    suggestOnTriggerCharacters: true,
    quickSuggestions: true,
    libraries: ['sys', 'os', 'math', 'datetime', 'json', 're']
  },
  
  javascript: {
    language: 'javascript',
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: false },
    suggestOnTriggerCharacters: true,
    quickSuggestions: true,
    libraries: ['fs', 'path', 'http', 'util']
  },
  
  java: {
    language: 'java',
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: false },
    // Force className to be 'Main' for execution
    defaultClassName: 'Main',
    requireMainMethod: true
  }
};
```

---

## Testing Strategy (Kent Beck Rule #1)

### Unit Tests
```
Backend:
- DockerExecutionService: 100% coverage
- NoteService: CRUD operations
- PermissionService: Role checks
- JwtTokenProvider: Token validation

Frontend:
- CodeBlock component: Render + execution
- Editor component: Monaco integration
- SessionManager: State management
```

### Integration Tests
```
API Tests (Postman/RestAssured):
- Auth flow: signup → login → refresh
- Note flow: create → execute → save → restore
- Permission flow: invite → accept → change role

Docker Integration:
- Single execution for all languages
- Session creation and execution
- Timeout and memory limit enforcement
- Error handling for missing images
```

### E2E Tests (Optional, if time)
```
Critical User Flows:
1. New user signup → create first note → execute Python
2. Existing user login → open note → session mode execution
3. Owner invites editor → editor executes code → owner sees changes
```

---

## Pre-Development Checklist

### Technical Validation
- [ ] Docker Desktop license confirmed (free for education)
- [ ] Electron can execute Docker CLI commands (tested)
- [ ] MongoDB Atlas free tier capacity: 512MB (sufficient for MVP)
- [ ] PostgreSQL RDS free tier: 20GB (sufficient for MVP)
- [ ] Test Docker execution on Windows/Mac/Linux

### Team Collaboration
- [ ] Git branch strategy decided (GitHub Flow recommended)
- [ ] Code review process defined (2 approvals for main)
- [ ] Daily standup time scheduled (15 min, 10 AM)
- [ ] API documentation tool chosen (Swagger/OpenAPI)
- [ ] Communication channel setup (Slack/Discord)

### Development Environment
- [ ] Docker Engine 24+ installed on all machines
- [ ] Node.js 20+ installed
- [ ] Java 17 installed
- [ ] PostgreSQL 15+ accessible
- [ ] MongoDB Atlas cluster created
- [ ] Git repository created with README
- [ ] CI/CD pipeline (GitHub Actions) configured

---

## Success Metrics (KPIs)

### Technical Metrics
- Average execution time: **< 1 second**
- Error rate: **< 5%**
- App crash rate: **< 1%**
- Test coverage: **> 70%** (backend), **> 60%** (frontend)

### User Metrics
- MAU (Monthly Active Users): **1,000**
- DAU (Daily Active Users): **200**
- Average usage time: **3+ hours/week**
- Return rate: **60%+**

### Business Metrics
- User satisfaction (NPS): **40+**
- SSAFY cohort adoption: **20%**
- Recommendation intent: **70%+**

---

## Future Roadmap

### Phase 2 (3 months)
- C++, Go, Rust language support
- Web version (browser-based)
- Real-time collaboration (WebSocket)
- Elasticsearch full integration

### Phase 3 (6 months)
- Graph view with Neo4j
- Custom Docker images
- Template marketplace
- VS Code extension

### Phase 4 (1 year)
- Mobile apps (iOS/Android)
- AI code suggestions
- Educational institution partnerships
- Enterprise features (SSO, audit logs)

---

## Final Checklist

### Planning Complete ✅
- [x] Supported languages: Python, JS, Java
- [x] Execution approach: Local Docker
- [x] Database design: PostgreSQL + MongoDB
- [x] API specification: Complete
- [x] Permission model: OWNER, EDITOR, VIEWER
- [x] Version control: Basic snapshots
- [x] Error codes: Standardized
- [x] 3-week schedule: Realistic
- [x] Kent Beck rules: Applied
- [x] MVP scope: Well-defined

### Next Steps
1. Share specification with team
2. Create GitHub repository
3. Set up development environment
4. Create initial issues/tasks in project board
5. Hold kickoff meeting
6. Start Week 1 development

---

## Advanced Project Organization

### Claude Code Configuration Structure

For optimal development workflow, organize your Claude Code configuration:

```
.claude/
├── agents/                    # Specialized subagents
│   ├── docker-expert.md       # Docker execution specialist
│   ├── db-designer.md         # Database schema designer
│   ├── api-architect.md       # REST API designer
│   └── security-auditor.md    # Security vulnerability checker
│
├── skills/                    # Reusable knowledge
│   ├── docker-execution.md    # Docker best practices
│   ├── spring-boot-patterns.md
│   ├── react-patterns.md
│   └── mongodb-queries.md
│
├── commands/                  # Quick slash commands
│   ├── test.md               # /test - Run tests
│   ├── docker-check.md       # /docker-check - Verify Docker
│   ├── build.md              # /build - Build project
│   └── deploy.md             # /deploy - Deployment
│
├── rules/                     # Always-follow guidelines
│   ├── security.md           # No secrets in code
│   ├── testing.md            # TDD, 70%+ coverage
│   ├── git-workflow.md       # Commit standards
│   └── code-style.md         # Coding conventions
│
├── hooks/                     # Automated triggers
│   └── hooks.json            # PreToolUse, PostToolUse hooks
│
└── contexts/                  # Mode-specific contexts
    ├── dev.md                # Development mode
    ├── review.md             # Code review mode
    └── test.md               # Testing mode
```

---

## Appendix: Kent Beck Rules Applied to This Project

### Rule 1: Passes All Tests
- Every Docker execution path has unit tests
- API endpoints have integration tests
- Critical flows have E2E tests
- Test coverage minimum: 70% backend, 60% frontend

### Rule 2: Reveals Intent
- Clear naming: `DockerExecutionService`, `SessionManager`, `NoteRepository`
- Single responsibility per class/component
- RESTful API design follows conventions
- TypeScript interfaces document data structures

### Rule 3: No Duplication
- `DockerManager` centralizes all Docker operations
- Error handling uses centralized `ExecutionErrorCode` enum
- React components are reusable (`CodeBlock`, `Editor`, `ExecutionResult`)
- Repository pattern eliminates duplicate queries

### Rule 4: Minimal Classes/Methods
- Start with simplest implementation (PostgreSQL ILIKE before Elasticsearch)
- Build features only when needed (YAGNI principle)
- Refactor when patterns emerge, not before
- MVP scope strictly enforced

---