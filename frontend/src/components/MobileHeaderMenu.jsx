import { useEffect, useRef } from "react";
import {
  X,
  User,
  LogOut,
  Sun,
  Moon,
  Sprout,
  Store,
  Home,
  Layers,
  ShoppingCart,
  Plus,
  Tractor,
  ChevronRight,
  Globe,
  Sparkles
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { SUPPORTED_LANGUAGES } from "../i18n/translations";

export default function MobileHeaderMenu({
  isOpen,
  onClose,
  currentUser,
  onOpenProfile,
  onLogout,
  darkMode,
  onToggleDarkMode,
  onOpenLogin,
  onOpenRegister,
  currentView,
  onNavigateHome,
  onNavigateMarketplace,
  onNavigateBuyerDashboard,
  onNavigateFarmerDashboard,
  onNavigateFarmerDiscovery,
  onOpenListingModal,
  buyerRespondedCount = 0,
  farmerPendingCount = 0
}) {
  const { t, language, setLanguage } = useLanguage();
  const drawerRef = useRef(null);

  // Close on Escape key and prevent body scroll when open
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="mobile-menu-overlay" role="dialog" aria-modal="true" aria-label={t("nav.menu") || "Menu"}>
      {/* Backdrop */}
      <div className="mobile-menu-backdrop" onClick={onClose} aria-hidden="true" />

      {/* Slide-out Drawer */}
      <div className="mobile-menu-drawer" ref={drawerRef}>
        {/* Drawer Header */}
        <div className="mobile-drawer-header">
          <div className="mobile-drawer-brand">
            <div className="brand-icon-box small">
              <Sprout className="sprout-icon" size={20} />
            </div>
            <div className="brand-text">
              <span className="brand-title">{t("nav.brandTitle")}</span>
              <div className="brand-subtitle-marquee" title={t("nav.brandSubtitle")}>
                <div className="brand-cylinder-track">
                  <span className="brand-telugu brand-cylinder-item">
                    {t("nav.brandSubtitle")} <span className="brand-sep" aria-hidden="true">•</span>
                  </span>
                  <span className="brand-telugu brand-cylinder-item" aria-hidden="true">
                    {t("nav.brandSubtitle")} <span className="brand-sep">•</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="mobile-drawer-close-btn"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="mobile-drawer-body">
          {/* 1. PROFILE SECTION */}
          {currentUser ? (
            <div className="mobile-menu-profile-card">
              <div className="profile-card-top">
                <div className="profile-avatar-large">
                  {currentUser.role === "Farmer" ? "🧑‍🌾" : "🛒"}
                </div>
                <div className="profile-details-text">
                  <div className="profile-user-name">
                    {currentUser.name || currentUser.username || currentUser.email?.split("@")[0] || "User"}
                  </div>
                  <div className="profile-role-badge">
                    {currentUser.role === "Farmer" ? "🌾 " : "🛒 "}
                    {t(`nav.role${currentUser.role}`) || currentUser.role}
                  </div>
                  {currentUser.email && (
                    <div className="profile-user-email">{currentUser.email}</div>
                  )}
                </div>
              </div>

              {/* View/Edit Profile Action */}
              <button
                type="button"
                className="mobile-profile-action-btn"
                onClick={() => {
                  onClose();
                  onOpenProfile();
                }}
              >
                <div className="action-btn-left">
                  <User size={17} className="action-icon" />
                  <span>{t("nav.viewProfile") || t("nav.profile") || "My Profile"}</span>
                </div>
                <ChevronRight size={16} className="action-chevron" />
              </button>
            </div>
          ) : (
            <div className="mobile-menu-guest-card">
              <div className="guest-badge-icon">
                <Sparkles size={20} />
              </div>
              <div className="guest-card-title">{t("splash.welcome") || "Welcome to AgroConnect"}</div>
              <p className="guest-card-subtitle">{t("banner.subtext") || "Direct trade between local farmers & buyers"}</p>
              <div className="guest-card-actions">
                <button
                  type="button"
                  className="mobile-guest-btn primary"
                  onClick={() => {
                    onClose();
                    onOpenLogin("Buyer");
                  }}
                >
                  <User size={16} />
                  <span>{t("nav.logIn")}</span>
                </button>
                <button
                  type="button"
                  className="mobile-guest-btn secondary"
                  onClick={() => {
                    onClose();
                    onOpenRegister("Farmer");
                  }}
                >
                  <Sparkles size={16} />
                  <span>{t("nav.joinAgroConnect")}</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. DARK AND LIGHT MODE TOGGLE */}
          <div className="mobile-menu-section">
            <div className="mobile-section-header">
              <span className="mobile-section-label">
                {t("nav.theme") || "Theme Mode"}
              </span>
              <span className="mobile-theme-current">
                {darkMode ? (t("nav.darkMode") || "Dark Mode") : (t("nav.lightMode") || "Light Mode")}
              </span>
            </div>

            <div className="mobile-theme-switcher">
              <button
                type="button"
                className={`theme-segment-btn ${!darkMode ? "active" : ""}`}
                onClick={() => {
                  if (darkMode) onToggleDarkMode();
                }}
                aria-pressed={!darkMode}
              >
                <Sun size={17} className="theme-icon-sun" />
                <span>{t("nav.lightMode") || "Light Mode"}</span>
              </button>

              <button
                type="button"
                className={`theme-segment-btn ${darkMode ? "active" : ""}`}
                onClick={() => {
                  if (!darkMode) onToggleDarkMode();
                }}
                aria-pressed={darkMode}
              >
                <Moon size={17} className="theme-icon-moon" />
                <span>{t("nav.darkMode") || "Dark Mode"}</span>
              </button>
            </div>
          </div>

          {/* 3. ROLE-BASED NAVIGATION LINKS */}
          <div className="mobile-menu-section">
            <div className="mobile-section-header">
              <span className="mobile-section-label">
                {t("nav.menu") || "Navigation"}
              </span>
            </div>

            <nav className="mobile-menu-links-list">
              {!currentUser ? (
                // Guest Links
                <>
                  <button
                    type="button"
                    className={`mobile-menu-nav-link ${currentView === "marketplace" ? "active" : ""}`}
                    onClick={() => {
                      onClose();
                      onNavigateMarketplace();
                    }}
                  >
                    <Store size={18} />
                    <span>{t("nav.freshHarvests") || "Marketplace"}</span>
                  </button>
                  <button
                    type="button"
                    className={`mobile-menu-nav-link ${currentView === "home" ? "active" : ""}`}
                    onClick={() => {
                      onClose();
                      onNavigateHome();
                    }}
                  >
                    <Home size={18} />
                    <span>{t("nav.home") || "Home"}</span>
                  </button>
                  <button
                    type="button"
                    className="mobile-menu-nav-link"
                    onClick={() => {
                      onClose();
                      const el = document.getElementById("how-it-works");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                      window.location.hash = "how-it-works";
                    }}
                  >
                    <Layers size={18} />
                    <span>{t("nav.howItWorks") || "How It Works"}</span>
                  </button>
                </>
              ) : currentUser.role === "Buyer" ? (
                // Buyer Links
                <>
                  <button
                    type="button"
                    className={`mobile-menu-nav-link ${currentView === "marketplace" ? "active" : ""}`}
                    onClick={() => {
                      onClose();
                      onNavigateMarketplace();
                    }}
                  >
                    <Store size={18} />
                    <span>{t("nav.freshHarvests") || "Fresh Harvests"}</span>
                  </button>
                  <button
                    type="button"
                    className={`mobile-menu-nav-link ${currentView === "buyer-dashboard" ? "active" : ""}`}
                    onClick={() => {
                      onClose();
                      onNavigateBuyerDashboard();
                    }}
                  >
                    <ShoppingCart size={18} />
                    <span>{t("nav.buyerDashboard") || "Buyer Dashboard"}</span>
                    {buyerRespondedCount > 0 && (
                      <span className="badge-count-pulse">{buyerRespondedCount}</span>
                    )}
                  </button>
                </>
              ) : (
                // Farmer Links
                <>
                  <button
                    type="button"
                    className="mobile-menu-nav-link highlight"
                    onClick={() => {
                      onClose();
                      onOpenListingModal();
                    }}
                  >
                    <Plus size={18} />
                    <span>{t("nav.listCrop") || "List Crop"}</span>
                  </button>
                  <button
                    type="button"
                    className={`mobile-menu-nav-link ${currentView === "farmers" ? "active" : ""}`}
                    onClick={() => {
                      onClose();
                      onNavigateFarmerDiscovery();
                    }}
                  >
                    <Tractor size={18} />
                    <span>{t("nav.farmers") || "Farmer Discovery"}</span>
                  </button>
                  <button
                    type="button"
                    className={`mobile-menu-nav-link ${currentView === "farmer-dashboard" ? "active" : ""}`}
                    onClick={() => {
                      onClose();
                      onNavigateFarmerDashboard();
                    }}
                  >
                    <Layers size={18} />
                    <span>{t("nav.farmerDashboard") || "Farmer Dashboard"}</span>
                    {farmerPendingCount > 0 && (
                      <span className="badge-count-pulse">{farmerPendingCount}</span>
                    )}
                  </button>
                </>
              )}
            </nav>
          </div>

          {/* 4. LANGUAGE SELECTOR ROW */}
          <div className="mobile-menu-section">
            <div className="mobile-section-header">
              <span className="mobile-section-label">
                <Globe size={14} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }} />
                Language / భాష
              </span>
            </div>

            <div className="mobile-language-row">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = lang.code === language;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    className={`mobile-lang-pill ${isSelected ? "selected" : ""}`}
                    onClick={() => setLanguage(lang.code)}
                  >
                    <span className="lang-native">{lang.nativeName}</span>
                    {lang.code !== "en" && (
                      <span className="lang-short">({lang.label})</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Drawer Footer: Logout (when logged in) */}
        {currentUser && (
          <div className="mobile-drawer-footer">
            <button
              type="button"
              className="mobile-logout-btn"
              onClick={() => {
                onClose();
                onLogout();
              }}
            >
              <LogOut size={18} />
              <span>{t("nav.logout")}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
