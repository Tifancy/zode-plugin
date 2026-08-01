# volc-coding-plan

◦ Volcano Engine Coding Plan usage status bar plugin for Zode.
◦ Real-time quota monitoring with HMAC-SHA256 signed API requests.
◦ Developed with the software and tools below.

---

## 📖 Table of Contents

- [📖 Table of Contents](#-table-of-contents)
- [📍 Overview](#-overview)
- [📦 Features](#-features)
- [📂 Repository Structure](#-repository-structure)
- [⚙️ Modules](#️-modules)
- [🚀 Getting Started](#-getting-started)
  - [🔧 Prerequisites](#-prerequisites)
  - [📦 Installation](#-installation)
  - [🤖 Running](#-running)
- [🛣 Project Roadmap](#-project-roadmap)
- [🔰 Contributing](#-contributing)
- [📄 License](#-license)
- [👏 Acknowledgments](#-acknowledgments)

---

## 📍 Overview

**volc-coding-plan** is a [Zode](https://github.com/ZSeven-W/zode) status bar plugin that displays Volcano Engine Ark Coding Plan quota usage in real time. It uses Zode's `zode.data.define` dynamic header function capability with `zode.crypto` primitives to compute HMAC-SHA256 signatures on every API request — no SDK, no external dependencies, pure JavaScript signing inside the Zode sandbox.

The plugin calls the Volcano Engine OpenAPI `GetCodingPlanUsage` action every 60 seconds and renders the hourly, weekly, and monthly quota percentages in the Zode status bar with color-coded alerts.

---

## 📦 Features

|    | Feature              | Description                                                                                              |
|----|----------------------|----------------------------------------------------------------------------------------------------------|
| ⚡ | **Real-time Quota**  | Displays hourly / weekly / monthly Coding Plan usage percentages with auto-refresh every 60 seconds.     |
| 🔐 | **HMAC-SHA256**      | Full Volcano Engine signature algorithm implemented in pure JS via `zode.crypto` primitives.             |
| 🎨 | **Color-coded**      | Hourly quota: green (<60%), yellow (60–80%), red (>80%). Weekly/monthly in muted tone.                   |
| 🔑 | **Secure Secrets**   | AK/SK injected from OS environment variables via `permissions.env`. Never exposed to renderer JS.        |
| 🧩 | **Zero Dependency**  | No npm packages, no SDK, no native modules. Pure JS + Zode built-in `zode.crypto` bridge.                |
| ⚙️ | **Configurable**     | Region, service, action, label — all editable as top-level constants in `scripts/ui.js`.                |

---

## 📂 Repository Structure

```sh
└── volc-coding-plan/
    ├── plugin.json           # Plugin manifest (permissions, UI slot declaration)
    ├── README.md             # This file
    └── scripts/
        └── ui.js             # Signing function + data source + status bar renderer
```

---

## ⚙️ Modules

| File | Summary |
|------|---------|
| [plugin.json](plugin.json) | Plugin manifest. Declares `statusLine` UI slot, network permissions (`open.volcengineapi.com`, `*.volcengineapi.com`), and env permissions (`VOLC_AK`, `VOLC_SK`). |
| [scripts/ui.js](scripts/ui.js) | Core logic. Contains three sections: (1) `volcSign()` — Volcano Engine HMAC-SHA256 signing function using `zode.crypto.sha256hex`, `hmacSha256Hex`, `hmacSha256HexKey`; (2) `zode.data.define("codingPlan", ...)` — background data source with dynamic header function; (3) `zode.ui.statusLine(...)` — status bar renderer extracting `QuotaUsage` percentages and applying color rules. |

### Signing Algorithm (`volcSign`)

The function implements the 6-step Volcano Engine HMAC-SHA256 signing process:

1. **Payload hash** — `sha256hex(body)` for `X-Content-Sha256`
2. **CanonicalRequest** — method + path + query + canonicalHeaders + signedHeaders + payloadHash
3. **StringToSign** — `HMAC-SHA256` + date + credentialScope + `sha256hex(canonicalRequest)`
4. **Derived key chain** — `kDate → kRegion → kService → kSigning` using `hmacSha256Hex` for the first step (SK as string key) and `hmacSha256HexKey` for subsequent steps (hex key decoded to raw bytes)
5. **Signature** — `hmacSha256HexKey(kSigning, stringToSign)`
6. **Headers** — Returns `X-Date`, `X-Content-Sha256`, `Content-Type`, `Authorization`

### API Response Structure

```json
{
  "Result": {
    "Status": "Running",
    "QuotaUsage": [
      { "Level": "session",  "Percent": 64.88, "ResetTimestamp": 1785225216 },
      { "Level": "weekly",   "Percent": 11.51, "ResetTimestamp": 1785686400 },
      { "Level": "monthly",  "Percent": 31.94, "ResetTimestamp": 1787500799 }
    ]
  }
}
```

| API Field | Status Bar | Description |
|-----------|------------|-------------|
| `session` | `h65%` | Hourly quota (color-coded) |
| `weekly` | `w12%` | Weekly quota (muted) |
| `monthly` | `m32%` | Monthly quota (muted) |

---

## 🚀 Getting Started

### 🔧 Prerequisites

- **Zode** >= 0.1.0-beta.8 (requires `zode.crypto` and dynamic `headers` function support)
- **Volcano Engine account** with Ark Coding Plan enabled
- **Access Key** — obtain from [Volcano Engine IAM Key Management](https://console.volcengine.com/iam/keymanage)

### 📦 Installation

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

1. Clone the plugin repository:

```sh
git clone https://github.com/ZSeven-W/zode-plugin.git
```

2. Install into Zode:

```sh
zode plugin install ./zode-plugin/volc-usage-plugin --trust
```

3. Verify installation:

```sh
zode plugin list
```

### 🤖 Running

Set the Volcano Engine credentials as environment variables and launch Zode:

```sh
VOLC_AK=your_access_key_id \
VOLC_SK=your_secret_access_key \
zode
```

The status bar will display:

```
火山CodingPlan ● h65%  w12%  m32%
```

#### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VOLC_AK` | ✅ Yes | - | Volcano Engine Access Key ID |
| `VOLC_SK` | ✅ Yes | - | Volcano Engine Secret Access Key |
| `VOLC_REGION` | ❌ No | `cn-beijing` | Volcano Engine region (used in HMAC-SHA256 credentialScope) |
| `VOLC_SERVICE` | ❌ No | `ark` | Service name (used in HMAC-SHA256 credentialScope) |

> **Note:** `HOST`, `ACTION`, `VERSION`, and `LABEL` are JS constants in `scripts/ui.js` because they affect the request URL (which must be static at plugin discovery time) or the status bar renderer (which runs in a sandbox without env access). Edit them directly in the file if you need different values.

Example with optional overrides:

```sh
VOLC_AK=your_ak \
VOLC_SK=your_sk \
VOLC_REGION=cn-shanghai \
VOLC_SERVICE=ark \
zode
```

#### Configuration (JS Constants)

Edit the `DEFAULTS` object at the top of `scripts/ui.js` for values that can't be set via env vars:

```js
const DEFAULTS = {
  REGION: "cn-beijing",              // Overridable by VOLC_REGION env var
  SERVICE: "ark",                    // Overridable by VOLC_SERVICE env var
  HOST: "open.volcengineapi.com",    // JS-only (affects request URL)
  ACTION: "GetCodingPlanUsage",      // JS-only (affects request URL)
  VERSION: "2024-01-01",             // JS-only (affects request URL)
  LABEL: "火山CodingPlan",           // JS-only (status bar display text)
};
```

#### Color Rules

| Hourly Quota | Color  | Tone     |
|-------------|--------|----------|
| < 60%       | 🟢 Green | `success` |
| 60–80%      | 🟡 Yellow | `warning` |
| > 80%       | 🔴 Red   | `danger`  |

---

## 🛣 Project Roadmap

- [X] Core HMAC-SHA256 signing with `zode.crypto` primitives
- [X] Status bar display with color-coded hourly quota
- [X] Configurable label and API parameters
- [ ] Sidebar panel with quota history chart
- [ ] Desktop notification when hourly quota exceeds 80%
- [ ] Multi-account support (multiple AK/SK pairs)

---

## 🔰 Contributing

- **[Discussions](https://github.com/ZSeven-W/zode-plugin/discussions)** — Join the discussion here.
- **[New Issue](https://github.com/ZSeven-W/zode-plugin/issues)** — Report a bug or request a feature here.

Contributions are welcome! Please follow these steps:

1. Fork the project repository to your GitHub account.
2. Clone the forked repository to your local machine.

```sh
git clone https://github.com/<your-username>/zode-plugin.git
```

3. Create a new branch:

```sh
git checkout -b feat/new-feature-x
```

4. Develop your changes locally.
5. Commit your updates with a clear explanation:

```sh
git commit -m 'feat: add new feature X'
```

6. Push your changes to your forked repository:

```sh
git push origin feat/new-feature-x
```

7. Create a new pull request to the original project repository.

---

## 📄 License

This project is licensed under the [MIT License](https://choosealicense.com/licenses/mit/). For more details, refer to the [LICENSE](LICENSE) file.

---

## 👏 Acknowledgments

- [Zode](https://github.com/ZSeven-W/zode) — AI-native coding assistant with plugin system and `zode.crypto` bridge
- [Volcano Engine](https://www.volcengine.com/) — Cloud platform providing the Ark Coding Plan API
- [Volcano Engine API Signing Documentation](http://docs.volcengine.com/docs/6369/67269?lang=zh) — HMAC-SHA256 signature algorithm reference

---

[**Return**](#-table-of-contents)
---
