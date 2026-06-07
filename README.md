# kpi-agent

任意の GitHub リポジトリに対して **7 軸 KPI を自動計測・レポート**する汎用エージェント。

```
GITHUB_TOKEN=ghp_xxx npx kpi-agent scan --repo bonsai/yosegaki-web
```

```markdown
## KPI スナップショット — 2026-06-07

> **repo**: `bonsai/yosegaki-web`

| 軸 | スコア | 前回比 | アラート |
|----|--------|--------|---------|
| 信頼性 | 🔴 58% (12 run) | — | CI 失敗 3 件連続 |
| 体験品質 | 🟡 2 件未解決 | — | #9, #11 |
| 開発速度 | 🟢 TTF 1.2 日 / CI green 58% | — | — |
| セキュリティ負債 | 🟢 0 件 | — | — |
| エージェント効率 | ⚪ 未計測 | — | 計測基盤未整備 |
| セキュリティリスク | 🟢 リスク検出なし | — | — |
| マネタイズ容易性 | ⚪ 未定義 | — | ラベル "monetize" の Issue なし |

### 推奨アクション (優先順)
1. **信頼性**: CI 失敗 3 件連続
2. **体験品質**: #9, #11
```

## 7 軸

| 軸 | データソース | 🟢 | 🟡 | 🔴 |
|----|------------|----|----|-----|
| 信頼性 | CI ワークフロー実行結果 | green率 ≥ 目標 | ±20% 以内 | 目標 -20% 以下 |
| 体験品質 | `ux` ラベルの open Issue | 0 件 | open あり | MAJOR あり |
| 開発速度 | Issue TTF 中央値・CI green 率 | TTF ≤ 目標 | TTF ≤ 目標×2 | TTF > 目標×2 |
| セキュリティ負債 | `security` ラベルの CRITICAL/MAJOR | 0 件 | MAJOR あり | CRITICAL あり |
| エージェント効率 | セッションログ連携 | — | — | 未計測 |
| セキュリティリスク | コード内 secret パターン検出 | 検出なし | — | 検出あり |
| マネタイズ容易性 | `monetize` ラベルのブロッカー | 0 件 | あり | — |

## インストール

```bash
# npx で都度実行 (インストール不要)
npx kpi-agent scan --repo owner/repo

# グローバルインストール
npm install --global kpi-agent
kpi-agent scan --repo owner/repo
```

**必須**: `GITHUB_TOKEN` 環境変数 (read: issues, actions, contents)

## 使い方

```bash
# 基本スキャン
GITHUB_TOKEN=ghp_xxx kpi-agent scan --repo owner/repo

# JSON 出力
kpi-agent scan --repo owner/repo --output json

# GitHub Issue として結果を投稿
kpi-agent scan --repo owner/repo --comment

# 既存 Issue にコメント
kpi-agent scan --repo owner/repo --comment --issue 42

# カスタム設定ファイルを使用
kpi-agent scan --config ./my-kpi.yml
```

## 設定ファイル (kpi.yml)

リポジトリルートに `kpi.yml` を置くとラベル名・目標値・軸の有効/無効をカスタマイズできます。

```bash
cp kpi.example.yml kpi.yml
```

```yaml
# ラベル名カスタマイズ
labels:
  ux: enhancement        # デフォルト: ux
  security: bug/security # デフォルト: security
  critical: P0           # デフォルト: critical

# KPI 目標値
targets:
  ci_green_rate: 0.95     # CI green 率 95%
  major_ttf_days: 7       # MAJOR Issue TTF 7 日以内
  critical_ttf_hours: 24  # CRITICAL Issue TTF 24 時間以内

# 不要な軸を無効化
axes:
  monetize: false
  ax_score: false

# CI ワークフロー名を指定 (省略時は全ワークフロー)
ci_workflow: ci.yml
```

## GitHub Actions

### 週次自動レポート (毎週月曜)

```yaml
# .github/workflows/kpi-weekly.yml
name: KPI Weekly Report
on:
  schedule:
    - cron: '0 1 * * 1'  # 10:00 JST
  workflow_dispatch:
jobs:
  kpi-scan:
    runs-on: ubuntu-latest
    permissions:
      issues: write
      actions: read
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install --global kpi-agent
      - run: kpi-agent scan --comment
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITHUB_REPOSITORY: ${{ github.repository }}
```

### CI 失敗時トリガー

```yaml
# .github/workflows/kpi-on-ci.yml
name: KPI on CI Failure
on:
  workflow_run:
    workflows: ['*']
    types: [completed]
jobs:
  kpi-check:
    runs-on: ubuntu-latest
    if: github.event.workflow_run.conclusion == 'failure'
    permissions:
      issues: write
      actions: read
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install --global kpi-agent
      - run: kpi-agent scan --output markdown
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITHUB_REPOSITORY: ${{ github.repository }}
```

## Claude Code スキル

`.claude/commands/kpi-report.md` を自分のリポジトリにコピーすると `/kpi-report` コマンドとして使えます。

```bash
curl -sSL https://raw.githubusercontent.com/bonsai/kpi-agent/main/.claude/commands/kpi-report.md \
  -o .claude/commands/kpi-report.md
```

Claude Code 上で `/kpi-report` と入力すると、スキャンを実行してレポートを表示します。

## エージェントロードマップ

| 優先 | 名前 | 役割 | 状態 |
|------|------|------|------|
| 1 | `kpi-agent` | KPI 7 軸の自動計測・レポート | ✅ v0.1 |
| 2 | `security-agent` | OWASP スキャン・SRI 検証・credential 検知 | 計画中 |
| 3 | `ux-agent` | UX イシューのスコアリング・優先度付け | 計画中 |
| 4 | `deploy-agent` | CI green 確認 → デプロイ承認提案 | 計画中 |
| 5 | `monetize-agent` | コンバージョンファネル計測 | 計画中 |

## 権限モデル

| 操作 | エージェント | 人間 |
|------|------------|------|
| Issue / CI 読み取り | ✅ | ✅ |
| kanban.md 書き込み | ✅ | ✅ |
| Issue コメント投稿 | ✅ | ✅ |
| コード push | ❌ | ✅ |
| デプロイ実行 | ❌ | ✅ |
| Issue クローズ | ❌ | ✅ |

## ライセンス

MIT
