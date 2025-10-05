---
title: "Python × Docker × uvで再現性のある環境構築を実現する"
summary: "Python開発でよく問題になる .venv と Docker の関係を整理し、uv sync を使って安全かつ再現性のある環境を構築する方法を解説します。"
tags: ["Python", "Docker", "uv", "開発環境", "再現性"]
---

## 🧭 1. はじめに

Python で開発していると、**`.venv` の扱いに迷う**ことってありませんか？
特に Docker と組み合わせたとき、
「ローカルの `.venv` を使うべきか？」「コンテナ内で作るべきか？」
といった問題に一度はぶつかると思います。

一見どちらでも動くように見えますが、実際には **ビルドの再現性が大きく崩れる**ポイントです。
ホスト（macOSなど）とコンテナ（Linux）では Python のバイナリ依存関係が異なるため、
同じ `.venv` を共有してしまうと「ImportError」「libが見つからない」などの微妙な不具合を生みます。

---

この問題は Node.js ではあまり起こりません。
`node_modules` は OS に依存しない JavaScript のパッケージ群であり、
`npm install` や `pnpm install` は常に 0 から再現的に構築される設計です。
一方、Python の `.venv` は **ホストのPython実行環境を基盤に構築される**ため、
環境をまたいで使うとその前提が崩れてしまいます。

---

この記事では、この問題を根本から整理しながら、

- Docker と `.venv` の構造的な関係
- `uv sync --frozen` を使った再現性のある構築方法
- `.dockerignore` による最小・安全な解決策

を順に紹介します。

---

次章ではまず、**Dockerとvenvの構造的な衝突**について掘り下げます。
「なぜNode.jsでは動くのにPythonでは壊れるのか？」
この疑問を整理することで、環境構築の理解が一段深まります。

---

## 2. Docker と venv の構造的な問題

Python のプロジェクトでは、依存関係を分離するために **`venv`（仮想環境）** を使うのが一般的です。
一方、Docker も「環境の隔離」を目的とする仕組みであるため、**`venv` と Docker が重複して環境を管理しようとする** 状況がよく起こります。

この章では、なぜ `.venv` が Docker と相性が悪いのかを構造的に整理します。

---

### 🔹 COPY と Volume の違い

まず前提として、**`COPY` はビルド時にホストのファイルをコンテナイメージへコピー**し、
**`volume`（ボリューム）は実行時にホストや匿名領域をコンテナへマウント**する仕組みです。

```dockerfile
# COPY：ビルド時にホスト → イメージ
COPY backend/ .

# volumes：実行時にホスト or 匿名領域 → コンテナ
volumes:
  - ../backend:/app
  - /app/__pycache__
```

つまり、ビルド時点で `.venv` がホストに存在すると、
**`COPY` によってそのままイメージ内部に取り込まれてしまう** というのが本質的な問題です。

---

### 🔹 匿名ボリュームとバインドマウントの違い

- **バインドマウント**：`../backend:/app` のように、ホスト側ディレクトリを直接コンテナに同期。
  → 開発時には便利だが、ホストの `.venv` など OS 依存ファイルまで引きずり込む可能性がある。

- **匿名ボリューム**：`/app/.venv` のように、名前のない一時領域をDockerが自動生成。
  → コンテナごとに分離されるため、ホストとの直接同期は行われない。

一見すると匿名ボリュームのほうが安全そうですが、
実際には **「ビルド時点ですでに .venv が COPY されている」** ため、
ランタイムで匿名ボリュームを使っても `.venv` の混入を防げないのです。

---

### 🔹 なぜ .venv をマウントすると危険なのか

`.venv` は OS やアーキテクチャに依存するネイティブバイナリを含みます。
たとえば macOS 上で作成された仮想環境を Linux コンテナにマウントすると、
リンク先の `.so`（共有ライブラリ）が対応しておらず、次のようなエラーが発生します。

```bash
ImportError: /app/.venv/lib/python3.13/site-packages/psycopg2/_psycopg.so: ELF load command address/offset not properly aligned
```

このように、**ホストとコンテナの `.venv` が混ざると再現性を失う**ため、
Docker 環境では `.venv` をコピー・マウントしないのが原則です。

