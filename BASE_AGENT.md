# BaseAgent インターフェイス + エージェントロードマップ

> yosegaki-web issue #24 から抽出

## BaseAgent コアメソッド

```typescript
interface BaseAgent {
  init(ctx: AgentContext): Promise<void>
  run(trigger: Trigger): Promise<AgentReport>
  stop(): Promise<void>
  report(): AgentReport
  suggestActions(): PrioritizedAction[]
}
```

## 権限モデル

エージェントは原則 **読み取り専用 + kanban.md 書き込み + Issue コメント** のみ。
コード push・デプロイ・Issue クローズは人間専用。

## エージェントロードマップ

| 優先 | 名前 | 役割 |
|------|------|------|
| 1 | `kpi-agent` | KPI 7 軸の自動計測・レポート |
| 2 | `security-agent` | OWASP スキャン・SRI 検証・credential 検知 |
| 3 | `ux-agent` | UX イシューのスコアリング・優先度付け |
| 4 | `deploy-agent` | CI green 確認 → デプロイ承認提案 |
| 5 | `monetize-agent` | コンバージョンファネル計測 |

## 実装 TODO

- [ ] `kpi-agent` を実装（KPI_AGENT.md 参照）
- [ ] `AgentRunner`（エージェントを起動・管理するハーネス）の設計
- [ ] GitHub Actions で `kpi-agent` を自動トリガーする `kpi-check.yml`
- [ ] 各エージェントの `permissions` をリポジトリ設定に紐付け
