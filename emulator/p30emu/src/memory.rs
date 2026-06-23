//! Byte-backed P30 address space with 15-byte lane helpers.

use crate::unit::{pack_quad, unpack_quad, valid_unit};

const DEFAULT_SIZE: usize = 64 * 1024;

pub struct P30Memory {
    bytes: Vec<u8>,
}

impl P30Memory {
    pub fn new(size: usize) -> Self {
        Self {
            bytes: vec![0; size],
        }
    }

    pub fn with_default_size() -> Self {
        Self::new(DEFAULT_SIZE)
    }

    pub fn len(&self) -> usize {
        self.bytes.len()
    }

    pub fn as_slice(&self) -> &[u8] {
        &self.bytes
    }

    pub fn write(&mut self, addr: usize, data: &[u8]) -> Result<(), &'static str> {
        let end = addr.checked_add(data.len()).ok_or("address overflow")?;
        if end > self.bytes.len() {
            return Err("out of range");
        }
        self.bytes[addr..end].copy_from_slice(data);
        Ok(())
    }

    pub fn read(&self, addr: usize, len: usize) -> Result<&[u8], &'static str> {
        let end = addr.checked_add(len).ok_or("address overflow")?;
        if end > self.bytes.len() {
            return Err("out of range");
        }
        Ok(&self.bytes[addr..end])
    }

    /// Write four units as a 15-byte lane at `addr` (must be 15-byte aligned).
    pub fn write_lane(&mut self, addr: usize, units: [u32; 4]) -> Result<(), &'static str> {
        if addr % 15 != 0 {
            return Err("lane misaligned");
        }
        self.write(addr, &pack_quad(units))
    }

    /// Read a 15-byte lane into four units.
    pub fn read_lane(&self, addr: usize) -> Result<[u32; 4], &'static str> {
        if addr % 15 != 0 {
            return Err("lane misaligned");
        }
        let chunk = self.read(addr, 15)?;
        let mut arr = [0u8; 15];
        arr.copy_from_slice(chunk);
        Ok(unpack_quad(&arr))
    }

    /// Validate `unit_count` units stored as consecutive 15-byte lanes from `addr`.
    pub fn validate_lanes(&self, addr: usize, unit_count: usize) -> Result<usize, &'static str> {
        let lanes = unit_count.div_ceil(4);
        let bytes_needed = lanes * 15;
        let end = addr.checked_add(bytes_needed).ok_or("address overflow")?;
        if end > self.bytes.len() {
            return Err("out of range");
        }
        let mut invalid = 0usize;
        let mut remaining = unit_count;
        let mut offset = addr;
        while remaining > 0 {
            let lane = self.read_lane(offset)?;
            let n = remaining.min(4);
            for u in &lane[..n] {
                if !valid_unit(*u) {
                    invalid += 1;
                }
            }
            remaining -= n;
            offset += 15;
        }
        Ok(invalid)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use p30_core::TOTATIVES;

    #[test]
    fn lane_roundtrip() {
        let mut mem = P30Memory::new(256);
        let units = [TOTATIVES[0], TOTATIVES[1], TOTATIVES[2], TOTATIVES[3]];
        mem.write_lane(0, units).unwrap();
        assert_eq!(mem.read_lane(0).unwrap(), units);
    }
}