---

### 🔹 .dockerignore が果たす本当の役割

この問題を根本から防ぐには、**ビルドコンテキストに `.venv` を含めない**ことです。
Dockerfile の設計や volume 設定をどれだけ工夫しても、
ホスト側から `.venv` が送信されれば問題は発生します。

そこで使うのが `.dockerignore`：

```bash
# .dockerignore
backend/.venv
```

こうしておくと、`docker build` 時に `.venv` が **送信対象から完全に除外** され、
イメージに混入するリスクをゼロにできます。
これが最もシンプルで確実な対策です。

---

✅ **まとめ**

- `COPY` はビルド時点で `.venv` を持ち込む可能性がある
- 匿名ボリュームは実行時の同期防止には有効だが、ビルド時点では無力
- `.venv` は OS 依存のため、マウントすると再現性を失う
- `.dockerignore` に追加しておくのが最も確実な防御策

---

## 3. uv の仕組みを理解する

`uv` は、Python の依存関係を**宣言的に・再現性高く**管理するための次世代ツールです。
`pip` や `pipenv` と異なり、`uv` は **pyproject.toml と uv.lock** をもとに、
依存環境を即時に同期（sync）する仕組みを持っています。

---

### 🔹 uv sync の動作 — 0 ベースか、差分か

`uv sync` コマンドは、プロジェクトディレクトリに `.venv` が存在するかどうかで挙動が変わります。

| 状況                      | 動作                                                                                   | 結果                            |
| ------------------------- | -------------------------------------------------------------------------------------- | ------------------------------- |
| `.venv` が **存在しない** | 新しい仮想環境を作成し、`uv.lock` に記載されたすべてのパッケージをクリーンインストール | ✅ **完全再現（0ベース）**      |
| `.venv` が **存在する**   | 既存の環境を再利用しつつ、`uv.lock` と差分を取って更新                                 | ⚠️ **整合性が崩れる可能性あり** |

つまり、`.venv` をホストからコピーしてしまうと、
`uv sync` は「すでに存在する環境を更新するだけ」と判断し、
古いバイナリや OS 依存ライブラリがそのまま残る可能性があります。

このため、Docker の中では「**.venvを含めず、常に0からsyncする**」のが再現性の鍵です。

---

### 🔹 pyproject.toml と uv.lock の関係

`uv` の依存管理構造は、Node.js のパッケージ管理と非常に似ています。

| Python (uv)      | Node.js (pnpm/npm/yarn)                | 役割                           |
| ---------------- | -------------------------------------- | ------------------------------ |
| `pyproject.toml` | `package.json`                         | 依存関係の宣言（人が編集する） |
| `uv.lock`        | `pnpm-lock.yaml` / `package-lock.json` | 依存関係の固定（マシンが生成） |

つまり `uv.lock` が存在すれば、`.venv` がなくても
**同一バージョン・同一依存構成の環境を100%再現**できます。

```bash
# 完全再現構築（Dockerfile内などで）
uv sync --frozen
```

`--frozen` は、「`uv.lock` に記載されていない変更を一切許可しない」オプションです。
これにより、CI/CD や Docker ビルド時に開発環境との差異を防げます。

---

### 🔹 なぜ uv なら .venv を捨ててもいいのか

従来の `pip install -r requirements.txt` では、
依存関係の解決が実行環境ごとに微妙に異なり、
再現性を保証するのが難しい問題がありました。

`uv` は依存ツリーを完全に固定した状態で `.venv` を生成するため、
**ビルドするたびに同じ環境が再現される**よう設計されています。
そのため、`.venv` を Docker に含める必要はまったくありません。

---

### ✅ まとめ

- `.venv` がない場合は **0ベースでクリーン構築**
- `.venv` がある場合は **差分同期** となり再現性を損なう可能性あり
- `pyproject.toml` ＋ `uv.lock` があれば、環境を完全に再現可能
- `uv sync --frozen` は CI/CD や Docker での再現性確保に必須

---

了解。ここは「理論から実装へ」つなぐ章だね。
章 3 で「なぜ `.venv` を捨てるのか」が明確になったので、ここでは
「どうやってそれをDockerで実現するか」を、**段階的に＋実用的に**まとめる👇

