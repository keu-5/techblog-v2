---
title: "JWT認証システム実装ガイド 第五回 (最終回) - 本質を理解して堅牢な認証を構築する"
summary: "JWTは認証フレームワークではなく署名付きトークン。実装経験から学んだ本質的な理解と、Web/モバイル両対応の実践的な設計パターンを解説します。"
tags:
  ["JWT", "認証", "セキュリティ", "Web開発", "モバイル開発", "Redis", "API設計"]
---

## 7. まとめ

### 7.1 JWT認証のポイント再確認

この記事を通じて学んだ、JWT認証システムの核心をおさらいしましょう。

#### JWTの本質

```
❌ 誤解：JWTは認証フレームワーク
✅ 正解：JWTは署名付き自己完結型トークン

JWTができること：
- データの改ざんを検知
- 有効期限の管理
- ステートレスな認証

JWTができないこと：
- 即座の無効化
- セッション管理
- 認証フロー全体の提供
```

#### 2トークン方式の本質

```
突き詰めれば、これだけ：

1. アクセストークン（JWT）で本人確認
2. 期限切れになったらリフレッシュトークンで更新

以上。

複雑に見えるのは、周辺設計：
- どう発行するか
- どう保存するか
- どう無効化するか
- どうセキュリティを高めるか
```

#### client_idによるセキュリティ強化

```
従来：リフレッシュトークンのみ
問題：盗まれたら使われる

改善：リフレッシュトークン + client_id
効果：2つ揃わないと使えない

セキュリティレイヤー：
第1層：リフレッシュトークン（ランダムUUID）
第2層：client_id（デバイス固有）
第3層：Redis TTL（30日で失効）
第4層：トークンローテーション（使い捨て）
```

#### シーケンス図で考える重要性

```
なぜシーケンス図が重要か：

1. 時系列で整理できる
   → 「いつ」「誰が」「何を」が明確

2. 5つの独立したフローに分解
   → サインアップ、ログイン、ログイン中、ログアウト、退会
   → それぞれ独立して実装・テスト可能

3. エッジケースを発見しやすい
   → エラー時の処理
   → リトライロジック
   → ロールバック処理
```

#### HttpOnly Cookieの理想と現実

```
理想：
✅ HttpOnly Cookie = 最もセキュア
✅ XSS攻撃で盗めない
✅ 自動送信で実装が簡単

現実：
❌ モバイルネイティブアプリで使えない
❌ WebViewでしか認証できない
❌ CORS設定が複雑
❌ マルチドメイン対応が困難

結論：
Web + モバイル対応なら JSON返却
client_id で追加セキュリティ層を確保
```

---

### 7.2 実装の優先順位

段階的に実装していくための、フェーズ分けを提案します。

#### Phase 1（MVP - 最小限の動作）

**目標：基本的な認証システムを動かす**

```
必須機能：
✅ ユーザー登録（メール確認）
  - POST /auth/signup/send-code
  - POST /auth/signup/verify-code

✅ ログイン
  - POST /auth/login

✅ トークンリフレッシュ
  - POST /auth/refresh

✅ ログアウト
  - POST /auth/logout

必須実装：
✅ JWT生成・検証（HS256）
✅ bcryptでパスワードハッシュ化
✅ Redisでリフレッシュトークン管理
✅ client_id検証
✅ 基本的なバリデーション

省略可能：
- レート制限（後で追加）
- デバイス情報記録
- セッション管理画面
- 詳細なログ
```

**実装期間：1〜2週間**

---

#### Phase 2（セキュリティ強化）

**目標：本番環境で安心して使えるレベルに**

```
追加機能：
✅ レート制限
  - ログイン：5回/5分
  - コード送信：3回/5分

✅ セッション管理
  - 同時セッション数制限（5セッション）
  - デバイス情報の記録
  - セッション一覧表示API

✅ エラーハンドリング強化
  - 統一されたエラー形式
  - 詳細なログ記録
  - 監視アラート

✅ セキュリティ対策
  - HTTPS必須化
  - CORS適切な設定
  - CSP（Content Security Policy）
  - 入力値のサニタイゼーション

追加実装：
✅ GET /auth/sessions（セッション一覧）
✅ DELETE /auth/sessions/:id（個別ログアウト）
✅ POST /auth/logout-all（全デバイスログアウト）
```

**実装期間：1〜2週間**

---

#### Phase 3（高度な機能）

**目標：エンタープライズレベルのセキュリティ**

