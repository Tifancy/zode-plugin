# zode-plugin

◦ Official plugin repository for [Zode](https://github.com/ZSeven-W/zode) - the AI-native coding assistant.
◦ Plugins extend Zode with status bar indicators, sidebar panels, background data sources, and more.
◦ Built with JavaScript and Zode's declarative `zode.data.define` / `zode.ui` APIs.

---

## 📖 Table of Contents

- [📖 Table of Contents](#-table-of-contents)
- [📍 Overview](#-overview)
- [📦 Available Plugins](#-available-plugins)
- [📂 Repository Structure](#-repository-structure)
- [🚀 Getting Started](#-getting-started)
  - [🔧 Prerequisites](#-prerequisites)
  - [📦 Installation](#-installation)
  - [🤖 Running a Plugin](#-running-a-plugin)
- [🧩 Plugin Development](#-plugin-development)
- [🛣 Project Roadmap](#-project-roadmap)
- [🔰 Contributing](#-contributing)
- [📄 License](#-license)
- [👏 Acknowledgments](#-acknowledgments)

---

## 📍 Overview

This repository hosts community and official plugins for [Zode](https://github.com/ZSeven-W/zode), an AI-native coding CLI built in Rust. Zode plugins are pure JavaScript - no npm, no bundler, no native modules. They run inside Zode's sandboxed QuickJS runtime with declarative APIs for UI rendering (`zode.ui.sidebar`, `zode.ui.statusLine`), background data sources (`zode.data.define`), and cryptographic primitives (`zode.crypto`).

Each plugin is a self-contained directory with a `plugin.json` manifest and one or more JavaScript files. Plugins are installed via `zode plugin install` and managed through Zode's plugin registry.

---

## 📦 Available Plugins

| Plugin | Description | Status |
|--------|-------------|--------|
| [volc-usage-plugin](volc-usage-plugin/) | Volcano Engine Coding Plan quota usage in the status bar with HMAC-SHA256 signed API requests | ✅ Stable |

---

## 📂 Repository Structure

```sh
zode-plugin/
├── README.md                          # This file
└── volc-usage-plugin/                 # Volcano Engine Coding Plan usage plugin
    ├── plugin.json                    # Plugin manifest (permissions, UI slots)
    ├── README.md                      # Plugin-specific documentation
    └── scripts/
        └── ui.js                      # Signing function + data source + status bar renderer
```

---

## 🚀 Getting Started

### 🔧 Prerequisites

- **[Zode](https://github.com/ZSeven-W/zode)** >= 0.1.0-beta.8 installed and runnable
- For plugins that require API credentials (e.g. `volc-usage-plugin`): appropriate access keys

### 📦 Installation

Zode supports installing plugins from local directories, Git repositories (HTTP/SSH), and GitHub shorthand. The `#subdir` suffix selects a plugin inside a monorepo.

#### Option 1: Remote Install (Recommended)

Install directly from the GitHub repository - no need to clone manually:

```sh
# GitHub shorthand with subdir
zode plugin install ZSeven-W/zode-plugin#volc-usage-plugin --trust

# Full Git URL with subdir
zode plugin install https://github.com/ZSeven-W/zode-plugin.git#volc-usage-plugin --trust

# With a specific branch/tag
zode plugin install ZSeven-W/zode-plugin@main#volc-usage-plugin --trust
```

#### Option 2: Local Install

Clone first, then install from the local path:

1. Clone this repository:

```sh
git clone https://github.com/ZSeven-W/zode-plugin.git
```

2. Install a plugin into Zode:

```sh
zode plugin install ./zode-plugin/volc-usage-plugin --trust
```

3. Verify installation:

```sh
zode plugin list
```

### 🤖 Running a Plugin

Plugins activate automatically once installed. Set required environment variables and launch Zode:

```sh
# Example: volc-usage-plugin
VOLC_AK=your_access_key_id \
VOLC_SK=your_secret_access_key \
zode
```

---

## 🧩 Plugin Development

A Zode plugin is a directory containing:

```
my-plugin/
├── plugin.json       # Manifest: name, version, UI slots, permissions
└── scripts/
    └── ui.js         # JavaScript logic
```

### plugin.json

```json
{
  "name": "my-plugin",
  "version": "0.1.0",
  "ui": {
    "statusLine": "./scripts/ui.js",
    "sidebar": "./scripts/ui.js"
  },
  "permissions": {
    "network": ["api.example.com"],
    "env": ["MY_API_TOKEN"],
    "context": []
  }
}
```

### JavaScript APIs

| API | Description |
|-----|-------------|
| `zode.ui.statusLine(fn)` | Register a status bar renderer. `fn(ctx)` returns `{ spans: [{ text, tone, bold }] }` |
| `zode.ui.sidebar(fn)` | Register a sidebar renderer. `fn(ctx)` returns `{ lines: [{ spans: [...] }] }` |
| `zode.data.define(key, config)` | Register a background HTTP data source. `config.request.headers` can be a function for dynamic signing |
| `zode.crypto.sha256hex(data)` | SHA256 hash, returns lowercase hex string |
| `zode.crypto.hmacSha256Hex(key, data)` | HMAC-SHA256 with string key, returns hex |
| `zode.crypto.hmacSha256HexKey(keyHex, data)` | HMAC-SHA256 with hex-decoded key (for derived key chains) |

### Dynamic Header Functions

`request.headers` can be a function instead of a static object. Zode calls it before each request with a context object:

```js
zode.data.define("myApi", {
  refreshIntervalMs: 60000,
  request: {
    url: "https://api.example.com/v1/data",
    method: "GET",
    headers: (ctx) => ({
      Authorization: "Bearer " + ctx.secrets.MY_API_TOKEN
    })
  }
});
```

The `ctx` object includes: `method`, `url`, `path`, `query`, `host`, `body`, `timestamp`, `secrets`.

---

## 🛣 Project Roadmap

- [X] `volc-usage-plugin` - Volcano Engine Coding Plan usage
- [ ] `github-rate` - GitHub API rate limit indicator
- [ ] `cost-tracker` - LLM token cost tracker
- [ ] `ci-status` - CI/CD pipeline status monitor

---

## 🔰 Contributing

- **[Discussions](https://github.com/ZSeven-W/zode-plugin/discussions)** - Join the discussion here.
- **[New Issue](https://github.com/ZSeven-W/zode-plugin/issues)** - Report a bug or request a feature here.

Contributions are welcome! Please follow these steps:

1. Fork the project repository to your GitHub account.
2. Clone the forked repository to your local machine.

```sh
git clone https://github.com/<your-username>/zode-plugin.git
```

3. Create a new branch:

```sh
git checkout -b feat/new-plugin-x
```

4. Develop your plugin following the [Plugin Development](#-plugin-development) guide.
5. Commit your updates:

```sh
git commit -m 'feat: add new plugin X'
```

6. Push your changes:

```sh
git push origin feat/new-plugin-x
```

7. Create a new pull request to the original project repository.

---

## 📄 License

This project is licensed under the [MIT License](https://choosealicense.com/licenses/mit/). For more details, refer to the [LICENSE](LICENSE) file.

---

## 👏 Acknowledgments

- [Zode](https://github.com/ZSeven-W/zode) - AI-native coding assistant with plugin system and `zode.crypto` bridge
- [rquickjs](https://github.com/DelSkayn/rquickjs) - QuickJS bindings for Rust, powering the plugin sandbox
- All plugin contributors and testers

---

[**Return**](#-table-of-contents)
---
