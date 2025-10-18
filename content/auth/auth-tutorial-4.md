---
title: "JWT認証システム実装ガイド 第四回 - 本質を理解して堅牢な認証を構築する"
summary: "JWTは認証フレームワークではなく署名付きトークン。実装経験から学んだ本質的な理解と、Web/モバイル両対応の実践的な設計パターンを解説します。"
tags:
  ["JWT", "認証", "セキュリティ", "Web開発", "モバイル開発", "Redis", "API設計"]
---

## 5. 実装のベストプラクティス

### 5.1 トークン設計

#### 5.1.1 アクセストークン（JWT）の設計

**有効期限：15分が最適解**

```
短すぎる（5分）:
❌ リフレッシュ頻度が高すぎる
❌ サーバー負荷増加
❌ ネットワーク不安定時に問題

適切（15分）:
✅ セキュリティと利便性のバランス
✅ 盗まれても被害は15分間
✅ ログアウト時の残存トークンも許容範囲

長すぎる（60分以上）:
❌ 盗難時の被害が大きい
❌ ログアウト後も長時間使える
❌ セキュリティリスク
```

**JWT Payloadの設計：**

```json
{
  "user_id": 123,
  "email": "user@example.com",
  "iat": 1697544300, // issued at（発行日時）
  "exp": 1697545200 // expiration（有効期限）
}
```

**必須クレーム：**

| クレーム  | 説明                           | 重要度     |
| --------- | ------------------------------ | ---------- |
| `user_id` | ユーザー識別子                 | ⭐⭐⭐⭐⭐ |
| `exp`     | 有効期限（UNIXタイムスタンプ） | ⭐⭐⭐⭐⭐ |
| `iat`     | 発行日時                       | ⭐⭐⭐⭐   |

**オプションクレーム：**

| クレーム | 説明           | 使用例             |
| -------- | -------------- | ------------------ |
| `email`  | メールアドレス | ユーザー情報表示   |
| `role`   | ユーザーロール | 権限管理           |
| `jti`    | JWT ID         | ブラックリスト方式 |

**注意点：**

```
❌ 機密情報を入れない
  例：パスワードハッシュ、クレジットカード番号

❌ 大きすぎるデータを入れない
  例：プロフィール画像、長文の説明
  → JWTはHTTPヘッダーに含まれる
  → サイズが大きいとパフォーマンス低下

✅ 必要最小限のクレームのみ
  → user_id, email, role 程度
  → 詳細情報は別途API呼び出し
```

**実装例（Go）：**

```go
import (
    "time"
    "github.com/golang-jwt/jwt/v5"
)

type JWTClaims struct {
    UserID int    `json:"user_id"`
    Email  string `json:"email"`
    jwt.RegisteredClaims
}

func GenerateAccessToken(userID int, email string) (string, error) {
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
    return token.SignedString([]byte(os.Getenv("JWT_SECRET_KEY")))
}

func ValidateAccessToken(tokenString string) (*JWTClaims, error) {
    token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
        // アルゴリズム検証
        if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
        }
        return []byte(os.Getenv("JWT_SECRET_KEY")), nil
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

---

#### 5.1.2 リフレッシュトークン（UUID）の設計

**形式：UUID v4**

```
例: 550e8400-e29b-41d4-a716-446655440000

特徴：
✅ 完全にランダム（推測不可能）
✅ 衝突確率が極めて低い（実質的にゼロ）
✅ 統一された形式（36文字）
```

**有効期限：最終更新から30日間（スライディングウィンドウ）**

```
従来方式（固定期限）:
発行日: 2025-01-01
期限: 2025-01-31
問題: 毎日使っても1/31に突然ログアウト

スライディングウィンドウ方式:
最終使用: 2025-01-30
期限: 2025-02-29（30日後）
利点: アクティブユーザーは実質無期限
     非アクティブは自動ログアウト
