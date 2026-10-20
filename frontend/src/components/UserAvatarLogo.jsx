import React from "react";
import agroConnectMainLogo from "../assets/Agroconnect_ Connecting Farmers and Buyers.png";

/**
 * High-definition, handcrafted vector SVG avatar for Farmers.
 * Features a friendly agricultural professional in a classic woven straw hat with green ribbon & sprout.
 */
export const FarmerAvatarSvg = ({ size = 36, className = "" }) => (
  <svg
    viewBox="0 0 48 48"
    width={size}
    height={size}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`avatar-vector-svg farmer-avatar-svg ${className}`}
    style={{ borderRadius: "50%", overflow: "hidden", display: "block" }}
    aria-label="Farmer Avatar"
  >
    <defs>
      <linearGradient id="farmerBgGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="#059669" />
        <stop offset="1" stopColor="#047857" />
      </linearGradient>
      <linearGradient id="farmerStrawGrad" x1="12" y1="10" x2="36" y2="24" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FDE68A" />
        <stop offset="0.5" stopColor="#FBBF24" />
        <stop offset="1" stopColor="#D97706" />
      </linearGradient>
      <linearGradient id="farmerSkinGrad" x1="24" y1="18" x2="24" y2="30" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FDE047" />
        <stop offset="1" stopColor="#F59E0B" />
      </linearGradient>
      <linearGradient id="farmerShirtGrad" x1="11" y1="33" x2="37" y2="45" gradientUnits="userSpaceOnUse">
        <stop stopColor="#10B981" />
        <stop offset="1" stopColor="#065F46" />
      </linearGradient>
    </defs>
    {/* Background Circle */}
    <circle cx="24" cy="24" r="24" fill="url(#farmerBgGrad)" />

    {/* Subtle inner emerald rim */}
    <circle cx="24" cy="24" r="22.5" stroke="#34D399" strokeWidth="1" strokeOpacity="0.45" />

    {/* Farmer Overalls & Shoulders */}
    <path
      d="M10 44 C10 35.5, 16.5 32.5, 24 32.5 C31.5 32.5, 38 35.5, 38 44 Z"
      fill="url(#farmerShirtGrad)"
    />
    {/* Suspenders */}
    <path d="M17.5 33 L17.5 44" stroke="#047857" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M30.5 33 L30.5 44" stroke="#047857" strokeWidth="2.4" strokeLinecap="round" />
    <circle cx="17.5" cy="35.5" r="1.2" fill="#FCD34D" />
    <circle cx="30.5" cy="35.5" r="1.2" fill="#FCD34D" />

    {/* Neck */}
    <rect x="21" y="27" width="6" height="5" rx="2" fill="#FBBF24" />

    {/* Face */}
    <circle cx="24" cy="23.5" r="7.5" fill="url(#farmerSkinGrad)" />

    {/* Eyes and Warm Smile */}
    <circle cx="21" cy="23" r="1.1" fill="#78350F" />
    <circle cx="27" cy="23" r="1.1" fill="#78350F" />
    <path d="M22 26.5 C23 27.8, 25 27.8, 26 26.5" stroke="#78350F" strokeWidth="1.2" strokeLinecap="round" />

    {/* Straw Hat Crown */}
    <path
      d="M17 18 C17 11.5, 19.5 10.5, 24 10.5 C28.5 10.5, 31 11.5, 31 18 Z"
      fill="url(#farmerStrawGrad)"
    />
    {/* Straw Hat Brim */}
    <ellipse cx="24" cy="18" rx="13.5" ry="3.3" fill="url(#farmerStrawGrad)" />
    {/* Hat Ribbon */}
    <path
      d="M17.2 17 C19.5 15.8, 28.5 15.8, 30.8 17"
      stroke="#047857"
      strokeWidth="2.2"
      strokeLinecap="round"
    />

    {/* Green Sprout Tuck in Hat */}
    <path d="M29.5 11.5 C32 9.5, 33.5 10.5, 33.5 10.5 C33.5 10.5, 32.8 13, 30.5 13 Z" fill="#34D399" />
  </svg>
);

