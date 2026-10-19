import { Sprout, ShoppingCart, User, Plus, Tractor, Layers, MessageSquare } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function MobileBottomNav({
  activeNav = "home",
  onNavClick,
  currentUser = null,
  unreadChatCount = 0
}) {
  const { t } = useLanguage();

  // Hide mobile bottom navigation completely for guests
  if (!currentUser) {
    return null;
  }

  // Buyer mobile bottom navigation
  if (currentUser.role === "Buyer") {
    return (
      <nav className="mobile-bottom-nav" aria-label="Buyer Mobile Navigation">
        <button
          type="button"
          className={`bottom-nav-item ${activeNav === "crops" || activeNav === "marketplace" ? "active" : ""}`}
          onClick={() => onNavClick("crops")}
        >
          <Sprout size={20} className="bottom-nav-icon" />
          <span className="bottom-nav-label">{t("nav.freshHarvests") || "Fresh Harvests"}</span>
        </button>

        <button
          type="button"
          className={`bottom-nav-item ${activeNav === "buyerDashboard" || activeNav === "dashboard" ? "active" : ""}`}
          onClick={() => onNavClick("buyerDashboard")}
        >
          <ShoppingCart size={20} className="bottom-nav-icon" />
          <span className="bottom-nav-label">{t("nav.buyerDashboard") || "Dashboard"}</span>
        </button>

        <button
          type="button"
          className={`bottom-nav-item ${activeNav === "messages" ? "active" : ""}`}
          onClick={() => onNavClick("messages")}
        >
          <div className="bottom-nav-icon-wrapper">
            <MessageSquare size={20} className="bottom-nav-icon" />
            {unreadChatCount > 0 && (
              <span className="bottom-nav-badge">{unreadChatCount}</span>
            )}
          </div>
          <span className="bottom-nav-label">{t("nav.messages") || "Messages"}</span>
        </button>

        <button
          type="button"
          className={`bottom-nav-item ${activeNav === "profile" ? "active" : ""}`}
          onClick={() => onNavClick("profile")}
        >
          <User size={20} className="bottom-nav-icon" />
          <span className="bottom-nav-label">{t("nav.profile") || "Profile"}</span>
        </button>
      </nav>
    );
  }

  // Farmer mobile bottom navigation
  return (
    <nav className="mobile-bottom-nav" aria-label="Farmer Mobile Navigation">
      <button
        type="button"
        className={`bottom-nav-item ${activeNav === "listCrop" ? "active" : ""}`}
        onClick={() => onNavClick("listCrop")}
      >
        <Plus size={20} className="bottom-nav-icon" />
        <span className="bottom-nav-label">{t("nav.listCrop") || "List Crop"}</span>
      </button>

      <button
        type="button"
        className={`bottom-nav-item ${activeNav === "messages" ? "active" : ""}`}
        onClick={() => onNavClick("messages")}
      >
        <div className="bottom-nav-icon-wrapper">
          <MessageSquare size={20} className="bottom-nav-icon" />
          {unreadChatCount > 0 && (
            <span className="bottom-nav-badge">{unreadChatCount}</span>
          )}
        </div>
        <span className="bottom-nav-label">{t("nav.messages") || "Messages"}</span>
      </button>

      <button
        type="button"
        className={`bottom-nav-item ${activeNav === "farmers" ? "active" : ""}`}
        onClick={() => onNavClick("farmers")}
      >
        <Tractor size={20} className="bottom-nav-icon" />
        <span className="bottom-nav-label">{t("nav.farmers") || "Farmers"}</span>
      </button>

      <button
        type="button"
        className={`bottom-nav-item ${activeNav === "farmerDashboard" || activeNav === "dashboard" ? "active" : ""}`}
        onClick={() => onNavClick("farmerDashboard")}
      >
        <Layers size={20} className="bottom-nav-icon" />
        <span className="bottom-nav-label">{t("nav.farmerDashboard") || "Dashboard"}</span>
      </button>

      <button
        type="button"
        className={`bottom-nav-item ${activeNav === "profile" ? "active" : ""}`}
        onClick={() => onNavClick("profile")}
      >
        <User size={20} className="bottom-nav-icon" />
        <span className="bottom-nav-label">{t("nav.profile") || "Profile"}</span>
      </button>
    </nav>
  );
}