---

## 4. 実際の Docker 構成例

ここでは、実際に **Python + uv + Docker** を使って
「ホストと分離された再現性のある環境」を構築する例を紹介します。

---

### 🔹 4.1 最小構成の Dockerfile.dev

まずは最小限の構成から見てみましょう。

```dockerfile
# ./deploy/backend/Dockerfile.dev
FROM python:3.13-slim

# Python設定（.pycを作らない・バッファ無効）
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# uvをインストール
RUN pip install --no-cache-dir uv

# 依存関係の同期（まずpyproject.tomlとuv.lockだけをコピー）
COPY backend/pyproject.toml backend/uv.lock* ./
RUN apt-get update && apt-get install -y --no-install-recommends pkg-config libmariadb-dev libmariadb-dev-compat build-essential \
    && rm -rf /var/lib/apt/lists/*
RUN uv sync --frozen  # ここで.venvが生成される

# アプリ本体をコピー
COPY backend/ .

CMD ["uv", "run", "python", "manage.py", "runserver", "0.0.0.0:8000"]
```

### ✅ 解説

- `COPY backend/pyproject.toml backend/uv.lock* ./`
  → 依存ファイルだけを先にコピーすることで、コード更新時に依存再インストールを避ける。
- `uv sync --frozen`
  → `.venv` が存在しなければ新規作成、あれば差分更新。
  Docker ビルドでは毎回新しいイメージ上で実行されるため、**常に0ベース構築**。
- `.dockerignore` に `.venv` を含めておくことで、
  ホストにある既存 `.venv` が誤ってビルドコンテキストに含まれるのを防ぐ。

---

### 🔹 4.2 .dockerignore の正しい書き方

```bash
# .dockerignore
backend/.venv
frontend/node_modules
.git
.DS_Store
```

これでホスト上の `.venv` をイメージに含めるリスクを完全に排除できます。
（`.git` を除外しておくのも一般的です。）

---

### 🔹 4.3 docker-compose.dev.yml の volume 設計

フロントエンドの構成と比較して、Python 側でも匿名ボリュームを設定することで
ホストの `.venv` がマウントされないようにできます。

```yaml
services:
  backend:
    build:
      context: ..
      dockerfile: deploy/backend/Dockerfile.dev
    volumes:
      - ../backend:/app
      - /app/__pycache__ # キャッシュ汚染防止
      - /app/.venv # ← 匿名ボリュームでホストと切り離す
    env_file:
      - .env.dev
    ports:
      - "8000:8000"
```

> 💡 ここで `/app/.venv` を匿名ボリュームにすると、
> `../backend` のバインドマウントが `.venv` を上書きできなくなり、
> コンテナ専用の仮想環境が維持されます。

---

### 🔹 4.4 COPY 順序のベストプラクティス

Dockerfile の COPY 順序はキャッシュ効率と再現性に直結します。

| ステップ | 内容                                 | 理由                         |
| -------- | ------------------------------------ | ---------------------------- |
| 1️⃣       | `pyproject.toml`, `uv.lock` をコピー | 依存関係キャッシュを有効化   |
| 2️⃣       | `uv sync --frozen`                   | .venv 構築                   |
| 3️⃣       | アプリコード全体をコピー             | コード更新のみで再ビルド可能 |

この順序を守ることで、`pip install` に比べて圧倒的に速いビルドが実現できます。

---

### ✅ まとめ

- `.venv` は **ビルド時に uv が作るもの**、ホストからコピーしない
- `.dockerignore` でホストの `.venv` を除外しておくのが最も確実
- 匿名ボリューム `/app/.venv` を使うと、ホストとの衝突を完全に防げる
- COPY 順序を整理すればキャッシュ効率も良くなる

---

## 5. よくある誤解とアンチパターン

Python × Docker の環境構築で `.venv` を扱う際、実務で頻発する誤解を整理します。
どれも一見「動いてるように見える」ため厄介ですが、再現性やチーム開発で問題を引き起こす典型例です。

---

### 🧩 誤解①：「匿名ボリュームにすれば安全でしょ？」

