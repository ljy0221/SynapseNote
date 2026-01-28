# Testing Rules

## Coverage Requirements
- Backend: Minimum 70% code coverage
- Frontend: Minimum 60% code coverage
- Critical paths (Docker execution, auth): 100% coverage

## Test Structure
- Unit tests: Fast, isolated, mock dependencies
- Integration tests: Test API endpoints with real DB
- E2E tests: Test critical user flows

## TDD Workflow
1. Write failing test (RED)
2. Write minimal code to pass (GREEN)
3. Refactor for quality (REFACTOR)
4. Verify coverage remains above threshold