```

**実装例（Go + Redis）：**

```go
import (
    "github.com/google/uuid"
    "github.com/redis/go-redis/v9"
    "time"
)

func GenerateRefreshToken(userID int, clientID string) (string, error) {
    // UUID生成
    token := uuid.New().String()

    // Redis保存
    key := fmt.Sprintf("refresh_token:%s", token)
    value := map[string]interface{}{
        "user_id":    userID,
        "client_id":  clientID,
        "created_at": time.Now().Unix(),
    }

    ctx := context.Background()
    err := redisClient.HSet(ctx, key, value).Err()
    if err != nil {
        return "", err
    }

    // TTL設定（30日）
    err = redisClient.Expire(ctx, key, 30*24*time.Hour).Err()
    if err != nil {
        return "", err
    }

    return token, nil
}

func ValidateRefreshToken(token, clientID string) (int, error) {
    ctx := context.Background()
    key := fmt.Sprintf("refresh_token:%s", token)

    // Redis取得
    result, err := redisClient.HGetAll(ctx, key).Result()
    if err != nil || len(result) == 0 {
        return 0, fmt.Errorf("invalid or expired token")
    }

    // client_id照合
    if result["client_id"] != clientID {
        // セキュリティ脅威検知
        log.Warn("client_id mismatch detected",
            "user_id", result["user_id"],
            "stored_client_id", result["client_id"],
            "request_client_id", clientID)

        // トークン無効化
        redisClient.Del(ctx, key)

        return 0, fmt.Errorf("client_id mismatch")
    }

    // TTLリセット（スライディングウィンドウ）
    redisClient.Expire(ctx, key, 30*24*time.Hour)

    userID, _ := strconv.Atoi(result["user_id"])
    return userID, nil
}
```

---

#### 5.1.3 JWT署名アルゴリズムの選択

**HS256 vs RS256**

| 項目                 | HS256（対称鍵）   | RS256（非対称鍵）         |
| -------------------- | ----------------- | ------------------------- |
| **暗号化方式**       | HMAC + SHA256     | RSA + SHA256              |
| **鍵の種類**         | 共通鍵（1つ）     | 公開鍵 + 秘密鍵           |
| **署名速度**         | ⭐⭐⭐⭐⭐ 高速   | ⭐⭐⭐ やや遅い           |
| **検証速度**         | ⭐⭐⭐⭐⭐ 高速   | ⭐⭐⭐⭐ 高速             |
| **鍵管理**           | ⭐⭐⭐ シンプル   | ⭐⭐ 複雑                 |
| **マイクロサービス** | ⭐⭐ 鍵共有が必要 | ⭐⭐⭐⭐⭐ 公開鍵配布のみ |

**使い分け：**

```
HS256を選ぶべき場合:
✅ シンプルなアプリケーション
✅ モノリシックアーキテクチャ
✅ 単一サーバー
✅ パフォーマンス重視

RS256を選ぶべき場合:
✅ マイクロサービス
✅ 複数サービスでJWT検証
✅ サードパーティにJWT発行
✅ 鍵のローテーションを頻繁に行う
```

**HS256実装例：**

```go
// 秘密鍵（環境変数）
JWT_SECRET_KEY=your-super-secret-key-here-min-32-chars

// 署名
token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
tokenString, _ := token.SignedString([]byte(os.Getenv("JWT_SECRET_KEY")))

// 検証
token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
    return []byte(os.Getenv("JWT_SECRET_KEY")), nil
})
```

**RS256実装例：**

```go
// 秘密鍵（RSA）
privateKey, _ := rsa.GenerateKey(rand.Reader, 2048)

// 署名
token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
tokenString, _ := token.SignedString(privateKey)

// 検証（公開鍵のみ必要）
publicKey := &privateKey.PublicKey
token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
    return publicKey, nil
})
```

**今回の実装での選択：**

```
✅ HS256を採用

