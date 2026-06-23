---
title: GitHub 和 Vercel 部署项目
published: 2026-06-23 
pinned: true
description: 介绍如何使用 GitHub 和 Vercel 部署项目
tags: [Markdown, Firefly, 博客, 部署]
category: 部署笔记
draft: false
image: ./images/firefly2.avif
---

## 更新GitHub从 https://github.com/CuteLeaf/Firefly.git
git remote add upstream https://github.com/CuteLeaf/Firefly.git
git fetch upstream
git merge upstream/master
git push origin master

