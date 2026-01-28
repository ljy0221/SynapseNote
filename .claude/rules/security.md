# Security Rules

## NEVER VIOLATE
1. No hardcoded secrets, API keys, or passwords
2. No SQL string concatenation (use prepared statements)
3. No eval() or Function() with user input
4. No sensitive data in logs
5. All Docker containers must have resource limits

## ALWAYS DO
1. Use environment variables for secrets
2. Use parameterized queries
3. Validate and sanitize all inputs
4. Use HTTPS for all external communications
5. Implement rate limiting on APIs