理由：
1. シンプルなアーキテクチャ
2. 高速な署名・検証
3. 鍵管理が簡単
4. 十分なセキュリティレベル
```

---

### 5.2 Redis活用戦略

#### 5.2.1 データ構造の設計

**1. サインアップセッション（仮登録）**

```
Key: signup:{email}
Type: Hash
TTL: 900秒（15分）

フィールド:
  password_hash: "$2a$10$..."
  code: "123456"
  client_id: "web-app-v1"
  created_at: "1697544300"

コマンド例:
HSET signup:user@example.com password_hash "$2a$10$..." code "123456" client_id "web-app-v1"
EXPIRE signup:user@example.com 900
```

**2. リフレッシュトークン**

```
Key: refresh_token:{uuid}
Type: Hash
TTL: 2592000秒（30日、スライディング）

フィールド:
  user_id: "123"
  client_id: "web-app-v1"
  created_at: "1697544300"
  ip_address: "192.168.1.1" (オプション)
  device_info: "iPhone 15 Pro" (オプション)

コマンド例:
HSET refresh_token:550e8400-e29b-41d4-a716-446655440000 user_id "123" client_id "web-app-v1"
EXPIRE refresh_token:550e8400-e29b-41d4-a716-446655440000 2592000
```

**3. ユーザーセッション一覧**

```
Key: user:{user_id}:sessions
Type: Set
TTL: なし（手動管理）

要素: "{uuid}:{client_id}"

コマンド例:
SADD user:123:sessions "550e8400-...:web-app-v1"
SADD user:123:sessions "660e8400-...:ios-app-v1"

全セッション取得:
SMEMBERS user:123:sessions

セッション削除:
SREM user:123:sessions "550e8400-...:web-app-v1"
```

**4. レート制限**

```
Key: rate_limit:{email}
Type: String（カウンター）
TTL: 300秒（5分）

値: 試行回数

コマンド例:
INCR rate_limit:user@example.com
EXPIRE rate_limit:user@example.com 300
GET rate_limit:user@example.com
```

---

#### 5.2.2 実装パターン

**完全な実装例（Go + Redis）：**

```go
package auth

import (
    "context"
    "fmt"
    "time"
    "github.com/redis/go-redis/v9"
    "github.com/google/uuid"
)

type RedisAuthStore struct {
    client *redis.Client
}

// サインアップセッション保存
func (r *RedisAuthStore) SaveSignupSession(email, passwordHash, code, clientID string) error {
    ctx := context.Background()
    key := fmt.Sprintf("signup:%s", email)

    data := map[string]interface{}{
        "password_hash": passwordHash,
        "code":          code,
        "client_id":     clientID,
        "created_at":    time.Now().Unix(),
    }

    if err := r.client.HSet(ctx, key, data).Err(); err != nil {
        return err
    }

    return r.client.Expire(ctx, key, 15*time.Minute).Err()
}

// サインアップセッション取得
func (r *RedisAuthStore) GetSignupSession(email string) (map[string]string, error) {
    ctx := context.Background()
    key := fmt.Sprintf("signup:%s", email)

    result, err := r.client.HGetAll(ctx, key).Result()
    if err != nil || len(result) == 0 {
        return nil, fmt.Errorf("session not found")
    }

    return result, nil
}

// サインアップセッション削除
func (r *RedisAuthStore) DeleteSignupSession(email string) error {
    ctx := context.Background()
    key := fmt.Sprintf("signup:%s", email)
    return r.client.Del(ctx, key).Err()
}

// リフレッシュトークン保存
func (r *RedisAuthStore) SaveRefreshToken(userID int, clientID string) (string, error) {
    ctx := context.Background()
    token := uuid.New().String()
    key := fmt.Sprintf("refresh_token:%s", token)

    data := map[string]interface{}{
        "user_id":    userID,
        "client_id":  clientID,
        "created_at": time.Now().Unix(),
    }

    if err := r.client.HSet(ctx, key, data).Err(); err != nil {
        return "", err
    }

    if err := r.client.Expire(ctx, key, 30*24*time.Hour).Err(); err != nil {
        return "", err
    }

    // ユーザーセッション一覧に追加
    sessionKey := fmt.Sprintf("user:%d:sessions", userID)
    sessionValue := fmt.Sprintf("%s:%s", token, clientID)
    r.client.SAdd(ctx, sessionKey, sessionValue)

    return token, nil
}

