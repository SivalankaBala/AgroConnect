import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Store,
  Home,
  Layers,
  Bell,
  CheckCheck,
  Check,
  CheckCircle2,
  X,
  Trash2,
  Sparkles,
  LogIn,
  Sun,
  Moon,
  Menu
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { AgroConnectBrandLogoSvg } from "./UserAvatarLogo";
import MobileHeaderMenu from "./MobileHeaderMenu";
import { formatRelativeTime } from "../utils/formatters";

export default function Navbar({
  currentUser,
  currentView,
  unreadNotificationCount = 0,
  unreadChatCount = 0,
  buyerRespondedCount = 0,
  farmerPendingCount = 0,
  notifications = [],
  onNotificationClick,
  onMarkAllNotificationsRead,
  onMarkNotificationRead,
  onClearNotification,
  onClearAllNotifications,
  onNavigateHome,
  onNavigateMarketplace,
  onNavigateBuyerDashboard,
  onNavigateFarmerDashboard,
  onNavigateFarmerDiscovery,
  onNavigateMessages,
  onOpenListingModal,
  onOpenLogin,
  onOpenRegister,
  onOpenProfile,
  onOpenSettings,
  onLogout,
  darkMode = false,
  onToggleDarkMode
}) {
  const { t, language } = useLanguage();

  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState("all"); // 'all' | 'unread'

  const notifDropdownRef = useRef(null);

  // Close notification dropdown when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target)) {
        setNotifDropdownOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setNotifDropdownOpen(false);
      }
    }
    if (notifDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside, { passive: true });
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [notifDropdownOpen]);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    if (notifFilter === "unread") {
      return notifications.filter((n) => !n.read);
    }
    return notifications;
  }, [notifications, notifFilter]);

  return (
    <nav className="main-navbar">
      <div className="navbar-container">
        {/* ========================================================================= */}
        {/* SECTION 1: BRAND LOGO WITH 3D CYLINDER RUNNING MARQUEE                    */}
        {/* ========================================================================= */}
        <a
          className="brand-logo"
          href={!currentUser ? "#home" : currentUser.role === "Farmer" ? "#farmer-dashboard" : "#marketplace"}
          onClick={(e) => {
            e.preventDefault();
            if (!currentUser && onNavigateHome) onNavigateHome();
            else if (currentUser?.role === "Farmer" && onNavigateFarmerDashboard) onNavigateFarmerDashboard();
            else if (onNavigateMarketplace) onNavigateMarketplace();
          }}
        >
          <div className="brand-icon-box">
            <AgroConnectBrandLogoSvg size={44} />
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
        </a>

        {/* ========================================================================= */}
        {/* SECTION 2: TOP NAVIGATION LINKS (GUEST DISCOVERY ONLY)                    */}
        {/* Logged-in users navigate via the Left Sidebar Navigation (SidebarNav)      */}
        {/* ========================================================================= */}
        {!currentUser && (
          <div className="nav-center-links">
            {/* GUEST NAVBAR: Home, How It Works, Fresh Harvests, Login */}
            <button
              type="button"
              className={`nav-link-btn ${currentView === "home" && window.location.hash !== "#how-it-works" ? "active" : ""}`}
              onClick={onNavigateHome}
            >
              <Home size={16} />
              <span>{t("nav.home") || "Home"}</span>
            </button>
            <button
              type="button"
              className={`nav-link-btn ${window.location.hash === "#how-it-works" ? "active" : ""}`}
              onClick={() => {
                if (onNavigateHome) onNavigateHome();
                setTimeout(() => {
                  const el = document.getElementById("how-it-works");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }, 50);
                window.location.hash = "how-it-works";
              }}
            >
              <Layers size={16} />
              <span>{t("nav.howItWorks") || "How It Works"}</span>
            </button>
            {currentView !== "home" && (
              <button
                type="button"
                className={`nav-link-btn ${currentView === "marketplace" ? "active" : ""}`}
                onClick={onNavigateMarketplace}
              >
                <Store size={16} />
                <span>{t("nav.freshHarvests") || "Fresh Harvests"}</span>
              </button>
            )}
            <button
              type="button"
              className="nav-link-btn"
              onClick={() => onOpenLogin && onOpenLogin("Buyer")}
            >
              <LogIn size={16} />
              <span>{t("nav.logIn") || "Login"}</span>
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 3: TOP NAVBAR ACTIONS (NOTIFICATIONS, THEME, MOBILE TRIGGER)      */}
        {/* ========================================================================= */}
        <div className="nav-actions">
          {/* SUBSECTION 3A: NOTIFICATION BELL WITH FLYOUT MENU (Visible on Desktop & Mobile Top Right) */}
          <div className="nav-notif-container" ref={notifDropdownRef}>
            <button
              type="button"
              className={`btn-nav-notif-bell ${notifDropdownOpen ? "active" : ""}`}
              onClick={() => {
                if (!currentUser) {
                  if (onOpenLogin) onOpenLogin("Buyer");
                  return;
                }
                setNotifDropdownOpen((prev) => !prev);
              }}
              title={currentUser ? "Notifications & Updates" : "Sign in to view notifications"}
              aria-label={currentUser ? "Open notifications" : "Sign in to view notifications"}
              aria-expanded={notifDropdownOpen}
            >
              <Bell size={18} className="nav-notif-icon" />
              {currentUser && unreadNotificationCount > 0 && (
                <span className="notif-badge-bubble">
                  {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                  <span className="notif-badge-ping" />
                </span>
              )}
            </button>

            {/* Mobile Backdrop for outside tap dismissal */}
            {notifDropdownOpen && currentUser && (
              <div
                className="notif-mobile-backdrop"
                onClick={() => setNotifDropdownOpen(false)}
                aria-hidden="true"
              />
            )}

            {/* NOTIFICATION FLYOUT DROPDOWN */}
            {notifDropdownOpen && currentUser && (
              <div className="notification-flyout-menu" role="menu">
                <div className="notif-flyout-header">
                  <div className="notif-flyout-title-wrap">
                    <Bell size={16} className="flyout-header-icon" />
                    <h4 className="notif-flyout-title">Notifications</h4>
                    {unreadNotificationCount > 0 && (
                      <span className="notif-unread-pill">{unreadNotificationCount} new</span>
                    )}
                  </div>
                  <div className="notif-header-actions">
                    {unreadNotificationCount > 0 && onMarkAllNotificationsRead && (
                      <button
                        type="button"
                        className="notif-mark-all-btn"
                        onClick={onMarkAllNotificationsRead}
                        title="Mark all notifications as read"
                      >
                        <CheckCheck size={14} />
                        <span>Mark all read</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-notif-close"
                      onClick={() => setNotifDropdownOpen(false)}
                      title="Close"
                      aria-label="Close notifications"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Tabs for unread / all & Clear all button */}
                <div className="notif-tabs-bar">
                  <div className="notif-tabs-group">
                    <button
                      type="button"
                      className={`notif-tab-item ${notifFilter === "all" ? "active" : ""}`}
                      onClick={() => setNotifFilter("all")}
                    >
                      All ({notifications.length})
                    </button>
                    <button
                      type="button"
                      className={`notif-tab-item ${notifFilter === "unread" ? "active" : ""}`}
                      onClick={() => setNotifFilter("unread")}
                    >
                      Unread ({unreadNotificationCount})
                    </button>
                  </div>
                  {notifications.length > 0 && onClearAllNotifications && (
                    <button
                      type="button"
                      className="notif-clear-all-btn"
                      onClick={onClearAllNotifications}
                      title="Clear all notifications"
                    >
                      <Trash2 size={13} />
                      <span>Clear all</span>
                    </button>
                  )}
                </div>

                {/* Notification Items List */}
                <div className="notif-flyout-list">
                  {filteredNotifications.length === 0 ? (
                    <div className="notif-empty-state">
                      <div className="notif-empty-icon-wrap">
                        <Sparkles size={24} className="notif-empty-icon" />
                      </div>
                      <p className="notif-empty-title">No notifications yet</p>
                      <span className="notif-empty-desc">You're all caught up with orders & enquiries.</span>
                    </div>
                  ) : (
                    filteredNotifications.map((notif) => {
                      const isUnread = !notif.read;
                      const isConfirmed = notif.type === "order_confirmed" || notif.status === "confirmed";
                      const isRejected = notif.type === "order_rejected" || notif.status === "rejected";

                      return (
                        <div
                          key={notif._id}
                          className={`notif-item-card ${isUnread ? "unread" : "read"} ${isConfirmed ? "status-confirmed" : isRejected ? "status-rejected" : "status-update"}`}
                          onClick={() => {
                            if (onNotificationClick) {
                              onNotificationClick(notif);
                              setNotifDropdownOpen(false);
                            }
                          }}
                        >
                          <div className="notif-card-icon-col">
                            <div className={`notif-type-bubble ${isConfirmed ? "confirmed" : isRejected ? "rejected" : "update"}`}>
                              {isConfirmed ? (
                                <CheckCircle2 size={16} />
                              ) : isRejected ? (
                                <X size={16} />
                              ) : (
                                <Bell size={16} />
                              )}
                            </div>
                          </div>
                          <div className="notif-card-content">
                            <div className="notif-card-top-row">
                              <div className="notif-title-group">
                                <h5 className="notif-item-title">{notif.title}</h5>
                                {isUnread && <span className="notif-unread-dot" title="Unread" />}
                              </div>
                              <span className="notif-item-time">
                                {formatRelativeTime(notif.createdAt, language)}
                              </span>
                            </div>
                            <p className="notif-item-message">{notif.message}</p>
                            <div className="notif-card-bottom-row">
                              <div className="notif-tags-wrap">
                                {notif.cropName && (
                                  <span className="notif-crop-pill">🌾 {notif.cropName}</span>
                                )}
                                <span className={`notif-status-badge ${isConfirmed ? "confirmed" : isRejected ? "rejected" : "update"}`}>
                                  {isConfirmed ? "Confirmed" : isRejected ? "Declined" : "Update"}
                                </span>
                              </div>
                              <div className="notif-card-actions">
                                {isUnread && onMarkNotificationRead && (
                                  <button
                                    type="button"
                                    className="btn-mark-single-read"
                                    title="Mark as read"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onMarkNotificationRead(notif._id);
                                    }}
                                  >
                                    <Check size={13} />
                                    <span>Read</span>
                                  </button>
                                )}
                                {onClearNotification && (
                                  <button
                                    type="button"
                                    className="btn-delete-notif"
                                    title="Delete notification"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onClearNotification(notif._id);
                                    }}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Actions Cluster (visible on desktop > 768px, hidden on mobile) */}
          <div className="nav-actions-desktop">
            {/* SUBSECTION 3B: THEME TOGGLE (DARK / LIGHT MODE) */}
            <button
              type="button"
              className="theme-toggle-btn btn-theme-toggle"
              onClick={() => onToggleDarkMode && onToggleDarkMode(!darkMode)}
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>

          {/* SUBSECTION 3C: MOBILE HEADER HAMBURGER TRIGGER (< 769px) */}
          <button
            type="button"
            className="mobile-hamburger-btn mobile-header-hamburger"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            <Menu size={22} />
            {(unreadNotificationCount > 0 || unreadChatCount > 0) && (
              <span className="hamburger-dot-badge" />
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: MOBILE HEADER SLIDE-OUT MENU DRAWER                            */}
      {/* ========================================================================= */}
      <MobileHeaderMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        currentUser={currentUser}
        onOpenProfile={() => {
          setMobileMenuOpen(false);
          if (onOpenProfile) onOpenProfile();
        }}
        onLogout={() => {
          setMobileMenuOpen(false);
          if (onLogout) onLogout();
        }}
        darkMode={darkMode}
        onToggleDarkMode={onToggleDarkMode}
        onOpenLogin={(role) => {
          setMobileMenuOpen(false);
          if (onOpenLogin) onOpenLogin(role);
        }}
        onOpenRegister={(role) => {
          setMobileMenuOpen(false);
          if (onOpenRegister) onOpenRegister(role);
        }}
        currentView={currentView}
        onNavigateHome={() => {
          setMobileMenuOpen(false);
          if (onNavigateHome) onNavigateHome();
        }}
        onNavigateMarketplace={() => {
          setMobileMenuOpen(false);
          if (onNavigateMarketplace) onNavigateMarketplace();
        }}
        onNavigateBuyerDashboard={() => {
          setMobileMenuOpen(false);
          if (onNavigateBuyerDashboard) onNavigateBuyerDashboard();
        }}
        onNavigateFarmerDashboard={() => {
          setMobileMenuOpen(false);
          if (onNavigateFarmerDashboard) onNavigateFarmerDashboard();
        }}
        onNavigateFarmerDiscovery={() => {
          setMobileMenuOpen(false);
          if (onNavigateFarmerDiscovery) onNavigateFarmerDiscovery();
        }}
        onNavigateMessages={() => {
          setMobileMenuOpen(false);
          if (onNavigateMessages) onNavigateMessages();
        }}
        onOpenListingModal={() => {
          setMobileMenuOpen(false);
          if (onOpenListingModal) onOpenListingModal();
        }}
        buyerRespondedCount={buyerRespondedCount}
        farmerPendingCount={farmerPendingCount}
        unreadChatCount={unreadChatCount}
      />
    </nav>
  );
}
