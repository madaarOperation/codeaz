# Codeaz

Codeaz is a GitHub Action designed to enforce a role-based system over your repository. It ensures that only authorized code owners can push or merge changes, providing a mechanism to automatically reset or revert unauthorized modifications.

---

## Features

- **Role-Based Access**: Define specific GitHub users as authorized code owners.
- **Automated Enforcement**: Automatically monitor pushes and manage changes made by non-authorized users.
- **Secure Integration**: Uses GitHub tokens to maintain repository integrity.

## Directory Structure

```text
.
├── action.yml          # Action metadata and input definitions
├── src/                # TypeScript source logic
├── lib/                # Compiled individual modules
├── dist/               # Bundled production build (dist/index.js)
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies and build scripts

```

## Inputs

| Input          | Description                                        | Required | Default |
| -------------- | -------------------------------------------------- | -------- | ------- |
| `code-owner`   | GitHub users allowed to push to the repo           | Yes      | ""      |
| `github-token` | Token used to reset changes outside of code owners | Yes      | ""      |

## Outputs

| Output | Description                                |
| ------ | ------------------------------------------ |
| `time` | The timestamp when the code merge occurred |

## Usage

Add Codeaz to your workflow file (e.g., `.github/workflows/main.yml`):

```yaml
jobs:
  enforce-roles:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run Codeaz Role Check
        uses: your-username/codeaz@main
        with:
          code-owner: "user1, user2"
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Development

### Build Pipeline

1. **Install dependencies**:

```bash
npm install

```

2. **Full Build**:
   Compiles modules to `lib/` and bundles the action to `dist/`.

```bash
npm run build

```

3. **Clean**:
   Remove build artifacts.

```bash
npm run clean

```

## License

This project is licensed under the MIT License.
