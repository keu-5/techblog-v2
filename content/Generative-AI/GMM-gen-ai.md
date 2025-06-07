---
title: "Consideration of a Generative Method Using a Gaussian Mixture Model"
summary: "We constructed a basic generative model using a Gaussian Mixture Model (GMM)."
tags:
  ["python", "Machine Learning", "Data Science", "Mathematical Optimization"]
---

# Gaussian Mixture Model (GMM)

- A clustering method.
- Can also be used as a generative model.
- Represents a given dataset as a combination of multiple Gaussian distributions.
- Provides a probability density function, which explains its use as a generative model.
- Can automatically determine the number of clusters.
- Reveals the prior distribution of explanatory variable X (latent variable).

## Gaussian Distribution (can be visualized as a graph in a two-dimensional space of x and y)

$$
N(x|\mu,\sigma^2)=\frac{1}{\sqrt{2\pi\sigma^2}}\exp\left\{-\frac{1}{2\sigma^2}(x-\mu)^2\right\}
$$

## Multivariate Normal Distribution (Can be viewed as a graph in three or more dimensions such as x, y, z...)

$$
N(\mathbf x|\mathbf\mu,\Sigma)=\frac{1}{(2\pi)^\frac{m}{2}}\frac{1}{|\Sigma|^{\frac{1}{2}}}\exp\left\{-\frac{1}{2}(\mathbf x-\mathbf\mu)^T\Sigma^{-1}(\mathbf x-\mathbf\mu)\right\}\quad\left(\mathbf x:
Random~variable~vector,\mathbf\mu:Average~vector,\Sigma:Covariance~matrix\right)
$$

## Mixture of Gaussian Distribution (Multiple peaks are formed)

$$
p(\mathbf x)=\sum_{k=1}^n\pi_kN(\mathbf x|\mu_k,\Sigma_k)\quad\left(n:n ~Gaussian~distributions,k:k-th~Gaussian~distribution,\pi_k:Mixture~coefficient\left(Weight~of~each~Gaussian~distribution,\sum_{k=1}^n\pi_k=1\right)\right)
$$

Reference: https://datachemeng.com/wp-content/uploads/gaussianmixturemodel.pdf

# Prior distribution of Mixture Gaussian Distribution

The prior distribution here is the distribution of "which cluster a variable belongs to after receiving it." If we define the latent variable as $\mathbf z$, then $\mathbf z$ is

- A vector (i.e., a matrix) with a one-hot vector that is 1 in one cluster and 0 in the others.
- If there is no information about the sample, the probability that $\mathbf z_k=1$ is set to follow the mixture coefficient.
  $$
  p(\mathbf z_k=1)=\pi_k
  $$

If this is not introduced, the area will not be 1 in the mixture Gaussian distribution (it is obvious that the sum of probabilities will exceed 1 if simply added).

## Finding the prior distribution

Using Bayes' theorem, the probability that a sample $\mathbf x$ will be $z_k=1$ given is

$$
p(z_k=1|\mathbf x)=\frac{p(z_k=1)p(\mathbf x|z_k=1)}{\sum_{i=1}^np(z_k=1)p(\mathbf x|z_i=1)}=\frac{\pi_kp(\mathbf x|z_k=1)}{\sum_{i=1}^n\pi_ip(\mathbf x|z_i=1)}=\frac{\pi_kN(\mathbf x|\mu_k,\Sigma_k)}{\sum_{i=1}^n\pi_iN(\mathbf x|\mu_i,\Sigma_i)}
$$

From this,

$$
k^\star=\arg\max_kp(z_k=1|\mathbf x)
$$

By doing so, the cluster at a certain point $\mathbf x$ can be estimated.

# Creating a Mixture Gaussian Distribution

## Definition of probability density function

```py
# Multivariate normal distribution
def gaussian_densty(x, mu, sigma): # (1, n), (1, n), (n, n)
  diff = x - mu
  sigma_inv = np.linalg.inv(sigma)
  sigma_det = np.linalg.det(sigma)
  z = np.exp(-np.dot(diff.T, np.dot(sigma_inv, diff)) / 2)

  return z / np.sqrt(np.power(2*np.pi, len(mu)) * sigma_det) # (1, n)

# Mixture Gaussian distribution
def mixture_gaussian_densty(x, mu_list, sigma_list, pi_list): # (1, n), (k, n), (k, n, n), (1, k)
  z = 0
  for i in range(len(pi_list)):
    z += pi_list[i] * gaussian_densty(x, mu_list[i], sigma_list[i])
  return z # (1, n)
```

