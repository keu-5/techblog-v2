---
title: "Auth.jsの基礎 (Google OAuthを使用)"
summary: "最新のAuth.jsの使い方をメモ"
tags: ["Next.js", "認証", "Auth.js"]
---

# バージョン

---

```json
"next": "15.1.7",
"next-auth": "^5.0.0-beta.25",
"react": "^19.0.0",
"react-dom": "^19.0.0"
```

# プロジェクト作成

---

App routerを使っていきます．

```bash
$ npx create-next-app@latest
✔ What is your project named? … frontend
✔ Would you like to use TypeScript? … Yes
✔ Would you like to use ESLint? … Yes
✔ Would you like to use Tailwind CSS? … Yes
✔ Would you like your code inside a `src/` directory? … No
✔ Would you like to use App Router? (recommended) … Yes
✔ Would you like to use Turbopack for `next dev`? … Yes
✔ Would you like to customize the import alias (`@/*` by default)? … No
```

## Auth.jsの設定

公式サイトのやり方に則ります．
[Auth.js | Installation](https://authjs.dev/getting-started/installation?framework=next-js)

### パッケージのインストール

```bash
npm install next-auth@beta
```

### シークレットキーの作成

ライブラリがトークンやメール認証用のハッシュを暗号化するために使用するランダムな値を生成し，自動で`.env`あるいは`.env.local`に保存されます．

```bash
$ npx auth secret
📝 Created [プロジェクトの場所].env.local with `AUTH_SECRET`.
```

# アプリの下準備

---

## `Auth.ts`の作成

ここでは使用したい認証プロバイダの指定やコールバックの設定などができます．ここでは単純にgoogleのプロバイダのみを使用します．

```ts
// ./auth.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
});
```

## `routes.ts`の作成

今後セッション管理用の関数を使うために，あらかじめルーティングを設定する必要があります．

```ts
// ./app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth"; // Referring to the auth.ts we just created
export const { GET, POST } = handlers;
```

これを設定すると以下のエンドポイントが自動で作成されます

- `/api/auth/signin`（サインイン）
- `/api/auth/signout`（サインアウト）
- `/api/auth/session`（セッション情報取得）
- `/api/auth/callback/:provider`（OAuth コールバック）
- `/api/auth/csrf`（CSRF トークン取得）

これらが作成されることにより適切にAuth.jsが用意した関数を使用することができるようになります．

## GoogleのOAuthを使う

Google Cloudからプロジェクトを作成し，クライアントIDとシークレットキーを取得する必要があります
https://console.cloud.google.com/

### 認証情報の作成

`ナビゲーションメニュー > APIとサービス > 認証情報`に移動し，`認証情報を作成`します．種類は OAuth クライアント ID を選択してください．

### クライアントIDの設定

OAuth クライアント ID の作成は以下のように設定してください．

- アプリケーションの種類 ... ウェブアプリケーション
- 名前 ... 任意の名前
- 承認済みの JavaScript 生成元 ... http://localhost:3000
- 承認済みのリダイレクト URI ... http://localhost:3000/api/auth/callback/google

> 同意画面を作成していない場合は，事前に作成することを促されます．また作成後，サイトを再読み込みする必要があります．

### `.env.local`の編集

OAuth クライアント IDの作成がうまくいくと，クライアント ID とクライアントシークレットを取得できます．これらを`.env.local`に追加しておきます．

```env
AUTH_GOOGLE_ID={CLIENT_ID}
AUTH_GOOGLE_SECRET={CLIENT_SECRET}
```

# 実装

---

## signin/signoutコンポーネントの作成

### `components/signin.tsx`

今回は，サインインしたのちに`/dashboard`にリダイレクトするようにします．

```tsx
import { signIn } from "@/auth";

export default function SignIn() {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("google", { redirectTo: "/dashboard" });
      }}
    >
      <button
        type="submit"
        className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
      >
        Sign in with Google
      </button>
    </form>
  );
}
```

### `components/signout.tsx`

```tsx
import { signOut } from "@/auth";

export function SignOut() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button
        type="submit"
        className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
      >
        Sign Out
      </button>
    </form>
  );
}
```

## ログイン専用ページの設定

`/dashboard`以下の階層ではログインしないと入れないような仕組みにします．`auth()`からセッション情報を取得し，その内容で`signin`ページにリダイレクトするか，そのままdashboardページを開くか分岐させます．そのために`/dashboard/layout.tsx`を以下のように編集します．

```tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import React from "react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/signin");
  }

  return <>{children}</>;
}
```

## ページコンポーネントでの使用

### `app/signin/page.tsx`

```tsx
import SignIn from "@/components/signin";

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign In</h1>
        <SignIn />
      </div>
    </div>
  );
}
```

### `app/dashboard/page.tsx`

```tsx
import { SignOut } from "@/components/sign-out";

export default function DashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-6 text-center">Dashboard</h1>
        <p className="mb-4 text-center">Welcome to your dashboard!</p>
        <div className="flex justify-center">
          <SignOut />
        </div>
      </div>
    </div>
  );
}
```

# テスト

---

- http://localhost:3000
- http://localhost:3000/signin
- http://localhost:3000/dashboard

これらのページを開いて，それぞれの挙動を確認しましょう．

次回は，バックエンドとの統合について解説していきます．
[Auth.jsとRuby on Railsによるユーザ管理](https://techblog-notes.vercel.app/174f1269-0c19-419b-a9f5-09a691e2f342)
