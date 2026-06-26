# /kpi-report

KPI スナップショットを生成して表示します。

## 実行手順

1. `GITHUB_TOKEN` が設定されているか確認する
2. 現在のリポジトリを特定する (`git remote -v` または `GITHUB_REPOSITORY`)
3. kpi-agent をローカルで実行する:

```bash
npx kpi-agent scan --repo <owner/repo>
```

`kpi.yml` が存在する場合は設定を自動で読み込みます。

## 出力後の対応

- 🔴 項目: 即座に Issue またはコメントでアクション提案を行う
- 🟡 項目: 今週中に対応方針を決める
- ⚪ 項目: 計測基盤が未整備 → 計測方法を提案する

## オプション

| フラグ | 説明 |
|--------|------|
| `--comment` | GitHub Issue に結果を投稿 |
| `--issue <N>` | 特定の Issue にコメント |
| `--output json` | JSON 形式で出力 |
| `-c kpi.yml` | カスタム設定ファイルを指定 |