```
オプション機能：
✅ ブラックリスト方式
  - jti（JWT ID）でアクセストークンを即座に無効化
  - トレードオフ：パフォーマンス低下

✅ 異常検知
  - IP アドレスの急激な変化
  - デバイスフィンガープリント
  - 不審なログインパターン

✅ 2要素認証（2FA）
  - TOTP（Google Authenticator）
  - SMS認証
  - メール認証

✅ OAuth連携
  - Google, Twitter, GitHub など
  - ソーシャルログイン

✅ パスワードポリシー強化
  - 大文字・小文字・数字・記号必須
  - よくあるパスワードのブラックリスト
  - パスワード履歴チェック

✅ 監査ログ
  - 全ての認証イベントを記録
  - ログ分析・レポート
  - コンプライアンス対応
```

**実装期間：2〜4週間**

---

### 7.3 さらに学ぶために

JWT認証をマスターしたら、次のステップへ：

#### より高度な認証・認可

**OAuth 2.0 / OpenID Connect**

```
JWT認証の次のステップ

学べること：
- サードパーティ連携
- スコープベースの認可
- 標準化されたフロー

参考リソース：
- RFC 6749 (OAuth 2.0)
- OpenID Connect Core 1.0
- Auth0ドキュメント
```

**Zero Trust Architecture**

```
「信頼せず、常に検証する」

学べること：
- マイクロサービスでの認証
- サービス間の相互認証
- 最小権限の原則

参考リソース：
- NIST SP 800-207
- BeyondCorp（Google）
```

**Passkey / WebAuthn**

```
パスワードレス認証の未来

学べること：
- 生体認証
- 公開鍵暗号
- FIDO2標準

参考リソース：
- W3C WebAuthn仕様
- Passkeys.dev
```

#### セキュリティ全般

**OWASP（Open Web Application Security Project）**

```
Webセキュリティの必読資料

重要なドキュメント：
- OWASP Top 10
- Authentication Cheat Sheet
- Session Management Cheat Sheet
- JWT Security Cheat Sheet

URL: https://owasp.org/
```

**関連記事・書籍**

```
書籍：
- 「体系的に学ぶ 安全なWebアプリケーションの作り方」（徳丸浩）
- 「OAuth徹底入門」（Justin Richer, Antonio Sanso）

オンライン：
- jwt.io（JWT Debugger）
- Auth0 Blog
- Okta Developer Blog
```

---

## 付録

### A. サンプルコード

#### A.1 バックエンド（Go + Fiber + Redis）

**プロジェクト構成：**

```
backend/
├── main.go
├── .env
├── go.mod
├── go.sum
├── handlers/
│   ├── auth.go
│   └── user.go
├── middleware/
│   ├── auth.go
│   └── rate_limit.go
├── models/
│   └── user.go
├── services/
│   ├── auth_service.go
│   ├── token_service.go
│   └── email_service.go
├── database/
│   ├── postgres.go
│   └── redis.go
└── utils/
    ├── jwt.go
    ├── password.go
    └── validator.go
```

**main.go**

```go
package main

import (
    "log"
    "os"

    "github.com/gofiber/fiber/v2"
    "github.com/gofiber/fiber/v2/middleware/cors"
    "github.com/gofiber/fiber/v2/middleware/logger"
    "github.com/joho/godotenv"

    "your-project/database"
    "your-project/handlers"
    "your-project/middleware"
)

func main() {
    // 環境変数読み込み
    if err := godotenv.Load(); err != nil {
        log.Fatal("Error loading .env file")
    }

    // データベース接続
    database.ConnectPostgres()
    database.ConnectRedis()

    // Fiberアプリ作成
    app := fiber.New(fiber.Config{
        ErrorHandler: customErrorHandler,
    })

    // ミドルウェア
    app.Use(logger.New())
    app.Use(cors.New(cors.Config{
        AllowOrigins:     os.Getenv("ALLOWED_ORIGINS"),
        AllowCredentials: true,
        AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
    }))

    // ルーティング
    setupRoutes(app)

    // サーバー起動
    port := os.Getenv("PORT")
    if port == "" {
        port = "8080"
    }

    log.Fatal(app.Listen(":" + port))
}

func setupRoutes(app *fiber.App) {
    api := app.Group("/api/v1")

    // 認証関連（認証不要）
    auth := api.Group("/auth")
    auth.Post("/signup/send-code", handlers.SendSignupCode)
    auth.Post("/signup/verify-code", handlers.VerifySignupCode)
    auth.Post("/signup/resend-code", handlers.ResendSignupCode)
    auth.Post("/login", handlers.Login)
    auth.Post("/refresh", handlers.RefreshToken)
    auth.Post("/logout", handlers.Logout)

    // ユーザー関連（認証必要）
    user := api.Group("/user", middleware.AuthRequired())
    user.Get("/profile", handlers.GetProfile)
    user.Put("/profile", handlers.UpdateProfile)
    user.Delete("/account", handlers.DeleteAccount)

    // セッション管理
    sessions := api.Group("/auth/sessions", middleware.AuthRequired())
    sessions.Get("/", handlers.GetSessions)
    sessions.Delete("/:id", handlers.DeleteSession)
    sessions.Post("/logout-all", handlers.LogoutAll)
}

func customErrorHandler(c *fiber.Ctx, err error) error {
    code := fiber.StatusInternalServerError
    message := "Internal Server Error"

    if e, ok := err.(*fiber.Error); ok {
        code = e.Code
        message = e.Message
    }

    return c.Status(code).JSON(fiber.Map{
        "error":   "internal_server_error",
        "message": message,
    })
}
```

