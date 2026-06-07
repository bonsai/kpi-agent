# kpi-agent

任意の GitHub リポジトリに対して **7 軸 KPI を自動計測・レポート**する汎用エージェント。

## なぜ KPI か — 判断の根拠として使う

**KPI は数値目標ではなく、意思決定のフレームワークとして機能する。**

Issue は常に多く、時間は常に足りない。「次に何をやるか」を感覚や声の大きさで決めると、重要度が低い作業が積み上がり、本当に痛い問題が先送りされる。kpi-agent はその判断を数値で置き換える。

### Issue を選ぶときの使い方

```
🔴 信頼性 58% → CI が壊れている → 他の何より先に直す
🟡 体験品質 2件 → UX issue が残っている → 信頼性の次に着手
🟢 開発速度 TTF 1.2日 → 問題なし → 放置してよい
⚪ エージェント効率 未計測 → 計測基盤がない → 今は対処不要
```

**🔴 が出ている軸のIssueを最優先に選ぶ。🟢 の軸のIssueは後回しにする理由が説明できる。**

### 優先順位付けのルール

| KPI 状態 | 取るべき行動 |
|----------|------------|
| 🔴 CRITICAL Issue あり | 他のすべてを止めて対処 |
| 🔴 CI green率 < 75% | 新機能開発を止めてCI修復 |
| 🟡 MAJOR Issue あり | 次のスプリントで必ず消化 |
| 🟢 全軸クリア | 新機能・技術的改善を自由に選んでよい |
| ⚪ 未計測 | 計測基盤の整備をバックログに積む |

### エージェントとして使う場合

Claude Code などのAIエージェントに Issue を割り当てる前に `/kpi-report` を実行する。エージェントは KPI スナップショットを判断根拠として Issue 選択を説明できる。

```
エージェントへの指示例:
「KPIを確認して、今週対処すべきIssueを1つ選んで実装してください」

エージェントの応答例:
「信頼性が🔴58%（CI失敗3件連続）のため、#34 [CI: fix flaky test in auth module] を選択します」
```

KPI なしに Issue を選ぶと「なぜこれをやるのか」が説明できない。KPI があれば選択の根拠が数値で残る。

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
