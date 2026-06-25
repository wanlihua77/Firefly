---
title: Spring 单例 Bean 与线程安全解析
published: 2026-06-25
updated: 2026-06-25
description: "深入理解 Spring 单例 Bean 是否线程安全，以及面试高频回答方式"
image: ""
tags: [Spring, Java, 面试, 线程安全, 后端]
category: "Java后端"
draft: false
---

## 概述

在 Spring 框架中，`@Service`、`@Component` 等默认 Bean 作用域是 **singleton（单例）**。

但很多开发者会误解：

> 单例 = 线程安全

实际上这是一个非常常见的面试陷阱点。

---

## Spring 单例的真实含义

Spring 的单例指的是：

> 在 Spring IoC 容器中 **只有一个实例对象**

而不是：

- ❌ 每个线程一个对象
- ❌ 每个请求一个对象
- ❌ 自动保证线程安全

---

## 关键结论（面试必答）

> Spring 单例 Bean **不是线程安全的，是否安全取决于 Bean 是否有共享可变状态**

---

## 为什么不线程安全？

因为多个线程会同时访问同一个对象实例。

例如：

```java
@Component
public class UserService {

    private int count = 0;

    public void add() {
        count++; // 非原子操作，线程不安全
    }
}