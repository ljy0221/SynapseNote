export const DOCKER_SECURITY_CONFIG = {
  python: {
    image: 'python:3.11-alpine',
    cpus: '1.0',
    memory: '512m',
    memorySwap: '512m',
    pidsLimit: 50,
    timeout: 5000,
  },
  javascript: {
    image: 'node:20-alpine',
    cpus: '1.0',
    memory: '512m',
    memorySwap: '512m',
    pidsLimit: 50,
    timeout: 5000,
  },
  java: {
    image: 'openjdk:17-alpine',
    cpus: '1.0',
    memory: '512m',
    memorySwap: '512m',
    pidsLimit: 50,
    timeout: 5000,
  },
} as const;
