# Contributing to Link

First off, thanks for taking the time to contribute! 🎉

**Link** is currently in **Beta**, and we are actively working towards a v1.0 release. We welcome contributions from the community to help us make this the best open-source link-in-bio platform.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct (standard Contributor Covenant). Please be respectful and inclusive.

## How Can You Contribute?

### 🐛 Reporting Bugs

If you find a bug, please create an issue that includes:

- A clear, descriptive title.
- Steps to reproduce the issue.
- Expected behavior vs. actual behavior.
- Screenshots or video recordings (if applicable).
- Your environment details (OS, Browser, etc.).

### 💡 Suggesting Enhancements

Have an idea? We'd love to hear it!

- Open a discussion or an issue with the tag `enhancement`.
- Explain **why** this feature would be useful.
- Provide examples or mockups if possible.

### 🛠 Pull Requests

1.  **Fork the repo** and clone it locally.
2.  **Create a branch** for your edit:
    ```bash
    git checkout -b fix/amazing-fix
    # or
    git checkout -b feat/new-feature
    ```
3.  **Make your changes**.
4.  **Lint and Format**:
    Ensure your code passes our style checks.
    ```bash
    bun run check
    ```
5.  **Commit your changes**.
    We prefer [Conventional Commits](https://www.conventionalcommits.org/).
    ```bash
    git commit -m "feat: add amazing new block component"
    ```
6.  **Push to your fork** and submit a Pull Request.

---

## Development Setup

We use **Bun** for package management and script execution.

1.  **Install Bun**: [https://bun.sh/](https://bun.sh/)
2.  **Install Dependencies**:
    ```bash
    bun install
    ```
3.  **Environment Variables**:
    Copy the `.env.example` (if available) or create a `.env` file based on `README.md`.
4.  **Start Development Server**:
    ```bash
    bun run dev
    ```

## Style Guide

- **TypeScript**: We use strict TypeScript. Please don't use `any` unless absolutely necessary.
- **Tailwind CSS**: Use utility classes. For complex styles, consider `class-variance-authority` (CVA).
- **Formatting**: We use Prettier. Run `bun run format` to fix style issues.
- **Linting**: We use ESLint. Run `bun run lint` to check for errors.

## Project Structure

- `src/routes`: Application routes (TanStack Start).
- `src/components`: Reusable UI components.
- `src/db`: Database schema and connection.
- `src/lib`: Core logic, auth, and utilities.
- `src/api`: tRPC router definitions.

---

Thank you for contributing to Link!