// リフレッシュトークン検証
func (r *RedisAuthStore) ValidateRefreshToken(token, clientID string) (int, error) {
    ctx := context.Background()
    key := fmt.Sprintf("refresh_token:%s", token)

    result, err := r.client.HGetAll(ctx, key).Result()
    if err != nil || len(result) == 0 {
        return 0, fmt.Errorf("invalid or expired token")
    }

    // client_id照合
    if result["client_id"] != clientID {
        log.Printf("client_id mismatch: stored=%s, requested=%s", result["client_id"], clientID)
        r.client.Del(ctx, key) // トークン無効化
        return 0, fmt.Errorf("client_id mismatch")
    }

    // TTLリセット（スライディングウィンドウ）
    r.client.Expire(ctx, key, 30*24*time.Hour)

    userID, _ := strconv.Atoi(result["user_id"])
    return userID, nil
}

// リフレッシュトークン削除
func (r *RedisAuthStore) DeleteRefreshToken(token string, userID int, clientID string) error {
    ctx := context.Background()

    // トークン削除
    key := fmt.Sprintf("refresh_token:%s", token)
    if err := r.client.Del(ctx, key).Err(); err != nil {
        return err
    }

    // ユーザーセッション一覧から削除
    sessionKey := fmt.Sprintf("user:%d:sessions", userID)
    sessionValue := fmt.Sprintf("%s:%s", token, clientID)
    return r.client.SRem(ctx, sessionKey, sessionValue).Err()
}

// 全セッション削除（全デバイスログアウト）
func (r *RedisAuthStore) DeleteAllSessions(userID int) error {
    ctx := context.Background()
    sessionKey := fmt.Sprintf("user:%d:sessions", userID)

    // 全セッション取得
    sessions, err := r.client.SMembers(ctx, sessionKey).Result()
    if err != nil {
        return err
    }

    // 各トークン削除
    for _, session := range sessions {
        parts := strings.Split(session, ":")
        if len(parts) != 2 {
            continue
        }
        token := parts[0]
        key := fmt.Sprintf("refresh_token:%s", token)
        r.client.Del(ctx, key)
    }

    // セッション一覧削除
    return r.client.Del(ctx, sessionKey).Err()
}

// レート制限チェック
func (r *RedisAuthStore) CheckRateLimit(email string, maxAttempts int, window time.Duration) (bool, error) {
    ctx := context.Background()
    key := fmt.Sprintf("rate_limit:%s", email)

    // カウント増加
    count, err := r.client.Incr(ctx, key).Result()
    if err != nil {
        return false, err
    }

    // 初回なら期限設定
    if count == 1 {
        r.client.Expire(ctx, key, window)
    }

    // 上限チェック
    return count <= int64(maxAttempts), nil
}
```

---

### 5.3 エラーハンドリング

#### 5.3.1 統一されたエラーレスポンス

**標準エラー形式：**

```json
{
  "error": "error_code",
  "message": "ユーザー向けメッセージ",
  "details": [
    {
      "field": "email",
      "message": "有効なメールアドレスを入力してください"
    }
  ]
}
```

**エラーコード体系：**

```
認証エラー（401）:
- invalid_credentials: 認証情報が間違っている
- access_token_expired: アクセストークンが期限切れ
- refresh_token_invalid: リフレッシュトークンが無効
- client_id_mismatch: client_idが一致しない

バリデーションエラー（400）:
- validation_error: 入力値の検証エラー
- email_already_exists: メールアドレスが既に存在
- session_not_found: セッションが見つからない
- invalid_code: 確認コードが不正

