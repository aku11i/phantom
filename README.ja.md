# 👻 Phantom

<div align="center">

**Git worktreeを使った並行開発のためのパワフルなCLIツール**

[![npm version](https://img.shields.io/npm/v/@aku11i/phantom.svg)](https://www.npmjs.com/package/@aku11i/phantom)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/@aku11i/phantom.svg)](https://nodejs.org)

[インストール](#-インストール) • [クイックスタート](#-クイックスタート) • [なぜPhantom？](#-なぜphantom) • [ドキュメント](#-ドキュメント)

</div>

## ✨ 概要

Phantomは、Git worktreeの管理を劇的にシンプルにするCLIツールです。複数の機能開発、バグ修正、PRレビューを並行して進める現代の開発ワークフローに最適化されています。

### 主な特徴

- 🚀 **シンプルなWorktree管理** - 直感的なコマンドでGit worktreeを作成・管理
- 🔄 **シームレスなコンテキスト切り替え** - stashやcommitせずに異なる作業間を瞬時に移動
- 🤖 **AI対応** - 複数のAIコーディングエージェントを並行実行するのに最適
- 🎯 **ブランチとWorktreeの同期** - 各worktreeに対応するブランチを自動作成
- 🐚 **インタラクティブシェル** - SSH風のworktreeナビゲーション体験
- ⚡ **ゼロ設定** - 賢明なデフォルト設定ですぐに使用可能

## 🤔 なぜPhantom？

現代の開発ワークフローでは、複数の機能を同時に作業することが一般的になっています。Git worktreeは素晴らしい機能ですが、パスとブランチを個別に指定する必要があり、少し面倒です。

### Git worktreeを使う際の問題点

素のGit worktreeを使う場合、worktreeのパス、ブランチ名、ベースブランチなどを毎回指定する必要があります。また、作業を切り替える際はディレクトリを移動する必要があり、複数の作業を頻繁に切り替える場合は少し手間がかかります。

### Phantomの解決策

```bash
# 従来の方法
git worktree add -b feature ../project-feature origin/main
cd ../project-feature

# Phantomを使用
phantom create feature --shell
```

Phantomは、worktreeの作成、ブランチの管理、ディレクトリの移動をすべて1つのコマンドに統合します。

## 🚀 クイックスタート

```bash
# Phantomをインストール
npm install -g @aku11i/phantom

# 新しいworktreeを作成
phantom create feature-awesome

# worktreeにジャンプ
phantom shell feature-awesome

# または直接コマンドを実行
phantom exec feature-awesome npm install
phantom exec feature-awesome npm test

# すべてのworktreeをリスト表示
phantom list

# 完了したらクリーンアップ
phantom delete feature-awesome
```

## 📦 インストール

### npmを使用（推奨）
```bash
npm install -g @aku11i/phantom
```

### pnpmを使用
```bash
pnpm add -g @aku11i/phantom
```

### yarnを使用
```bash
yarn global add @aku11i/phantom
```

### ソースからビルド
```bash
git clone https://github.com/aku11i/phantom.git
cd phantom
pnpm install
pnpm build
npm link
```

## 📖 ドキュメント

### コアコンセプト

**Worktree** 🌳 - Phantomによって管理されるGit worktree。各worktreeは特定のブランチや機能のための独立したワークスペースで、競合なしに並行開発が可能です。

### コマンド概要

#### Worktree管理

```bash
# 対応するブランチを持つ新しいworktreeを作成
phantom create <name>

# すべてのworktreeとその現在のステータスをリスト表示
phantom list

# worktreeへの絶対パスを取得
phantom where <name>

# worktreeとそのブランチを削除
phantom delete <name>
phantom delete <name> --force  # コミットされていない変更がある場合の強制削除
```

#### Worktreeでの作業

```bash
# worktreeのコンテキストで任意のコマンドを実行
phantom exec <name> <command> [args...]

# 例:
phantom exec feature-auth npm install
phantom exec feature-auth npm run test
phantom exec feature-auth git status

# worktreeでインタラクティブシェルセッションを開く
phantom shell <name>
```

### 環境変数

Phantomで管理されたworktree内で作業する際、以下の環境変数が利用可能です：

- `PHANTOM_NAME` - 現在のworktreeの名前
- `PHANTOM_PATH` - worktreeディレクトリへの絶対パス

## 🔄 Phantom vs Git Worktree

| 機能 | Git Worktree | Phantom |
|---------|--------------|---------|
| worktree + ブランチの作成 | `git worktree add -b feature ../project-feature` | `phantom create feature` |
| worktreeのリスト表示 | `git worktree list` | `phantom list` |
| worktreeへの移動 | `cd ../project-feature` | `phantom shell feature` |
| worktreeでコマンド実行 | `cd ../project-feature && npm test` | `phantom exec feature npm test` |
| worktreeの削除 | `git worktree remove ../project-feature` | `phantom delete feature` |

## 🛠️ 開発

```bash
# クローンとセットアップ
git clone https://github.com/aku11i/phantom.git
cd phantom
pnpm install

# テストの実行
pnpm test

# 型チェック
pnpm type-check

# リンティング
pnpm lint

# すべてのチェックを実行
pnpm ready
```

## 🚀 リリースプロセス

Phantomの新しいバージョンをリリースするには：

1. **mainブランチにいて最新の状態であることを確認**
   ```bash
   git checkout main
   git pull
   ```

2. **すべてのチェックを実行**
   ```bash
   pnpm ready
   ```

3. **バージョンを上げる**
   ```bash
   # パッチリリース（バグ修正）の場合
   npm version patch

   # マイナーリリース（新機能）の場合
   npm version minor

   # メジャーリリース（破壊的変更）の場合
   npm version major
   ```

4. **バージョンコミットとタグをプッシュ**
   ```bash
   git push && git push --tags
   ```

5. **npmに公開**
   ```bash
   pnpm publish
   ```

6. **GitHubリリースを作成**
   ```bash
   # 自動生成されたノートでリリースを作成
   gh release create v<version> \
     --title "Phantom v<version>" \
     --generate-notes \
     --target main

   # v0.1.3の例:
   gh release create v0.1.3 \
     --title "Phantom v0.1.3" \
     --generate-notes \
     --target main
   ```

ビルドプロセスは`prepublishOnly`スクリプトによって自動的に処理され、以下を行います：
- すべてのテストとチェックを実行
- esbuildを使用してTypeScriptソースをJavaScriptにビルド
- `dist/`ディレクトリにバンドルされた実行可能ファイルを作成

**注意**: `dist/`ディレクトリはgit-ignoreされており、公開プロセス中にのみ作成されます。

## 🤝 コントリビューション

コントリビューションは歓迎します！プルリクエストを自由に送信してください。大きな変更については、まず変更したい内容について議論するためにissueを開いてください。

以下を必ず行ってください：
- 適切にテストを更新する
- 既存のコードスタイルに従う
- 提出前に`pnpm ready`を実行する

## 📄 ライセンス

このプロジェクトはMITライセンスの下でライセンスされています - 詳細は[LICENSE](LICENSE)ファイルをご覧ください。

## 🙏 謝辞

- より良い並行開発ワークフローの必要性に触発されて
- AI支援開発時代のために構築
- すべてのコントリビューターに特別な感謝を

## 🤝 コントリビューター

- [@aku11i](https://github.com/aku11i) - プロジェクトの作成者およびメンテナー
- [Claude (Anthropic)](https://claude.ai) - コードベースの大部分を実装したAIペアプログラマー

---

<div align="center">
<a href="https://github.com/aku11i">aku11i</a>と<a href="https://claude.ai">Claude</a>により👻で作成
</div>