/**
 * High-definition vector SVG avatar for Verified Buyers.
 * Features a modern corporate merchant in a crisp collar & tie with a verified check badge.
 */
export const BuyerAvatarSvg = ({ size = 36, className = "" }) => (
  <svg
    viewBox="0 0 48 48"
    width={size}
    height={size}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`avatar-vector-svg buyer-avatar-svg ${className}`}
    style={{ borderRadius: "50%", overflow: "hidden", display: "block" }}
    aria-label="Buyer Avatar"
  >
    <defs>
      <linearGradient id="buyerBgGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2563EB" />
        <stop offset="1" stopColor="#1D4ED8" />
      </linearGradient>
      <linearGradient id="buyerSuitGrad" x1="11" y1="33" x2="37" y2="45" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3B82F6" />
        <stop offset="1" stopColor="#1E40AF" />
      </linearGradient>
      <linearGradient id="buyerSkinGrad" x1="24" y1="18" x2="24" y2="30" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FDE047" />
        <stop offset="1" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
    {/* Background Circle */}
    <circle cx="24" cy="24" r="24" fill="url(#buyerBgGrad)" />

    {/* Subtle inner sapphire rim */}
    <circle cx="24" cy="24" r="22.5" stroke="#93C5FD" strokeWidth="1" strokeOpacity="0.45" />

    {/* Business Attire / Blazer */}
    <path
      d="M10 44 C10 35.5, 16.5 32.5, 24 32.5 C31.5 32.5, 38 35.5, 38 44 Z"
      fill="url(#buyerSuitGrad)"
    />
    {/* Crisp White Shirt Collar */}
    <path d="M20 32.5 L24 37.5 L28 32.5 Z" fill="#FFFFFF" />
    {/* Elegant Gold Tie */}
    <path d="M23 36.5 L25 36.5 L24.5 44 L23.5 44 Z" fill="#F59E0B" />

    {/* Neck */}
    <rect x="21" y="27" width="6" height="5" rx="2" fill="#FBBF24" />

    {/* Face */}
    <circle cx="24" cy="22" r="7.5" fill="url(#buyerSkinGrad)" />

    {/* Eyes and Friendly Professional Smile */}
    <circle cx="21" cy="22" r="1.1" fill="#1E293B" />
    <circle cx="27" cy="22" r="1.1" fill="#1E293B" />
    <path d="M22 25 C23 26, 25 26, 26 25" stroke="#1E293B" strokeWidth="1.2" strokeLinecap="round" />

    {/* Modern Styled Hair */}
    <path
      d="M17 20 C16.5 14, 19 12, 24 12 C29 12, 31.5 14, 31 20 C29.5 17, 27.5 15, 24 15 C19.5 15, 18 17, 17 20 Z"
      fill="#1E293B"
    />

    {/* Verified Star Badge Accent */}
    <circle cx="34" cy="34" r="6" fill="#10B981" />
    <path
      d="M31.5 34 L33.2 35.7 L36.8 32.2"
      stroke="#FFFFFF"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * AgroConnect Official Brand Logo Emblem.
 */
export const AgroConnectBrandLogo = ({ size = 32, className = "" }) => (
  <img
    src={agroConnectMainLogo}
    alt="AgroConnect Logo"
    width={size}
    height={size}
    className={`agroconnect-brand-logo-img ${className}`}
    style={{
      width: size,
      height: size,
      objectFit: "cover",
      display: "inline-block",
      verticalAlign: "middle"
    }}
  />
);

export const AgroConnectBrandLogoSvg = AgroConnectBrandLogo;

/**
 * Universal UserAvatar Component.
 * Automatically chooses photo if provided, or the bespoke vector avatar logo by role.
 */
export const UserAvatar = ({ user, size = 34, className = "" }) => {
  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name || "User"}
        className={`user-avatar-image ${className}`}
        style={{ width: size, height: size, objectFit: "cover", borderRadius: "50%" }}
      />
    );
  }

  if (user?.role === "Buyer") {
    return <BuyerAvatarSvg size={size} className={className} />;
  }

  return <FarmerAvatarSvg size={size} className={className} />;
};

export default UserAvatar;