レート制限（429）:
- rate_limit_exceeded: レート制限超過

サーバーエラー（500）:
- internal_server_error: サーバー内部エラー
```

**実装例（Go + Fiber）：**

```go
type ErrorResponse struct {
    Error   string        `json:"error"`
    Message string        `json:"message"`
    Details []ErrorDetail `json:"details,omitempty"`
}

type ErrorDetail struct {
    Field   string `json:"field"`
    Message string `json:"message"`
}

// エラーハンドラー
func HandleError(c *fiber.Ctx, statusCode int, errorCode, message string, details []ErrorDetail) error {
    return c.Status(statusCode).JSON(ErrorResponse{
        Error:   errorCode,
        Message: message,
        Details: details,
    })
}

// 使用例
func LoginHandler(c *fiber.Ctx) error {
    var req LoginRequest
    if err := c.BodyParser(&req); err != nil {
        return HandleError(c, 400, "validation_error", "不正なリクエストです", nil)
    }

    // ユーザー検索
    user, err := db.FindUserByEmail(req.Email)
    if err != nil {
        // メールアドレスの存在を隠す
        return HandleError(c, 401, "invalid_credentials",
            "メールアドレスまたはパスワードが間違っています", nil)
    }

    // パスワード検証
    if !bcrypt.CompareHashAndPassword(user.PasswordHash, req.Password) {
        return HandleError(c, 401, "invalid_credentials",
            "メールアドレスまたはパスワードが間違っています", nil)
    }

    // トークン発行...
}
```

---

#### 5.3.2 クライアント側のエラーハンドリング

```typescript
// エラーハンドリング戦略
async function apiRequest(url: string, options: RequestInit = {}) {
  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      switch (response.status) {
        case 401:
          return handleUnauthorized(data, url, options);
        case 429:
          return handleRateLimit(data);
        case 400:
          return handleValidationError(data);
        default:
          return handleGenericError(data);
      }
    }

    return data;
  } catch (error) {
    console.error("Network error:", error);
    throw new Error("ネットワークエラーが発生しました");
  }
}

// 401エラー処理
async function handleUnauthorized(
  error: any,
  url: string,
  options: RequestInit,
) {
  if (error.error === "access_token_expired") {
    // 自動リフレッシュ
    const refreshed = await tokenManager.refreshIfNeeded();

    if (refreshed) {
      // リトライ
      return apiRequest(url, options);
    }
  }

  if (error.error === "client_id_mismatch") {
    // セキュリティ警告
    alert(
      "セキュリティ上の理由でログアウトしました。再度ログインしてください。",
    );
  }

  // ログアウト
  tokenManager.clearAll();
  window.location.href = "/login";
  throw error;
}

// 429エラー処理
function handleRateLimit(error: any) {
  alert("アクセスが集中しています。しばらく待ってから再度お試しください。");
  throw error;
}

