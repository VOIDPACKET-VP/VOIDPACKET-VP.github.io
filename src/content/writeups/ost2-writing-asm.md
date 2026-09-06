---
layout: layouts/entry-detail.njk
title: "OST2 : Writing Assembly"
date: 2026-09-04
category: Assembly
platform: OST2
difficulty: Easy
tags: [Opcode, asm, RTFM, Low Level]
summary: "Converte assmebly code into Machine Code (Opcode)"
backLink: /writeups/
backLabel: Writeups
---

I started by using the ==Intel manual==, which is where I found the opcode formats for each instruction. At first, the notation looked more complicated than the instructions themselves. For example, I learned that `MOV r32, imm32` uses the opcode form `B8 + rd id`. Since `EAX` has register code 0, the opcode becomes `B8`.

That meant:

```assembly
mov eax, 0xAABBCCDD
```

was encoded as:

```text
B8 DD CC BB AA
```

The immediate value had to be written in little-endian order, so `0xAABBCCDD` became `DD CC BB AA`.

The next instruction was:

```assembly
sahf
```

I initially did not know what it did, but after looking it up, I found that `SAHF` copies the flags stored in the `AH` register into the processor’s status flags. Its opcode is:

```text
9E
```

After loading `0xAABBCCDD` into `EAX`, the `AH` register contains `0xCC`. The `SAHF` instruction uses that value to update the flags, which affects the following conditional jump.

The difficult part was the jump:

```assembly
jz mylabel
```

The ==Intel manual== gives the near conditional-jump encoding as:

```text
0F 84 rel32
```

The `rel32` does not mean that the absolute address of `mylabel` is placed directly into the instruction. It means that a signed 32-bit relative displacement is stored there. The processor calculates the destination using:

$$\text{relative displacement} = \text{address of target} - \text{address immediately after the jump}$$

To calculate that manually, I first had to determine how many bytes each instruction occupied.

My complete assembly code was:

```assembly
mov eax, 0xAABBCCDD
sahf
jz mylabel
and eax, 0x31337

mylabel:
ret
```

The byte lengths were:

- `mov eax, imm32` = 5 bytes
- `sahf` = 1 byte
- `jz rel32` = 6 bytes
- `and eax, imm32` = 5 bytes
- `ret` = 1 byte

I then assigned offsets starting from zero:

```text
B8 DD CC BB AA       ; offsets 00–04
9E                   ; offset 05
0F 84                ; offsets 06–07
?? ?? ?? ??          ; offsets 08–0B
25 37 13 03 00       ; offsets 0C–10
mylabel:             ; offset 11
C3                   ; offset 11
```

The `JZ` instruction begins at offset 06 and is 6 bytes long, so the address immediately after it is offset 0C. The label is located at offset 11. Therefore:

==_0x11 - 0x0C = 0x05_==

The relative displacement is 0x05, which is encoded as a 32-bit little-endian value:

```text
05 00 00 00
```

The `AND` instruction also required careful attention to little-endian encoding. The value `0x31337` is really:

```text
0x00031337
```

Therefore its immediate bytes are:

```text
37 13 03 00
```

The opcode for:

```assembly
and eax, imm32
```

is:

```text
25
```

Finally, `RET` has the single-byte opcode:

```text
C3
```

The completed raw byte sequence is therefore:

```text
B8 DD CC BB AA       ; mov eax, 0xAABBCCDD
9E                   ; sahf
0F 84 05 00 00 00    ; jz mylabel
25 37 13 03 00       ; and eax, 0x00031337
C3                   ; ret
```

When trying to bundle this into Visual Studio alongside a C entry point, I hit a few critical compiler and linker errors that needed fixing. First, MASM threw errors complaining that instructions must be inside a segment block. Because this is a 32-bit (x86) workspace, the assembler needs an explicit memory layout specification before it will parse raw directives. Adding `.model flat, c` to the top established a flat memory space and configured the C calling convention rules.

Next, I hit a `LNK4042` and `LNK2019` mismatch because both my files were originally called `Source.c` and `Source.asm`. They were compiling into identical `Source.obj` files and overwriting each other, causing the linker to lose track of the assembly function symbol entirely. Renaming them to distinct names (`main.c` and `challenge.asm`) resolved the conflict.

Once compiled, reviewing the code in the Visual Studio disassembly window revealed a final interesting behavior: the instruction bytes `0F 84` were translated to `JE` (Jump if Equal) instead of `JZ`. Because `JE` and `JZ` both check if the Zero Flag (`ZF`) is 1, they are identical opcodes to the CPU. While assemblers natively optimize these short jumps down to a 2-byte short instruction (`74 05`), hardcoding the 6-byte near-jump variant (`0F 84 05 00 00 00`) worked perfectly because the relative displacement math remained exactly the same.

```assembly
.model flat, c

.code
asmToOpCode_challenge PROC

	db 0B8h, 0DDh, 0CCh, 0BBh, 0AAh         ; mov eax, 0xAABBCCDD
	db 09Eh                                 ; sahf					
	db 00Fh, 084h, 005h, 000h, 000h, 000h	; jz mylabel			
	db 025h, 037h, 013h, 003h, 000h         ; and eax, 0x31337		
	db 0C3h                                 ; ret

asmToOpCode_challenge ENDP
end
```

```c
#include <stdio.h>
extern void asmToOpCode_challenge(void);

int main(void)
{
	asmToOpCode_challenge();
	return 0;
}
```

The main lesson was that labels do not generate bytes themselves. `mylabel:` simply marks the address of the next instruction. The assembler uses that address to calculate the jump displacement. For relative jumps, the essential rule is:

==_relative displacement = target address - address after the jump_==

So when calculating a jump manually, I need to count the length of every instruction, include the complete length of the jump itself, find the offset of the target label, subtract, and finally encode the result in little-endian order.