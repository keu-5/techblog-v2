---
title: "Next.js App routerで，Custom 404 pageにレイアウトを適用させない方法"
summary: "地味に苦労した．日本語の記事がなかったのでつくる"
tags: ["React", "Next.js", "Web", "Webアプリ開発", "個人開発"]
---

`Layout.tsx`は配置されているディレクトリの中身に適用される

→ `not-found.tsx`と`page.tsx`とで違うディレクトリにすれば良い．

→ 普通のディレクトリにいれるとルーティングされるので，論理グループを使う

```txt
app/
    (default_site)/
        /page.tsx
        about/page.tsx
        contact/page.tsx
        layout.tsx
    (error_layout)/
        layout.tsx
        not-found.tsx
components/
utils/
```

このように配置すればいい

参考
[How to remove the Layout on 404 page](https://github.com/vercel/next.js/discussions/37311)
