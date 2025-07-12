# techblog-v2

## 概要

**techblog-v2** は、Next.js (TypeScript) を使ったシンプルな技術ブログアプリケーションです。  
フロントエンドは Next.js App Router 構成、Tailwind CSS を用いてモダンな UI を実現しています。  

---

## 主な機能

- 記事（投稿）の一覧表示・詳細表示
- 記事の新規投稿・編集・削除
- サーバサイドレンダリング (SSR) による高速かつ安全な表示
- 型安全な開発（TypeScript/型定義）
- クリーンなディレクトリ構成とコンポーネント分割

---

## ディレクトリ構成 (一部抜粋)

```
techblog-v2/
├── app/                # Next.js アプリケーション本体
│   ├── page.tsx        # 投稿一覧ページ (SSR)
│   └── posts/
│       ├── [id]/       # 投稿詳細・編集 (動的ルーティング)
│       │   ├── page.tsx
│       │   └── edit-post/
│       │       └── page.tsx
│       └── create-post/
│           └── page.tsx
├── lib/
│   └── types.ts        # 型定義
├── content/
│   └── Next.js/
│       └── next-rails-tutorial.md # 開発手順・詳細解説
├── public/
├── styles/
├── package.json
└── ...
```

---

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 開発サーバ起動

```bash
npm run dev
# または
yarn dev
```

dev環境内で記事データを更新すると自動で再レンダリングされます．

## 技術スタック

- **フロントエンド**: Next.js (TypeScript, App Router), Tailwind CSS
- **スタイリング**: Tailwind CSS
- **型定義**: TypeScript

---

## 参考リンク

- [Next.js 公式ドキュメント](https://nextjs.org/docs)
- [Tailwind CSS ドキュメント](https://tailwindcss.com/docs)

---