> Note that only the probability density function has been created, so the corresponding code is required to sample it.

## Using NumPy's Official Multivariate Normal Distribution

```py
# Generate samples from a multivariate normal distribution
def sample_multivariate_gaussian(mu, sigma, num_samples=1):
    return np.random.multivariate_normal(mu, sigma, num_samples)

# Generate samples from a mixture Gaussian distribution
def sample_mixture_gaussian(mu_list, sigma_list, pi_list, num_samples=100):
    samples = []
    num_clusters = len(pi_list)

    # Determine the number of samples in each cluster
    cluster_sizes = np.random.multinomial(num_samples, pi_list) # Randomly determine the number of samples in each cluster using the mixture coefficients

    for i in range(num_clusters):
        # Generate samples for each cluster
        cluster_samples = sample_multivariate_gaussian(mu_list[i], sigma_list[i], cluster_sizes[i])
        samples.append(cluster_samples)

    # Combine the samples and return them
    return np.vstack(samples)
```

## Preparing the data

```py
# Prepare sample data
# Create a Gaussian mixture distribution with random variable X = [x0, x1], Mu = [mu0, mu1], and latent variable Z = [z0, z1, z2].

# Cluster 0
mu0 = np.array([0, -0.5])
sigma0 = np.array([[1.0, 0], [0, 1.0]])
# Cluster 1
mu1 = np.array([2.5, 2])
sigma1 = np.array([[0.5, 0.3], [0.3, 0.7]])

# Cluster 2
mu2 = np.array([-2, 1.5])
sigma2 = np.array([[1.2, 0.2], [0.2, 0.4]])

# Combine data
mu_list = [mu0, mu1, mu2]
sigma_list = [sigma0, sigma1, sigma2]
pi_list = [0.45, 0.25, 0.3]

# Number of sample data points
NUM_DATA = 500

# Generate samples from the Gaussian mixture distribution
samples = sample_mixture_gaussian(mu_list, sigma_list, pi_list, num_samples=NUM_DATA)

samples[:10]
```

## Plotting the Gaussian Mixture Distribution

```py
def plot_mixture_gaussian(mu_list, sigma_list, pi_list, samples=None, figsize=(8,6)):
    x_range = np.linspace(-5, 5, 100)
    y_range = np.linspace(-5, 5, 100)
    X, Y = np.meshgrid(x_range, y_range)
    Z = np.zeros((len(x_range), len(y_range)))

    # Calculate the probability density for each coordinate
    for i in range(len(x_range)):
        for j in range(len(y_range)):
            x = np.array([x_range[i], y_range[j]])
            Z[i, j] = mixture_gaussian_densty(x, mu_list, sigma_list, pi_list)

    plt.figure(figsize=figsize)
    if samples is not None:
        plt.scatter(samples[:, 1], samples[:, 0], color='red', s=10, label='Samples')
    plt.contour(X, Y, Z, cmap='viridis')
    plt.colorbar(label='Density')
    plt.xlabel('x')
    plt.ylabel('y')
    plt.title('Mixture Gaussian Distribution')
    plt.show()

plot_mixture_gaussian(mu_list, sigma_list, pi_list, samples)
```

# Estimating Clusters from Samples

`To be considered later`

# Estimating Parameters of the Mixture Gaussian Distribution from Samples

## Maximum Likelihood Estimation

"Likelihood maximization" is one of the methods to estimate the distribution from the sample data.

$$
Likelihood~function:{\cal L}(\theta;\mathbf x)=\prod_{i=1}^nP(x_i;\theta),\quad Maximum~likelihood~estimator:\theta^\star=\arg\max_\theta{\cal L}(\theta;\mathbf x)\quad(n:Number~of~samples)
$$

Reference: https://cochineal19.hatenablog.com/entry/2021/11/08/003751

## Define the log likelihood function

It's hard to calculate the likelihood function directly because it's a product of many probabilities. Therefore, it is common to use the log likelihood function.

