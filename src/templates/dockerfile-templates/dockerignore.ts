export const Dockerignore = `
  # Node.js project ignores
  node_modules/
  npm-debug.log
  yarn-error.log
  dist/
  build/
  coverage/
  *.log
  .env
  .env.local
  .env.development
  .env.test
  .env.production

  # Rust project ignores
  target/
  Cargo.lock
  *.rs.bk
  *.log

  # General ignores
  .git
  .gitignore
  .vscode/
  .idea/
  *.md
  Dockerfile
  docker-compose.yml
  *.swp
  *.swo
  *.tmp
  *.bak
`;
