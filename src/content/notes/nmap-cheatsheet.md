---
layout: layouts/entry-detail.njk
title: "Nmap Cheatsheet"
date: 2026-01-05
category: Cheatsheet
tags: [nmap, recon, networking]
summary: "The nmap flags I actually reach for during recon, in the order I run them."
backLink: /notes/
backLabel: Notes
---

## First pass — fast, all ports

```bash
nmap -p- --min-rate=5000 -T4 -oN nmap/all-ports 10.10.11.111
```

## Second pass — service/version detection on found ports

```bash
nmap -sC -sV -p 22,80,443 -oN nmap/detailed 10.10.11.111
```

## UDP (when TCP looks thin)

```bash
sudo nmap -sU --top-ports 100 10.10.11.111
```

## Useful flags reference

| Flag | Meaning |
|---|---|
| `-sC` | default script scan |
| `-sV` | version detection |
| `-A` | aggressive (OS detect + scripts + traceroute) |
| `-Pn` | skip host discovery (assume host is up) |
| `--min-rate` | force minimum packet send rate |

> Skip `-Pn` unless you already know the host is up and blocking ICMP — it can mask a genuinely offline target.
