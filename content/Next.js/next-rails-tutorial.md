---
title: "Next.jsとRailsで作るwebアプリ"
summary: "Next.jsとRailsでapi開発の勉強をしたのでここにメモしておきます"
tags: ["Next.js", "webアプリ開発", "Ruby on Rails", "API"]
---

# バックエンド

## railsプロジェクト作成

---

```bash
rails new blog_api --api -T
```

`--api`とすることで，viewなどの余計なファイルの作成がされなくなります．また，`-T`とすると，テスト用のファイルが生成されなくなります．

## gemの追加

---

```ruby
# Gemfile
  gem 'rack-cors', require: 'rack/cors'
```

Next.jsアプリのリクエストを受け付ける際にcorsの設定をする必要があるので，`rack-cors`のgemを追加します．その後，`bundle install`することを忘れないようにしましょう

## rack-corsの設定

---

ここで許可するオリジンを設定しておきましょう

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

## モデル作成

---

データベースに登録したいテーブルのモデルを作ります．

```bash
rails generate model Post title:string content:text
```

この場合，dbには`posts`というテーブルが追加されることになります．

### 作成されるファイル

#### **マイグレーションファイル**

データベースのテーブルを作成するためのファイル．`rails db:migrate`をするとはじめて実行される

```ruby
# db/migrate/20250209064827_create_posts.rb
class CreatePosts < ActiveRecord::Migration[7.2]
  def change
    create_table :posts do |t|
      t.string :title
      t.text :content

      t.timestamps
    end
  end
end
```

> モデルは単数形で一文字目が大文字，テーブルは複数形で全て小文字で記述するのが慣習

#### **モデルファイル**

ここに記述されたクラスを用いて，コントローラなどでデータベースの操作を行う．バリデーションやアソシエーションなどを記述することも可能

```ruby
# app/models/post.rb
class Post < ApplicationRecord
end
```

#### **テストファイル**

今回は`rails new blog_api --api -T`で`-T`オプションを指定しているため，テストファイルは作成されない

#### **シードファイル**

なにも書かれていないが，特にシードデータを追加する必要があれば，`Post.create`を使って初期データを登録することも可能

## マイグレーション

---

```bash
rails db:migrate
```

> `db/schema.rb`にデータベースのスキーマが記述される

## コントローラ作成

---

コントローラは，ユーザからのリクエストを受け取り，適切な処理を行い，レスポンスを返す役割を持ちます．それぞれのコントローラはルーティングを設定することによりリクエストが可能になります．

> **MVCモデルとは**\
> ソフトウェアアーキテクチャの一つ．アプリケーションの構造をmodel, view, controllerの3つに分けることで，コードの整理や保守性を向上させることができる．

### コントローラ作成

```bash
rails generate controller Api::v1::Posts index show create update destroy
```

> コントローラの設定を間違えた場合，`rails destroy controller Api::v1::Posts`で削除できる

#### **作成されるファイル**

##### **コントローラファイル**

コントローラの処理を記述するファイル．`render`メソッドでレスポンスを返す．以下のように記述することで，json形式でデータを返すことができます．

今回は，**投稿一覧**，**特定の投稿**が取得できるコントローラ，投稿内容を**作成**，**編集**，**削除**できるコントローラを作っていきます

```ruby
# app/controllers/api/v1/posts_controller.rb
class Api::V1::PostsController < ApplicationController
  def index
    @posts = Post.all

    render json: @posts
  end

  def show
    @post = Post.find(params[:id])

    render json: @post
  end

  def create
    @post = Post.new(post_params)

    if @post.save
      render json: @post, status: :created
    else
      render json: @post.errors, status: :unprocessable_entity
    end
  end

  def update
    @post = Post.find(params[:id])

    if @post.update(post_params)
      render json: @post
    else
      render json: @post.errors, status: :unprocessable_entity
    end
  end

  def destroy
    @post = Post.find(params[:id])

    @post.destroy
  end

  private

  def post_params
    params.require(:post).permit(:title, :content)
  end
end
```

