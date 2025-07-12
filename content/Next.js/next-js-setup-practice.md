---
title: "Next.jsで開発するときにおすすめのセットアップ手法"
summary: "eslintの設定やtailwind等の設定をいじって開発体験を上げる"
tags: ["Next.js", "eslint", "vscode", "tailwindcss"]
---

# ESLintの設定

## ESLintとは

ESlintはJavaScriptやTypeScriptなどに使える静的解析ツールです．any型を許容するのか，アロー関数のみを使うのかなど，多岐に渡って厳密なルールを定義することでコードの一貫性を維持することができます．

## おすすめの設定法

### npmライブラリの追加

`npx create-next-app@latest`し，以下のように設定した場合を想定します

```bash
What is your project named?  xxx
Would you like to use TypeScript?  Yes
Would you like to use ESLint?  Yes
Would you like to use Tailwind CSS?  Yes
Would you like your code inside a `src/` directory?  No
Would you like to use App Router? (recommended)  Yes
Would you like to use Turbopack for `next dev`?  Yes
Would you like to customize the import alias (`@/*` by default)?  No
```

この場合，デフォルトで以下のようなnpmパッケージが取り込まれます．

```json
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "next": "14.2.29"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "eslint": "^8",
    "eslint-config-next": "14.2.29"
  }
```

ここからさらにeslint関連のライブラリを追加していきます．
| ライブラリ名 | 主な用途・特徴 |
| ------------------------------------ | ---------------------------------------------------------------- |
| **@typescript-eslint/eslint-plugin** | TypeScript向けのESLintルール集。型情報を活かした詳細な静的解析が可能になる。 |
| **@typescript-eslint/parser** | ESLintにTypeScript構文を理解させるためのパーサ。これがないとTSコードにESLintが使えない。 |
| **@eslint/eslintrc** | `.eslintrc` 設定ファイルの読み込みに使う内部ツール。通常不要だが、高度な設定やバージョン差異の吸収に使うこともある。 |
| **eslint-plugin-import** | `import` 文の書き方（順序、重複、解決可能性）をチェック・補正するための定番プラグイン。 |
| **eslint-plugin-import-access** | 特定のディレクトリや層に対するアクセス制限ルールを定義できる。Clean Architectureなどと相性が良い。 |
| **eslint-plugin-simple-import-sort** | `import`, `export` をアルファベット順や指定順に自動整列してくれるプラグイン。整形の補助に便利。 |
| **eslint-plugin-unused-imports** | 使用されていない `import` を検出・削除（自動修正対応）してくれる。不要コード削減に有効。 |

```bash
npm install -D \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  @eslint/eslintrc \
  eslint-plugin-import \
  eslint-plugin-import-access \
  eslint-plugin-simple-import-sort \
  eslint-plugin-unused-imports
```

## eslint.config.mjsの設定

create-next-app時にeslintを追加した場合，自動で`.eslintrc.json`が作成されます．ただしjsonで書く場合柔軟性がなくなるので，代わりにフラット構成(`eslint.config.mjs`)で使うべきです．

```js
// /eslint.config.mjs
import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import importAccess from "eslint-plugin-import-access/flat-config";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: ["coverage", ".next", "*.config.mjs", "components/ui/**/*"],
  },
  ...fixupConfigRules(
    compat.extends(
      "plugin:@typescript-eslint/recommended",
      "next/core-web-vitals",
      "plugin:import/recommended",
      "plugin:import/warnings",
    ),
  ),
  {
    plugins: {
      "@typescript-eslint": fixupPluginRules(typescriptEslint),
      "simple-import-sort": simpleImportSort,
      "unused-imports": unusedImports,
      "import-access": importAccess,
    },
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "variable",
          types: ["array", "boolean", "number", "string"],
          format: ["strictCamelCase", "UPPER_CASE"],
        },
        {
          selector: "variable",
          types: ["function"],
          format: ["strictCamelCase", "StrictPascalCase"],
        },
      ],
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "import/first": "error",
      "import/newline-after-import": "error",
      "import/no-duplicates": "error",
      "@typescript-eslint/consistent-type-exports": "error",
      "import/group-exports": "error",
      "unused-imports/no-unused-imports": "error",
      "import-access/jsdoc": ["error"],
      "no-restricted-imports": [
        "error",
        {
          paths: [
            "sonner",
            "next/link",
            "react-icons",
            "lucide-react",
            "zod",
            { name: "@/components/ui/Form", importNames: ["Form"] },
            {
              name: "@next/third-parties/google",
              importNames: ["sendGAEvent"],
            },
          ],
          patterns: ["react-icons/*"],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.object.name='Object'][callee.property.name='keys']",
          message:
            "Do not use Object.keys. Check src/utils/object.ts or add a new utility function.",
        },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
    },
  },
  {
    files: [
      "src/**/*.stories.tsx",
      "src/**/*Type.ts",
      "src/types/**",
      "src/features/**/*Repository.ts",
      "src/features/**/*Converter.ts",
      "src/features/**/*Constants.ts",
    ],
    rules: {
      "import/group-exports": "off",
    },
  },
  {
    files: ["components/icons/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
];
```

### コードの解説

**1. モジュールのインポート部**

```js
import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import importAccess from "eslint-plugin-import-access/flat-config";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";
import path from "node:path";
import { fileURLToPath } from "node:url";
```

| 行                                        | 内容                                                                             |
| ----------------------------------------- | -------------------------------------------------------------------------------- |
| `@eslint/compat`                          | `.eslintrc` スタイルの設定（extends 等）をフラット構成用に変換するためのヘルパー |
| `FlatCompat`                              | ↑の変換を実際に行うクラス。`plugin:xxx/recommended` などを使いたいときに必要     |
| `@eslint/js`                              | ESLint公式の `recommended` 設定セット（ESLintが提供する基本ルール）              |
| `@typescript-eslint/*`                    | TypeScriptのルール定義とパーサ。TS対応には必須                                   |
| `eslint-plugin-import-access/flat-config` | import制限をJSDocに基づいて行うためのプラグイン（※フラット構成対応の入口）       |
| その他のプラグイン                        | `simple-import-sort`, `unused-imports` → import順や未使用importの整理用          |
| `path`, `fileURLToPath`                   | `__dirname` をESM形式で取得するための処理（Node.js ESMの都合）                   |

**2. `__dirname` & `FlatCompat` の準備**

```js
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});
```

| 行                        | 内容                                                                                                                 |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `__filename`, `__dirname` | CommonJSにないESM形式でのファイルパス取得                                                                            |
| `FlatCompat(...)`         | `.eslintrc`で書かれたような設定（例: `"plugin:@typescript-eslint/recommended"`）をフラット構成でも使えるよう変換する |

**3. エクスポートされる ESLint 設定本体**

```js
export default [
  ...
];
```

**4. 無視ファイルの指定**

```js
{
  ignores: [
    "coverage",
    ".next",
    "*.config.mjs",
    "components/ui/**/*",
  ],
},
```

- ESLintがチェック対象から除外するファイルやフォルダを定義
- `*.config.mjs`なども解析しないよう除外している（誤検出防止）

**5. 従来の extends をそのまま使う（変換）**

```js
...fixupConfigRules(
  compat.extends(
    "plugin:@typescript-eslint/recommended",
    "next/core-web-vitals",
    "plugin:import/recommended",
    "plugin:import/warnings",
  )
),
```

- `compat.extends(...)`：`.eslintrc`スタイルの `"extends"` を使えるように変換
- `fixupConfigRules(...)`：ルールにプラグイン名を正しくプレフィックスしてくれる（例: `"@typescript-eslint/no-unused-vars"` に直してくれる）

**6. メイン設定ブロック（ルール、プラグインなど）**

```js
{
  plugins: {
    "@typescript-eslint": fixupPluginRules(typescriptEslint),
    "simple-import-sort": simpleImportSort,
    "unused-imports": unusedImports,
    "import-access": importAccess,
  },
  ...
}
```

| セクション              | 内容                                                                   |
| ----------------------- | ---------------------------------------------------------------------- |
| `plugins`               | 使用するプラグインを ESLint に明示的に登録                             |
| `fixupPluginRules(...)` | `@typescript-eslint` のルールを正しく使える形に整形                    |
| `languageOptions`       | ECMAScriptやモジュール種別（ESM）、TypeScriptのパーサ情報              |
| `parserOptions`         | `tsconfig.json` の場所を ESLint に教える（型情報を使いたいときに重要） |

**7. ルール設定（重要）**

```js
rules: {
  "@typescript-eslint/naming-convention": [...],
  "simple-import-sort/imports": "error",
  "simple-import-sort/exports": "error",
  ...
}
```

| ルール名                           | 内容                                                                 |
| ---------------------------------- | -------------------------------------------------------------------- |
| `naming-convention`                | 変数名の形式を強制（camelCase, PascalCase など）                     |
| `simple-import-sort/*`             | import/export 文を自動でソート                                       |
| `unused-imports/no-unused-imports` | 未使用の import をエラーに                                           |
| `import/first`                     | import文はファイルの先頭に書け                                       |
| `import/no-duplicates`             | 同じモジュールを複数回 import するな                                 |
| `import/group-exports`             | export はまとめて書け（バラバラに書かない）                          |
| `import-access/jsdoc`              | JSDocコメントに従って層間importを制限（例: infra → domain 禁止など） |
| `no-restricted-imports`            | 特定のモジュールやimport名を禁止（使ってほしくないライブラリなど）   |
| `no-restricted-syntax`             | 特定の構文（例: `Object.keys`）の使用を禁止し、独自実装を促す        |

**8. 特定ファイルへのルール適用除外**

```js
{
  files: [...],
  rules: {
    "import/group-exports": "off",
  },
},
{
  files: ["components/icons/**/*.{ts,tsx}"],
  rules: {
    "no-restricted-imports": "off",
  },
},
```

- 特定のファイルパターン（例: `*.stories.tsx`, `*Type.ts`）にだけルールを変更
- `group-exports`を無効にすることで、柔軟にexport可能にしている

# tailwindの設定

Tailwind CSS は通常の CSS や JS 文法とは違う「ユーティリティクラスを文字列で書くスタイル」なので，エラーチェックや構文チェックができません．そのためこれらの設定をeslintに追加していきます

## npm の追加

```bash
npm install -D eslint-plugin-readable-tailwind
```

## eslint.config.mjsの設定

### import

```js
import readableTailwind from "eslint-plugin-readable-tailwind";
```

### `ignores`に追記

```js
  {
    ignores: [
      "coverage",
      ".next",
      "*.config.mjs",
      "tailwind.config.ts",  // ←追加
      "components/ui/**/*",
    ],
  },
