---
title: "Understanding XGBoost"
summary: "I explained XGBoost in a university lecture!"
tags: ["AI", "Machine Learning", "Mathematics", "Explanation"]
---

# Introduction to XGBoost

## Overview of XGBoost (eXtreme Gradient Boosting)

- An ensemble learning method combining boosting and decision trees.
- **Boosting**: A technique that iteratively creates weak models (weak learners), with each subsequent learner correcting the errors of the previous one, thereby improving performance.
- Shallow decision trees are created, each of which performs well only on a portion of the data. Boosting improves their overall performance.
- Although sensitive to parameter tuning, XGBoost can outperform Random Forest when configured correctly.
- Despite the term "regression tree," it can be used for both regression and classification tasks.

---

## Review: Decision Trees

A method that learns conditional branching, often illustrated by games like Akinator.

### Prerequisite Knowledge

#### Information

The less frequent (rarer) an event, the greater its "information content":

$$
i(x) = -\log_2 p(x)
$$

#### Impurity

- **Entropy (Average Information Content)**  
  A measure of randomness or disorder. It uses the expected value of information content based on occurrence probabilities:

  $$
  I_H(t) = -\sum_{i=1}^c p(i|t) \log_2 p(i|t) \quad \left(p(i|t) = \frac{n_i}{N}: \text{Probability of class } i \text{ at node } t\right)
  $$

- **Gini Impurity**  
  Borrowed from econometrics:

  $$
  I_G(t) = 1 - \sum_{i=1}^c p(i|t)^2
  $$

  A higher value indicates more mixed classes, i.e., **higher impurity** → poor classification. Other metrics like misclassification rate can also be used.

#### Gain

The difference in impurity between nodes before and after splitting. Higher gain indicates a greater reduction in impurity.

##### Decision Tree Learning Using Gain

1. For each feature, consider the midpoints of adjacent data points as threshold candidates.
2. Compute the impurity after splitting at each candidate threshold.
3. Split at the threshold that reduces impurity the most.
4. Repeat recursively.
5. Stop when a node contains too few data points or further splitting is not possible.

$$
\Delta I_H(t) = I_H(t_B) - \sum_{i=1}^b w_i I_{H_i}(t_{A_i})
$$

$$
\left(I_H(t_B): \text{Impurity before branching, } \sum_{i=1}^b w_i I_H(t_{A_i}): \text{Weighted average impurity after branching}\right)
$$

---

# Ensemble Methods for Improved Generalization Performance

**Ensemble Methods** combine multiple machine learning models to achieve better predictive performance than any single model.

By integrating predictions from different models, ensemble methods compensate for individual weaknesses, improving overall predictive accuracy and generalization performance.

### Generalization Performance

Indicates a model's ability to make accurate predictions on unseen data, not just the training data.

#### Overfitting

- A phenomenon where the model performs well on training data but poorly on test data.
- Occurs when the model "memorizes" the training data, becoming unable to generalize to new data.
- Analogous to scoring high on regular tests but poorly on mock or entrance exams.

#### Weak Learners

Models with low predictive accuracy that are prone to overfitting, such as shallow decision trees.

For example, if a model is trained to identify cats as animals with pointy ears, it might fail to recognize cats with rounded ears.

#### Strong Learners

Models with higher predictive accuracy than weak learners. Boosting transforms weak learners into a single strong learner system.

For instance, to identify cats, a weak learner that predicts based on pointy ears can be combined with another that identifies eye shape. By refining predictions iteratively, the overall system improves accuracy.

---

## Bagging

An ensemble technique designed to address overfitting. Multiple weak learners are created, and their predictions are aggregated using majority voting (for classification) or averaging (for regression) to enhance generalization performance.

### Examples

- RandomForest
- BaggingClassifier/Regressor

---

## Boosting

- Combines multiple weak learners.
- Adjusts the weights of data points so that subsequent models focus more on previously misclassified points.
- Each model reduces errors iteratively.

### Examples of Boosting Models

#### AdaBoost

A general boosting method. Repeatedly creates weak learners, emphasizing misclassified points by adjusting their weights. Final predictions are made using a weighted majority vote of all weak learners.

#### GBDT (Gradient Boosting Decision Tree)

Minimizes the error between predicted values and true labels iteratively, gradually transforming weak learners into strong learners. The final model's output is the combined prediction of all learners.

#### XGBoost (eXtreme Gradient Boosting)

An enhanced version of GBDT with features like regularization and parallel computation for improved performance.

# Ensemble Methods Usage Guide

| Ensemble Method | Model Examples              | Use Cases                                                                                                  | Priority                                             |
| :-------------- | :-------------------------- | :--------------------------------------------------------------------------------------------------------- | :--------------------------------------------------- |
| Bagging         | RandomForest                | When avoiding overfitting and at the initial stage of a project where useful features are not well-defined | First choice for bagging                             |
|                 | BaggingClassifier/Regressor |                                                                                                            | For non-decision-tree models                         |
| Boosting        | XGBoost, GradientBoosting   | When aiming for high accuracy, typically after EDA reveals useful features                                 | Often the first choice due to overfitting prevention |
|                 | AdaBoost                    |                                                                                                            | For non-decision-tree models                         |
| No Ensemble     | Single Model                | When interpretability of results is critical                                                               |                                                      |