> `@`がついている変数はインスタンス変数．`:`がついている変数はシンボル．文字列の皮をかぶった整数値 \
> `status: :unprocessable_entity`は辞書 \
> `params` は Rails がリクエストのデータを自動でセットしてくれるオブジェクト

##### **ルーティング**

基本は既に設定されている．`config/routes.rb`で管理をしている

```ruby
# config/routes.rb

Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      resources :posts, only: [:index, :show, :create, :update, :destroy]
    end
  end
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Defines the root path route ("/")
  # root "posts#index"
end
```

> `resources :posts, only: [:index, :show, :create, :update, :destroy]` とすると，これらは暗黙的に以下のルーティングが設定される
> | HTTPメソッド | パス | コントローラ#アクション | 用途 |
> | --- | --- | --- | --- |
> | GET | /posts | posts#index | 一覧表示 |
> | GET | /posts/:id | posts#show | 詳細表示 |
> | POST | /posts | posts#create | 作成 |
> | PUT | /posts/:id | posts#update | 更新 |
> | DELETE | /posts/:id | posts#destroy | 削除 |
>
> これを各コントローラごとに設定することでrestfulなAPIを作成することができる

### テスト

postmanやcurlコマンドを使ってAPIのテストを行う

```bash
curl -X POST -H "Content-Type: application/json" -d '{"post": {"title": "初めての投稿です", "content": "初めての投稿です"}}' http://localhost:3000/api/v1/posts
curl -X POST -H "Content-Type: application/json" -d '{"post": {"title": "2つ目の投稿です", "content": "2つ目の投稿です"}}' http://localhost:3000/api/v1/posts

curl http://localhost:3000/api/v1/posts
curl http://localhost:3000/api/v1/posts/1
curl http://localhost:3000/api/v1/posts/2

curl -X PUT -H "Content-Type: application/json" -d '{"post": {"title": "初めての投稿を更新しました", "content": "初めての投稿を更新しました"}}' http://localhost:3000/api/v1/posts/1
curl -X PUT -H "Content-Type: application/json" -d '{"post": {"title": "2つ目の投稿を更新しました", "content": "2つ目の投稿を更新しました"}}' http://localhost:3000/api/v1/posts/2

curl -X DELETE http://localhost:3000/api/v1/posts/1
curl -X DELETE http://localhost:3000/api/v1/posts/2
```

## ポート番号の変更

```bash
rails s -p 3001
```

> 永続的に変更する場合は`config/puma.rb`を変更する

# フロントエンド

Next.js typescript App router, TailwindCSSを使っていきます．

## プロジェクト作成

---

```bash
npx create-next-app blog_client
```

## 各種コンポーネントの作成

---

### 型定義ファイル

バックエンド開発時に作ったモデルのスキーマと同じにすると良いです．

```typescript
export type Post = {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};
```

### 投稿一覧ページ

#### **一覧ページ**

一覧ページでは，`http://localhost:3000/api/v1/posts`にアクセスすることで，すべての投稿を取得します．各投稿には編集ボタンと削除ボタンを用意し，投稿作成ボタンも用意します．

基本的にはSSRで実装していきますが，フォームなどはクライアント側で処理しないといけないので，それらは別途クライアントコンポーネントとして作成していきます．

> **SSRとは**\
> サーバサイドレンダリングの意．クライアント側ではなくサーバ側で処理を済ますので負荷がかかりにくくセキュリティ面においても安全．

```tsx
// app/page.tsx
import { Post } from "@/lib/types";
import Link from "next/link";
import { DeletePost } from "./_components/delete-post";

export default async function Home() {
  const res = await fetch("http://localhost:3001/api/v1/posts", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const posts: Post[] = await res.json();

  return (
    <div className="container mx-auto p-4 flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-4">Rails & Next.js Blog</h2>

      <Link
        href="/create-post"
        className="text-blue-500 hover:text-blue-700 mb-4"
      >
        Create new Post
      </Link>

      <div className="mt-6 w-full max-w-2xl">
        {posts.map((post) => (
          <div
            key={post.id}
            className="border border-gray-300 rounded-lg p-4 mb-4 shadow-md"
          >
            <Link
              href={`posts/${post.id}`}
              className="text-xl font-semibold text-blue-600 hover:text-blue-800"
            >
              {post.title}
            </Link>

            <p className="text-gray-700 mt-2">{post.content}</p>

            <div className="flex justify-end mt-4">
              <Link
                href={`posts/${post.id}/edit-post`}
                className="text-sm text-white bg-blue-500 hover:bg-blue-700 py-1 px-2 rounded mr-2"
              >
                Edit
              </Link>

              <DeletePost id={post.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### **削除コンポーネント**

こちらはonClickをクライアント側で発火させなければならないため，`use client`を追加し，クライアントコンポーネントにします．

```tsx
// app/_components/delete-post.tsx
"use client";

