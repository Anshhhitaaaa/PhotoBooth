export interface StickerDef {
  category: string;
  glyphs: string[];
}

export const STICKER_CATEGORIES: StickerDef[] = [
  {
    category: 'Hearts',
    glyphs: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🤍', '🖤', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '❣️', '💟', '♥️', '❤️‍🔥', '❤️‍🩹'],
  },
  {
    category: 'LDR',
    glyphs: ['✈️', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛', '☎️', '📞', '📱', '💻', '🌙', '☀️', '🌍', '🗺️', '📍', '💌', '📮'],
  },
  {
    category: 'Cute Couple',
    glyphs: ['👫', '👭', '👬', '💑', '👩‍❤️‍👨', '👨‍❤️‍👨', '👩‍❤️‍👩', '👩‍❤️‍💋‍👨', '💏', '🥰', '😍', '😘', '🤗', '🙈', '🙊', '🫶', '🤝', '🫂'],
  },
  {
    category: 'Flowers & Nature',
    glyphs: ['🌸', '🌷', '🌹', '🌺', '🌻', '🌼', '💐', '🏵️', '💮', '🪷', '🍀', '🍃', '🌿', '🌱', '🌴', '🌈', '☁️', '⭐', '🌟', '✨', '💫', '⚡'],
  },
  {
    category: 'Fun & Sweet',
    glyphs: ['🍰', '🧁', '🍫', '🍬', '🍭', '🍩', '🍪', '☕', '🧋', '🍓', '🍒', '🍑', '🥂', '🍾', '🎉', '🎊', '🎈', '🎁', '🎀', '🧸', '🎶', '🎵', '📸', '🦋'],
  },
  {
    category: 'Symbols',
    glyphs: ['✓', '✗', '❥', '❦', '❧', '❀', '❁', '❂', '❃', '❄', '✿', '✾', '✽', '➜', '➤', '♡', '♢', '◈', '◉', '☀', '☁', '☂', '☃', '✦', '✧'],
  },
];

/** Flat list of all glyphs for quick-pick favorites */
export const ALL_STICKERS: string[] = STICKER_CATEGORIES.flatMap((c) => c.glyphs);