**handlers/auth.go**

```go
package handlers

import (
    "github.com/gofiber/fiber/v2"
    "your-project/services"
    "your-project/middleware"
)

type SendCodeRequest struct {
    Email    string `json:"email" validate:"required,email"`
    Password string `json:"password" validate:"required,min=8,max=72"`
    ClientID string `json:"client_id" validate:"required"`
}

type VerifyCodeRequest struct {
    Email    string `json:"email" validate:"required,email"`
    Code     string `json:"code" validate:"required,len=6"`
    ClientID string `json:"client_id" validate:"required"`
}

type LoginRequest struct {
    Email    string `json:"email" validate:"required,email"`
    Password string `json:"password" validate:"required"`
    ClientID string `json:"client_id" validate:"required"`
}

type RefreshTokenRequest struct {
    RefreshToken string `json:"refresh_token" validate:"required"`
    ClientID     string `json:"client_id" validate:"required"`
}

type LogoutRequest struct {
    RefreshToken string `json:"refresh_token" validate:"required"`
    ClientID     string `json:"client_id" validate:"required"`
}

func SendSignupCode(c *fiber.Ctx) error {
    var req SendCodeRequest
    if err := c.BodyParser(&req); err != nil {
        return c.Status(400).JSON(fiber.Map{
            "error":   "validation_error",
            "message": "不正なリクエストです",
        })
    }

    // バリデーション
    if err := validate.Struct(req); err != nil {
        return c.Status(400).JSON(fiber.Map{
            "error":   "validation_error",
            "message": "入力内容に誤りがあります",
            "details": parseValidationErrors(err),
        })
    }

    // レート制限チェック
    allowed, err := middleware.CheckRateLimit(req.Email, 3, 5*time.Minute)
    if err != nil || !allowed {
        return c.Status(429).JSON(fiber.Map{
            "error":   "rate_limit_exceeded",
            "message": "送信回数が多すぎます。しばらく待ってから再度お試しください",
        })
    }

    // サービス呼び出し
    err = services.SendSignupCode(req.Email, req.Password, req.ClientID)
    if err != nil {
        if err.Error() == "email already exists" {
            return c.Status(400).JSON(fiber.Map{
                "error":   "email_already_exists",
                "message": "このメールアドレスは既に登録されています",
            })
        }
        return c.Status(500).JSON(fiber.Map{
            "error":   "internal_server_error",
            "message": "サーバー内部エラーが発生しました",
        })
    }

    return c.JSON(fiber.Map{
        "message":    "確認コードを送信しました。メールを確認してください。",
        "email":      req.Email,
        "expires_in": 900,
    })
}

func VerifySignupCode(c *fiber.Ctx) error {
    var req VerifyCodeRequest
    if err := c.BodyParser(&req); err != nil {
        return c.Status(400).JSON(fiber.Map{
            "error":   "validation_error",
            "message": "不正なリクエストです",
        })
    }

    // バリデーション
    if err := validate.Struct(req); err != nil {
        return c.Status(400).JSON(fiber.Map{
            "error":   "validation_error",
            "message": "入力内容に誤りがあります",
        })
    }

    // サービス呼び出し
    result, err := services.VerifySignupCode(req.Email, req.Code, req.ClientID)
    if err != nil {
        switch err.Error() {
        case "session not found":
            return c.Status(400).JSON(fiber.Map{
                "error":   "session_not_found",
                "message": "確認コードが無効または期限切れです。最初からやり直してください",
            })
        case "invalid code":
            return c.Status(400).JSON(fiber.Map{
                "error":   "invalid_code",
                "message": "確認コードが一致しません",
            })
        case "client_id mismatch":
            return c.Status(401).JSON(fiber.Map{
                "error":   "client_id_mismatch",
                "message": "不正なリクエストです",
            })
        default:
            return c.Status(500).JSON(fiber.Map{
                "error":   "internal_server_error",
                "message": "サーバー内部エラーが発生しました",
            })
        }
    }

    return c.Status(201).JSON(fiber.Map{
        "message":       "アカウントが作成されました",
        "access_token":  result.AccessToken,
        "refresh_token": result.RefreshToken,
        "token_type":    "Bearer",
        "expires_in":    900,
        "user":          result.User,
    })
}

func Login(c *fiber.Ctx) error {
    var req LoginRequest
    if err := c.BodyParser(&req); err != nil {
        return c.Status(400).JSON(fiber.Map{
            "error":   "validation_error",
            "message": "不正なリクエストです",
        })
    }

    // レート制限チェック
    allowed, err := middleware.CheckRateLimit(req.Email, 5, 5*time.Minute)
    if err != nil || !allowed {
        return c.Status(429).JSON(fiber.Map{
            "error":   "rate_limit_exceeded",
            "message": "ログイン試行回数が多すぎます。しばらく待ってから再度お試しください",
        })
    }

    // サービス呼び出し
    result, err := services.Login(req.Email, req.Password, req.ClientID)
    if err != nil {
        return c.Status(401).JSON(fiber.Map{
            "error":   "invalid_credentials",
            "message": "メールアドレスまたはパスワードが間違っています",
        })
    }

    return c.JSON(fiber.Map{
        "message":       "ログインに成功しました",
        "access_token":  result.AccessToken,
        "refresh_token": result.RefreshToken,
        "token_type":    "Bearer",
        "expires_in":    900,
        "user":          result.User,
    })
}

func RefreshToken(c *fiber.Ctx) error {
    var req RefreshTokenRequest
    if err := c.BodyParser(&req); err != nil {
        return c.Status(400).JSON(fiber.Map{
            "error":   "validation_error",
            "message": "不正なリクエストです",
        })
    }

    // サービス呼び出し
    result, err := services.RefreshToken(req.RefreshToken, req.ClientID)
    if err != nil {
        if err.Error() == "client_id mismatch" {
            return c.Status(401).JSON(fiber.Map{
                "error":   "client_id_mismatch",
                "message": "セキュリティ上の理由でログアウトしました。再度ログインしてください",
            })
        }
        return c.Status(401).JSON(fiber.Map{
            "error":   "refresh_token_invalid",
            "message": "リフレッシュトークンが無効です。再度ログインしてください",
        })
    }

    return c.JSON(fiber.Map{
        "access_token":  result.AccessToken,
        "refresh_token": result.RefreshToken,
        "token_type":    "Bearer",
        "expires_in":    900,
    })
}

func Logout(c *fiber.Ctx) error {
    var req LogoutRequest
    if err := c.BodyParser(&req); err != nil {
        return c.Status(400).JSON(fiber.Map{
            "error":   "validation_error",
            "message": "不正なリクエストです",
        })
    }

    // サービス呼び出し（エラーは無視＝冪等性）
    services.Logout(req.RefreshToken, req.ClientID)

    return c.JSON(fiber.Map{
        "message": "ログアウトしました",
    })
}
```

