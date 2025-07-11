---
title: "ブースのアルゴリズムをC++で実装してみた"
summary: "二進数の掛け算はハードウェア内でどのように行われているのかを確認しました"
tags: ["C++", "ブースのアルゴリズム", "Algorithm"]
---

ブースのアルゴリズム実装した記事が見つからない上にChatGPTに聞いても的外れなコードしか出来上がらないので自分で作ってみました．

# ブースのアルゴリズムとは？

符号付き二進数の乗算を効率的に行う手法です．加算器作ったならもちろん乗算器も作りたくなるよね？でも加算を何度もする乗算は計算に時間がかかってしまうので，ブースのアルゴリズムが編み出されました．

## アルゴリズムの概要

アルゴリズムは以下の通りです．

1. 被乗数と乗数を二の補数表現で用意します．(今回は4bit分用意してみます)
2. 被乗数については，符号を変えたものも用意しておきます．(もちろん補数表現を使用しますが，わかりやすいように以降は「-被乗数」とします)
3. $A$を「被乗数 + 00000」,$S$を「-被乗数 + 00000」とします．
4. $P_0$を「0000 + 乗数 + 0」とします．
5. 漸化的に$P_n$を求めていきます．4bit同士の演算の場合，$P_4$まで求めます．
   - $P_{n}$の末尾2bitが「00」あるいは「11」の場合，$P_{n}$を算術右シフトしたものを$P_n$とする
   - 末尾が「01」の場合，$P_{n}$に$A$を加算したうえで右シフトしたものを$P_{n+1}$とする
   - 末尾が「10」の場合，$P_{n}$に$S$を加算したうえで右シフトしたものを$P_{n+1}$とする
6. $P_4$の上位8桁が解となります．

