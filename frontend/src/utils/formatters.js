/**
 * AgroConnect Utility Formatters & Crop Visual Helpers
 */

export const PRESET_LOCATIONS = [
  "All",
  "Bhimavaram",
  "Anakapalli",
  "Kakinada",
  "Rajahmundry",
  "East Godavari"
];

export function getCropPhotoUrl(crop) {
  if (
    crop?.image &&
    typeof crop.image === "string" &&
    (crop.image.startsWith("http") || crop.image.startsWith("data:") || crop.image.startsWith("/"))
  ) {
    return crop.image;
  }
  const lower = ((crop?.name || "") + " " + (crop?.category || "")).toLowerCase();
  if (
    lower.includes("chilli") ||
    lower.includes("mirchi") ||
    lower.includes("మిరప") ||
    lower.includes("మిర్చి") ||
    lower.includes("मिर्च")
  ) {
    return "/crops/chillies.svg";
  }
  if (lower.includes("carrot") || lower.includes("క్యారెట్") || lower.includes("गाजर")) {
    return "/crops/carrots.svg";
  }
  if (lower.includes("mustard") || lower.includes("ఆవాలు") || lower.includes("सरसों")) {
    return "/crops/mustard.svg";
  }
  if (lower.includes("wheat") || lower.includes("గోధుమ") || lower.includes("गेहूं")) {
    return "/crops/wheat.svg";
  }
  if (
    lower.includes("rice") ||
    lower.includes("paddy") ||
    lower.includes("వరి") ||
    lower.includes("బియ్యం") ||
    lower.includes("धान") ||
    lower.includes("चावल")
  ) {
    return "/crops/rice.svg";
  }
  if (lower.includes("tomato") || lower.includes("టమోటా") || lower.includes("టమాట") || lower.includes("टमाटर")) {
    return "/crops/tomatoes.svg";
  }
  if (lower.includes("maize") || lower.includes("corn") || lower.includes("మొక్కజొన్న") || lower.includes("मक्का")) {
    return "/crops/maize.svg";
  }
  if (
    lower.includes("groundnut") ||
    lower.includes("peanut") ||
    lower.includes("వేరుశనగ") ||
    lower.includes("పల్లీ") ||
    lower.includes("मूंगफली")
  ) {
    return "/crops/groundnut.svg";
  }
  if (
    lower.includes("spice") ||
    lower.includes("masala") ||
    lower.includes("turmeric") ||
    lower.includes("పసుపు") ||
    lower.includes("हल्दी")
  ) {
    return "/crops/chillies.svg";
  }
  if (lower.includes("veg") || lower.includes("కూరగాయలు") || lower.includes("సబ్జీ")) {
    return "/crops/carrots.svg";
  }
  return "/crops/default.svg";
}

export function getCropVisualTheme(name = "", category = "") {
  const lower = name.toLowerCase();
  if (lower.includes("rice") || lower.includes("paddy") || lower.includes("వరి") || lower.includes("धान")) {
    return { emoji: "🌾", bgClass: "theme-grain" };
  }
  if (
    lower.includes("chilli") ||
    lower.includes("mirchi") ||
    lower.includes("మిరప") ||
    lower.includes("మిర్చి") ||
    lower.includes("मिर्च")
  ) {
    return { emoji: "🌶️", bgClass: "theme-spice" };
  }
  if (lower.includes("maize") || lower.includes("corn") || lower.includes("మొక్కజొన్న") || lower.includes("मक्का")) {
    return { emoji: "🌽", bgClass: "theme-maize" };
  }
  if (lower.includes("tomato") || lower.includes("టమోటా") || lower.includes("टमाटर")) {
    return { emoji: "🍅", bgClass: "theme-veg" };
  }
  if (lower.includes("groundnut") || lower.includes("peanut") || lower.includes("వేరుశనగ") || lower.includes("मूंगफली")) {
    return { emoji: "🥜", bgClass: "theme-pulse" };
  }
  if (lower.includes("turmeric") || lower.includes("పసుపు") || lower.includes("हल्दी")) {
    return { emoji: "🫚", bgClass: "theme-turmeric" };
  }
  if (category === "Vegetables") {
    return { emoji: "🥬", bgClass: "theme-veg" };
  }
  if (category === "Spices") {
    return { emoji: "🌿", bgClass: "theme-spice" };
  }
  if (category === "Pulses & Nuts") {
    return { emoji: "🫘", bgClass: "theme-pulse" };
  }
  return { emoji: "🌱", bgClass: "theme-default" };
}

export function formatEnquiryDate(dateStr, lang) {
  if (!dateStr) return "";
  try {
    const locale = lang === "te" ? "te-IN" : lang === "hi" ? "hi-IN" : "en-IN";
    return new Date(dateStr).toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return dateStr;
  }
}

export function formatRelativeTime(dateStr, lang) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffSec < 45) return "Just now";
    if (diffSec < 3600) return `${Math.max(1, Math.floor(diffSec / 60))}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 172800) return "Yesterday";
    return formatEnquiryDate(dateStr, lang);
  } catch {
    return dateStr;
  }
}

export function playChatNotificationSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.38);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // browser audio autoplay restrictions ignored safely
  }
}