**services/token_service.go**

```go
package services

import (
    "context"
    "fmt"
    "time"
    "github.com/google/uuid"
    "your-project/database"
    "your-project/utils"
)

type TokenPair struct {
    AccessToken  string
    RefreshToken string
}

func GenerateTokenPair(userID int, email, clientID string) (*TokenPair, error) {
    // アクセストークン生成（JWT）
    accessToken, err := utils.GenerateJWT(userID, email)
    if err != nil {
        return nil, err
    }

    // リフレッシュトークン生成（UUID）
    refreshToken := uuid.New().String()

    // Redisに保存
    ctx := context.Background()
    key := fmt.Sprintf("refresh_token:%s", refreshToken)

    data := map[string]interface{}{
        "user_id":    userID,
        "client_id":  clientID,
        "created_at": time.Now().Unix(),
    }

    if err := database.RedisClient.HSet(ctx, key, data).Err(); err != nil {
        return nil, err
    }

    // TTL設定（30日）
    if err := database.RedisClient.Expire(ctx, key, 30*24*time.Hour).Err(); err != nil {
        return nil, err
    }

    // ユーザーセッション一覧に追加
    sessionKey := fmt.Sprintf("user:%d:sessions", userID)
    sessionValue := fmt.Sprintf("%s:%s", refreshToken, clientID)
    database.RedisClient.SAdd(ctx, sessionKey, sessionValue)

    return &TokenPair{
        AccessToken:  accessToken,
        RefreshToken: refreshToken,
    }, nil
}

func ValidateRefreshToken(token, clientID string) (int, error) {
    ctx := context.Background()
    key := fmt.Sprintf("refresh_token:%s", token)

    // Redis取得
    result, err := database.RedisClient.HGetAll(ctx, key).Result()
    if err != nil || len(result) == 0 {
        return 0, fmt.Errorf("invalid or expired token")
    }

    // client_id照合
    if result["client_id"] != clientID {
        // セキュリティ脅威検知
        log.Printf("[SECURITY] client_id mismatch: user_id=%s, stored=%s, requested=%s",
            result["user_id"], result["client_id"], clientID)

        // トークン無効化
        database.RedisClient.Del(ctx, key)

        return 0, fmt.Errorf("client_id mismatch")
    }

    // TTLリセット（スライディングウィンドウ）
    database.RedisClient.Expire(ctx, key, 30*24*time.Hour)

    userID, _ := strconv.Atoi(result["user_id"])
    return userID, nil
}

func DeleteRefreshToken(token, clientID string, userID int) error {
    ctx := context.Background()

    // トークン削除
    key := fmt.Sprintf("refresh_token:%s", token)
    database.RedisClient.Del(ctx, key)

    // ユーザーセッション一覧から削除
    sessionKey := fmt.Sprintf("user:%d:sessions", userID)
    sessionValue := fmt.Sprintf("%s:%s", token, clientID)
    database.RedisClient.SRem(ctx, sessionKey, sessionValue)

    return nil
}
```

