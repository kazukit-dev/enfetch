---
description: Run all quality assurance checks (lint, format, typecheck, test)
allowed-tools:
  - Bash
---

プロジェクト全体の品質保証チェックを実行します。

## 1. Lintチェック（Biome）
pnpm check:lint

## 2. フォーマットチェック（Biome）
pnpm check:format

## 3. 型チェック（TypeScript）
pnpm typecheck

## 4. テスト実行（Vitest）
pnpm test