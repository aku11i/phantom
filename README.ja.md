# 👻 Phantom

<div align="center">

**Git worktreeを使ったシームレスな並行開発のためのパワフルなCLIツール**

[![npm version](https://img.shields.io/npm/v/@aku11i/phantom.svg)](https://www.npmjs.com/package/@aku11i/phantom)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/@aku11i/phantom.svg)](https://nodejs.org)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/aku11i/phantom)

[English](./README.md) • [インストール](#-インストール) • [なぜPhantom？](#-なぜphantom) • [基本的な使い方](#-基本的な使い方) • [ドキュメント](#-ドキュメント)

![Phantom demo](./docs/assets/phantom.gif)

</div>

## ✨ Phantomとは？

PhantomはGit worktreeをシンプルかつパワフルに操り、開発生産性を飛躍的に向上させるCLIツールです。複数のタスクを独立した作業環境で同時進行し、真のマルチタスク開発を実現します。AIエージェントを用いた並行開発に対応した次世代の並行開発ツールです。

### 主な機能

- 🚀 **シンプルなWorktree管理** - 直感的なコマンドでGit worktreeを作成・管理
- 🔄 **真のマルチタスク** - ブランチ毎に作業ディレクトリを作成し、複数のタスクを同時進行
- 🎯 **どこからでもコマンド実行** - `phantom exec <worktree> <command>`でワークツリーに対してコマンドを実行可能
- 🪟 **組み込みtmux統合** - ワークツリーを新しいペインやウィンドウで開きます
- 🔍 **fzfによるインタラクティブな選択** - worktreeの選択に組み込みのfzfオプションを使用できます
- 🎮 **シェル補完** - Fish,Zsh,Bashの完全な自動補完サポート
- 🐙 **GitHub統合** - GitHubのPRやイシューから直接ワークツリーを作成
- 🤖 **MCP統合** - AIが自律的にワークツリーを管理し、並行開発を実現
- 🔍 **PRレビューインターフェース** - [difit](https://github.com/yoshiko-pg/difit)を使用してワークツリーの差分をローカルでレビュー（実験的機能）
- ⚡ **高速で軽量** - 最小限の外部依存関係

## 🚀 インストール

### Homebrewを使用（推奨）

```bash
brew install aku11i/tap/phantom
```

> **注意:** Homebrewでインストールした場合、FishとZshのシェル補完は自動的にインストールされます。Bashの補完については、下記の[シェル補完](#シェル補完)セクションを参照してください。

#### npmを使用

```bash
npm install -g @aku11i/phantom
```

## 🤔 なぜPhantom？

Git worktreeは強力ですが、パスとブランチの手動管理が必要です。また、複数のワークツリーを移動するのも大変です。Phantomはこの問題を解消します：

```bash
# Phantomなし
git worktree add -b feature-awesome ../project-feature-awesome origin/main
cd ../project-feature-awesome

# Phantomあり
phantom create feature-awesome --shell
```

### Phantomの仕組み

`phantom create feature-awesome`を実行すると、`.git/phantom/worktrees/`に`feature-awesome`という名前の新しいGit worktreeが作成されます。
phantomを使って作成されたすべてのワークツリーがこの場所で一元管理されます

```
your-project/    # Gitリポジトリ
├── .git/
│   └── phantom/
│       └── worktrees/        # Phantomが管理するディレクトリ
│           ├── feature-awesome/  # ブランチ名 = worktree名
│           ├── bugfix-login/     # 別のworktree
│           └── hotfix-critical/  # さらに別のworktree
└── ...
```

`phantom.config.json`の`worktreesDirectory`設定オプションを使用してワークツリーの場所をカスタマイズすることもできます。これにより、お好みの場所にワークツリーを保存できます。

このルールにより、worktreeの場所を覚える必要がなくなり、ブランチ名だけで簡単にワークツリーの操作ができます。

### ✈️ 快適な開発体験を実現する機能

Phantomはコマンドラインツールとしての完璧な機能を備えています。開発者はまるでファーストクラスに乗っているような信頼と安心を感じます。

#### シェル補完

Phantomはfish,zsh,bashの完全なシェル補完をサポートしています。タブキーでコマンドやworktree名を補完できます。

Homebrewでインストールした場合、FishとZshの補完は自動的にインストールされます。Bashの場合は手動でセットアップする必要があります：

```bash
# 前提条件: bash-completion v2がインストールされている必要があります

# Bash用（.bashrcまたは.bash_profileに追加）
eval "$(phantom completion bash)"
```

#### tmux統合

ワークツリーを作成する際にtmuxを使用して新しいウィンドウやペインで開くことができます。これにより、複数の作業環境を同時に管理できます。

```bash
# 新しいウィンドウでworktreeを作成して開く
phantom create feature-x --tmux
# ペインを分割して作成
phantom create feature-y --tmux-vertical
phantom create feature-z --tmux-horizontal

# 既存のworktreeをtmuxで開く
phantom shell feature-x --tmux
phantom shell feature-y --tmux-v

# 結果: 複数のworktreeが同時に表示され、それぞれで独立した作業が可能
```

![Phantom tmux統合](./docs/assets/phantom-tmux.gif)

#### エディタ統合

PhantomはVS CodeやCursorなどのエディタでも快適に使用できます。エディタを指定してワークツリーを開くことができます。

```bash
# VS Codeで開く
phantom create feature --exec "code ."

# または既存のworktreeを開く
phantom exec feature code .

# Cursorで開く
phantom create feature --exec "cursor ."
phantom exec feature cursor .
```

![Phantom VS Code統合](./docs/assets/phantom-vscode.gif)

#### fzf統合

fzfを使用したインタラクティブな検索で素早くworktreeを選択できます。

```bash
# fzfでworktreeを選択してシェルを開く
phantom shell --fzf

# fzfでworktreeを選択して削除
phantom delete --fzf
```

### MCP統合

PhantomはModel Context Protocol（MCP）のサーバーを提供します。AIコーディングアシスタントが自律的にワークツリーを作成・管理し、複数の機能を並行して開発できます。

MCPサーバーの設定を完了した後、次のようなプロンプトをAIエージェントに与えてみてください。
AIエージェントは2つのワークツリーを作成し、それぞれにExpressとHonoのアプリを実装します。

> ExpressとHonoを使用した簡単なhello worldアプリの2つのバリエーションを作成し、それぞれ別のワークツリーで実装してください。各アプリはnpm startで起動でき、異なるURLで提供されるようにしてください。

詳細な設定と使用方法については[MCP統合ガイド](./docs/mcp.md)を参照してください。


## 🔍 基本的な使い方

### 新しいワークツリーの作成

```bash
phantom create feature-awesome

phantom list
```

### worktreeで新しいシェルを起動

```bash
phantom shell feature-awesome

# 開発作業を開始

# 作業が終わったらシェルを終了
exit
```

### 任意のworktreeでコマンドを実行

```bash
phantom exec feature-awesome {実行したいコマンド}
# 例: phantom exec feature-awesome npm run build
```

### GitHub風インターフェースでコードをレビュー

```bash
# デフォルトブランチに対してworktreeをレビュー
phantom review feature-awesome

# 特定のブランチに対してレビュー
phantom review feature-awesome --base main

# インタラクティブなworktree選択
phantom review --fzf
```

### 完了したらクリーンアップ

```bash
phantom delete feature-awesome
```


## 📚 ドキュメント

- **[はじめに](./docs/getting-started.md)** - 一般的なワークフローとヒント
- **[コマンドリファレンス](./docs/commands.md)** - すべてのコマンドとオプション
- **[設定](./docs/configuration.md)** - 自動ファイルコピーと作成後コマンドの設定
- **[GitHub統合](./docs/github.md)** - GitHubプルリクエストとイシューの操作
- **[MCP統合](./docs/mcp.md)** - Model Context ProtocolによるAIを活用した並行開発


## 🤝 コントリビュート

コントリビュートは歓迎します！[コントリビューションガイド](./CONTRIBUTING.md)をご覧ください：
- 開発環境のセットアップ
- コードスタイルガイドライン
- テスト要件
- プルリクエストプロセス

## 📄 ライセンス

MIT License - [LICENSE](LICENSE)を参照

## 🙏 謝辞

👻 [@aku11i](https://github.com/aku11i)と[Claude](https://claude.ai)によって作られました
