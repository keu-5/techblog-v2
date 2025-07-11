---
title: "Auth.jsとRuby on Railsによるユーザ管理"
summary: "だれも解説してくれないのでメモ"
tags: ["Next.js", "Ruby on Rails", "認証", "Auth.js"]
---

前回の続きです．
[Auth.jsの基礎 (Google OAuthを使用)](https://techblog-notes.vercel.app/afdc23b5-ec55-4c5e-8763-6bc649124448)

# JWT認証の導入

---

今回，Auth.jsにより取得したログイン情報をバックエンドに渡しユーザ管理する手法として以下のプロセスを要します．

1. Googleの認証が成功するとAuth.jsがaccount.id_tokenを受け取る．このID トークンはGoogleが発行するJWTである．
1. account.id_tokenはjwtコールバックで token.idTokenに保存する．
1. セッションにIDトークンを保存する．
1. セッションからIDトークンを取得し，`fetch()`を用いてバックエンドに送信．
1. バックエンドでIDトークンを検証，成功後に初めてデータを処理できる．

このように，結構面倒な処理をする必要があります．(コード自体はそこまで書かない気がする)

## 型定義ファイルを編集する

Auth.jsでは，account.id_tokenは定義されているものの，tokenとsessionにid_tokenは定義されていません．しかしそれでもid_tokenを渡したいので，定義します．

```ts
// types/next-auth.d.ts
import "next-auth/jwt";

declare module "next-auth/jwt" {
  interface JWT {
    idToken?: string;
  }
}

declare module "next-auth" {
  interface Session {
    user: {
      idToken?: string;
    } & DefaultSession["user"];
  }
}
```

> `session.idToken`でいいかなと思っていたけど，V5では`session.user.idToken`にすることが推奨されていたのでこのようにしてます．

## コールバック関数を用意する

```ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.idToken = account.id_token;
      }

      return token;
    },
    async session({ session, token }) {
      session.user.idToken = token.idToken;

      return session;
    },
  },
});
```

こうすることで，`auth()`から`user.idToken`を取得することができるようになります．

## バックエンドにIDトークンを渡す

トークン情報はbodyではなくheaderに含めるのが一般的です．`http://localhost:3001/auth/google`に渡すように設定します．

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

  if (session) {
    const idToken = session.user.idToken;

    if (idToken) {
      await fetch("http://localhost:3001/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });
    }
  } else {
    redirect("/signin");
  }

  return <>{children}</>;
}
```

# バックエンド処理

---

## プロジェクト作成

```bash
rails new backend --api -T
```

### gemのインストール

今回使うgemは以下の通りです．

```ruby
gem 'rack-cors', require: 'rack/cors'
gem "google-id-token"
gem 'dotenv-rails'
```

`bundle install`を忘れずに実行しましょう

### corsの設定

`http://localhost:3000`を許可しましょう

```ruby
# config/initializers/cors.rb
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins "http://localhost:3000"

    resource "*",
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head]
  end
end
```

### ポートの修正

3000番は既にフロント側で使用されているので，バックエンド側は3001番に設定します．

```ruby
# config/puma.rb
port ENV.fetch("PORT", 3001)
```

## モデルの作成

`google_sub`はユーザーごとに一意なIDを示しており，IDトークンの検証時に取得できます(フロントエンドでも取得できる)．

```bash
rails generate model User google_sub:string name:string email:string picture:string
```

`rails db:migrate`を忘れずに実行しましょう

### バリデーションを定義する

作成した`User`モデルの`google_sub`と`email`について，それぞれ必須かつユニークな値にバリデートします．

```ruby
class User < ApplicationRecord
  validates :google_sub, presence: true, uniqueness: true
  validates :email, presence: true, uniqueness: true
end
```

## コントローラの作成

```bash
rails generate controller sessions
```

実行すると，`sessions_controller.rb`が生成されるので，そのファイルを編集していきます．

```ruby
class SessionsController < ApplicationController
  # ライブラリの読み込み
  require "google-id-token"

  def google_auth
    auth_header = request.headers["Authorization"]

    # トークンが存在しない場合、または形式が不正な場合，unauthorizedエラーを返す
    unless auth_header&.start_with?("Bearer ")
      return render json: { error: "Unauthorized" }, status: :unauthorized
    end

    # AuthorizationヘッダーからIDトークンを取り出す
    token = auth_header.split("Bearer ").last

    # トークン検証
    begin
      # IDトークンを検証するためのバリデータを作成
      validator = GoogleIDToken::Validator.new
      payload = validator.check(token, ENV["GOOGLE_CLIENT_ID"])

      sub = payload["sub"]
      email = payload["email"]
      name = payload["name"]
      picture = payload["picture"]

      # ユーザが見つかれば更新，見つからなければ作成
      user = User.find_or_create_by(google_sub: sub) do |u|
        u.name = name
        u.email = email
        u.picture = picture
      end

      render json: { message: "Login successful", user: user }
    rescue StandardError => e
      Rails.logger.error "Google Auth Error: #{e.message}"

      render json: { error: "Invalid ID token" }, status: :unauthorized
    end
  end
end
```

### ルーティングの設定

`auth/google`にアクセスしたときに`SessionsController`クラスの`google_auth`メソッドが実行されるようにルーティングします．

```ruby
Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Defines the root path route ("/")
  # root "posts#index"

  post "auth/google", to: "sessions#google_auth"
end
```

# テスト

実際に`http://localhost:3000`にアクセスし，アカウント作成，ログイン，ログアウトを検証してみましょう．想定通りの挙動がされれば成功です．