There is no effect on the maximum value of the function because the logarithm is a monotonically increasing function.

$$
{\cal L}(\mu,\Sigma,\pi;\mathbf x)=\prod_{i=1}^np(\mathbf x;\mu,\Sigma,\pi)=\prod_{i=1}^n\sum_{k=1}^n\pi_kN(\mathbf x|\mu_k,\Sigma_k)\\\to\log{\cal L}(\mu,\Sigma,\pi;\mathbf x)=\log\prod_{i=1}^n\sum_{k=1}^n\pi_kN(\mathbf x|\mu_k,\Sigma_k)=\sum_{i=1}^n\log\sum_{k=1}^n\pi_kN(\mathbf x|\mu_k,\Sigma_k)
$$

```py
def log_likelihood(mu_list, sigma_list, pi_list, sample):
  log_likelihood = 0
  for i in range(len(sample)):
    log_likelihood += np.log(mixture_gaussian_densty(sample[i], mu_list, sigma_list, pi_list))

  return log_likelihood
```

## Defining the Burden Rate

Since we need to find the prior distribution \( p(z|x) \) of \( p(x|z) \), the prior probability of each cluster for a given data point \( \mathbf{x_i} \) is expressed as follows:

$$
p_{\mu,\Sigma,\pi}(z_{ik}=1|\mathbf{x_i}) = \frac{\pi_k{\cal N}(\mathbf{x_i};\mu_k,\Sigma_k)}{\sum_{j=1}^K \pi_j {\cal N}(\mathbf{x_i};\mu_j,\Sigma_j)} \equiv \gamma(z_{ik})
$$

Intuitively, we are calculating the probability that the distribution of each cluster fits the given data point.

```py
def responsibility(data, mu_list, sigma_list, pi_list):
    gamma = np.zeros((len(data), len(pi_list)))
    for i in range(len(data)):
        for j in range(len(pi_list)):
            gamma[i, j] = pi_list[j] * gaussian_density(data[i], mu_list[j], sigma_list[j])
        gamma[i] /= np.sum(gamma[i])
    return gamma
```

### Classifying Using the Burden Rate

To perform classification, we need to find:

$$
z^\star = \argmax_{z_{ik}} \gamma(z_{ik})
$$

This gives us the cluster with the highest responsibility for each data point.

```python
df = pd.DataFrame(samples[:, [1, 0]], columns=['x', 'y'])
gamma = responsibility(samples, mu_list, sigma_list, pi_list)
df['gamma0'] = gamma[:, 0]
df['gamma1'] = gamma[:, 1]
df['gamma2'] = gamma[:, 2]
df['z_star'] = df[['gamma0', 'gamma1', 'gamma2']].idxmax(axis=1)

x_range = np.linspace(-5, 5, 100)
y_range = np.linspace(-5, 5, 100)
X, Y = np.meshgrid(x_range, y_range)
Z = np.zeros((len(x_range), len(y_range)))

# Calculate probability density for each coordinate
for i in range(len(x_range)):
    for j in range(len(y_range)):
        x = np.array([x_range[i], y_range[j]])
        Z[i, j] = mixture_gaussian_density(x, mu_list, sigma_list, pi_list)

sns.scatterplot(x='x', y='y', hue='z_star', data=df, palette='viridis')
plt.contour(X, Y, Z, cmap='viridis')
plt.colorbar(label='Density')
plt.xlabel('x')
plt.ylabel('y')
plt.title('Mixture Gaussian Distribution')
plt.show()
```

## Learning

To maximize the log-likelihood, we need to solve:

$$
\argmax_{\mu,\Sigma,\pi} \log {\cal L}(\mu, \Sigma, \pi; \mathbf{x}) = \argmax_{\mu,\Sigma,\pi} \sum_{i=1}^n \log \sum_{k=1}^K \pi_k N(\mathbf{x} | \mu_k, \Sigma_k)
$$

In this case, the log-sum part makes it difficult to solve analytically → We optimize it using the Expectation-Maximization (EM) algorithm.

### Initialize the parameters

Set randomly

### E-Step

Calculate the responsibility for each data point at the current step:

