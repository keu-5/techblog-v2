---
title: "PCA解説"
summary: "PCAを一からまとめました！"
tags: ["PCA", "AI", "Machine Learning"]
---

# 教師なし学習とは

---

## 教師あり学習と比較

1. 目的変数がない、入力データそのものに注目
2. データの中に部分集合を見つけたり、データを変換して別の形式で表現したりすることでデータの解釈性を高める
3. データに潜むパターンや示唆を見出すために用いる
4. 教師なし学習モデルはクラスタリング、次元削減に大別できる

## データサイエンスのプロセス

OSEMN (オーサム) Process

![](https://miro.medium.com/v2/resize:fit:828/format:webp/1*eE8DP4biqtaIK3aIy1S2zA.png)

[5 Steps of a Data Science Project Lifecycle](https://towardsdatascience.com/5-steps-of-a-data-science-project-lifecycle-26c50372b492)

### OBTAIN (データの取得)

データを取得する。データは主にデータベース、`CSV`, `Web API`から取得できる

### SCRUB

データを解釈するために整理する。

データには欠損値や、モデルに使用できない型になっているデータが存在する。また、(リレーショナル)データベースでは複数のテーブルが混在しており、データ分析がしにくい。列を分割、あるいは結合する必要がある。

pythonでは主に`pandas`を使う。

### EXPLORE (データの探索)

モデルに使うためのデータを探す。**機械なし学習はここで役立つ**。またpythonでは、`matplotlib`を用いてデータの可視化も行う。

ここではデータのメタ的な理解が必要。そのための探索、特徴量エンジニアリングを行う。

### MODEL

将来を予測するために**教師あり学習**を用いて機械学習モデルを作る。

### INTERPRET

データを利用して価値を創出する。(稼ぐ)

# PCAとは

---

PCA: Principal Component Analysis (主成分分析)

## 次元削減

より少ない特徴量でデータを理解するための手法。多変数データを特徴を保ちながら少変数で表現すること。

機械学習において、特徴量は多すぎないほうが良い。データの解釈性を失う恐れがあるし、過学習が起こりやすい。さらに、処理スピードも遅くなる。それらを解決するために「特徴量を減らす=次元削減をする」

## PCA概要

変数間に相関のあるデータに対して有効。代表的な次元削減の手法。

元データの変数から新たな変数を構成する。
たいていの場合3次元以内に収める

以下のサイトで視覚的に理解できる

[Principal Component Analysis explained visually](https://setosa.io/ev/principal-component-analysis/)

![a](https://newsatcl-pctr.c.yimg.jp/t/amd-img/20200202-00010000-wordleaf-000-8-view.jpg?pri=l&w=640&h=640&exp=10800&fmt=webp)

## アルゴリズム

### やること

主成分における内積の分散が最大となるような主成分軸を見つける→基底変換

→基底を変換したいので変換行列が必要、最適な変換行列を求める

![output.png](output.png)

$$
i番目のp次元ベクトルx_{i*}が(x_{i1},x_{i2},...,x_{ip})^Tのとき
$$

$$
データXを、\mathbf X=\begin{pmatrix}
x_{11}&x_{12}&...&x_{1p}\\
x_{21}&x_{22}&...&x_{2p}\\
\vdots&\vdots&\ddots&\vdots&\\
x_{n1}&x_{n2}&...&x_{np}
\end{pmatrix},\quad

p次元からq次元に変換する変換行列を\mathbf w=\begin{pmatrix}
w_{11}&w_{12}&...&w_{1q}\\
w_{21}&w_{22}&...&w_{2q}\\
\vdots&\vdots&\ddots&\vdots&\\
w_{p1}&w_{p2}&...&w_{pq}
\end{pmatrix}とする。
$$

> 変換行列のそれぞれの列は基底ベクトルを表す

$$
このとき、圧縮されたデータを\mathbf Yとすると、\mathbf Y=\mathbf X\mathbf wが成り立つ。次に、射影後のベクトルについて考える。
$$

$$
元のデータベクトルx_{i*}を求めたい主成分の方向に射影した結果をy_i、この時の主成分をw=(w_1,w_2,...,w_p)^Tとすると、y_i=w^Tx_{i*}と表せる。
$$

![](https://math-negi.jp/wp-content/uploads/2021/10/20211028214521.png)

> ベクトルの方向が近ければ近いほど、内積は大きくなる。その分内積の値のズレも大きくなる→その方向における内積の分散の最大値を求めれば主成分が決まるのでは？

$$
このとき、分散s^2=\frac{1}{n}\sum_{i=1}^n(y_i-\overline y)^2,\quad 平均\overline y=\frac{1}{n}\sum_{i=1}^ny_i=w_1\overline {x_{*1}}+w_2\overline {x_{*2}}+...+w_p\overline {x_{*p}}=w^T(\overline{x_{*1}},\overline{x_{*2}},...,\overline{x_{*p}})となるので、\\

s^2=\frac{1}{n}\sum_{i=1}^n(w^T(x_{i1},x_{i2},...,x_{ip})-w^T(\overline{x_{*1}},\overline{x_{*2}},...,\overline{x_{*p}}))^2\\=

\frac{1}{n}\sum_{i=1}^n \left\{w
\begin{pmatrix}
x_{i1}-\overline{x_{*1}}\\
x_{i2}-\overline{x_{*2}}\\
\vdots\\
x_{ip}-\overline{x_{*p}}
\end{pmatrix}\right\}^2=

\frac{1}{n}\sum_{i=1}^n w^T
\begin{pmatrix}
x_{i1}-\overline{x_{*1}}\\
x_{i2}-\overline{x_{*2}}\\
\vdots\\
x_{ip}-\overline{x_{*p}}
\end{pmatrix}
\begin{pmatrix}
x_{i1}-\overline{x_{*1}}\\
x_{i2}-\overline{x_{*2}}\\
\vdots\\
x_{ip}-\overline{x_{*p}}
\end{pmatrix}^Tw=

 w^T
\frac{1}{n}\sum_{i=1}^n
\begin{pmatrix}
x_{i1}-\overline{x_{*1}}\\
x_{i2}-\overline{x_{*2}}\\
\vdots\\
x_{ip}-\overline{x_{*p}}
\end{pmatrix}
\begin{pmatrix}
x_{i1}-\overline{x_{*1}}\\
x_{i2}-\overline{x_{*2}}\\
\vdots\\
x_{ip}-\overline{x_{*p}}
\end{pmatrix}^Tw

=w^TSw\\

※共分散行列S=\begin{pmatrix}
s_{11}&s_{12}&...&s_{1p}\\
s_{21}&s_{22}&...&s_{2p}\\
\vdots&\vdots&\ddots&\vdots&\\
s_{p1}&s_{p2}&...&s_{pp}
\end{pmatrix},\quad s_{jk}=\frac{1}{n}\sum_{i=1}^n(x_{ij}-\overline{x_{*j}})(x_{ik}-\overline{x_{*k}})
$$

$$
ここでs^2=w^TSw\quad (w^Tw=1)が最大値を取るときのwをラグランジュの未定乗数法で求める。\\
f(w)=s^2=w^TSw,\quad 制約：g(w)=w^Tw-1=0\quad のもとで、ラグランジュ関数はF(w,\lambda)=f(w)+\lambda g(w)となる。\\(wはいくらでも大きくできてしまうので制約が必要)
$$

[ラグランジュの未定乗数法と例題 | 高校数学の美しい物語](https://manabitimes.jp/math/879)

$$
s^2が最大化するとき \frac{\partial}{\partial w}F(w,\lambda)=2Sw-2\lambda w=0より、Sw=\lambda w
$$

$$
Sw=\lambda wは共分散行列の固有方程式を表している。ちなみに両辺にw^Tをかけると、w^TSw=w^T\lambda w,\quad 式変形していくと仮定よりw^TSw=\lambda w^Tw=\lambda=s^2
$$

$$
したがって固有値\lambdaは分散そのものを表す。\\また、それぞれに対する固有ベクトルwは変換後の基底=主成分であり、求めたい変換行列\mathbf wは\begin{pmatrix}w_1&w_2&...&w_q\end{pmatrix}となる。
$$

## 寄付率

各成分ごとに計算される固有値を固有値の総和で割ると、主成分の重要度の割合で表現することができる。この時の割合を寄付率といい、各主成分がデータをどれぐらい説明しているかを表現している。

$$
第k主成分の寄付率=\frac{\lambda_k}{\sum_{i=1}^n\lambda_i}
$$

# pythonで実装してみる

---

## データを作る

次に示すプログラムは、`RandomState`オブジェクトを使って、2変数のデータセットを生成し、各変数について標準化したものをプロットしたものである。

```py
from sklearn.preprocessing import StandardScaler
import numpy as np
import scipy as sp
import matplotlib.pyplot as plt

# RandomStateオブジェクトを作成
sample = np.random.RandomState(1)

#２つの乱数を生成
X = np.dot(sample.rand(2, 2), sample.randn(2, 200)).T

# 標準化 (平均0, 分散1にする)
sc = StandardScaler()
X_std = sc.fit_transform(X)

# 相関係数の算出とグラフ化
print('相関係数{:.3f}:'.format(sp.stats.pearsonr(X_std[:, 0], X_std[:, 1])[0]))
plt.scatter(X_std[:, 0], X_std[:, 1])
```

## 主成分分析の実行

```py
# インポート
from sklearn.decomposition import PCA

# 主成分分析
pca = PCA(n_components=2) # 2次元に圧縮
pca.fit(X_std)
```

## 学習結果の確認

### `components_`属性

変換行列(固有ベクトル)を出力する

```py
print(pca.components_)
```

### `explained_variance_`属性

分散(固有値)を出力する

```py
print('各主成分の分散:{}'.format(pca.explained_variance_))
```

## 結果を図示する

```py
# パラメータ設定
arrowprops=dict(arrowstyle='->',
                linewidth=2,
                shrinkA=0, shrinkB=0)

# 矢印を描くための関数
def draw_vector(v0, v1): # v0: 先端, v1: 終端
    plt.gca().annotate('', v1, v0, arrowprops=arrowprops)

# 元のデータをプロット
plt.scatter(X_std[:, 0], X_std[:, 1], alpha=0.2)

# 主成分分析の2軸を矢印で表示する
for length, vector in zip(pca.explained_variance_, pca.components_): # zip(): forループの中で複数のリストを同時に取り出す
    v = vector * 3 * np.sqrt(length)
    draw_vector(pca.mean_, pca.mean_ + v) # 重心を起点とする

plt.axis('equal')
```

# PCAを用いた乳がん患者予測

---

## ライブラリインポート

```py
# 乳がんデータを読み込むためのインポート
from sklearn.datasets import load_breast_cancer
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
%matplotlib inline
```

## 乳がんデータの取得

```py
# 乳がんデータの取得
cancer = load_breast_cancer()
cancer
```

## pandas dataframeで整理

```py
df = pd.DataFrame(cancer.data, columns=cancer.feature_names)
df["target"] = cancer.target
df
```

欠損値などはありませんでした。

## 説明変数と目的変数の関係をヒストグラムにしてみる

### データをmalignant (悪性)かbenign (良性)に分けるためのフィルター処理

```py
malignant = df[df["target"] == 0]
benign = df[df["target"] == 1]
```

### 30個のヒストグラムを作る

```py
#　malignant（悪性）がブルー、benign（良性）がオレンジのヒストグラム
# 各図は、各々の説明変数（mean radiusなど）と目的変数との関係を示したヒストグラム
fig, axes = plt.subplots(6,5,figsize=(20,20))
ax = axes.ravel()
for i, column in enumerate(df.columns[:-1]):
    _,bins = np.histogram(df[column], bins=50)
    ax[i].hist(malignant[column], bins, alpha=.5)
    ax[i].hist(benign[column], bins, alpha=.5)
    ax[i].set_title(column)
    ax[i].set_yticks(())

# ラベルの設定
ax[0].set_ylabel('Count')
ax[0].legend(['malignant','benign'],loc='best')
fig.tight_layout()
```

しかし特徴的なデータは見当たらないので、主成分分析を用いて次元削減を行ってみる

## PCAで次元削減

```py
# 標準化
sc = StandardScaler()
X_std = sc.fit_transform(cancer.data)

# 主成分分析
pca = PCA(n_components=2)
pca.fit(X_std)
X_pca = pca.transform(X_std)

# 表示
print('X_pca shape:{}'.format(X_pca.shape))
print('Explained variance ratio:{}'.format(pca.explained_variance_ratio_))
```

X_pcaは569行2列に変換された→569個の二次元ベクトルの集合

## 圧縮データの可視化

### DF作成

```py
# 列にラベルをつける、1つ目が第1主成分、2つ目が第2主成分
X_pca = pd.DataFrame(X_pca, columns=['pc1','pc2'])

# 上のデータに、目的変数（cancer.target）を紐づける、横に結合
X_pca = pd.concat([X_pca, pd.DataFrame(cancer.target, columns=['target'])], axis=1)

# 悪性、良性を分ける
pca_malignant = X_pca[X_pca['target']==0]
pca_benign = X_pca[X_pca['target']==1]
```

### 可視化

```py
# 悪性をプロット
ax = pca_malignant.plot.scatter(x='pc1', y='pc2', color='red', label='malignant');

# 良性をプロット
pca_benign.plot.scatter(x='pc1', y='pc2', color='blue', label='benign', ax=ax);

# おおよその境界線
x = np.arange(-5, 9)
y = 1.7 * x - 0.8
ax.plot(x, y, color="black")
```

境界線は`SVM`を使うとより最適化できるかも

# 補足

---

## 主成分の選び方

累計寄付率を求めてみると、次元が大きくなるほど値は変化しなくなる。なくなるぐらいの次元がベスト。逆に次元が大きくなるほど累計寄付率が大きく変わる場合、それは相関関係があるとは言えない。PCRを使ってもあまり意味がない。

## 注意点

### 解釈の難しさ

主成分分析を用いて得られる結果は、統計的な指標や数値情報である。しかし、見つかった主成分が具体的にどのような意味を持つのかは、分析者の解釈に委ねられ、直感的には理解しづらい場合がある。その理由は、主成分自体が元のデータと直接の関連を持たないためである。

### 正規性の仮定

主成分分析は、データが正規分布に従っているという仮定の元に成り立っている分析手法である。正規分布とは、平均値の周りにデータが集中し、左右対称の釣鐘状にデータが広がるような分布をさす。正規性の仮定を満たさないデータに主成分分析を適用すると、主成分の方向や寄与率が歪められる可能性がある。

### 外れ値の影響

外れ値は通常のデータパターンから大きく逸脱した値であり、分析結果に悪影響を及ぼす可能性がある。**主成分分析はデータの分散を最大化する方向を求める手法である**。そのため、外れ値が分散に大きく影響すると、主成分の方向や寄与率が歪められてしまう。これにより、分析結果が歪んだり、軸の解釈が困難になってしまう問題が発生する。