```

### `compat.extends(...)` に追記

```js
...fixupConfigRules(
  compat.extends(
    "plugin:@typescript-eslint/recommended",
    "plugin:import/recommended",
    "plugin:import/warnings",
    "plugin:tailwindcss/recommended", // ←追加
  )
),
```

### `plugins`に追加

```js
plugins: {
  "@typescript-eslint": fixupPluginRules(typescriptEslint),
  "simple-import-sort": simpleImportSort,
  "unused-imports": unusedImports,
  "import-access": importAccess,
  "readable-tailwind": readableTailwind, // ←追加
},
```

### Tailwindの `settings`（`cn()` など補完関数を解析させたい場合）

```js
settings: {
  tailwindcss: {
    callees: ["cn", "cva"], // `cn()` や `cva()` の中のclass名もチェック対象に
  },
},
```

### `rules`を追加

```js
      "tailwindcss/no-custom-classname": [
        "error",
        {
          classRegex:
            "^(class(Name)?|textClassName|iconClassName|innerClassName)$",
          whitelist: ["^[A-Z].*"],
        },
      ],
      "readable-tailwind/multiline": [
        "warn",
        {
          group: "newLine",
        },
      ],
```

- `no-custom-classname`：カスタムクラスの混入を制限
- `readable-tailwind/multiline`: Tailwindクラスを折り返して可読性を高める（複数行に分ける）

## tailwind.config.tsの設定

なぜかスタイリングされないといった事象が発生した場合，このファイルを確認することをお勧めします．

```ts
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
```

コンポーネントの場所が設定されていない可能性があります．

# prettierの設定

Prettierはコード整形を自動で揃えるフォーマッタです．eslintも一部はコード整形を行いますが，これはより拡張的です．

## eslint.config.mjsの設定

### ライブラリの追加

```bash
npm install -D \
  prettier \
  prettier-plugin-tailwindcss \
  eslint-config-prettier
