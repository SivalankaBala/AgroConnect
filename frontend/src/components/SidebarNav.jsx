import React from "react";
import {
  LayoutDashboard,
  Package,
  MessageSquare,
  ShoppingCart,
  TrendingUp,
  Settings,
  Store,
  Bell,
  ChevronRight,
  Tractor
} from "lucide-react";
import { AgroConnectBrandLogoSvg, UserAvatar } from "./UserAvatarLogo";

/**
 * Universal Left Sidebar Navigation for AgroConnect Dashboards.
 * Displays on desktop (>= 769px) for both Farmer and Buyer Dashboards.
 * Seamlessly adapts to Light and Dark modes via CSS variables.
 */
export default function SidebarNav({
  currentUser,
  currentView,
  dashboardTab = "all",
  buyerDashboardTab = "all",
  farmerPendingCount = 0,
  confirmedOrdersCount = 0,
  unreadNotificationCount = 0,
  buyerPendingCount = 0,
  buyerConfirmedCount = 0,
  buyerEnquiriesCount = 0,
  buyerOrdersCount = 0,
  farmerCropCount = 0,
  unreadChatCount = 0,
  onNavigate,
  onOpenSettings,
  onLogout
}) {
  const isFarmer = currentUser?.role === "Farmer";
  const isBuyer = currentUser?.role === "Buyer";

  // Build navigation items based on user role
  let navItems = [];

  if (isFarmer) {
    navItems = [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        active: currentView === "farmer-dashboard" && dashboardTab === "all",
        badge: null
      },
      {
        id: "products",
        label: "My Products",
        icon: Package,
        active: currentView === "farmer-dashboard" && dashboardTab === "listings",
        badge: farmerCropCount > 0 ? farmerCropCount : null,
        badgeType: "default"
      },
      {
        id: "enquiries",
        label: "Buyer Enquiries",
        icon: MessageSquare,
        active: currentView === "farmer-dashboard" && dashboardTab === "enquiries",
        badge: farmerPendingCount > 0 ? farmerPendingCount : null,
        badgeType: "alert"
      },
      {
        id: "orders",
        label: "Orders",
        icon: ShoppingCart,
        active: currentView === "farmer-dashboard" && dashboardTab === "orders",
        badge: confirmedOrdersCount > 0 ? confirmedOrdersCount : null,
        badgeType: "success"
      },
      {
        id: "sales-report",
        label: "Sales Report",
        icon: TrendingUp,
        active: currentView === "farmer-dashboard" && dashboardTab === "sales-report",
        badge: null
      },
      {
        id: "marketplace",
        label: "Fresh Harvests",
        icon: Store,
        active: currentView === "marketplace",
        badge: null
      },
      {
        id: "farmers",
        label: "Discover Farmers",
        icon: Tractor,
        active: currentView === "farmers",
        badge: null
      },
      {
        id: "messages",
        label: "Messages",
        icon: MessageSquare,
        active: currentView === "messages",
        badge: unreadChatCount > 0 ? unreadChatCount : null,
        badgeType: "alert"
      },
      {
        id: "settings",
        label: "Settings",
        icon: Settings,
        active: false,
        badge: null
      }
    ];
  } else {
    // Buyer Dashboard items - mirroring Farmer Dashboard with Buyer features
    const enquiriesCount = buyerEnquiriesCount || 0;
    const enquiriesLabel = enquiriesCount > 0 ? `My Enquiries (${enquiriesCount})` : "My Enquiries";
    const ordersTotal = buyerConfirmedCount || buyerOrdersCount || 0;
    const ordersLabel = ordersTotal > 0 ? `Orders (${ordersTotal})` : "Orders & Deals";

    navItems = [
      {
        id: "dashboard",
        label: "Overview",
        icon: LayoutDashboard,
        active: currentView === "buyer-dashboard" && buyerDashboardTab === "all",
        badge: null
      },
      {
        id: "enquiries",
        label: enquiriesLabel,
        icon: MessageSquare,
        active: currentView === "buyer-dashboard" && buyerDashboardTab === "enquiries",
        badge: buyerPendingCount > 0 ? buyerPendingCount : null,
        badgeType: "alert"
      },
      {
        id: "orders",
        label: ordersLabel,
        icon: ShoppingCart,
        active: currentView === "buyer-dashboard" && buyerDashboardTab === "orders",
        badge: ordersTotal > 0 ? ordersTotal : null,
        badgeType: buyerConfirmedCount > 0 ? "success" : "alert"
      },
      {
        id: "purchases-report",
        label: "Purchase Report",
        icon: TrendingUp,
        active: currentView === "buyer-dashboard" && buyerDashboardTab === "purchases-report",
        badge: null
      },
      {
        id: "marketplace",
        label: "Fresh Harvests",
        icon: Store,
        active: currentView === "marketplace",
        badge: null
      },
      {
        id: "farmers",
        label: "Discover Farmers",
        icon: Tractor,
        active: currentView === "farmers",
        badge: null
      },
      {
        id: "messages",
        label: "Messages",
        icon: MessageSquare,
        active: currentView === "messages",
        badge: unreadChatCount > 0 ? unreadChatCount : null,
        badgeType: "alert"
      },
      {
        id: "settings",
        label: "Profile & Settings",
        icon: Settings,
        active: false,
        badge: null
      }
    ];
  }

  const handleItemClick = (e, item) => {
    e.preventDefault();
    if (item.id === "settings") {
      if (onOpenSettings) onOpenSettings();
      else if (onNavigate) onNavigate("settings");
      return;
    }
    if (onNavigate) {
      onNavigate(item.id);
    }
  };

  return (
    <aside className="app-sidebar" aria-label="Dashboard Sidebar Navigation">
      {/* Portal Indicator Strip */}
      <div className="sidebar-portal-badge-strip">
        <span className={`sidebar-portal-badge ${isFarmer ? "farmer" : "buyer"}`}>
          {isFarmer ? "🌾 Farmer Portal" : "🛒 Buyer Portal"}
        </span>
      </div>

      {/* Navigation Menu */}
      <div className="sidebar-nav-container">
        <div className="sidebar-section-header">
          <span>{isFarmer ? "FARM MANAGEMENT" : "BUYER FEATURES"}</span>
        </div>

        <nav className="sidebar-nav-list" role="navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={`sidebar-nav-item ${item.active ? "active" : ""}`}
                onClick={(e) => handleItemClick(e, item)}
                aria-current={item.active ? "page" : undefined}
                title={item.label}
              >
                <div className="nav-item-icon-wrap">
                  <Icon size={18} strokeWidth={item.active ? 2.4 : 2} />
                </div>
                <span className="nav-item-label">{item.label}</span>
                {item.badge && (
                  <span className={`sidebar-badge ${item.badgeType || "default"}`}>
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer User Card */}
      {currentUser && (
        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-user-card"
            onClick={onOpenSettings}
            title="Account & Settings"
          >
            <div className="sidebar-user-avatar">
              <UserAvatar user={currentUser} size={32} />
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">
                {currentUser.name || currentUser.username || currentUser.email?.split("@")[0] || "User"}
              </span>
              <span className="sidebar-user-role">
                {isFarmer ? "Pro Farmer" : "Verified Buyer"}
              </span>
            </div>
            <ChevronRight size={14} className="sidebar-user-arrow" />
          </button>
        </div>
      )}
    </aside>
  );
}
