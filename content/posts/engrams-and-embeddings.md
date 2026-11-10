---
title: "Engrams & Embeddings: what this series is about"
date: 2026-11-10
summary: "A short introduction to a series on one question that brains, swarms and neural networks all have to answer: when many units could store something, which ones actually do?"
tags: [Engrams & Embeddings, Neuroscience, Interpretability, AI Safety]
---

## TL;DR

This series follows one question across neuroscience and machine learning: when many units could store a memory or make a decision, how many of them actually get to, and which ones? I think the answer tells us something about how brains work, how to read what a model has learned, and how to take dangerous things back out of it.

## Introduction

In early November I went to two evening lectures in Geneva, one day after the other. Sheena Josselyn talked about how a memory is born, and Iain Couzin talked about how groups of animals decide where to go. I had taken a summer course with Sheena a couple of years ago, so I came for her talk. On the walk home after the second one, I realised both of them had described the same thing: a competition over who gets to represent something.

I spend most of my time working with machine learning models, and I had seen that competition there too, in transformers that suddenly break during training because their attention locks onto a single token. That is where this series comes from.

## Who it is for

I am writing for three groups of people, and I will try to keep every post readable for all of them.

- **Neuroscientists.** Engram research has worked out, in real circuits, rules that machine learning is only now rediscovering. Some of the posts will turn those rules into small computational models with predictions that could be tested in the lab.
- **Interpretability researchers.** If we know how a network decides where to store a fact, we know better where to look for it.
- **AI safety researchers.** Josselyn's lab showed years ago that if you know which neurons hold a fear memory, you can remove that memory and leave the rest alone. The same logic applies to removing a harmful capability from a model, which is why I think allocation is a safety question and not only a scientific one.

## What is coming

1. [Who Gets to Remember?](/posts/who-gets-to-remember/) One parameter, the softmax inverse temperature β, decides whether a competition has one winner, a few or all. It comes with an interactive figure, [the β Dial](/posts/who-gets-to-remember/beta-dial.html).
2. Where allocation happens inside a transformer: MLP neurons, mixture-of-experts routing and sparse autoencoders, with an experiment that makes some units more "excitable" before training and checks whether a new fact lands there.
3. A small model whose excitability rises and fades, to see whether it links memories learned close together in time, the way brains do.
4. Grokking, and whether a model's sudden jump to generalization is also a jump to sparser representations.

Later I want to turn the question around and look at what happens when the winners cooperate instead of compete: self-assembly, emergence and synergy. That part is further off.

## How I work on these

Each post separates what is established from what is my own hypothesis, and cites the papers it relies on, so you can check the claims. Where I can, I will publish the code. If something is wrong, especially from the neuroscience side, I would really like to hear about it.
