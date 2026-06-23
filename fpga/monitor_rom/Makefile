# P30 monitor / soak firmware — RV32 (VexRiscv / LiteX Arty A7)

CROSS ?= riscv32-unknown-elf
CC    := $(CROSS)-gcc
OBJ   := $(CROSS)-objcopy

CFLAGS  := -march=rv32i -mabi=ilp32 -O2 -Wall -Wextra -ffreestanding -nostdlib
LDFLAGS := -T linker.ld -nostdlib -static

COMMON := crt0.S.o corpus_data.c.o

.PHONY: all clean monitor p30_soak hamming_soak

all: monitor_rom.bin p30_soak.bin hamming_soak.bin

%.S.o: %.S
	$(CC) $(CFLAGS) -c $< -o $@

%.c.o: %.c p30_mmio.h p30_uart.h p30_soak.h
	$(CC) $(CFLAGS) -c $< -o $@

monitor_rom.elf: crt0.S.o main.c.o
	$(CC) $(CFLAGS) $(LDFLAGS) $^ -o $@

p30_soak.elf: $(COMMON) p30_soak.c.o
	$(CC) $(CFLAGS) $(LDFLAGS) $^ -o $@

hamming_soak.elf: $(COMMON) hamming_soak.c.o
	$(CC) $(CFLAGS) $(LDFLAGS) $^ -o $@

%.bin: %.elf
	$(OBJ) -O binary $< $@

clean:
	rm -f *.o *.elf *.bin

monitor: monitor_rom.bin
p30_soak: p30_soak.bin
hamming_soak: hamming_soak.bin