$$
p_{\mu,\Sigma,\pi}(z_{ik}=1|\mathbf x_i)=\frac{\pi_k{\cal N}(\mathbf x_i;\mu_k,\Sigma_k)}{\sum_{j=1}^K\pi_j{\cal N}(\mathbf x_i;\mu_j,\Sigma_j)}\equiv\gamma(z_{ik})
$$

### M-Step

Update the parameters to maximize the likelihood using the responsibilities:

$$
\begin{aligned}
&\frac{\partial{\cal L}}{\partial\mu_k}=0\to\mu_k=\frac{1}{N_k}\sum_{i=1}^n\gamma(z_{ik})\mathbf x_i\\
&\frac{\partial{\cal L}}{\partial\Sigma_k}=0\to\Sigma_k=\frac{1}{N_k}\sum_{i=1}^n\gamma(z_{ik})(\mathbf x_i-\mu_k)(\mathbf x_i-\mu_k)^T
\end{aligned}
\quad\left(N_k=\sum_{i=1}^n\gamma(z_{ik})\right)
$$

For $\pi_k$, since $\sum_{k=1}^K\pi_k=1$, we use the Lagrange multiplier method to maximize the likelihood:

$$
\frac{\partial G}{\partial\pi_k}=0\to\pi_k=\frac{N_k}{\sum_{k=1}^KN_k}\quad\left(G={\cal L}+\lambda\left(\sum_{k=1}^K\pi_k-1\right)\right)
$$

### Convergence Condition

If the change in the likelihood meets a predefined threshold $\epsilon$:

$$
{\cal L}_{new}-{\cal L}_{old}<\epsilon
$$

then stop the iterations; otherwise, repeat the EM steps.

```python
# Number of clusters (You can use methods to find the optimal number)
K = 3

# Initialize random mean vectors (2D)
mu_list = [np.random.randn(2) for _ in range(K)]

# Initialize random covariance matrices (2x2)
sigma_list = []
for _ in range(K):
    A = np.random.randn(2, 2)
    sigma = np.dot(A, A.T)  # Create symmetric and positive definite matrices
    sigma_list.append(sigma)

# Initialize random mixing coefficients and normalize
pi_list = np.random.rand(K)
pi_list = pi_list / np.sum(pi_list)

# Display the results
print("mu_list:", mu_list)
print("sigma_list:", sigma_list)
print("pi_list:", pi_list)

n_iter = 0

likely = log_likelihood(mu_list, sigma_list, pi_list, samples) / NUM_DATA
print('Iteration: {0}, log_likelihood: {1}'.format(n_iter, likely))
plot_mixture_gaussian(mu_list, sigma_list, pi_list, samples, figsize=(4,3))

th = 0.0001

while True:
  n_iter += 1

  # E-Step
  gamma = responsibility(samples, mu_list, sigma_list, pi_list)
  n_k = np.sum(gamma, axis=0)

  # M-Step

  # Update pi
  pi_list_next = (n_k / n_k.sum()).tolist()

  # Update mu
  mu_list_next = list(((samples.T @ gamma) / n_k).T)

  # Update Sigma
  sigma_list_next = []
  for k in range(len(pi_list)):
    sigma_k = np.zeros_like(sigma_list[k], dtype=float)
    for i in range(len(samples)):
      sigma_k += gamma[i, k] * np.matmul(
          (samples[i] - mu_list[k]).reshape(-1, 1),
          (samples[i] - mu_list[k]).reshape(1, -1)
      )

    sigma_list_next.append(sigma_k/n_k[k])

  # Why deepcopy here? (Possibly due to reference issues)
  # Also, why is 'next' converted to regular lists for all?
  mu_list = copy.deepcopy(mu_list_next)
  sigma_list = copy.deepcopy(sigma_list_next)
  pi_list = copy.deepcopy(pi_list_next)

  # Convergence condition
  likely_before = likely
  likely = log_likelihood(mu_list, sigma_list, pi_list, samples) / NUM_DATA
  print('Iteration: {0}, log_likelihood: {1}'.format(n_iter, likely))
  plot_mixture_gaussian(mu_list, sigma_list, pi_list, samples, figsize=(4,3))

  delta = likely - likely_before
  if delta < th:
    break

# Display results
print("mu_list:", mu_list)
print("sigma_list:", sigma_list)
print("pi_list:", pi_list)
```
