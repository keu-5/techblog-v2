---
title: "CSSの基礎"
summary: "HTMLをかっこいいデザインにする！"
tags: ["Web", "CSS", "HTML", "基礎"]
---

# コードを書くための準備

---

## 開発環境がない場合

1. ブラウザで _code pen_ と検索
   [CodePen: Online Code Editor and Front End Web Developer ...](https://codepen.io/)
1. 一番上のサイトを開く
1. 左側にある「Start Coding」を押す
1. htmlとcssを試すことができる！

# HTMLとは

1. **Hyper Text Markup Language**の略
1. 文章を書きウェブサイトに上げることができる
1. 「タグ」によって文字に役割を与えることができる
1. デザインを変えたり，動きを与えることはHTMLだけではほぼ不可能

```HTML
<!DOCTYPE html>
<html>
  <head>
    <title>My First HTML</title>
  </head>
  <body>
    <h1>My First Heading</h1>
    <p>My first paragraph.</p>
    <a href="#">This is a link</a>
  </body>
</html>
```

## タグの種類

| タグ            | 概要                                             |
| --------------- | ------------------------------------------------ |
| `<html></html>` | htmlの外殻                                       |
| `<head></head>` | ウェブサイトのタイトルや文字コードなど決める場所 |
| `<body></body>` | サイトの内容を書く場所                           |
| `<h1></h1>`     | 見出し                                           |

ほかにもめちゃくちゃある！

# CSSとは

---

1. **Cascading Style Sheets** の略
1. HTMLにデザインを指定できる

# ボックスモデルを知ろう！

---

## WEBページはブロックの集まり

### ボックスモデルとは？

HTMLの要素はすべて四角形の領域で構成されているという考え方

### ページの構造

WEBサイトはボックスを並べたり，格納したり，重ねているだけ

### ブロックとインライン

ボックスはブロックボックスとインラインボックスに分けられる (詳しくは別の回で)

## 開発者ツールでページの構造を見てみよう！

1. webページを開く
   [https://google.com](https://google.com)
1. `f12`キーを押す
1. ごちゃごちゃした画面が出てきたら成功！

## 明示的にボックスをつくろう！

`<div>`タグは子要素をグループ化してくれるよ！

```HTML
<!DOCTYPE html>
<html lang="ja">

  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>○○テック講座</title>
  </head>

  <body>

    <div>
      <h1>○○テック講座</h1>
      <p>Webサイトをつくろう！</p>
    </div>

    <div>
      <h2>活動内容</h2>
      <div>
        <div>
          <p>1. HTMLとCSSの基本を学ぶ</p>
          <p>2. レスポンシブデザインを作成する</p>
        </div>
        <div>
          <p>3. JavaScriptを使ったインタラクティブな機能を実装する</p>
          <p>4. GitとGitHubの使い方を習得する</p>
        </div>
      </div>
      <div>
        <div>
          <p>5. Rubyを学び、Webアプリケーションを作成する</p>
          <p>6. チーム開発を体験する</p>
        </div>
        <div>
          <p>7. ポートフォリオを作成する</p>
          <p>8. もくもく会を開催する</p>
        </div>
    </div>

    <div>
      <div>
        <h3>チームメンバー</h3>
        <div>
          <p>メンバー1: 山田太郎</p>
          <p>メンバー2: 佐藤花子</p>
        </div>
        <div>
          <p>メンバー3: 鈴木一郎</p>
          <p>メンバー4: 中村幸子</p>
        </div>
      </div>
      <div>
        <h3>お問い合わせ</h3>
        <div>
          <p>メール: contact@example.com</p>
          <p>電話: 03-1234-5678</p>
        </div>
      </div>
    </div>

  </body>

</html>
```

開発者ツールで以下の二点を確認しよう！

- divタグは普通目には見えない
- divタグによってグループ化されている

# 要素に名前をつけよう！

---

## 要素に名前をつけるって？？

要素を並べるときに，

- 「同じタグを区別できるようにしたい」
- 「他とは違う要素だと示したい」
- 「要素をグループに分けたい」
- 「名前をつけて読みやすくしたい」

などの場合に，名前を付けます．つけた名前は，CSSやJavaScriptで使うことができます．その要素だけが持つ「id」と所属グループを示す「class」を指定することができます．

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My First HTML</title>
  </head>
  <body>
    <div id="title">
      {/*idを指定*/}
      <h1>My First HTML</h1>
      <p>Welcome to my first HTML page.</p>
    </div>
    <div id="foods" class="menu">
      {/*idとclassを指定*/}
      <h2>My Favorite Foods</h2>
      <ul>
        <li>Pizza</li>
        <li>Ice Cream</li>
        <li>Chocolate</li>
      </ul>
    </div>
    <div id="movies" class="menu">
      {/*idとclassを指定*/}
      <h2>My Favorite Movies</h2>
      <ol>
        <li>Star Wars</li>
        <li>Indiana Jones</li>
        <li>Back to the Future</li>
      </ol>
    </div>
  </body>
</html>
```

## idとclassの違い

### class

```html
<要素名 class=“クラス名”>
```

ほかの要素にも同じクラス名をつけてよい．グループ化をするのが主な目的

### id

```html
<要素名 id=“id”>
```

classとは違い一意の値でなければならないという規則がある

## 各要素に名前をつけよう

```html
<!DOCTYPE html>
<html lang="ja">

  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>○○テック講座</title>
    <link rel="stylesheet" href="stylesheet.css">
  </head>

  <body>

    <div id="header">
      <h1>○○テック講座</h1>
      <p>Webサイトをつくろう！</p>
    </div>

    <div id="activities">
      <h2>活動内容</h2>
      <div id="first-semister" class="activity-list">
        <div>
          <p>1. HTMLとCSSの基本を学ぶ</p>
          <p>2. レスポンシブデザインを作成する</p>
        </div>
        <div>
          <p>3. JavaScriptを使ったインタラクティブな機能を実装する</p>
          <p>4. GitとGitHubの使い方を習得する</p>
        </div>
      </div>
      <div id="second-semister" class="activity-list">
        <div>
          <p>5. Rubyを学び、Webアプリケーションを作成する</p>
          <p>6. チーム開発を体験する</p>
        </div>
        <div>
          <p>7. ポートフォリオを作成する</p>
          <p>8. もくもく会を開催する</p>
        </div>
    </div>

    <div id="team-contact">
      <div class="team-section">
        <h3>チームメンバー</h3>
        <div>
          <p>メンバー1: 山田太郎</p>
          <p>メンバー2: 佐藤花子</p>
        </div>
        <div>
          <p>メンバー3: 鈴木一郎</p>
          <p>メンバー4: 中村幸子</p>
        </div>
      </div>
      <div class="contact-section">
        <h3>お問い合わせ</h3>
        <div>
          <p>メール: contact@example.com</p>
          <p>電話: 03-1234-5678</p>
        </div>
      </div>
    </div>

  </body>

</html>
```

できあがったらLive-serverでサイトを立ち上げ，f12で探索しよう！
開発者ツールで以下の一点を確認しよう！

- 「elements」タブに表示される各要素に名前が設定されている

# CSSの書き方

---

## 三種類の書き方

### インラインスタイル

特定の要素に対して直接スタイルを指定する手法

直感的だが，同じコードを何度も書く必要がある場合が存在する

### 内部スタイルシート

HTMLファイルの中にCSSを書く欄を設け，セレクタによってスタイルを割り当てる手法．

外部ファイルがいらないが，ほかのページでコードの再利用ができない

### 外部スタイルシート

CSSを記述するファイルを用意し，セレクタによってスタイルを割り当てる手法．

スタイルの共通化ができ，管理もしやすい

## 基本文法

1. セレクタで対象の要素を指定する
1. プロパティで設定したいスタイルを指定する
1. バリューでスタイルの数値を適用する

## セレクタによる要素の指定方法例

| セレクタ                      | 構文例                 | 概要                                   |
| ----------------------------- | ---------------------- | -------------------------------------- |
| 要素セレクタ                  | `div`                  | 指定のタグを持つ要素に適用             |
| クラスセレクタ                | `.hogeHope`            | 指定のクラスを持つ要素に適用           |
| IDセレクタ                    | `#fuga_fuga`           | 指定のIDを持つ要素に適用               |
| IDセレクタ and クラスセレクタ | `#fuga_fuga .hogeHope` | 親要素が指定された中の指定クラスに適用 |
| 要素セレクタ or 要素セレクタ  | `div, h1`              | 複数種類のタグに適用                   |

ほかにもたくさんのセレクト手法があるよ！

## プロパティの例

| グループ     | プロパティ         | 概要                               |
| ------------ | ------------------ | ---------------------------------- |
| テキスト関連 | `color`            | テキストの色を変更する             |
|              | `font-size`        | テキストのサイズを変更する         |
|              | `text-align`       | 左揃え、中央揃え、右揃えを指定する |
| ボックス関連 | `padding`          | ボックス内側の余白の幅を指定する   |
|              | `margin`           | ボックス外側の余白の幅を指定する   |
|              | `border`           | ボックスの枠線を設定する           |
| 背景関連     | `background-color` | 背景色を変更する                   |
| 配置関連     | `display`          | 横並びにしたり縦並びにしたりする   |

ほかにもたくさんのプロパティがあるよ！

## バリューの例

| グループ | バリュー例       | 概要                                                   |
| -------- | ---------------- | ------------------------------------------------------ |
| サイズ   | `1024px`         | 1ピクセル=0.26mm                                       |
|          | `16rem`          | 1rem=ルートの要素のテキストサイズ（推奨）              |
|          | `100vw, 100vh`   | 100vw=横幅のサイズ、100vh=縦幅のサイズ                 |
| 色       | `red`            | 名前                                                   |
|          | `#ff0000`        | 16進数                                                 |
|          | `rgb(255, 0, 0)` | rgb表現                                                |
| その他   | `flex`           | `display: flex`のように使う。子要素を横並びにできる    |
| 配置関連 | `none`           | `border: none`のように使う。枠線を取り消すことができる |

ほかにもたくさんのバリューがあるよ！

# CSSを適用する一連の流れ

一旦整理しよう

---

## 1. index.htmlを書く

1. head部分など基盤を作る
1. body内に表示する内容を書く
1. 適宜classやidを要素に与える
1. 今回はさっき作ったhtmlファイルを使っちゃおう！

## 2. cssファイルを置く，index.htmlでcssファイルを指定する

1. index.htmlと同じ場所に「stylesheet.css」を配置！
1. 次に，index.htmlファイルを開く
1. `<head>`内に`<link rel=“stylesheet” href=“stylesheet.css”>`を追加！

```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>○○テック講座</title>
  <link rel="stylesheet" href="stylesheet.css" />
</head>
```

これでhtmlファイルとcssをつなげることができた！

## 3. cssコードを書く

1.  セレクタを使って適用する要素を指定する
1.  プロパティを書き，デザインする
1.  セレクタ×プロパティの組を並べていく

ひとまずbody要素にcssを適用して，どのようにデザインが変わるか確認してみよう！

```css
body {
  font-family: Arial, sans-serif; /*フォントを指定*/
  line-height: 1.6; /*行間を1.6倍に*/
  margin: 0; /*ページの外側の余白を0に*/
  padding: 0; /*ページの内側の余白を0に*/
  background-color: #f9f9f9; /*背景色を指定*/
  color: #333; /*文字色を指定*/
}
```

> CSSは覚えようとすると頭爆発します．実践あるのみ！

# 4. 演習

説明していないセレクタやプロパティなどがたくさん出てくるのでぜひ調べながら書いてください！

---

## 現時点のhtmlコード

```html
<!DOCTYPE html>
<html lang="ja">

  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>○○テック講座</title>
    <link rel="stylesheet" href="stylesheet.css">
  </head>

  <body>

    <div id="header">
      <h1>○○テック講座</h1>
      <p>Webサイトをつくろう！</p>
    </div>

    <div id="activities">
      <h2>活動内容</h2>
      <div id="first-semister" class="activity-list">
        <div>
          <p>1. HTMLとCSSの基本を学ぶ</p>
          <p>2. レスポンシブデザインを作成する</p>
        </div>
        <div>
          <p>3. JavaScriptを使ったインタラクティブな機能を実装する</p>
          <p>4. GitとGitHubの使い方を習得する</p>
        </div>
      </div>
      <div id="second-semister" class="activity-list">
        <div>
          <p>5. Rubyを学び、Webアプリケーションを作成する</p>
          <p>6. チーム開発を体験する</p>
        </div>
        <div>
          <p>7. ポートフォリオを作成する</p>
          <p>8. もくもく会を開催する</p>
        </div>
    </div>

    <div id="team-contact">
      <div class="team-section">
        <h3>チームメンバー</h3>
        <div>
          <p>メンバー1: 山田太郎</p>
          <p>メンバー2: 佐藤花子</p>
        </div>
        <div>
          <p>メンバー3: 鈴木一郎</p>
          <p>メンバー4: 中村幸子</p>
        </div>
      </div>
      <div class="contact-section">
        <h3>お問い合わせ</h3>
        <div>
          <p>メール: contact@example.com</p>
          <p>電話: 03-1234-5678</p>
        </div>
      </div>
    </div>

  </body>

</html>
```

## タグに対するスタイリング

各タグに対し適用

```CSS
body {
  font-family: Arial, sans-serif; /*フォントを指定*/
  line-height: 1.6; /*行間を1.6倍に*/
  margin: 0; /*ページの外側の余白を0に*/
  padding: 0; /*ページの内側の余白を0に*/
  background-color: #f9f9f9; /*背景色を指定*/
  color: #333; /*文字色を指定*/
}

div {
  padding: 20px; /*要素の内側の余白を20pxに*/
  max-width: 800px; /*要素の最大幅を800pxに*/
  margin: 20px auto; /*要素を中央寄せに*/
  background-color: #fff; /*背景色を指定*/
  border-radius: 8px; /*角丸を8pxに*/
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) /*影を指定*/;
}

h1, h2, h3 { /*h1, h2, h3タグを指定*/
  color: #444; /*見出しの文字色を指定*/
}

h1 {
  font-size: 2.5em; /*見出しの文字サイズを2.5emに*/
  margin-bottom: 10px; /*見出しの下の余白を10pxに*/
}

h2 {
  font-size: 1.8em; /*見出しの文字サイズを1.8emに*/
  margin-top: 20px; /*見出しの上の余白を20pxに*/
  border-bottom: 2px solid #e1e1e1; /*見出しの下に2pxの線を引く*/
  padding-bottom: 5px; /*見出しの下の余白を5pxに*/
}

h3 {
  font-size: 1.5em; /*見出しの文字サイズを1.5emに*/
  margin-top: 15px; /*見出しの上の余白を15pxに*/
}
```

## idに対するスタイリング

各idやそれに付随するクラス，タグに対し適用

```css
#header {
  text-align: center; /*テキストを中央寄せに*/
}

#header p {
  /*親要素のidがheaderであるpタグを指定*/
  font-size: 1.2em; /*文字サイズを1.2emに*/
  color: #555; /*文字色を指定*/
  margin-top: 5px; /*上の余白を5pxに*/
}

#activities {
  margin-top: 30px; /*上の余白を30pxに*/
}

#activities .activity-list div {
  /* 親要素のidがactivitiesで、クラスがactivity-listのdivタグを指定 */
  margin-bottom: 15px; /*下の余白を15pxに*/
}

#activities .activity-list p {
  /* 親要素のidがactivitiesで、クラスがactivity-listのpタグを指定 */
  padding-left: 15px; /*左の余白を15pxに*/
  text-indent: -15px; /*テキストを左に15pxずらす*/
  list-style: inside disc; /*リストのマーカーを指定*/
}

#team-contact {
  /*idがteam-contactの要素を指定*/
  display: flex; /*要素を横並びに*/
  flex-wrap: wrap; /*要素を折り返し表示*/
  gap: 20px; /*要素間の間隔を20pxに*/
}
```

## クラスに対するスタイリング

各クラスやそれに付随するタグに対し適用

```css
.team-section,
.contact-section {
  /*クラスがteam-section、contact-sectionの要素を指定*/
  flex: 1; /*要素を均等に広げる*/
  min-width: 200px; /*要素の最小幅を200pxに*/
}

.team-section div,
.contact-section div {
  /*クラスがteam-section、contact-sectionのdivタグを指定*/
  margin-bottom: 10px; /*下の余白を10pxに*/
}

.team-section p,
.contact-section p {
  /*クラスがteam-section、contact-sectionのpタグを指定*/
  margin: 8px 0; /*上下の余白を8pxに*/
}

.contact-section {
  background-color: #eef6f9; /*背景色を指定*/
  border-left: 4px solid #0aa; /*左側に4pxの線を引く*/
}
```

> ひとつのブロックを設定するごとに，どのようにデザインが変わったか確認してみましょう
>
> \
> コメントは書いても書かなくてもよいです

完成したら確認しましょう！

# まとめ

とりあえず

1. `index.html`を作りタグを駆使して文章を書く
1. `head`内に`<link rel="stylesheet" href="stylesheet.css">`を追加する
1. 同じディレクトリに`stylesheet.css`を作る
1. `stylesheet.css`でデザインを指定する

このプロセスさえわかれば十分です！お疲れさまでした！
