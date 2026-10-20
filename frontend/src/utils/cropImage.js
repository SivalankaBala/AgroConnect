export function getCropPhotoUrl(crop) {
  if (crop?.image && typeof crop.image === "string" && (crop.image.startsWith("http") || crop.image.startsWith("data:") || crop.image.startsWith("/"))) {
    return crop.image;
  }
  const lower = ((crop?.name || "") + " " + (crop?.category || "")).toLowerCase();
  if (lower.includes("chilli") || lower.includes("mirchi") || lower.includes("మిరప") || lower.includes("మిర్చి") || lower.includes("मिर्च")) {
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
  if (lower.includes("rice") || lower.includes("paddy") || lower.includes("వరి") || lower.includes("బియ్యం") || lower.includes("धान") || lower.includes("चावल")) {
    return "/crops/rice.svg";
  }
  if (lower.includes("tomato") || lower.includes("టమోటా") || lower.includes("టమాట") || lower.includes("टमाटर")) {
    return "/crops/tomatoes.svg";
  }
  if (lower.includes("maize") || lower.includes("corn") || lower.includes("మొక్కజొన్న") || lower.includes("मक्का")) {
    return "/crops/maize.svg";
  }
  if (lower.includes("groundnut") || lower.includes("peanut") || lower.includes("వేరుశనగ") || lower.includes("పల్లీ") || lower.includes("मूंगफली")) {
    return "/crops/groundnut.svg";
  }
  if (lower.includes("spice") || lower.includes("masala") || lower.includes("turmeric") || lower.includes("పసుపు") || lower.includes("हल्दी")) {
    return "/crops/chillies.svg";
  }
  if (lower.includes("veg") || lower.includes("కూరగాయలు") || lower.includes("సబ్జీ")) {
    return "/crops/carrots.svg";
  }
  return "/crops/default.svg";
}
