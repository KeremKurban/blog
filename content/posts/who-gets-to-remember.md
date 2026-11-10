---
title: "Who Gets to Remember?"
date: 2026-11-10
updated: 2026-11-10
summary: "One number decides whether a memory system picks a single winner, blends a few, or averages everything. The first post of Engrams & Embeddings."
tags: [Engrams & Embeddings, Neuroscience, Interpretability, AI Safety]
---

## TL;DR

Transformer attention is the retrieval rule of a modern Hopfield network. A single scale factor, β, sets how competitive retrieval is. High β gives one winner, like a swarm committing to one food source. Medium β gives a sparse blend of a few related memories, like an engram. Low β gives a mush. When query and key norms grow during training, β rises on its own and attention collapses to one winner. QK-norm puts the dial back under control.

## Two talks and a video

Last week I went to two evenings of the [Colloque Wright](https://colloquewright.ch) in Geneva. On the first, Sheena Josselyn talked about how a memory is born. On the second, Iain Couzin talked about how groups of animals decide together. I took a summer course with Sheena two years ago, where I learned how engrams form, especially fear memory engrams in the lateral amygdala, and Susumu Tonegawa's work on overlapping engrams. So I went mostly for her talk.

Couzin's group studies animals that have to choose between two targets, food A and food B. For a while the group heads somewhere in between. Then, past a critical angle, one side wins and the whole group commits to one target (Sridhar et al., 2021). The fly's head direction circuit behaves in a similar way. It keeps a single bump of activity on a ring of neurons, held in place by local excitation and inhibition of the other angles (Kim et al., 2017). A ring like this can point in only one direction at a time. Both are winner-take-all.

An engram is different. When a fear memory is assigned in the lateral amygdala, it does not go to one neuron, and it does not go to all of them. Roughly 10 to 20 percent of the local neurons take it, and they are the ones that were most excitable when learning happened (Han et al., 2007; Yiu et al., 2014). It is not a grandmother cell and not a fully distributed code. It sits somewhere in between.

A few days earlier I had watched a short video about transformers that suddenly blow up during training. When people looked inside, some attention heads had query-key logits that kept growing while others faded away. The fix was to normalise queries and keys before the dot product. It looked like the same competition again, this time going wrong.

So there are three systems and one question: when many units could represent something, how many of them get to? This post shows that one number answers it. It is the first post of [Engrams & Embeddings](/posts/engrams-and-embeddings/).

## Attention is memory retrieval

Ramsauer et al. (2021) showed that a modern Hopfield network stores memories x₁ … x_N and, given a cue ξ, retrieves in one step:

```text
ξ_new = Σᵢ pᵢ xᵢ,    p = softmax(β · Xᵀξ)
```

Score the cue against every stored memory, turn the scores into weights, return the weighted blend. That is exactly scaled dot-product attention:

| Hopfield network | Transformer attention |
| --- | --- |
| Cue ξ (a partial input) | Query q |
| Stored memories xᵢ, used for scoring | Keys kᵢ |
| Stored memories xᵢ, used as the output | Values vᵢ |
| Inverse temperature β | 1/√d, times whatever scale \|q\| · \|k\| adds |

The name β comes from statistical physics, where it is inverse temperature. A hot system (low β) visits every state about equally. A cold system (high β) freezes into its single lowest-energy state.

## Turn the dial

Three memories sit on a circle. A and B are close to each other; C points the other way. The ring handle is the cue: drag it around the circle. The solid dot is what the network retrieves, the weighted blend of the three memories.

```embed
/posts/who-gets-to-remember/bench.html
The β Dial: drag a cue around three stored memories and change β
```

Some things to try:

1. Press the Engram preset and park the cue between A and B. The two related memories share the weight and C drops out.
2. Press the Swarm preset. One memory takes almost all of the weight, even with the cue close to both A and B.
3. Go back to β 1 and raise the norm growth slider. The blend collapses to one memory without β itself changing.
4. Tick QK-norm. The norm slider stops having any effect.

## A worked example

Fix the similarity scores at 3, 2.5 and 0 for memories A, B and C, and change only β.

| β | Weight A | Weight B | Weight C | Regime |
| --- | --- | --- | --- | --- |
| 0.1 | 0.37 | 0.35 | 0.28 | Global average |
| 1 | 0.60 | 0.37 | 0.03 | Metastable: A and B blended |
| 10 | 0.99 | 0.01 | ≈0 | Single winner |

The middle row is the interesting one. The two related memories merge into a shared state while the unrelated one drops out. Whether two memories merge depends on β times the gap between their scores, so close memories need a high β to be told apart. Ramsauer et al. call these blended fixed points metastable states.

The same dial describes the three systems from the start. A swarm committing to one food source sits at the high end. A fully distributed code sits at the low end. An engram, sparse but not single, sits in the middle.

## When the dial turns itself up

In a transformer the logit is not scaled by 1/√d alone:

```text
q · k / √d  =  |q| · |k| · cos θ / √d
```

If the norms of the queries and keys grow, the effective β grows, even though nobody changed a hyperparameter. Heads slide from the metastable regime into the single-winner regime. Attention becomes one-hot, its entropy collapses, gradients through the softmax vanish for most entries and spike for the rest, and the training loss jumps. This was reported in ViT-22B (Dehghani et al., 2023) and reproduced at small scale by Wortsman et al. (2024), who traced it to growing query and key norms.

The fix is QK-norm: apply LayerNorm or RMSNorm to queries and keys before the dot product. Their norms are then bounded by construction, so β becomes an explicit, controlled quantity again, usually through a learnable scale. Several open models now train this way, including OLMo 2 (Team OLMo et al., 2025). In the figure above, the QK-norm toggle does exactly this.

## The brain's version

Brains do not simply want winner-take-all while transformers avoid it. Both want sharp winners within one memory and different winners across memories.

In engram allocation, neurons with higher excitability at the time of learning, for example with higher CREB levels, win the competition and suppress their neighbours. That excitability is transient. Josselyn's group showed that two fear memories formed a few hours apart are allocated to overlapping lateral amygdala neurons and become linked, while memories formed a day apart are allocated to separate populations (Rashid et al., 2016). A similar result was found in the hippocampus (Cai et al., 2016). If one fixed set of neurons always won, every memory would collapse onto the same engram.

That is the same failure the transformer suffers when every query attends to the same few keys. Both systems need sparsity per item and diversity across items, and both control it through the strength of competition. In cortex that strength is set partly by inhibition, which implements divisive normalization (Carandini & Heeger, 2012); softmax is a close mathematical relative. This last link is an analogy, not an established mapping.

## Where the series goes from here

If you know how a network picks its winners, you also know where to look for what it stored. Josselyn's lab showed this directly. They raised CREB in a small set of lateral amygdala neurons so that those neurons took the fear memory, then removed that set after training. The memory was erased, while removing a random set of the same size left it intact (Han et al., 2009). Machine learning has started to ask the same questions. Meng et al. (2022) located factual associations in GPT and edited them in place, and gradient routing (Cloud et al., 2024) decides during training which part of a network a capability goes to, so that it can later be removed. For AI safety this is the practical side of allocation: finding, auditing and taking out what a model has learned.

Attention competes over tokens, while engram allocation competes over neurons. The next post asks where neuron-like allocation happens inside a transformer, in MLP neurons, mixture-of-experts routing and sparse autoencoders. The one after builds a small model whose excitability rises and fades, to see whether it links memories learned close together in time. Corrections from neuroscience, interpretability and safety readers are welcome.

## Glossary

**CREB.** A transcription factor that raises neuronal excitability and biases which neurons join an engram.

**Engram.** The set of neurons, and their connections, that physically store a memory.

**Gradient routing.** A training method that masks gradients so chosen data updates only a chosen part of a network.

**Inverse temperature (β).** The factor that multiplies scores before a softmax. Higher values mean fewer winners.

**Modern Hopfield network.** An associative memory model that retrieves stored patterns from a cue; its update rule is softmax attention.

**QK-norm.** Normalising queries and keys before the attention dot product so attention logits stay bounded.

## References

Cai, D. J., Aharoni, D., Shuman, T., Shobe, J., Biane, J., Song, W., Wei, B., Veshkini, M., La-Vu, M., Lou, J., Flores, S. E., Kim, I., Sano, Y., Zhou, M., Baumgaertel, K., Lavi, A., Kamata, M., Tuszynski, M., Mayford, M., ... Silva, A. J. (2016). A shared neural ensemble links distinct contextual memories encoded close in time. *Nature, 534*(7605), 115–118. https://doi.org/10.1038/nature17955

Carandini, M., & Heeger, D. J. (2012). Normalization as a canonical neural computation. *Nature Reviews Neuroscience, 13*(1), 51–62. https://doi.org/10.1038/nrn3136

Cloud, A., Goldman-Wetzler, J., Wybitul, E., Miller, J., & Turner, A. M. (2024). *Gradient routing: Masking gradients to localize computation in neural networks* (arXiv:2410.04332). arXiv. https://arxiv.org/abs/2410.04332

Dehghani, M., Djolonga, J., Mustafa, B., et al. (2023). Scaling vision transformers to 22 billion parameters. In *Proceedings of the 40th International Conference on Machine Learning*. PMLR. https://arxiv.org/abs/2302.05442

Han, J.-H., Kushner, S. A., Yiu, A. P., Cole, C. J., Matynia, A., Brown, R. A., Neve, R. L., Guzowski, J. F., Silva, A. J., & Josselyn, S. A. (2007). Neuronal competition and selection during memory formation. *Science, 316*(5823), 457–460. https://doi.org/10.1126/science.1139438

Han, J.-H., Kushner, S. A., Yiu, A. P., Hsiang, H.-L., Buch, T., Waisman, A., Bontempi, B., Neve, R. L., Frankland, P. W., & Josselyn, S. A. (2009). Selective erasure of a fear memory. *Science, 323*(5920), 1492–1496. https://doi.org/10.1126/science.1164139

Kim, S. S., Rouault, H., Druckmann, S., & Jayaraman, V. (2017). Ring attractor dynamics in the *Drosophila* central brain. *Science, 356*(6340), 849–853. https://doi.org/10.1126/science.aal4835

Meng, K., Bau, D., Andonian, A., & Belinkov, Y. (2022). Locating and editing factual associations in GPT. In *Advances in Neural Information Processing Systems, 35*. https://arxiv.org/abs/2202.05262

Ramsauer, H., Schäfl, B., Lehner, J., Seidl, P., Widrich, M., Adler, T., Gruber, L., Holzleitner, M., Pavlović, M., Sandve, G. K., Greiff, V., Kreil, D., Kopp, M., Klambauer, G., Brandstetter, J., & Hochreiter, S. (2021). Hopfield networks is all you need. In *International Conference on Learning Representations*. https://arxiv.org/abs/2008.02217

Rashid, A. J., Yan, C., Mercaldo, V., Hsiang, H.-L., Park, S., Cole, C. J., De Cristofaro, A., Yu, J., Ramakrishnan, C., Lee, S. Y., Deisseroth, K., Frankland, P. W., & Josselyn, S. A. (2016). Competition between engrams influences fear memory formation and recall. *Science, 353*(6297), 383–387. https://doi.org/10.1126/science.aaf0594

Sridhar, V. H., Li, L., Gorbonos, D., Nagy, M., Schell, B. R., Sorochkin, T., Gov, N. S., & Couzin, I. D. (2021). The geometry of decision-making in individuals and collectives. *Proceedings of the National Academy of Sciences, 118*(50), e2102157118. https://doi.org/10.1073/pnas.2102157118

Team OLMo, Walsh, P., Soldaini, L., Groeneveld, D., et al. (2025). *2 OLMo 2 Furious* (arXiv:2501.00656). arXiv. https://arxiv.org/abs/2501.00656

Wortsman, M., Liu, P. J., Xiao, L., Everett, K., Alemi, A., Adlam, B., et al. (2024). Small-scale proxies for large-scale transformer training instabilities. In *International Conference on Learning Representations*. https://arxiv.org/abs/2309.14322

Yiu, A. P., Mercaldo, V., Yan, C., Richards, B., Rashid, A. J., Hsiang, H.-L. L., Pressey, J., Mahadevan, V., Tran, M. M., Kushner, S. A., Woodin, M. A., Frankland, P. W., & Josselyn, S. A. (2014). Neurons are recruited to a memory trace based on relative neuronal excitability immediately before training. *Neuron, 83*(3), 722–735. https://doi.org/10.1016/j.neuron.2014.07.017