**utils/jwt.go**

```go
package utils

import (
    "fmt"
    "os"
    "time"

    "github.com/golang-jwt/jwt/v5"
)

type JWTClaims struct {
    UserID int    `json:"user_id"`
    Email  string `json:"email"`
    jwt.RegisteredClaims
}

func GenerateJWT(userID int, email string) (string, error) {
    secretKey := os.Getenv("JWT_SECRET_KEY")
    if secretKey == "" {
        return "", fmt.Errorf("JWT_SECRET_KEY not set")
    }

    claims := JWTClaims{
        UserID: userID,
        Email:  email,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
            NotBefore: jwt.NewNumericDate(time.Now()),
        },
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString([]byte(secretKey))
}

func ValidateJWT(tokenString string) (*JWTClaims, error) {
    secretKey := os.Getenv("JWT_SECRET_KEY")
    if secretKey == "" {
        return nil, fmt.Errorf("JWT_SECRET_KEY not set")
    }

    token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
        // アルゴリズム検証
        if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
        }
        return []byte(secretKey), nil
    })

    if err != nil {
        return nil, err
    }

    if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
        return claims, nil
    }

    return nil, fmt.Errorf("invalid token")
}
```

**middleware/auth.go**

```go
package middleware

import (
    "strings"

    "github.com/gofiber/fiber/v2"
    "your-project/utils"
)

func AuthRequired() fiber.Handler {
    return func(c *fiber.Ctx) error {
        // Authorization ヘッダー取得
        authHeader := c.Get("Authorization")
        if authHeader == "" {
            return c.Status(401).JSON(fiber.Map{
                "error":   "unauthorized",
                "message": "認証が必要です",
            })
        }

        // "Bearer " プレフィックスを削除
        tokenString := strings.TrimPrefix(authHeader, "Bearer ")
        if tokenString == authHeader {
            return c.Status(401).JSON(fiber.Map{
                "error":   "unauthorized",
                "message": "不正な認証ヘッダーです",
            })
        }

        // JWT検証
        claims, err := utils.ValidateJWT(tokenString)
        if err != nil {
            return c.Status(401).JSON(fiber.Map{
                "error":   "access_token_expired",
                "message": "アクセストークンの有効期限が切れています",
            })
        }

        // ユーザー情報をコンテキストに保存
        c.Locals("user_id", claims.UserID)
        c.Locals("email", claims.Email)

        return c.Next()
    }
}
```

**.env（サンプル）**

```env
# サーバー設定
PORT=8080
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# JWT設定
JWT_SECRET_KEY=your-super-secret-key-here-min-32-chars-random-string-change-this-in-production

# PostgreSQL設定
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=auth_db

# Redis設定
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# メール設定
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourapp.com
```