// バリデーションエラー処理
function handleValidationError(error: any) {
  if (error.details && error.details.length > 0) {
    // フィールドごとのエラー表示
    error.details.forEach((detail: any) => {
      showFieldError(detail.field, detail.message);
    });
  } else {
    alert(error.message);
  }
  throw error;
}
```

---

### 5.4 セキュリティチェックリスト

実装前・実装後に確認すべき項目：

#### 5.4.1 トークン管理

```
□ アクセストークンの有効期限は15分以内
□ リフレッシュトークンの有効期限は30日以内
□ JWTに機密情報を含めていない
□ JWT署名の検証を必ず行う
□ client_idによる2段階検証を実装
□ リフレッシュトークンローテーション実装済み
□ スライディングウィンドウ方式を採用
```

#### 5.4.2 パスワード

```
□ bcryptでハッシュ化（cost=10以上）
□ 最小8文字以上を要求
□ 平文パスワードをログに出力しない
□ パスワードをDBに平文保存しない
□ パスワードをRedisに平文保存しない
```

#### 5.4.3 通信

```
□ 本番環境では必ずHTTPS使用
□ HSTS（HTTP Strict Transport Security）設定
□ TLS 1.2以上を使用
□ 証明書の有効期限を監視
```

#### 5.4.4 API

```
□ レート制限を実装（ログイン: 5回/5分）
□ CORS設定を適切に行う
□ CSRFトークン（必要に応じて）
□ 入力値のバリデーション
□ SQLインジェクション対策
□ XSS対策（入力値のサニタイゼーション）
```

#### 5.4.5 エラーハンドリング

```
□ エラーメッセージで機密情報を漏らさない
□ メールアドレスの存在を推測させない
□ スタックトレースを公開しない
□ 統一されたエラー形式を使用
```

#### 5.4.6 ログ・監視

```
□ 認証失敗をログに記録
□ client_id不一致を検知・通知
□ 異常なアクセスパターンを監視
□ 個人情報をログに出力しない
□ ログの定期的なレビュー体制
```

---

## 6. よくある落とし穴と解決策

### 6.1 トークン管理の罠

#### 罠1：両方のトークンをlocalStorageに保存

```typescript
// ❌ 悪い例
localStorage.setItem("access_token", accessToken); // 危険！
localStorage.setItem("refresh_token", refreshToken);

// XSSで簡単に盗まれる
const stolen = {
  access: localStorage.getItem("access_token"),
  refresh: localStorage.getItem("refresh_token"),
};
```

**解決策：**

```typescript
// ✅ 良い例
class TokenManager {
  private accessToken: string | null = null; // メモリ

  setAccessToken(token: string) {
    this.accessToken = token; // XSSで盗めない
  }

  setRefreshToken(token: string, clientId: string) {
    localStorage.setItem("refresh_token", token);
    localStorage.setItem("client_id", clientId);
    // リフレッシュトークン単体では使えない（client_id必要）
  }
}
```

---

#### 罠2：リフレッシュトークンを再利用

```go
// ❌ 悪い例：同じトークンを使い続ける
func RefreshToken(token string) (*TokenPair, error) {
    // 検証だけして同じトークンを返す
    session := redis.Get("refresh_token:" + token)
    newAccessToken := generateJWT(session.UserID)

    return &TokenPair{
        AccessToken:  newAccessToken,
        RefreshToken: token,  // 同じトークン！危険！
    }
}

// 問題：トークンが盗まれた場合、攻撃者と正規ユーザーが同じトークンを使える
```

**解決策：**

```go
// ✅ 良い例：トークンローテーション
func RefreshToken(oldToken, clientID string) (*TokenPair, error) {
    // 検証
    session := redis.Get("refresh_token:" + oldToken)
    if session.ClientID != clientID {
        redis.Del("refresh_token:" + oldToken)  // 無効化
        return nil, errors.New("client_id mismatch")
    }

    // 新トークン生成
    newRefreshToken := uuid.New().String()
    newAccessToken := generateJWT(session.UserID)

    // 古いトークン削除
    redis.Del("refresh_token:" + oldToken)

    // 新しいトークン保存
    redis.Set("refresh_token:" + newRefreshToken, session, 30*24*time.Hour)

    return &TokenPair{
        AccessToken:  newAccessToken,
        RefreshToken: newRefreshToken,  // 新しいトークン
    }
}
```

---

#### 罠3：無限ループするリフレッシュ

```typescript
// ❌ 悪い例
async function apiRequest(url: string) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });

  if (response.status === 401) {
    await refreshTokens(); // リフレッシュ
    return apiRequest(url); // リトライ
  }

  return response;
}

// 問題：リフレッシュも401を返すと無限ループ
```

**解決策：**

```typescript
// ✅ 良い例
let refreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function apiRequest(url: string, retryCount = 0) {
  const MAX_RETRIES = 1; // リトライは1回まで

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });

  if (response.status === 401 && retryCount < MAX_RETRIES) {
    const refreshed = await refreshTokens();

    if (refreshed) {
      return apiRequest(url, retryCount + 1); // リトライ（カウント増加）
    } else {
      // リフレッシュ失敗 → ログアウト
      logout();
      throw new Error("Session expired");
    }
  }

  return response;
}