```

<blockquote>
※ eslint-plugin-prettier を使いたい場合は、最後に以下を追加：

```bash
npm install -D eslint-plugin-prettier
```

</blockquote>

| ライブラリ名                  | 役割・説明                                                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `prettier`                    | コード整形本体。インデントや改行、スペースなどのスタイルを一貫して整える。                                         |
| `prettier-plugin-tailwindcss` | Tailwindのユーティリティクラスを自動で**推奨順に並べ替える**Prettierプラグイン。                                   |
| `eslint-config-prettier`      | ESLintの整形系ルールとPrettierのルールが競合しないように、ESLint側の整形ルールを無効化する。                       |
| `eslint-plugin-prettier`      | Prettierの整形ルール違反を**ESLintの警告として表示する**ためのプラグイン（VSCodeで保存時整形する場合は省略可能）。 |

### `compat.extends(...)` に追記

```js
...fixupConfigRules(
  compat.extends(
    "plugin:@typescript-eslint/recommended",
    "plugin:import/recommended",
    "plugin:import/warnings",
    "plugin:tailwindcss/recommended",
    "prettier", // ←追加
  )
),
```

# vscodeの設定

プロジェクトに`.vscode`ディレクトリを配置し，その中にjsonファイルを配置するとvscode専用のプロジェクトごとのエディタ設定を置くことができます．

## 使えるファイル

| ファイル名        | 用途・できること                                               |
| ----------------- | -------------------------------------------------------------- |
| `settings.json`   | エディタの動作や拡張機能の設定（保存時整形、インデント幅など） |
| `extensions.json` | 推奨拡張機能の一覧（プロジェクト参加者に自動で通知される）     |
| `launch.json`     | デバッガーの設定（Node.jsやChromeのステップ実行など）          |
| `tasks.json`      | ターミナルで実行するタスクを定義（ビルド・lint・test など）    |

## settings.jsonの設定

ここではeslintやprettier関連の設定をし，ファイル保存時に自動で整形が走るようにします．

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll": "explicit",
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "non-relative",
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.classAttributes": ["class", "className", ".*Class"],
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

| 設定キー                                            | 内容・説明                                                                              |
| --------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `"editor.formatOnSave"`                             | ファイル保存時に自動でコード整形（Prettierなどが有効になる）                            |
| `"editor.defaultFormatter"`                         | Prettier拡張機能（`esbenp.prettier-vscode`）を整形エンジンとして使用                    |
| `"editor.codeActionsOnSave.source.fixAll"`          | 明示的に保存したときのみ、すべての問題（Lint等）を一括修正                              |
| `"editor.codeActionsOnSave.source.fixAll.eslint"`   | 明示的に保存したときのみ、ESLintの警告・エラーを自動修正                                |
| `"editor.codeActionsOnSave.source.organizeImports"` | 明示的に保存したときのみ、不要なimport削除＆並び替え                                    |
| `"typescript.preferences.importModuleSpecifier"`    | TypeScriptのimport補完を相対パスではなく絶対パス（非相対）にする                        |
| `"typescript.tsdk"`                                 | VSCodeが使用するTypeScriptバージョンをプロジェクト内の `node_modules/typescript` に固定 |
| `"tailwindCSS.classAttributes"`                     | Tailwindの補完対象となる属性名（`class`, `className`, `iconClassName`など）を指定       |
| `"tailwindCSS.experimental.classRegex"`             | `cn()`, `cva()`, `cx()` のような関数内でもTailwindクラスを認識させる正規表現設定        |

## extensions.jsonの設定

プロジェクトで使うべき VSCode 拡張機能のおすすめ一覧を示し，プロジェクトに適用することができます．

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint", // ESLintのエラー表示・自動修正を有効にする拡張
    "esbenp.prettier-vscode", // Prettierで保存時整形をする拡張
    "bradlc.vscode-tailwindcss" // Tailwindクラスの補完・色表示をしてくれる拡張
  ]
}
```

# まとめ

以上のことをすると構文チェックができ，ファイル保存時に自動でフォーマッティングされます．すごく頼もしいです．