---

#### A.2 フロントエンド（TypeScript + React）

**プロジェクト構成：**

```
frontend/
├── src/
│   ├── lib/
│   │   ├── token-manager.ts
│   │   ├── api-client.ts
│   │   └── auth.ts
│   ├── hooks/
│   │   └── useAuth.ts
│   ├── components/
│   │   ├── LoginForm.tsx
│   │   ├── SignupForm.tsx
│   │   └── ProtectedRoute.tsx
│   └── App.tsx
├── package.json
└── tsconfig.json
```

**lib/token-manager.ts**

```typescript
// トークン管理クラス
class TokenManager {
  // アクセストークン：メモリ
  private accessToken: string | null = null;

  // 定数
  private readonly REFRESH_TOKEN_KEY = "refresh_token";
  private readonly CLIENT_ID_KEY = "client_id";
  private readonly CLIENT_ID = "web-app-v1"; // プラットフォーム固有

  // アクセストークン管理
  setAccessToken(token: string) {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  // リフレッシュトークン + client_id管理
  setRefreshToken(refreshToken: string) {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(this.CLIENT_ID_KEY, this.CLIENT_ID);
  }

  getRefreshTokens(): { refreshToken: string | null; clientId: string | null } {
    return {
      refreshToken: localStorage.getItem(this.REFRESH_TOKEN_KEY),
      clientId: localStorage.getItem(this.CLIENT_ID_KEY),
    };
  }

  getClientId(): string {
    return this.CLIENT_ID;
  }

  // 全削除
  clearAll() {
    this.accessToken = null;
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.CLIENT_ID_KEY);
  }

  // リフレッシュ処理
  private refreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  async refreshIfNeeded(): Promise<boolean> {
    // 既にリフレッシュ中なら待機
    if (this.refreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshing = true;
    this.refreshPromise = (async () => {
      try {
        const { refreshToken, clientId } = this.getRefreshTokens();

        if (!refreshToken || !clientId) {
          return false;
        }

        const response = await fetch(
          "http://localhost:8080/api/v1/auth/refresh",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              refresh_token: refreshToken,
              client_id: clientId,
            }),
          },
        );

        if (response.ok) {
          const data = await response.json();
          this.setAccessToken(data.access_token);
          this.setRefreshToken(data.refresh_token);
          return true;
        }

        // リフレッシュ失敗
        if (response.status === 401) {
          const error = await response.json();
          if (error.error === "client_id_mismatch") {
            alert(
              "セキュリティ上の理由でログアウトしました。再度ログインしてください。",
            );
          }
        }

        return false;
      } catch (error) {
        console.error("Token refresh failed:", error);
        return false;
      } finally {
        this.refreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }
}

export const tokenManager = new TokenManager();
```

**lib/api-client.ts**

```typescript
import { tokenManager } from "./token-manager";

// APIクライアント
export async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {},
  retryCount = 0,
): Promise<T> {
  const MAX_RETRIES = 1;
  const BASE_URL = "http://localhost:8080/api/v1";

  // ヘッダー設定
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // アクセストークンを付与
  const accessToken = tokenManager.getAccessToken();
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      ...options,
      headers,
    });

    // 401エラー → 自動リフレッシュ
    if (response.status === 401 && retryCount < MAX_RETRIES) {
      const data = await response.json();

      if (data.error === "access_token_expired") {
        const refreshed = await tokenManager.refreshIfNeeded();

        if (refreshed) {
          // リトライ
          return apiRequest<T>(url, options, retryCount + 1);
        }
      }

      // リフレッシュ失敗 → ログアウト
      tokenManager.clearAll();
      window.location.href = "/login";
      throw new Error("Session expired");
    }

    // エラーハンドリング
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "API request failed");
    }

    return await response.json();
  } catch (error) {
    console.error("API request error:", error);
    throw error;
  }
}
```

**lib/auth.ts**