匿名ボリュームを指定すれば、確かに実行時にホストの `.venv` がマウントされるのを防げます。
しかし、**Dockerfile 内で `COPY backend/ .` をしている場合、ビルド時点で `.venv` が含まれてしまう** ため意味がありません。
これは匿名ボリュームが “コンテナ起動時” に適用される仕組みだからです。

👉 **解決策:**
`.dockerignore` に `backend/.venv` を追加し、**ビルドコンテキスト**から除外する。

---

### 🧩 誤解②：「uv sync すれば上書きされるでしょ？」

`uv sync` は依存関係を同期するコマンドですが、**0ベースで再構築するわけではありません。**
既存の `.venv` がある場合、その環境を「更新」してしまうため、**ホストとコンテナで異なる依存関係が混ざる可能性**があります。

👉 **解決策:**
`.venv` はホストとコンテナで共有しない。
常に `.dockerignore` で除外し、`uv sync --frozen` で lock ファイルをもとにクリーン構築。

---

### 🧩 誤解③：「ホストの .venv を共有すれば速い」

確かにビルドや起動は速くなりますが、**OS依存バイナリ（例：C拡張）**が入っているため危険です。
macOS 上で作った `.venv` を Linux コンテナにマウントすると、
「インポートエラー」や「共有ライブラリが見つからない」などの不具合が発生します。

👉 **解決策:**
ホストとコンテナは別の `.venv` を持つのが原則。
パッケージの再現性は `uv.lock` に任せる。

---

### 🧩 誤解④：「Node.js では動いてるから同じでしょ？」

Node.js の `node_modules` はプラットフォーム依存が少なく、**`pnpm install` は常に0ベースで構築**されます。
一方で Python の `.venv` は OS・アーキテクチャ依存であり、**ホスト環境をコピーすると破綻します。**

👉 **解決策:**
Node.js と Python の環境再現モデルは異なる。
Pythonでは「.venvは排除・再構築」、Nodeでは「node_modulesを匿名ボリュームで再生成」。

---

### 🧩 誤解⑤：「.dockerignore いらないでしょ？」

`.dockerignore` を使わなくても動くように見えるケースがありますが、
**動く ≠ 再現性が保証されている** ではありません。
ホストの不要ファイル（`.venv`, `__pycache__`, `.DS_Store`など）はビルドキャッシュを汚染し、
別マシンで同じDockerfileを使っても同一の環境にならないリスクがあります。

👉 **解決策:**
`.gitignore` とは別に、**Docker専用の除外ルール**を必ず設定する。
特に `.venv`, `.mypy_cache`, `.pytest_cache` などは必須除外項目。

---

### ✅ まとめ

| 誤解                  | 問題点             | 解決策                 |
| --------------------- | ------------------ | ---------------------- |
| 匿名ボリュームでOK    | ビルド時に混入     | `.dockerignore` で除外 |
| uv syncで上書きされる | 差分更新される     | `uv sync --frozen`     |
| ホストの.venv共有     | OS非互換           | 分離・再構築           |
| Node.jsと同じ構成     | 動作モデルが異なる | Python専用設計         |
| .dockerignore不要     | 再現性低下         | 必ず設定               |

---

いい締めにいこう。
この章は “技術的な結論” だけじゃなく、**考え方の指針**として終われると読後感が強く残る。
以下のようにまとめるのがベスト👇

---

## 7. まとめ

今回扱ったのは、単なる `.venv` の除外設定ではなく、
**「Python × Docker における環境再現性の本質」** です。

---

### 🧩 問題の本質

- `.venv` には **OS依存のバイナリやシンボリックリンク** が含まれるため、
  ホストとコンテナで共有すると **環境の整合性が壊れる**。
- `uv sync` は既存の `.venv` を部分的に更新する仕組みのため、
  **クリーンな状態から構築しない限り完全再現にはならない**。

---

### 🧰 解決策の要点

