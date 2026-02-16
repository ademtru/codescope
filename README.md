# Codescope

Visualize the structure and relationships of any GitHub repository. Enter a repo URL and get an interactive graph showing classes, functions, methods, interfaces, and how they connect.

## Features

- **Graph visualization** — Interactive node-based graph of code entities using React Flow
- **Code parsing** — Parses JavaScript, TypeScript, Python, and Java using Tree-sitter
- **Relationship detection** — Maps calls, imports, inheritance, ownership, and interface implementations
- **Code preview** — Click any entity to see its source code
- **Recent repos** — Quickly revisit previously analyzed repositories

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- React Flow (`@xyflow/react`)
- Tree-sitter (WASM)
- Zustand
- Octokit (GitHub API)

## Getting Started

```bash
npm install
npm run dev
```

## Usage

1. Paste a GitHub repository URL
2. Wait for the repo to be fetched and parsed
3. Explore the interactive graph — click nodes to preview code