```typescript
import { apiRequest } from "./api-client";
import { tokenManager } from "./token-manager";

// 型定義
export interface User {
  id: number;
  email: string;
  is_verified: boolean;
  created_at: string;
}

export interface AuthResponse {
  message: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

// サインアップ - コード送信
export async function sendSignupCode(
  email: string,
  password: string,
): Promise<void> {
  await fetch("http://localhost:8080/api/v1/auth/signup/send-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      client_id: tokenManager.getClientId(),
    }),
  }).then((res) => {
    if (!res.ok) throw new Error("Failed to send code");
    return res.json();
  });
}

// サインアップ - コード確認
export async function verifySignupCode(
  email: string,
  code: string,
): Promise<User> {
  const data: AuthResponse = await fetch(
    "http://localhost:8080/api/v1/auth/signup/verify-code",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        code,
        client_id: tokenManager.getClientId(),
      }),
    },
  ).then((res) => {
    if (!res.ok) throw new Error("Invalid code");
    return res.json();
  });

  // トークン保存
  tokenManager.setAccessToken(data.access_token);
  tokenManager.setRefreshToken(data.refresh_token);

  return data.user;
}

// ログイン
export async function login(email: string, password: string): Promise<User> {
  const data: AuthResponse = await fetch(
    "http://localhost:8080/api/v1/auth/login",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        client_id: tokenManager.getClientId(),
      }),
    },
  ).then((res) => {
    if (!res.ok) throw new Error("Invalid credentials");
    return res.json();
  });

  // トークン保存
  tokenManager.setAccessToken(data.access_token);
  tokenManager.setRefreshToken(data.refresh_token);

  return data.user;
}

// ログアウト
export async function logout(): Promise<void> {
  const { refreshToken, clientId } = tokenManager.getRefreshTokens();

  if (refreshToken && clientId) {
    try {
      await fetch("http://localhost:8080/api/v1/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refresh_token: refreshToken,
          client_id: clientId,
        }),
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  // トークン削除
  tokenManager.clearAll();
}

// プロフィール取得
export async function getProfile(): Promise<User> {
  return apiRequest<User>("/user/profile");
}
```

**hooks/useAuth.ts**

```typescript
import { useState, useEffect } from "react";
import { User } from "../lib/auth";
import { tokenManager } from "../lib/token-manager";
import * as auth from "../lib/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 初回起動時の認証チェック
    async function checkAuth() {
      const { refreshToken, clientId } = tokenManager.getRefreshTokens();

      if (refreshToken && clientId) {
        // リフレッシュトークンがあれば認証試行
        const success = await tokenManager.refreshIfNeeded();

        if (success) {
          try {
            const profile = await auth.getProfile();
            setUser(profile);
          } catch (error) {
            console.error("Failed to get profile:", error);
          }
        }
      }

      setLoading(false);
    }

    checkAuth();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    const user = await auth.login(email, password);
    setUser(user);
  };

  const handleLogout = async () => {
    await auth.logout();
    setUser(null);
  };

  return {
    user,
    loading,
    login: handleLogin,
    logout: handleLogout,
    isAuthenticated: !!user,
  };
}
```

**components/LoginForm.tsx**

```typescript
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // ログイン成功 → リダイレクトは親コンポーネントで処理
    } catch (err: any) {
      setError(err.message || 'ログインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          メールアドレス
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          パスワード
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white rounded-md py-2 hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'ログイン中...' : 'ログイン'}
      </button>
    </form>
  );
}
```

**components/ProtectedRoute.tsx**

```typescript
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

---

### B. よくある質問（FAQ）

#### Q1: アクセストークンの有効期限は15分が絶対？

**A:** いいえ、プロジェクトの要件次第です。

```
短い（5分）:
✅ セキュリティ重視
❌ リフレッシュ頻度高い

標準（15分）:
✅ バランスが良い
✅ 推奨値

長い（60分）:
❌ セキュリティリスク
✅ パフォーマンス重視
```

**判断基準：**

- 金融系・医療系 → 5〜10分
- 一般的なWebアプリ → 15分
- 社内ツール → 30〜60分

---

#### Q2: client_idは本当に必要？

**A:** 必須ではないが、強く推奨します。

```
client_idなし:
- リフレッシュトークンだけで更新可能
- 盗まれたら即座に悪用される

client_idあり:
- リフレッシュトークン + client_id の両方が必要
- セキュリティ層が2重に
- 実装コストは低い
```

**追加の利点：**

- デバイスごとのセッション管理
- 異常なログイン検知
- セッション一覧表示

---

#### Q3: JWTに個人情報を入れても大丈夫？

**A:** Base64エンコードは暗号化ではありません。

```
❌ 入れてはいけない:
- パスワード（ハッシュも含む）
- クレジットカード番号
- マイナンバー
- 機密情報

✅ 入れて良い:
- user_id
- email（公開情報）
- role（権限）
- 有効期限
```

**原則：**
「誰に見られても問題ない情報だけ」

---

#### Q4: Redisが落ちたらどうなる？

**A:** リフレッシュトークンが使えなくなります。

```
影響範囲：
❌ トークン更新不可
❌ 新規ログイン不可
✅ アクセストークンは使える（15分間）