async function refreshTokens(): Promise<boolean> {
  // 既にリフレッシュ中なら待機
  if (refreshing && refreshPromise) {
    return refreshPromise;
  }

  refreshing = true;
  refreshPromise = (async () => {
    try {
      const { refreshToken, clientId } = tokenManager.getRefreshTokens();

      const response = await fetch("/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refresh_token: refreshToken,
          client_id: clientId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        tokenManager.setAccessToken(data.access_token);
        tokenManager.setRefreshTokens(data.refresh_token, clientId);
        return true;
      }

      return false;
    } finally {
      refreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
```

---

### 6.2 ログアウト時の問題

#### 罠4：アクセストークンが残る

```
問題：
ユーザーがログアウト
→ リフレッシュトークンは削除される
→ でもアクセストークンは最大15分間有効

攻撃者がアクセストークンを盗んでいた場合：
→ ログアウト後も15分間は使える
```

**解決策A：許容する（推奨）**

```
✅ 15分は短いので実用上問題なし
✅ 実装がシンプル
✅ パフォーマンスが良い
✅ スケールしやすい

リスク軽減策：
- アクセストークンの有効期限を短くする（15分 → 5分）
- 重要な操作は再認証を要求
- 異常なアクセスパターンを監視
```

**解決策B：ブラックリスト方式**

```go
// JWT に jti (JWT ID) を追加
type JWTClaims struct {
    UserID int    `json:"user_id"`
    JTI    string `json:"jti"`  // JWT固有ID
    jwt.RegisteredClaims
}

// ログアウト時
func Logout(accessToken string) error {
    claims, _ := parseJWT(accessToken)

    // JTIをブラックリストに追加
    key := fmt.Sprintf("blacklist:%s", claims.JTI)
    ttl := time.Until(time.Unix(claims.ExpiresAt, 0))  // 期限まで
    redis.Set(key, "1", ttl)

    return nil
}

// 全リクエストで検証
func ValidateToken(token string) error {
    claims, _ := parseJWT(token)

    // ブラックリストチェック
    key := fmt.Sprintf("blacklist:%s", claims.JTI)
    exists := redis.Exists(key)

    if exists {
        return errors.New("token has been revoked")
    }

    return nil
}
```

**トレードオフ：**

```
利点：
✅ 即座にログアウト可能
✅ セキュリティが高い

欠点：
❌ 全リクエストでRedisアクセス必要
❌ パフォーマンス低下
❌ Redisが単一障害点になる
❌ JWTのステートレスの利点が失われる
```

---

### 6.3 モバイル対応の盲点

#### 罠5：WebViewの制約

```
問題：
HttpOnly Cookieを使いたい
→ WebViewでログイン
→ ネイティブ画面に戻る
→ Cookie が使えない（別コンテキスト）
```

**解決策：**

```
✅ JSON返却方式を採用
✅ client_idで2段階検証
✅ ネイティブのセキュアストレージ使用
  - iOS: Keychain
  - Android: Keystore
```

---

#### 罠6：ディープリンク認証

```
シナリオ：
メールのリンクをタップ
→ アプリが開く
→ トークンをどう渡す？
```

**悪い例：**

```
// ❌ URLにトークンを含める
myapp://auth?access_token=eyJhbGci...&refresh_token=550e8400...

問題：
- URLはログに残る
- ブラウザ履歴に残る
- 他のアプリから読める可能性
```

**良い例：**

```
// ✅ ワンタイムコードを使う
myapp://auth?code=abc123

// アプリ側
func handleDeepLink(code: String) {
    // サーバーにコードを送信してトークンと交換
    let response = await api.exchangeCode(code)

    // トークン保存
    KeychainHelper.save("access_token", response.accessToken)
    KeychainHelper.save("refresh_token", response.refreshToken)
    KeychainHelper.save("client_id", "ios-app-v1")
}

// サーバー側
func ExchangeCode(code string) (*TokenPair, error) {
    // コードを検証（1回のみ使用可能、5分で期限切れ）
    session := redis.Get("auth_code:" + code)
    if session == nil {
        return nil, errors.New("invalid or expired code")
    }

    // コード削除（使い捨て）
    redis.Del("auth_code:" + code)

    // トークン発行
    return generateTokenPair(session.UserID, session.ClientID)
}
```

---

### 6.4 その他の落とし穴

#### 罠7：JWT署名検証を忘れる

```go
// ❌ 悪い例：署名検証なし
func ParseJWT(tokenString string) (*JWTClaims, error) {
    parts := strings.Split(tokenString, ".")
    payload, _ := base64.URLEncoding.DecodeString(parts[1])

    var claims JWTClaims
    json.Unmarshal(payload, &claims)

    return &claims, nil  // 署名未検証！危険！
}

// 攻撃者が改ざん可能：
// user_id を 123 → 999 に書き換え
// → 他人のデータにアクセスできる
```

**解決策：**

```go
// ✅ 良い例：必ず署名検証
func ParseJWT(tokenString string) (*JWTClaims, error) {
    token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
        // アルゴリズム確認
        if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, fmt.Errorf("unexpected signing method")
        }
        return []byte(os.Getenv("JWT_SECRET_KEY")), nil
    })

    if err != nil {
        return nil, err  // 署名エラー or 期限切れ
    }

    if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
        return claims, nil
    }

    return nil, errors.New("invalid token")
}
```

---

#### 罠8：秘密鍵をハードコード

```go
// ❌ 超危険！
const JWT_SECRET = "my-secret-key"