| 層           | 方針                                      | 理由                         |
| ------------ | ----------------------------------------- | ---------------------------- |
| **ビルド時** | `.dockerignore` に `backend/.venv` を追加 | ホストの `.venv` 混入を防止  |
| **実行時**   | 匿名ボリュームで `.venv` を切り離す       | マウント衝突を防止           |
| **環境再現** | `uv sync --frozen`                        | `uv.lock` に基づいて完全同期 |
| **開発効率** | VSCodeではローカル`.venv`を利用           | Lintや補完はローカル完結でOK |

---

### 💡 学べる教訓

1. **「動く」ことより「再現できる」ことが重要。**
   チーム開発やCI/CDでは、同じDockerfileから同じ環境が再現できることが最優先。

2. **PythonはNode.jsよりも環境差の影響が大きい。**
   Nodeでは依存が純粋にJavaScriptで完結するが、
   Pythonはネイティブ依存（C, glibc, etc.）を多く含むため慎重な分離が必要。

3. **`.dockerignore` は“安全弁”であり、再現性の最後の砦。**
   「動くからいい」ではなく「他の環境でも確実に動くか」で判断する。

---

### 🚀 結論

> `.venv` はコンテナに含めない。
> `uv.lock` と `uv sync --frozen` で再現する。
> `.dockerignore` は必ず設定する。

これが、**Python × Docker × uv の最小構成で再現性を担保する最もシンプルな解** です。

了解 ✅
以下は、TechBlog v2 用にそのままコピペできる **Markdown フッター** 形式の完成版です。
すべて一次情報の英語原文＋日本語訳＋公式リンク付きです。

---

## 📚 参考文献・ソース

### 🧩 **uv 関連（Astral Docs）**

> “If the project virtual environment (`.venv`) does not exist, it will be created.”
> “Update the project's environment.”
> “Syncing ensures that all project dependencies are installed and up-to-date with the lockfile.”
> （`.venv` が存在しない場合は新規作成され、存在する場合は更新される。ロックファイルに基づき依存関係を最新化する。）
>
> — [Astral Docs: uv – Projects / uv sync](https://docs.astral.sh/uv/reference/commands/#uv-sync)

---

### 🐳 **Docker × Python 環境設計**

> “Avoid copying virtual environments from your local machine into Docker images.”
> （ローカルの仮想環境を Docker イメージにコピーしないこと。）
>
> — [Docker Official Docs – Language Guide (Python)](https://docs.docker.com/language/python/build-images/)

> “To exclude files not relevant to the build, without restructuring your source repository, use a `.dockerignore` file.”
> （ビルドに不要なファイルを除外するには `.dockerignore` を使用する。）
>
> — [Docker Docs – `.dockerignore`](https://docs.docker.com/engine/reference/builder/#dockerignore-file)

---

### 🐍 **Python 公式 – venv の移植性について**

> “Because of this, environments are inherently non-portable, in the general case.”
> （このため仮想環境は本質的にポータブルではない。）
>
> — [Python Docs – venv (3.13)](https://docs.python.org/3/library/venv.html)

---

### 💽 **Docker – Volume と Bind Mount の違い**

> “When you use a bind mount, a file or directory on the host machine is mounted from the host into a container.”
> （バインドマウントではホスト上のファイル／ディレクトリをそのままコンテナへマウントする。）
>
> “While bind mounts are dependent on the directory structure and OS of the host machine, volumes are completely managed by Docker.”
> （バインドマウントはホストのディレクトリ構造や OS に依存するが、ボリュームは Docker によって完全に管理される。）
>
> — [Docker Docs – Use bind mounts or volumes](https://docs.docker.com/storage/volumes/)

---

### 🧱 **Node.js Lockfile の再現性**

> “It describes the exact tree that was generated, such that subsequent installs are able to generate identical trees, regardless of intermediate dependency updates.”
> （`package-lock.json` は生成された依存ツリーを厳密に記述し、後のインストールで同一ツリーを再現できるようにする。）
>
> — [npm Docs – About package-lock.json](https://docs.npmjs.com/cli/v9/configuring-npm/package-lock-json)

> “Commit the lockfile (`pnpm-lock.yaml`) for faster installs and consistent installations.”
> （`pnpm-lock.yaml` をコミットすることで、より高速かつ一貫したインストールが可能になる。）
>
> — [pnpm Docs – Lockfile](https://pnpm.io/lockfile)
