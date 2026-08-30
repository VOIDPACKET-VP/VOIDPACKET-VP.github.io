---
layout: layouts/entry-detail.njk
title: "HTB — Forge"
date: 2026-02-14
category: Web
platform: HackTheBox
difficulty: Easy
tags: [ssrf, gopher, flask]
summary: "SSRF via an image-upload URL fetcher chained into internal service access."
backLink: /writeups/
backLabel: Writeups
---

## Enumeration

Started with a standard nmap sweep against the box. Ports 22 and 80 were open, with the web app running a Flask backend behind an nginx reverse proxy.

```bash
nmap -sC -sV -oN nmap/initial 10.10.11.111
```

The application allowed uploading an image **by URL**, which is the first sign of a potential SSRF.

## Exploitation

The upload endpoint fetched the given URL server-side without validating the scheme or destination. Pointing it at `http://localhost` confirmed SSRF, and pivoting to the internal-only admin panel exposed a file-read primitive.

```python
import requests

r = requests.post(
    "http://forge.htb/upload",
    data={"url": "http://127.0.0.1:5000/admin/backup"}
)
print(r.text)
```

> Internal services trusting "localhost" traffic is a classic SSRF-to-RCE chain — always check what's listening on loopback interfaces.

## Privilege Escalation

Found an sudoers misconfiguration allowing a backup script to run as root without a fixed `PATH`, which let a hijacked binary escalate privileges.

## Takeaways

- Never trust user-supplied URLs on the server side without an allowlist.
- Loopback-only admin panels are not a security boundary.
