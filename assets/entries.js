/* ============================================================
   Content index for oleenamak.ca.

   Migrated 2026-09-09 from the live Framer site at
   oleenamak.ca/writing. Titles, decks and dates are exactly as
   published there. Slugs preserve the existing URLs, so inbound
   links keep working.

   `kind` and `subjects` are the one editorial layer that was NOT
   on the old site — it had no categories. These are a proposal,
   not a reading: adjust freely, they are one line each and the
   facet counts recompute from them.

   Counts everywhere on the site are computed from this array,
   never hardcoded. DESIGN-SYSTEM §8.
   ============================================================ */

/* Facet display order — authored, not derived. Values not listed
   here are appended by count. */
window.TAXONOMY = {
  kinds:    ["essay", "note", "field note", "playbook", "project", "drawing"],
  subjects: ["crypto", "growth", "culture", "systems", "faith"]
};

window.ENTRIES = [
  {
    slug: "/writing/token-led-growth/",
    title: "Token-led Growth",
    deck: "A draft playbook for the next era of web3",
    kind: "playbook",
    date: "2026-04-20",
    subjects: ["crypto", "growth"],
    plates: 2
  },
  {
    slug: "/writing/on-fragmented-communication/",
    title: "On fragmented communication",
    deck: "The origin of fragmented communication and building modern-day Towers of Babel",
    kind: "essay",
    date: "2024-07-30",
    subjects: ["culture", "faith"],
    plates: 0
  },
  {
    slug: "/writing/web3-mental-models-measuring-performance/",
    title: "Web3 Mental Models: Measuring Performance",
    deck: "The shift to performance-based web3 metrics",
    kind: "essay",
    date: "2024-04-20",
    subjects: ["crypto", "growth", "systems"],
    plates: 2
  },
  {
    slug: "/writing/referrals-retention-in-crypto/",
    title: "Referrals + Retention in Crypto",
    deck: "Can growth happen without FOMO, airdrops or incentives?",
    kind: "essay",
    date: "2023-09-24",
    subjects: ["crypto", "growth"],
    plates: 2
  },
  {
    slug: "/writing/algorithms-groupthink-and-media/",
    title: "On algorithms, groupthink and media",
    deck: "A reflection on what controls and manufactures our thoughts",
    kind: "essay",
    date: "2020-10-14",
    subjects: ["culture"],
    plates: 0
  }
];
