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

  return (
    <footer className="agro-footer">
      <div className="footer-container">
        <div className="footer-main-row">
          <div className="footer-brand-col">
            <a
              className="brand-logo footer-logo"
              href={!currentUser ? "#home" : currentUser.role === "Farmer" ? "#farmer-dashboard" : "#marketplace"}
              onClick={(e) => {
                e.preventDefault();
                if (!currentUser && onNavigateHome) onNavigateHome();
                else if (currentUser?.role === "Farmer" && onNavigateFarmerDashboard) onNavigateFarmerDashboard();
                else if (onNavigateMarketplace) onNavigateMarketplace();
              }}
            >
              <div className="brand-icon-box">
                <AgroConnectBrandLogoSvg size={32} />
              </div>
              <div className="brand-text">
                <span className="brand-title">{t("nav.brandTitle")}</span>
                <span className="brand-telugu">{t("nav.brandSubtitle")}</span>
              </div>
            </a>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <span>{t("footer.copyright", { year: new Date().getFullYear() })}</span>
        </div>
      </div>
    </footer>
  );
}
