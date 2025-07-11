---
title: "The Basics of Neural Networks"
summary: "I explain neural networks without using confusing metaphors."
tags:
  ["python", "Machine Learning", "Deep Learning", "Algorithm", "Neural Network"]
---

# Neural Networks

---

A neural network is similar to a function. However, it uses high-dimensional input values to output desired data. It can approximate very complex functions. A disadvantage is that it requires "learning" and lacks interpretability in its computation process.

## Structure

![Neural Network Structure](https://www.tel.co.jp/museum/magazine/communication/160229_report01_02/img/img_report01_03.jpg)

### Input Layer

$$
\mathbf x=[x_1,x_2,...,x_n]\in\mathbb R^n
$$

### Hidden Layers

$$
\mathbf h_i=f_i(\mathbf W_i\mathbf h_{i-1}+\mathbf b_i)\quad
\left\{
\begin{aligned}
f_i&:\mathbb R^{m_{i-1}}\to\mathbb R^{m_i}\quad(\text{activation function})\\
\mathbf W_i&\in\mathbb R^{m_i\times m_{i-1}}\quad(\text{weight vector})\\
\mathbf h_i,\mathbf b_i&\in\mathbb R^{m_i}\quad(\text{output and bias vector of layer } i)
\end{aligned}
\right.
$$

### Output Layer

$$
\mathbf y=f_{out}(\mathbf W_{out}\mathbf h_{last}+\mathbf b_{out})
$$

### Overall Function

$$
\hat{\mathbf y}=f_{NN}(x;\theta)=f_{out}\circ f_n\circ f_{n-1}\circ...\circ f_1(\mathbf W_1\mathbf x+\mathbf b_1)
$$

Here, \( \theta \) represents the parameters, including \( f \), \( W \), \( h \), and \( b \).

## Activation Functions

Activation functions introduce non-linearity.

### ReLU (Rectified Linear Unit)

$$
f(x)=\max(0,x)
$$

### Sigmoid

$$
f(x)=\frac{1}{1+\exp(-x)}
$$

### Tanh

$$
f(x)=\tanh(x)=\frac{e^x-e^{-x}}{e^x+e^{-x}}
$$

### SoftPlus

The integral of the sigmoid function:

$$
f(x)=\log(1+\exp(x))
$$

## Learning Process

### Forward Propagation

The calculation process from input to output:

$$
\hat{\mathbf y}=f_{NN}(x;\theta)=f_{out}\circ f_n\circ f_{n-1}\circ...\circ f_1(\mathbf W_1\mathbf x+\mathbf b_1)
$$

### Loss Function Calculation

The process of calculating the error using a loss function based on the output and target data. Examples include Mean Squared Error (MSE) and Cross-Entropy Loss.

$$
{\cal L}=Loss(\mathbf y,\hat{\mathbf y})
$$

### Backpropagation

The process of updating parameters based on the error using gradient descent.

$$
\mathbf W_i\leftarrow\mathbf W_i-\eta\frac{\partial{\cal L}}{\partial\mathbf W_i},\quad\mathbf b_i\leftarrow\mathbf b_i-\eta\frac{\partial{\cal L}}{\partial\mathbf b_i}\quad
\left\{
\begin{aligned}
&\frac{\partial{\cal L}}{\partial\mathbf W_i}=\frac{\partial{\cal L}}{\partial\hat{\mathbf y}}\cdot\frac{\partial\hat{\mathbf y}}{\partial\mathbf h_i}\cdot\frac{\partial\mathbf h_i}{\partial\mathbf W_i}\\
&\frac{\partial{\cal L}}{\partial\mathbf b_i}=\frac{\partial{\cal L}}{\partial\hat{\mathbf y}}\cdot\frac{\partial\hat{\mathbf y}}{\partial\mathbf h_i}\cdot\frac{\partial\mathbf h_i}{\partial\mathbf b_i}
\end{aligned}
\right.
$$

This process ensures the gradients guide the parameters toward lower error values. It allows for efficient updates, especially when far from the minimum.

> 💡 The reason \( f'(x)=0 \) is not directly computed is that it is computationally difficult for computers. Instead, gradient descent is used since it is easier to compute the derivative numerically.

[Why Use Gradient Descent in Machine Learning](https://www.tomotaku.com/machine-learning-gradient-descent/)

## Optimization Algorithms

### Standard Gradient Descent

$$
\theta_{t+1}=\theta_t-\eta\nabla_\theta{\cal L}(\theta_t)
\left\{
\begin{aligned}
\theta_t:&\text{parameters at time } t\\
\eta:&\text{learning rate}\\
\nabla_\theta{\cal L}(\theta_t):&\text{gradient of the loss function at time } t
\end{aligned}
\right.
$$

Stop when $||\nabla_\theta{\cal}(\theta_t)||<\epsilon$, or use another stopping criterion.

### Adam

Adam is more suited to deep learning, as it converges faster than standard gradient descent.

1. Compute the first moment: the moving average of the gradients (using exponential smoothing).

   $$
   m_t=\beta_1m_{t-1}+(1-\beta_1)\nabla_\theta{\cal L}(\theta_t)
   $$

2. Compute the second moment: the moving average of the squared gradients.

   $$
   v_t=\beta_2v_{t-1}+(1-\beta_2)(\nabla_\theta{\cal L}(\theta_t))^2
   $$

3. Bias correction:

   $$
   \hat m_t=\frac{m_t}{1-\beta_1^t},~\hat v_t=\frac{v_t}{1-\beta_2^t}
   $$

4. Update parameters:

   $$
   \theta_{t+1}=\theta_t-\eta\frac{\hat m_t}{\sqrt{\hat v_t}+\epsilon}
   $$
