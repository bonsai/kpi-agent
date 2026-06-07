# kpi-agent

任意の GitHub リポジトリに対して 7 軸 KPI を自動計測・レポートする汎用エージェント。

## 7 軸

| 軸 | データソース |
|----|------------|
| 信頼性 | CI ワークフロー実行結果 |
| 体験品質 | `ux` ラベルの open Issue 数 |
| 開発速度 | Issue TTF 中央値・CI green 率 |
| セキュリティ負債 | `security` ラベルの CRITICAL/MAJOR Issue |
| エージェント効率 | セッションログ連携 (未計測) |
| セキュリティリスク | コード内 secret パターン検出 |
| マネタイズ容易性 | `monetize` ラベルのブロッカー Issue |

## クイックスタート

```bash
# 任意のリポジトリをスキャン
GITHUB_TOKEN=ghp_xxx npx kpi-agent scan --repo owner/repo

# JSON 出力
GITHUB_TOKEN=ghp_xxx npx kpi-agent scan --repo owner/repo --output json

# GitHub Issue にコメント投稿
GITHUB_TOKEN=ghp_xxx npx kpi-agent scan --repo owner/repo --comment --issue 42
```

## GitHub Actions

### 週次自動レポート

`.github/workflows/kpi-weekly.yml` をリポジトリに追加するだけで、毎週月曜に KPI レポートが Issue として作成されます。

```yaml
# .github/workflows/kpi-weekly.yml
name: KPI Weekly Report
on:
  schedule:
    - cron: '0 1 * * 1'
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

## 設定ファイル

`kpi.yml` をリポジトリルートに置くとラベル名・目標値をカスタマイズできます。

```bash
cp kpi.example.yml kpi.yml
```

## Claude Code スキル

`.claude/commands/kpi-report.md` を自分のリポジトリにコピーすると `/kpi-report` スキルとして使えます。

## ライセンス

MIT
