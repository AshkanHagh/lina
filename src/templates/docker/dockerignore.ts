export const Dockerignore = `
  # Node.js dependencies
  node_modules/
  npm-debug.log
  yarn-error.log
  package-lock.json
  yarn.lock

  # Build and distribution directories
  dist/
  build/
  out/

  # Common web framework-specific files (e.g., Express, Next.js, NestJS, etc.)
  .next/
  public/build/
  .next/cache/
  coverage/
  jest-cache/
  tsconfig.tsbuildinfo

  # Development and testing files
  test/
  tests/
  __tests__/
  *.test.js
  *.test.ts
  *.spec.js
  *.spec.ts
  test-coverage/

  # Configuration and environment files (excluding runtime env)
  .env
  .env.local
  .env.development
  .env.test
  .env.production.local
  .env.*.local

  # Logs and temporary files
  logs/
  *.log
  *.log.*

  # IDE and editor files
  .vscode/
  .idea/
  *.sublime-project
  *.sublime-workspace

  # OS-specific files
  .DS_Store
  Thumbs.db

  # Miscellaneous
  tmp/
  temp/
  .cache/
  *.swp
  *.bak
  *.tmp
`;