# Theory Behind XGBoost

## AdaBoost

A drawback of decision trees is that they can overfit or underfit if tree size is incorrectly chosen, making them a sensitive model.

- **Idea**: Instead of building the entire tree at once, why not incrementally grow it?
- Use a combination of weak learners.
- Assign higher weights to misclassified data and lower weights to correctly classified data after each iteration.
- Combine all nodes to create a robust tree.

**Reference**: [Ensembles (4): AdaBoost](https://www.youtube.com/watch?v=ix6IvwbVpw0)

## Gradient Boosting Decision Trees (GBDT)

### Issues with AdaBoost

1. Assigning high weights to misclassified data can also amplify noise, potentially causing overfitting.
2. Simply adjusting weights without leveraging a loss function does not explicitly solve a minimization problem, which may not be optimal.

### GBDT's Approach

GBDT explicitly defines a loss function and solves its minimization problem.

#### Key Concepts

- **Loss Function**: Measures prediction error (e.g., Mean Squared Error or Cross-Entropy Loss).
  $$
  \mathcal{L}(y, \hat{y}) = \frac{1}{n} \sum_{i=1}^n (y_i - \hat{y})^2
  $$
- **Gradient Descent**: Optimizes model parameters by minimizing the loss.
  $$
  \theta^* = \arg\min_{\theta} \mathcal{L}(y, f_{\theta}(\mathbf{x})) \equiv \theta - \eta \frac{\partial \mathcal{L}(y, f_\theta(\mathbf{x}))}{\partial \theta}
  $$

#### Procedure

1. Initialize predictions with a constant that minimizes the loss:
   $$
   F_0(\mathbf{x}) = \arg\min_{\hat{y}_0} \sum_{i=1}^n \mathcal{L}(y_i, \hat{y}_0)
   $$
   For MSE:
   $$
   \hat{y}_0 = \frac{1}{n} \sum_{i=1}^n y_i
   $$
2. Iteratively improve predictions:
   - Compute residuals (errors):
     $$
     \tilde{y}_0 = -\frac{\partial \mathcal{L}(y, F_0(\mathbf{x}))}{\partial F_0(\mathbf{x})}
     $$
   - Train a weak learner (e.g., decision tree) to predict residuals.
   - Update predictions with optimal step size:
     $$
     F_1(\mathbf{x}) = F_0(\mathbf{x}) + \rho_0 h_{\theta_0}(\mathbf{x})
     $$

The process minimizes the overall loss function:

$$
\mathcal{L} = \sum_{i=1}^n \mathcal{L}(y_i, F_k)
$$

## XGBoost

XGBoost enhances GBDT by incorporating second-order derivatives (Hessian) and regularization terms.

### Regularization

Introduces regularization to control model complexity:

$$
\mathcal{L}^{(t)} = \sum_{i=1}^n l(y_i, \hat{y}_i^{(t-1)} + f_k(\mathbf{x}_i)) + \Omega(f_t)
$$

$$
\Omega(f_t) = \gamma T + \frac{1}{2} \lambda \sum_{j=1}^T w_j^2
$$

Where:

- \( T \): Number of leaves
- \( w_j \): Leaf weight
- \( \gamma, \lambda \): Hyperparameters

### Taylor Approximation

Uses second-order Taylor expansion to approximate the loss function:

$$
\mathcal{L}^{(t)} \approx \sum_{i=1}^n \left[ g_i f_t(\mathbf{x}_i) + \frac{1}{2} h_i f_t^2(\mathbf{x}_i) \right] + \Omega(f_t)
$$

Where:

- \( g_i = \frac{\partial l(y_i, \hat{y}^{(t-1)})}{\partial \hat{y}^{(t-1)}} \) (gradient)
- \( h_i = \frac{\partial^2 l(y_i, \hat{y}^{(t-1)})}{\partial \hat{y}^{(t-1)^2}} \) (Hessian)

### Optimal Solution

Optimal weight for a leaf:

$$
w_j^* = -\frac{\sum_{i \in I_j} g_i}{\sum_{i \in I_j} h_i + \lambda}
$$

Optimal loss:

$$
\mathcal{L}^{(t)}(w_j^*) = -\frac{1}{2} \sum_{j=1}^T \frac{\left(\sum_{i \in I_j} g_i\right)^2}{\sum_{i \in I_j} (h_i + \lambda)} + \gamma T
$$

### Tree Construction

Leaf gain is calculated as:

$$
\text{Gain} = \frac{G_L^2}{H_L + \lambda} + \frac{G_R^2}{H_R + \lambda} - \frac{G^2}{H + \lambda} - \gamma
$$

### Final Algorithm

1. **Greedy Method**:
   - Scan all split points to find the best one. High accuracy but computationally expensive.
2. **Approximate Method**:
   - Use candidate split points to reduce computation cost at the expense of accuracy.

## Simplified XGBoost: LightGBM

LightGBM is a faster, simpler alternative to XGBoost, offering high generalization performance. While not available in Exploratory, it is widely supported in Python and often serves as the default choice.
