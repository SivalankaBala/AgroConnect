import React from "react";
import { AgroConnectBrandLogoSvg } from "./UserAvatarLogo";
import { useLanguage } from "../context/LanguageContext";

export default function Footer({
  currentUser,
  onNavigateHome,
  onNavigateMarketplace,
  onNavigateFarmerDashboard
}) {
  const { t } = useLanguage();

  const handleBrandClick = (e) => {
    e.preventDefault();
    if (!currentUser && onNavigateHome) {
      onNavigateHome();
    } else if (currentUser?.role === "Farmer" && onNavigateFarmerDashboard) {
      onNavigateFarmerDashboard();
    } else if (onNavigateMarketplace) {
      onNavigateMarketplace();
    }
  };

  return (
    <footer className="agro-footer" role="contentinfo">
      <div className="footer-container">
        <div className="footer-compact-row">
          {/* Brand Logo & Title (Left aligned) */}
          <div className="footer-brand-col">
            <a
              className="brand-logo footer-logo"
              href={!currentUser ? "#home" : currentUser.role === "Farmer" ? "#farmer-dashboard" : "#marketplace"}
              onClick={handleBrandClick}
              title="AgroConnect"
            >
              <div className="brand-icon-box">
                <AgroConnectBrandLogoSvg size={24} />
              </div>
              <div className="brand-text">
                <span className="brand-title">{t("nav.brandTitle")}</span>
                <span className="brand-telugu">{t("nav.brandSubtitle")}</span>
              </div>
            </a>
          </div>

          {/* Direct Marketplace Tagline Pill (Center aligned) */}
          <div className="footer-center-tagline">
            <span className="footer-tagline-pill">
              {t("footer.tagline") || "100% Direct · Zero Middlemen · Andhra Pradesh"}
            </span>
          </div>

          {/* Copyright notice (Right aligned) */}
          <div className="footer-copyright-col">
            <span>{t("footer.copyright", { year: new Date().getFullYear() })}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
