---
title: "Who Gets to Remember?"
date: 2026-11-10
summary: "Swarms, memory circuits and transformers all run a competition over which units represent an input. One parameter, the softmax inverse temperature β, sets how many winners that competition allows, and knowing where the winners sit matters for interpretability and AI safety."
tags: [Engrams & Embeddings, Neuroscience, Interpretability, AI Safety]
---

## TL;DR

Swarms, memory circuits and transformers all run a competition over which units get to represent an input. One parameter, the softmax inverse temperature β, sets how many winners that competition allows: one, a sparse few, or everyone.

Transformers fail when β drifts upward during training and attention collapses onto single tokens. Brains avoid the equivalent failure by making the winners of the competition change over time. For AI safety, the same question becomes practical: if we know how a network decides where to store something, we can find it, audit it and remove it.

## Introduction

**Where this comes from.** In November 2026 the [Colloque Wright](https://colloquewright.ch) in Geneva held a week of public lectures on intelligence. On consecutive evenings, Sheena Josselyn spoke about how a memory is born and Iain Couzin spoke about how animal groups make decisions. Both talks described a competition over which units get to represent something. The connection to transformers drawn here is mine, not theirs. This is the first post of [Engrams & Embeddings](/posts/engrams-and-embeddings/), a series on that competition.

**The problem.** A group of animals moving toward two food sources has to decide where to go. For a while it averages the two directions. Past a critical point, it commits to one. A fear memory in the amygdala faces a similar choice about which neurons will store it. So does every attention head in a transformer, deciding which tokens to read from. All three are competitions, and they differ in how many winners they allow.

**Why it matters.** The number of winners decides how information is stored. One winner is easy to locate but fragile. Everyone winning is robust but hard to read. Neuroscientists want to know how the brain sets this balance. Interpretability researchers want to know where a model has put a fact. AI safety researchers want to know whether that fact can be found, checked and removed.

**How to read this.** Section 1 describes the three competitions. Sections 2 and 3 show that attention is a memory-retrieval rule with one dial, β. Section 4 explains a known transformer failure as the dial turning itself up. Section 5 shows how brains avoid the same failure. Section 6 connects allocation to AI safety. Section 7 separates established findings from hypotheses. A glossary and references close the post. The [β Dial](/posts/who-gets-to-remember/beta-dial.html) is an interactive version of the main figure.

## 1. Three competitions

**Swarms.** Sridhar et al. (2021) placed flies, locusts and fish in virtual reality with two targets. When the targets were close in angle, animals moved toward their average. Beyond a critical angle, the group spontaneously chose one target. Inside the fly brain, the head direction circuit shows a related pattern: a single bump of activity on a ring of neurons, maintained by local excitation and broader inhibition (Kim et al., 2017).

**Engrams.** A fear memory in the lateral amygdala is stored by roughly 10 to 20 percent of local neurons. Which neurons join is decided by their relative excitability at the time of learning. Raising the transcription factor CREB, and with it excitability, in a chosen group biases the memory toward that group (Han et al., 2007; Yiu et al., 2014). The code is sparse. It sits between a single "grandmother cell" and a fully distributed representation.

**Attention.** Each query in a transformer scores every key. A softmax converts the scores into weights, and the output is the weighted sum of the values.

| | Swarm | Engram | Attention |
| --- | --- | --- | --- |
| Competing units | Target directions | Neurons | Keys (tokens) |
| Basis for winning | Agreement within the group | Excitability at learning | Query-key match |
| Typical number of winners | One | A sparse few | From one to all |

## 2. Attention is memory retrieval

Ramsauer et al. (2021) showed that softmax attention is the update rule of a modern Hopfield network, a model of associative memory. The network stores patterns, receives a cue, and retrieves a weighted blend of the stored patterns. In attention, the cue is the query and the stored patterns are the keys and values. The weights on the stored patterns are:

```text
p = softmax(β · Kᵀq)
```

The parameter β is the inverse temperature, a term from statistical physics. A hot system (low β) visits all of its states about equally. A cold system (high β) settles into its single lowest-energy state.

## 3. One dial, three regimes

Consider a cue with similarity scores 3, 2.5 and 0 to three stored memories. A and B are related; C is unrelated.

![Bar charts of the weights on memories A, B and C at three values of beta. At 0.1 the weights are 0.37, 0.35 and 0.28. At 1 they are 0.60, 0.37 and 0.03. At 10 they are 0.99, 0.01 and 0.00.](/posts/who-gets-to-remember/three-regimes.svg)

At low β the network averages everything and decides nothing. At high β it picks one memory and ignores the rest. At intermediate β, related memories merge into a shared state and unrelated ones drop out. Ramsauer et al. call these blended fixed points metastable states. Whether two memories merge depends on β multiplied by the gap between their scores, so similar memories need a high β to be told apart.

The three systems map onto this dial. Swarm commitment corresponds to high β, a fully distributed code to low β, and an engram to the intermediate range. In the [β Dial](/posts/who-gets-to-remember/beta-dial.html) you can move the cue, change β and watch the retrieved state move between the regimes.

## 4. When the dial turns itself up

In a transformer, β is nominally the constant 1/√d, where d is the key dimension. The effective value also depends on the lengths of the query and key vectors:

```text
q · k / √d  =  |q| · |k| · cos θ / √d
```

When query and key norms grow during training, the effective β grows with them. Nobody changes a hyperparameter, yet heads move into the single-winner regime. Attention entropy collapses, gradients through the softmax become unstable, and the loss diverges. Dehghani et al. (2023) observed this in a vision transformer with 22 billion parameters. Wortsman et al. (2024) reproduced it at small scale and traced it to the growth of query and key norms.

QK-norm applies layer normalization to queries and keys before the dot product. Their lengths are then bounded, so β becomes a controlled quantity again. It is used in several open language models, including OLMo 2 (Team OLMo et al., 2025).

## 5. How brains avoid collapse

Brains need sharp winners within a memory and different winners across memories. Engram studies show how both are achieved.

Diversity across memories comes from the transience of excitability. Neurons allocated to a memory remain more excitable for several hours, then return to baseline. Two fear memories formed six hours apart are stored in overlapping lateral amygdala neurons and become linked. Memories formed a day apart are stored separately (Rashid et al., 2016). The same timing effect holds for contextual memories in the hippocampus (Cai et al., 2016).

Sparsity within a memory comes from inhibition. Silencing parvalbumin interneurons in the lateral amygdala, or somatostatin interneurons in the hippocampus, enlarges memory ensembles (Morrison et al., 2016; Stefanelli et al., 2016).

Without transient excitability, the same neurons would win every competition and all memories would share one engram. This is the biological counterpart of attention entropy collapse, where every query attends to the same few keys. Both systems need sparsity per item and diversity across items.

## 6. Why allocation matters for AI safety

The engram literature contains a result that safety researchers will recognise. Han et al. (2009) raised CREB in a small set of lateral amygdala neurons before fear conditioning, so those neurons were preferentially allocated to the memory. Killing that set after training erased the fear memory. Killing a random set of the same size did not. Because the allocation rule was known, the memory could be located and removed without damaging the rest of the circuit.

Transformers raise the same three questions.

**Where is it stored?** Interpretability work tries to locate a fact or behaviour inside a trained model. Meng et al. (2022) traced factual associations in GPT to specific MLP layers and edited them in place. Elhage et al. (2022) showed that models store more features than they have neurons by overlapping them, a state called superposition, which makes such locations hard to read. Superposition resembles overlapping engrams. The difference is that the brain uses overlap to link related memories, while in models it mostly appears as interference.

**Can we decide where it is stored?** The engram experiments steer allocation before learning by raising excitability. Gradient routing (Cloud et al., 2024) does something similar in networks. It masks gradients during training so that chosen data only updates a chosen subregion of the network. The authors then removed a capability by ablating that subregion, which is the computational counterpart of Han et al. (2009).

**What happens to things learned together?** Memories formed close in time share neurons and become linked. If something similar happens in models, a capability learned alongside an unrelated skill may share parameters with it. Removing one would then affect the other. This is a hypothesis, but it bears directly on unlearning, where removing one piece of knowledge cleanly is the hard part.

Attention collapse also has a safety reading. A head stuck in the single-winner regime ignores most of its context. Monitoring attention entropy is a cheap signal of this failure, and QK-norm is a cheap guard against it.

## 7. Established findings and open hypotheses

| Claim | Status |
| --- | --- |
| Softmax attention equals modern Hopfield retrieval | Established |
| Query and key norm growth causes attention entropy collapse; QK-norm prevents it | Established |
| Engram allocation follows relative excitability, and inhibition limits engram size | Established |
| Memories formed close in time share neurons | Established |
| Ablating the allocated neurons erases a memory; ablating a designated subregion removes a trained capability | Established in their own systems |
| One competition-strength parameter is a useful common language for these systems | Hypothesis |
| Inhibition plays a role in cortex comparable to β, since softmax is a form of divisive normalization (Carandini & Heeger, 2012) | Analogy |
| Capabilities learned close together in training share parameters, which complicates unlearning | Hypothesis |

## 8. Next in the series

Attention competes over tokens; engram allocation competes over neurons. Post 2 examines where neuron-like allocation happens in transformers, including MLP neurons, mixture-of-experts routing and sparse autoencoders, and tests whether a unit made more "excitable" just before training becomes the place a new fact is stored. Post 3 tests whether a small model with decaying excitability reproduces memory linking. Corrections from neuroscience, interpretability and safety readers are welcome.

## Glossary

**Allocation.** The process that decides which units, such as neurons or model parameters, store a given memory.

**Attention entropy collapse.** A transformer failure in which attention heads put almost all weight on one token, often followed by a loss spike.

**CREB.** cAMP response element-binding protein, a transcription factor that raises neuronal excitability and biases which neurons join an engram.

**Engram.** The physical trace of a memory: the set of neurons, and their connections, that store it.

**Gradient routing.** A training method that masks gradients so chosen data updates only a chosen part of a network.

**Inverse temperature (β).** The factor that multiplies scores before a softmax. Higher values make the softmax pick fewer winners.

**Lateral amygdala.** A brain region where fear memories are formed.

**Modern Hopfield network.** An associative memory model that retrieves stored patterns from a cue; its update rule is softmax attention.

**QK-norm.** Normalizing queries and keys before the attention dot product to keep attention logits bounded.

**Superposition.** A network representing more features than it has neurons by letting features share neurons.

**Unlearning.** Removing a specific piece of knowledge or capability from a trained model without retraining it from scratch.

## References

Cai, D. J., Aharoni, D., Shuman, T., Shobe, J., Biane, J., Song, W., Wei, B., Veshkini, M., La-Vu, M., Lou, J., Flores, S. E., Kim, I., Sano, Y., Zhou, M., Baumgaertel, K., Lavi, A., Kamata, M., Tuszynski, M., Mayford, M., ... Silva, A. J. (2016). A shared neural ensemble links distinct contextual memories encoded close in time. *Nature, 534*(7605), 115–118. https://doi.org/10.1038/nature17955

Carandini, M., & Heeger, D. J. (2012). Normalization as a canonical neural computation. *Nature Reviews Neuroscience, 13*(1), 51–62. https://doi.org/10.1038/nrn3136

Cloud, A., Goldman-Wetzler, J., Wybitul, E., Miller, J., & Turner, A. M. (2024). *Gradient routing: Masking gradients to localize computation in neural networks* (arXiv:2410.04332). arXiv. https://arxiv.org/abs/2410.04332

Dehghani, M., Djolonga, J., Mustafa, B., et al. (2023). Scaling vision transformers to 22 billion parameters. In *Proceedings of the 40th International Conference on Machine Learning*. PMLR. https://arxiv.org/abs/2302.05442

Elhage, N., Hume, T., Olsson, C., et al. (2022). Toy models of superposition. *Transformer Circuits Thread*. https://transformer-circuits.pub/2022/toy_model/index.html

Han, J.-H., Kushner, S. A., Yiu, A. P., Cole, C. J., Matynia, A., Brown, R. A., Neve, R. L., Guzowski, J. F., Silva, A. J., & Josselyn, S. A. (2007). Neuronal competition and selection during memory formation. *Science, 316*(5823), 457–460. https://doi.org/10.1126/science.1139438

Han, J.-H., Kushner, S. A., Yiu, A. P., Hsiang, H.-L., Buch, T., Waisman, A., Bontempi, B., Neve, R. L., Frankland, P. W., & Josselyn, S. A. (2009). Selective erasure of a fear memory. *Science, 323*(5920), 1492–1496. https://doi.org/10.1126/science.1164139

Kim, S. S., Rouault, H., Druckmann, S., & Jayaraman, V. (2017). Ring attractor dynamics in the *Drosophila* central brain. *Science, 356*(6340), 849–853. https://doi.org/10.1126/science.aal4835

Meng, K., Bau, D., Andonian, A., & Belinkov, Y. (2022). Locating and editing factual associations in GPT. In *Advances in Neural Information Processing Systems, 35*. https://arxiv.org/abs/2202.05262

Morrison, D. J., Rashid, A. J., Yiu, A. P., Yan, C., Frankland, P. W., & Josselyn, S. A. (2016). Parvalbumin interneurons constrain the size of the lateral amygdala engram. *Neurobiology of Learning and Memory, 135*, 91–99.

Ramsauer, H., Schäfl, B., Lehner, J., Seidl, P., Widrich, M., Adler, T., Gruber, L., Holzleitner, M., Pavlović, M., Sandve, G. K., Greiff, V., Kreil, D., Kopp, M., Klambauer, G., Brandstetter, J., & Hochreiter, S. (2021). Hopfield networks is all you need. In *International Conference on Learning Representations*. https://arxiv.org/abs/2008.02217

Rashid, A. J., Yan, C., Mercaldo, V., Hsiang, H.-L., Park, S., Cole, C. J., De Cristofaro, A., Yu, J., Ramakrishnan, C., Lee, S. Y., Deisseroth, K., Frankland, P. W., & Josselyn, S. A. (2016). Competition between engrams influences fear memory formation and recall. *Science, 353*(6297), 383–387. https://doi.org/10.1126/science.aaf0594

Sridhar, V. H., Li, L., Gorbonos, D., Nagy, M., Schell, B. R., Sorochkin, T., Gov, N. S., & Couzin, I. D. (2021). The geometry of decision-making in individuals and collectives. *Proceedings of the National Academy of Sciences, 118*(50), e2102157118. https://doi.org/10.1073/pnas.2102157118

Stefanelli, T., Bertollini, C., Lüscher, C., Muller, D., & Mendez, P. (2016). Hippocampal somatostatin interneurons control the size of neuronal memory ensembles. *Neuron, 89*(5), 1074–1085.

Team OLMo, Walsh, P., Soldaini, L., Groeneveld, D., et al. (2025). *2 OLMo 2 Furious* (arXiv:2501.00656). arXiv. https://arxiv.org/abs/2501.00656

Wortsman, M., Liu, P. J., Xiao, L., Everett, K., Alemi, A., Adlam, B., et al. (2024). Small-scale proxies for large-scale transformer training instabilities. In *International Conference on Learning Representations*. https://arxiv.org/abs/2309.14322

Yiu, A. P., Mercaldo, V., Yan, C., Richards, B., Rashid, A. J., Hsiang, H.-L. L., Pressey, J., Mahadevan, V., Tran, M. M., Kushner, S. A., Woodin, M. A., Frankland, P. W., & Josselyn, S. A. (2014). Neurons are recruited to a memory trace based on relative neuronal excitability immediately before training. *Neuron, 83*(3), 722–735. https://doi.org/10.1016/j.neuron.2014.07.017