func GenerateJWT(userID int) string {
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    tokenString, _ := token.SignedString([]byte(JWT_SECRET))
    return tokenString
}

// 問題：
// - Gitにコミットされる
// - 誰でも見られる
// - 変更が困難
```

**解決策：**

```bash
# .env ファイル
JWT_SECRET_KEY=your-super-secret-key-here-min-32-chars-random-string

# .gitignore に追加
.env
```

```go
// ✅ 環境変数から読み込む
import "os"

func GenerateJWT(userID int) string {
    secretKey := os.Getenv("JWT_SECRET_KEY")
    if secretKey == "" {
        panic("JWT_SECRET_KEY not set")
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    tokenString, _ := token.SignedString([]byte(secretKey))
    return tokenString
}
```

---

## まとめ（第4回）

### 今回学んだこと

1. **トークン設計のベストプラクティス**

   - アクセストークン：15分、JWT、ステートレス
   - リフレッシュトークン：30日、UUID、ステートフル
   - client_idによる2段階検証

2. **Redis活用戦略**

   - サインアップセッション、リフレッシュトークン、レート制限
   - スライディングウィンドウ方式
   - ユーザーセッション一覧管理

3. **エラーハンドリング**

   - 統一されたエラー形式
   - セキュリティ情報を漏らさない
   - クライアント側の自動リトライ

4. **セキュリティチェックリスト**

   - トークン管理、パスワード、通信、API、ログ

5. **よくある落とし穴**
   - localStorage への両方保存（NG）
   - リフレッシュトークン再利用（NG）
   - 無限ループリフレッシュ（NG）
   - JWT署名検証忘れ（超危険）
   - 秘密鍵ハードコード（超危険）

### 次回予告

次回は [**「まとめ + 付録」**](https://techblog-v2.vercel.app/auth/auth-tutorial-5) です。

- JWT認証のポイント総復習
- 実装の優先順位（Phase 1〜3）
- さらに学ぶためのリソース
- 完全なサンプルコード（Go + TypeScript）
- よくある質問（FAQ）

全5回の集大成として、実装に必要な全ての情報をまとめます。