対策：
1. Redis のクラスタリング
2. 定期的なバックアップ
3. フェイルオーバー設定
4. 監視・アラート
```

---

#### Q5: スマホアプリでWebViewログインは本当にダメ？

**A:** 技術的には可能だが、UX・セキュリティ的に問題があります。

```
問題点：
❌ ネイティブUI が使えない
❌ 生体認証が難しい
❌ アプリストアの審査で不利
❌ ユーザー体験が悪い

推奨：
✅ JSON返却 + Keychain/Keystore
✅ ネイティブログイン画面
✅ 生体認証統合
```

---

#### Q6: ログアウト後もアクセストークンが使えるのは問題では？

**A:** 15分なら許容範囲です。

```
リスク評価：
- 盗まれても最大15分間のみ
- 新しいトークンは取得できない
- 重要な操作は再認証を要求

より厳密にする場合：
- ブラックリスト方式
- 有効期限を短く（5分）
- 重要操作で再認証必須
```

---

#### Q7: 同時ログイン数を制限すべき？

**A:** サービスの性質によります。

```
制限すべき場合：
✅ 有料サービス（アカウント共有防止）
✅ ライセンス制限がある
✅ セキュリティ重視

制限不要な場合：
✅ 個人の複数デバイス利用が前提
✅ 無料サービス
✅ 利便性重視
```

**実装方法：**

```
user:{user_id}:sessions に上限
例: 最大5セッション
超過時: 最も古いセッションを削除
```

---

#### Q8: パスワードリセット機能はどう実装する？

**A:** サインアップと同様のフローで実装できます。

```
フロー：
1. POST /auth/password-reset/send-code
   → メールに6桁コード送信

2. POST /auth/password-reset/verify-code
   → コード確認 + ワンタイムトークン発行

3. POST /auth/password-reset/complete
   → ワンタイムトークン + 新パスワード
   → パスワード更新
   → 全セッション無効化（強制ログアウト）
```

---

#### Q9: OAuth（Google, Twitterログイン）との統合は？

**A:** JWT認証と組み合わせ可能です。

```
フロー：
1. OAuth で認証
2. サーバー側でユーザー作成 or 取得
3. JWT + リフレッシュトークン発行
4. 以降は通常のJWT認証

実装：
- OAuthはログイン方法の1つ
- 内部的には同じトークン管理
```

---

#### Q10: テストはどう書く？

**A:** 各レイヤーで異なるテスト戦略を。

```
単体テスト：
✅ JWT生成・検証
✅ パスワードハッシュ化
✅ バリデーション

統合テスト：
✅ サインアップフロー全体
✅ ログインフロー
✅ トークンリフレッシュ
✅ エラーハンドリング

E2Eテスト：
✅ ユーザーの実際の操作
✅ 複数デバイス
✅ セッション管理
```

---

## 終わりに

この記事では、JWT認証システムの実装について、実際の経験をもとに解説してきました。

### 重要なポイントの振り返り

1. **JWTは認証フレームワークではなく、署名付きトークン**

   - 改ざん防止が本質
   - 認証システムの部品として使う

2. **アクセストークン + リフレッシュトークンの2本立て**

   - セキュリティと利便性の両立
   - client_idで更なる強化

3. **シーケンス図で考えることの重要性**

   - 5つの独立したフローに分解
   - 実装の迷いがなくなる

4. **HttpOnly Cookieは万能ではない**

   - モバイル対応が必要ならJSON返却
   - 適切なトレードオフを選択

5. **段階的な実装**
   - Phase 1: MVP
   - Phase 2: セキュリティ強化
   - Phase 3: 高度な機能

### 最後に

JWT認証システムの実装は、一見複雑に見えますが、本質を理解すれば驚くほどシンプルです。

```
核心：
1. JWTで本人確認
2. 期限切れたら更新

それだけ。
```

あとは、あなたのプロジェクトの要件に合わせて、適切なセキュリティレベルを選択するだけです。

この記事が、あなたの実装の助けになれば幸いです。

---

## 参考リソース

### 公式ドキュメント・仕様

- [RFC 7519 - JSON Web Token (JWT)](https://datatracker.ietf.org/doc/html/rfc7519)
- [RFC 6749 - OAuth 2.0](https://datatracker.ietf.org/doc/html/rfc6749)
- [jwt.io](https://jwt.io/) - JWT Debugger

### セキュリティ

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)

### ブログ・記事

- [Auth0 Blog](https://auth0.com/blog/)
- [Okta Developer Blog](https://developer.okta.com/blog/)
