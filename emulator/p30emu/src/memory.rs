//! Unit-native P30 address space (P30-ISA v0.1 §1-§2).
//!
//! The fundamental, addressable storage cell is a 30-bit P30 *unit* — there is
//! no byte substrate. Addresses index units directly. Byte packing (4 units ->
//! 15 bytes) is purely a host/DRAM serialization concern handled in `unit.rs`
//! and applied only when crossing the host boundary, never as the in-core
//! representation.

use crate::unit::{pack_quad, unpack_quad, valid_unit, UNIT_MASK};

/// Default capacity in units (16 Ki units).
const DEFAULT_UNITS: usize = 16 * 1024;

pub struct P30Memory {
    cells: Vec<u32>,
}

impl P30Memory {
    /// Create a unit-addressed memory with `units` 30-bit cells (zeroed).
    pub fn new(units: usize) -> Self {
        Self {
            cells: vec![0; units],
        }
    }

    pub fn with_default_size() -> Self {
        Self::new(DEFAULT_UNITS)
    }

    /// Capacity in units.
    pub fn len(&self) -> usize {
        self.cells.len()
    }

    pub fn is_empty(&self) -> bool {
        self.cells.is_empty()
    }

    /// Read-only view of all unit cells.
    pub fn as_units(&self) -> &[u32] {
        &self.cells
    }

    /// Read a single 30-bit unit (PLOAD).
    pub fn read_unit(&self, addr: usize) -> Result<u32, &'static str> {
        self.cells.get(addr).copied().ok_or("out of range")
    }

    /// Write a single 30-bit unit, masked to 30 bits (PSTORE).
    pub fn write_unit(&mut self, addr: usize, unit: u32) -> Result<(), &'static str> {
        let cell = self.cells.get_mut(addr).ok_or("out of range")?;
        *cell = unit & UNIT_MASK;
        Ok(())
    }

    /// Read `count` consecutive units.
    pub fn read_units(&self, addr: usize, count: usize) -> Result<&[u32], &'static str> {
        let end = addr.checked_add(count).ok_or("address overflow")?;
        if end > self.cells.len() {
            return Err("out of range");
        }
        Ok(&self.cells[addr..end])
    }

    /// Write `units` consecutive cells (each masked to 30 bits).
    pub fn write_units(&mut self, addr: usize, units: &[u32]) -> Result<(), &'static str> {
        let end = addr.checked_add(units.len()).ok_or("address overflow")?;
        if end > self.cells.len() {
            return Err("out of range");
        }
        for (i, &u) in units.iter().enumerate() {
            self.cells[addr + i] = u & UNIT_MASK;
        }
        Ok(())
    }

    /// Write a quad (4 units) as one lane. Units are stored natively, so a lane
    /// is just four consecutive cells — no byte alignment is required.
    pub fn write_lane(&mut self, addr: usize, units: [u32; 4]) -> Result<(), &'static str> {
        self.write_units(addr, &units)
    }

    /// Read four consecutive units as a quad.
    pub fn read_lane(&self, addr: usize) -> Result<[u32; 4], &'static str> {
        let s = self.read_units(addr, 4)?;
        Ok([s[0], s[1], s[2], s[3]])
    }

    /// Count invalid (non-coprime) units among `count` cells from `addr`
    /// (PVALL-style).
    pub fn validate_lanes(&self, addr: usize, count: usize) -> Result<usize, &'static str> {
        let s = self.read_units(addr, count)?;
        Ok(s.iter().filter(|&&u| !valid_unit(u)).count())
    }

    /// Serialize `count` units from `addr` into the physical 15-byte lane byte
    /// stream (4 units -> 15 bytes, final quad zero-padded). Host/DRAM boundary
    /// only — the in-core model never stores these bytes.
    pub fn to_packed_bytes(&self, addr: usize, count: usize) -> Result<Vec<u8>, &'static str> {
        let units = self.read_units(addr, count)?;
        let mut out = Vec::with_capacity(units.len().div_ceil(4) * 15);
        for quad in units.chunks(4) {
            let mut lane = [0u32; 4];
            lane[..quad.len()].copy_from_slice(quad);
            out.extend_from_slice(&pack_quad(lane));
        }
        Ok(out)
    }

    /// Load `count` units from a physical 15-byte lane byte stream into cells
    /// starting at `addr` (inverse of [`P30Memory::to_packed_bytes`]).
    pub fn from_packed_bytes(
        &mut self,
        addr: usize,
        bytes: &[u8],
        count: usize,
    ) -> Result<(), &'static str> {
        let lanes = count.div_ceil(4);
        if bytes.len() < lanes * 15 {
            return Err("short packed buffer");
        }
        let mut units = Vec::with_capacity(lanes * 4);
        for lane in bytes[..lanes * 15].chunks_exact(15) {
            let mut arr = [0u8; 15];
            arr.copy_from_slice(lane);
            units.extend_from_slice(&unpack_quad(&arr));
        }
        units.truncate(count);
        self.write_units(addr, &units)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use p30_core::TOTATIVES;

    #[test]
    fn lane_roundtrip() {
        let mut mem = P30Memory::new(8);
        let units = [TOTATIVES[0], TOTATIVES[1], TOTATIVES[2], TOTATIVES[3]];
        mem.write_lane(0, units).unwrap();
        assert_eq!(mem.read_lane(0).unwrap(), units);
    }

    #[test]
    fn unit_masking() {
        let mut mem = P30Memory::new(2);
        // High bits above bit 29 are dropped on store.
        mem.write_unit(0, 0xFFFF_FFFF).unwrap();
        assert_eq!(mem.read_unit(0).unwrap(), UNIT_MASK);
    }

    #[test]
    fn packed_bytes_roundtrip() {
        let mut mem = P30Memory::new(8);
        let units = [TOTATIVES[0], TOTATIVES[1], TOTATIVES[2], TOTATIVES[3]];
        mem.write_lane(0, units).unwrap();
        let bytes = mem.to_packed_bytes(0, 4).unwrap();
        assert_eq!(bytes.len(), 15);
        let mut mem2 = P30Memory::new(8);
        mem2.from_packed_bytes(0, &bytes, 4).unwrap();
        assert_eq!(mem2.read_lane(0).unwrap(), units);
    }
}