export const DeletePost = ({ id }: { id: number }) => {
  const handleDelete = async (id: number) => {
    const res = await fetch(`http://localhost:3001/api/v1/posts/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (res.ok) {
      alert("Post deleted");
    } else {
      alert("Failed to delete post");
    }
  };

  return (
    <button
      onClick={() => handleDelete(id)}
      className="text-sm text-white bg-red-500 hover:bg-red-700 py-1 px-2 rounded"
    >
      Delete
    </button>
  );
};
```

### 投稿詳細ページ

こちらでは，動的ルーティングを用いてidを取得し，対象の投稿を取得して表示します．

```tsx
// app/posts/[id]/page.tsx
import { Post } from "@/lib/types";
import Link from "next/link";

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await fetch(`http://localhost:3001/api/v1/posts/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const post: Post = await res.json();

  return (
    <div className="container mx-auto p-4 flex flex-col items-center">
      <div className="w-full max-w-2xl p-4">
        <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
        <div className="text-gray-500 mb-4">{post.created_at}</div>
        <p className="text-gray-700">{post.content}</p>
        <Link href="/" className="text-blue-500 hover:text-blue-700">
          投稿一覧に戻る
        </Link>
      </div>
    </div>
  );
}
```

### 投稿作成ページ

こちらは，クライアント側がフォームを編集しなければならないので，クライアントコンポーネントにします．

```tsx
// app/create-post/page.tsx
"use client";

import Link from "next/link";
import { redirect } from "next/navigation";

export default function CreatePage() {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;

    const res = await fetch("http://localhost:3001/api/v1/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: title,
        content: content,
      }),
    });

    if (res.ok) {
      redirect("/");
    } else {
      alert("Failed to create post");
    }
  };

  return (
    <div className="container mx-auto p-4 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">ブログ新規登録</h1>

        <form className="w-full" onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              タイトル
            </label>
            <input
              name="title"
              type="text"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              本文
            </label>
            <textarea
              name="content"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              投稿
            </button>
            <Link href="/" className="text-blue-500 hover:text-blue-700">
              キャンセル
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### 投稿編集ページ

#### **編集ページ**

こちらは，パラメータを受け取るためにSSRし，編集ができるクライアントコンポーネントを渡しておきます

```tsx
import { Post } from "@/lib/types";
import { EditForm } from "./_components/form";

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await fetch(`http://localhost:3001/api/v1/posts/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const post: Post = await res.json();

  return <EditForm post={post} />;
}
```

#### **編集フォーム**

```tsx
"use client";

import { Post } from "@/lib/types";
import Link from "next/link";
import { redirect } from "next/navigation";

export const EditForm = ({ post }: { post: Post }) => {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;

    const res = await fetch(`http://localhost:3001/api/v1/posts/${post.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: title,
        content: content,
      }),
    });

    if (res.ok) {
      redirect(`/posts/${post.id}`);
    } else {
      alert("Failed to update post");
    }
  };

  return (
    <div className="container mx-auto p-4 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">ブログ編集</h1>

        <form className="w-full" onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              タイトル
            </label>
            <input
              name="title"
              type="text"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              defaultValue={post.title}
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              本文
            </label>
            <textarea
              name="content"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              defaultValue={post.content}
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              更新
            </button>
            <Link
              href={`/posts/${post.id}`}
              className="text-blue-500 hover:text-blue-700"
            >
              キャンセル
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
```