詳しくは[シフト演算とは？論理シフトと算術シフトの違いを調べよう！](https://itmanabi.com/shift-operation/)を参考にすると良いです．

# C++による実装

別にCでも書けるんですけど，練習したいのでC++で書きます．

## ライブラリのインポートや定数など

```cpp
#include <iostream>
#include <vector>

constexpr int BIT_SIZE = 4;
constexpr int TABLE_SIZE = 2 * BIT_SIZE + 1;

using namespace std;
```

## BoothAlgorithmクラスの構築

必要な変数は

1. 被乗数
1. -被乗数
1. $P_0$

で，必要な関数は，

1. 整数を二進数に変換する関数
1. 算術右シフトさせる関数
1. 二進数加算させる関数
1. $P_{n+1}$を求める関数
1. 配列を表示させる関数
1. 再帰的に$P$を求める関数

です．

### メンバ変数

まずは必要なメンバ変数を用意します．先ほどと同様に$A$は被乗数，$S$は-被乗数，$P_0$を乗数とします．

```cpp
class BoothAlgorithm {
  public:
  private:
   vector<int> A, S, P_0, Result;
```

### 整数を二進数に変換する関数to_binary

` binary[bit_size - 1 - i] = (x >> i) & 1;`とすることで，10進数の値を2進数にしたときにi桁目の値を対応する配列に格納していきます．

```cpp
    vector<int> to_binary(int x, int bit_size) {
      vector<int> binary(bit_size, 0);

      for (int i = 0; i < bit_size; i++) {
          binary[bit_size - 1 - i] = (x >> i) & 1;
      }

      return binary;
    }
```

### 算術シフトさせる関数right_shift

算術シフトですので最上位ビットの処理に気をつけます．

```cpp
    void right_shift(vector<int>& vec) {
      for (int i = vec.size() - 1; i > 0; --i) {
        vec[i] = vec[i - 1];
      }
      vec[0] = vec[0] == 1 ? 1 : 0;
    }
```

### 二進数加算させる関数add_vectors

単純に要素ごとに加算させると，10進数として計算してしまうため，二進数としての繰り上がりを考慮する必要があります．

```cpp
    vector<int> add_vectors(const vector<int>& vec1, const vector<int>& vec2) {
      vector<int> result(vec1.size());
      int carry = 0;

      for (size_t i = vec1.size(); i-- > 0;) {
        int sum = vec1[i] + vec2[i] + carry;
        result[i] = sum % 2;
        carry = sum / 2;
      }

      return result;
    }
```

### $P_{n+1}$を求める関数conditional_shift

- $P_{n}$の末尾2bitが「00」あるいは「11」の場合，$P_{n}$を算術右シフトしたものを$P_n$とする
- 末尾が「01」の場合，$P_{n}$に$A$を加算したうえで右シフトしたものを$P_{n+1}$とする
- 末尾が「10」の場合，$P_{n}$に$S$を加算したうえで右シフトしたものを$P_{n+1}$とする

という条件をもとにシフトさせる関数を作ります．

```cpp
    vector<int> conditional_shift(const vector<int>& A, const vector<int>& S, const vector<int>& P) {
      vector<int> result = P;

      if (P[TABLE_SIZE - 2] == P[TABLE_SIZE - 1]) {
        right_shift(result);
      } else if (P[TABLE_SIZE - 2] == 0) {
        result = add_vectors(result, A);

        right_shift(result);
      } else {
        result = add_vectors(result, S);

        right_shift(result);
      }

      return result;
    }
```

### 配列を表示させる関数

あるとわかりやすいね

```cpp
    void print_array(const vector<int>& arr) {
      for (int i = 0; i < arr.size(); i++) {
        cout << arr[i] << " ";
      }
      cout << endl;
    }
```

### 再帰的に$P$を求める関数

先ほど作った`conditional_shift()`を使って$P_1\sim P_4$まで再帰的に計算させます．

```cpp
    vector<int> booth_algorithm(vector<int>& A, vector<int>& S, vector<int>& P, int count = BIT_SIZE) {
      if (count > 0) {
        P = conditional_shift(A, S, P);

        cout << "P_" << BIT_SIZE - count + 1 << ": ";
        print_array(P);

        return booth_algorithm(A, S, P, count - 1);
      } else {
        vector<int> Result(TABLE_SIZE - 1, 0);

        for (int i = 0; i < TABLE_SIZE - 1; i++) {
          Result[i] = P[i];
        }

        return Result;
      }
    }
```

### コンストラクタなど

コンストラクタでは，整数x, yを受け取り，2進数に変換しつつ適切な形式に変換して，各メンバ変数に代入していきます．また実行のために関数runを用意します．

```cpp
  public:
    BoothAlgorithm(int x, int y) {
      A.resize(TABLE_SIZE, 0);
      S.resize(TABLE_SIZE, 0);
      P_0.resize(TABLE_SIZE, 0);
      Result.resize(TABLE_SIZE - 1, 0);

      vector<int> binary_x = to_binary(x, BIT_SIZE);
      vector<int> binary_minus_x = to_binary(-x, BIT_SIZE);
      vector<int> binary_y = to_binary(y, BIT_SIZE);

      for (int i = 0; i < BIT_SIZE; i++) {
        A[i] = binary_x[i];
        S[i] = binary_minus_x[i];
        P_0[i + BIT_SIZE] = binary_y[i];
      }
    }

    void run() {
      cout << "P_0: ";
      print_array(P_0);

      Result = booth_algorithm(A, S, P_0);

      cout << "Result: ";
      print_array(Result);
    }
```

## main関数

あとはmain関数を書けば完成です．

```cpp
int main() {
  int x, y;
  cin >> x >> y;

  BoothAlgorithm booth(x, y);
  booth.run();

  return 0;
}
```

# 実際に実行してみる

```zsh
❯ cpp booth.cpp
-6 5
P_0: 0 0 0 0 0 1 0 1 0
P_1: 0 0 1 1 0 0 1 0 1
P_2: 1 1 1 0 1 0 0 1 0
P_3: 0 0 1 0 0 1 0 0 1
P_4: 1 1 1 0 0 0 1 0 0
Result: 1 1 1 0 0 0 1 0

❯ cpp booth.cpp
5 -6
P_0: 0 0 0 0 1 0 1 0 0
P_1: 0 0 0 0 0 1 0 1 0
P_2: 1 1 0 1 1 0 1 0 1
P_3: 0 0 0 1 0 1 0 1 0
P_4: 1 1 1 0 0 0 1 0 1
Result: 1 1 1 0 0 0 1 0

❯ cpp booth.cpp
4 -3
P_0: 0 0 0 0 1 1 0 1 0
P_1: 1 1 1 0 0 1 1 0 1
P_2: 0 0 0 1 0 0 1 1 0
P_3: 1 1 1 0 1 0 0 1 1
P_4: 1 1 1 1 0 1 0 0 1
Result: 1 1 1 1 0 1 0 0
```

実際に実行してみると上記のようになります．例えば，$5\times -6$という演算をブースのアルゴリズムで解いた場合，$P_4=(11100010)_2=(-30)_{10}$のように，確かに正しく計算できています．

また，$-6\times 5$でも同じような結果となっており，乗法の交換律も成り立っています．

$4\times -3$も同様に正しく計算できています．

# コードの全体像

最後にコードの全体像を貼っておきます．

```cpp
#include <iostream>
#include <vector>

constexpr int BIT_SIZE = 4;
constexpr int TABLE_SIZE = 2 * BIT_SIZE + 1;

using namespace std;

class BoothAlgorithm {
  public:
    BoothAlgorithm(int x, int y) {
      A.resize(TABLE_SIZE, 0);
      S.resize(TABLE_SIZE, 0);
      P_0.resize(TABLE_SIZE, 0);
      Result.resize(TABLE_SIZE - 1, 0);

      vector<int> binary_x = to_binary(x, BIT_SIZE);
      vector<int> binary_minus_x = to_binary(-x, BIT_SIZE);
      vector<int> binary_y = to_binary(y, BIT_SIZE);

      for (int i = 0; i < BIT_SIZE; i++) {
        A[i] = binary_x[i];
        S[i] = binary_minus_x[i];
        P_0[i + BIT_SIZE] = binary_y[i];
      }
    }

    void run() {
      cout << "P_0: ";
      print_array(P_0);

      Result = booth_algorithm(A, S, P_0);

      cout << "Result: ";
      print_array(Result);
    }

  private:
    vector<int> A, S, P_0, Result;

    void right_shift(vector<int>& vec) {
      for (int i = vec.size() - 1; i > 0; --i) {
        vec[i] = vec[i - 1];
      }
      vec[0] = vec[0] == 1 ? 1 : 0;
    }

    vector<int> add_vectors(const vector<int>& vec1, const vector<int>& vec2) {
      vector<int> result(vec1.size());
      int carry = 0;

      for (size_t i = vec1.size(); i-- > 0;) {
        int sum = vec1[i] + vec2[i] + carry;
        result[i] = sum % 2;
        carry = sum / 2;
      }

      return result;
    }

    vector<int> to_binary(int x, int bit_size) {
      vector<int> binary(bit_size, 0);

      for (int i = 0; i < bit_size; i++) {
          binary[bit_size - 1 - i] = (x >> i) & 1;
      }

      return binary;
    }

    vector<int> conditional_shift(const vector<int>& A, const vector<int>& S, const vector<int>& P) {
      vector<int> result = P;

      if (P[TABLE_SIZE - 2] == P[TABLE_SIZE - 1]) {
        right_shift(result);
      } else if (P[TABLE_SIZE - 2] == 0) {
        result = add_vectors(result, A);

        right_shift(result);
      } else {
        result = add_vectors(result, S);

        right_shift(result);
      }

      return result;
    }

    void print_array(const vector<int>& arr) {
      for (int i = 0; i < arr.size(); i++) {
        cout << arr[i] << " ";
      }
      cout << endl;
    }

    vector<int> booth_algorithm(vector<int>& A, vector<int>& S, vector<int>& P, int count = BIT_SIZE) {
      if (count > 0) {
        P = conditional_shift(A, S, P);

        cout << "P_" << BIT_SIZE - count + 1 << ": ";
        print_array(P);

        return booth_algorithm(A, S, P, count - 1);
      } else {
        vector<int> Result(TABLE_SIZE - 1, 0);

        for (int i = 0; i < TABLE_SIZE - 1; i++) {
          Result[i] = P[i];
        }

        return Result;
      }
    }
};

int main() {
  int x, y;
  cin >> x >> y;

  BoothAlgorithm booth(x, y);
  booth.run();

  return 0;
}
```
