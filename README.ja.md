# 👻 Phantom

<div align="center">

**Git worktreeを使ったシームレスな並行開発のためのパワフルなCLIツール**

[![npm version](https://img.shields.io/npm/v/@aku11i/phantom.svg)](https://www.npmjs.com/package/@aku11i/phantom)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/@aku11i/phantom.svg)](https://nodejs.org)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/aku11i/phantom)

[English](./README.md) • [はじめに](./docs/getting-started.md) • [コマンド](./docs/commands.md) • [設定](./docs/configuration.md) • [統合](./docs/integrations.md)

</div>

## ✨ Phantomとは？

Phantomは、Git worktreeをシンプルかつパワフルに操り、開発生産性を飛躍的に向上させるCLIツールです。複数のタスクを独立した作業環境で同時進行し、真のマルチタスク開発を実現します。AIエージェントを用いた並行開発に対応した次世代の並行開発ツールです。

### 主な機能

- 🚀 **シンプルなWorktree管理** - 直感的なコマンドでGit worktreeを作成・管理
- 🔄 **真のマルチタスク** - ブランチ毎に作業ディレクトリを作成し、複数のタスクを同時進行
- 🎯 **どこからでもコマンド実行** - `phantom exec <worktree> <command>`でワークツリーに対してコマンドを実行可能
- 🪟 **組み込みtmux統合** - ワークツリーを新しいペインやウィンドウで開きます
- 🔍 **fzfによるインタラクティブな選択** - worktreeの選択に組み込みのfzfオプションを使用できます
- 🎮 **シェル補完** - FishとZshの完全な自動補完サポート
- ⚡ **ゼロ依存** - 高速で軽量

## 🚀 クイックスタート

### インストール

#### Homebrewを使用（推奨）

```bash
brew install aku11i/tap/phantom
```

#### npmを使用

```bash
npm install -g @aku11i/phantom
```


### 基本的な使い方

```bash
# 新しい機能ブランチを独自のworktreeに作成
phantom create feature-awesome

# worktreeで新しいシェルを起動
phantom shell feature-awesome

# どこからでも任意のworktreeでコマンドを実行
phantom exec feature-awesome npm test

# 完了したらクリーンアップ
phantom delete feature-awesome
```


## 📚 ドキュメント

- **[はじめに](./docs/getting-started.md)** - 一般的なワークフローとヒント
- **[コマンドリファレンス](./docs/commands.md)** - すべてのコマンドとオプション
- **[設定](./docs/configuration.md)** - 自動ファイルコピーと作成後コマンドの設定
- **[統合](./docs/integrations.md)** - tmux、fzf、エディタなど

## 🤔 なぜPhantom？

Git worktreeは強力ですが、パスとブランチの手動管理が必要です。Phantomはこの摩擦を解消します：

```bash
# Phantomなし
git worktree add -b feature-awesome ../project-feature-awesome origin/main
cd ../project-feature-awesome

# Phantomあり
phantom create feature-awesome --shell
```

### Phantomの仕組み

`phantom create feature-awesome`を実行すると：
1. `.git/phantom/feature-awesome/`ディレクトリが自動作成されます
2. ブランチ名と同じ名前のworktreeがこの場所に作成されます
3. すべてのworktreeが`.git/phantom/`配下で一元管理されます

```
your-project/
├── .git/
│   └── phantom/              # Phantomが管理するディレクトリ
│       ├── feature-awesome/  # ブランチ名 = worktree名
│       ├── bugfix-login/     # 別のworktree
│       └── hotfix-critical/  # さらに別のworktree
├── src/                      # メインのworktree（通常はmainブランチ）
├── package.json
└── ...
```

この規約により、worktreeの場所を覚える必要がなくなり、`phantom shell`や`phantom exec`でブランチ名だけで簡単にアクセスできます。

以下に最適：
- 複数の機能を同時に作業
- 作業を中断せずにPRレビュー
- アプリの異なるバージョンを並行実行
- 開発中も`main` worktreeをクリーンに保つ

## 🤝 コントリビュート

コントリビュートは歓迎します！[コントリビューションガイド](./contributing/CONTRIBUTING.md)をご覧ください：
- 開発環境のセットアップ
- コードスタイルガイドライン
- テスト要件
- プルリクエストプロセス

## 📄 ライセンス

MIT License - [LICENSE](LICENSE)を参照

## 🙏 謝辞

👻 [@aku11i](https://github.com/aku11i)と[Claude](https://claude.ai)によって作られました

---

<div align="center">
<a href="https://github.com/aku11i/phantom/issues">バグ報告</a> • 
<a href="https://github.com/aku11i/phantom/issues">機能リクエスト</a> •
<a href="https://github.com/aku11i/phantom/discussions">ディスカッション</a>
</div>