import React, { useState, useMemo } from "react";
import {
  RefreshCw,
  Store,
  AlertCircle,
  MessageSquare,
  Clock,
  CheckCircle2,
  Check,
  Bell,
  XCircle,
  ShoppingCart,
  Info,
  MapPin,
  TrendingUp,
  Printer,
  ChevronRight,
  Filter,
  Search,
  ExternalLink,
  FileText,
  Mail,
  Tag,
  Quote,
  Download,
  ArrowUpDown
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { formatEnquiryDate } from "../../utils/formatters";

export default function BuyerDashboardView({
  buyerLoading = false,
  buyerError = "",
  buyerEnquiries = [],
  buyerPendingCount = 0,
  buyerRespondedCount = 0,
  buyerClosedCount = 0,
  unreadNotificationCount = 0,
  buyerNotifications = [],
  buyerDashboardTab = "all",
  buyerConfirmedOrders = [],
  buyerTotalSpent = 0,
  fetchBuyerEnquiries,
  navigateToMarketplace,
  handleSidebarNavigate,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  handleStartChat
}) {
  const { t, language } = useLanguage();

  // Local filter for Enquiries tab: 'all' | 'pending' | 'responded' | 'confirmed' | 'closed'
  const [enquiryFilter, setEnquiryFilter] = useState("all");

  // Local search, status filter, and sort for Purchase Report sourcing table
  const [reportSearch, setReportSearch] = useState("");
  const [reportStatusFilter, setReportStatusFilter] = useState("all");
  const [reportSort, setReportSort] = useState("recent");

  // Filtered enquiries based on local tab filter
  const filteredEnquiries = useMemo(() => {
    if (!Array.isArray(buyerEnquiries)) return [];
    if (enquiryFilter === "pending") {
      return buyerEnquiries.filter((e) => (e.status || "").toLowerCase() === "pending");
    }
    if (enquiryFilter === "responded") {
      return buyerEnquiries.filter((e) => (e.status || "").toLowerCase() === "responded");
    }
    if (enquiryFilter === "confirmed") {
      return buyerEnquiries.filter((e) => (e.status || "").toLowerCase() === "confirmed");
    }
    if (enquiryFilter === "closed") {
      return buyerEnquiries.filter((e) => (e.status || "").toLowerCase() === "closed");
    }
    return buyerEnquiries;
  }, [buyerEnquiries, enquiryFilter]);

  // Unique producers contacted across all enquiries
  const uniqueProducersCount = useMemo(() => {
    if (!Array.isArray(buyerEnquiries)) return 0;
    const ids = new Set();
    buyerEnquiries.forEach((e) => {
      const fid = typeof e.crop?.farmer === "object" ? e.crop.farmer._id : e.crop?.farmer;
      if (fid) ids.add(fid);
    });
    return ids.size;
  }, [buyerEnquiries]);

  // Sourcing fulfillment rate (% of enquiries confirmed)
  const fulfillmentRate = useMemo(() => {
    if (!Array.isArray(buyerEnquiries) || buyerEnquiries.length === 0) return 0;
    const confirmed = buyerEnquiries.filter((e) => (e.status || "").toLowerCase() === "confirmed").length;
    return Math.round((confirmed / buyerEnquiries.length) * 100);
  }, [buyerEnquiries]);

  // Breakdown counts by status for filter pills
  const reportStatusCounts = useMemo(() => {
    const counts = { all: buyerEnquiries.length, confirmed: 0, responded: 0, pending: 0, rejected: 0 };
    if (!Array.isArray(buyerEnquiries)) return counts;
    buyerEnquiries.forEach((e) => {
      const s = (e.status || "").toLowerCase();
      if (counts[s] !== undefined) counts[s]++;
      else if (s === "closed") counts.rejected++;
    });
    return counts;
  }, [buyerEnquiries]);

  // Filtered and sorted sourcing breakdown for Purchase Report
  const filteredReportEnquiries = useMemo(() => {
    if (!Array.isArray(buyerEnquiries)) return [];
    let list = [...buyerEnquiries];

    // Status filter
    if (reportStatusFilter !== "all") {
      list = list.filter((e) => (e.status || "").toLowerCase() === reportStatusFilter);
    }

    // Text search (crop name, category, location, farmer, status, ID)
    if (reportSearch.trim()) {
      const query = reportSearch.toLowerCase().trim();
      list = list.filter((e) => {
        const cropName = (e.crop?.name || "").toLowerCase();
        const category = (e.crop?.category || "").toLowerCase();
        const location = (e.crop?.location || "").toLowerCase();
        const status = (e.status || "").toLowerCase();
        const farmerName =
          typeof e.crop?.farmer === "object"
            ? (e.crop.farmer.name || e.crop.farmer.username || "").toLowerCase()
            : "";
        const refId = (e._id || "").toLowerCase();
        return (
          cropName.includes(query) ||
          category.includes(query) ||
          location.includes(query) ||
          farmerName.includes(query) ||
          status.includes(query) ||
          refId.includes(query)
        );
      });
    }

    // Sorting
    if (reportSort === "price-desc") {
      list.sort((a, b) => (Number(b.crop?.price) || 0) - (Number(a.crop?.price) || 0));
    } else if (reportSort === "price-asc") {
      list.sort((a, b) => (Number(a.crop?.price) || 0) - (Number(b.crop?.price) || 0));
    } else if (reportSort === "crop-asc") {
      list.sort((a, b) => (a.crop?.name || "").localeCompare(b.crop?.name || ""));
    } else {
      // Recent first by default
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return list;
  }, [buyerEnquiries, reportSearch, reportStatusFilter, reportSort]);

  // Instant CSV export for buyers
  const handleExportCSV = () => {
    if (!filteredReportEnquiries || filteredReportEnquiries.length === 0) return;
    const headers = [
      "Reference ID",
      "Crop Name",
      "Category",
      "Farm Location",
      "Producer Name",
      "Requirement / Qty",
      "Unit Price (INR)",
      "Status",
      "Date Sourced"
    ];

    const rows = filteredReportEnquiries.map((enq) => {
      const parsed = parseEnquiryMessage(enq.message);
      const farmerName =
        typeof enq.crop?.farmer === "object"
          ? enq.crop.farmer.name || enq.crop.farmer.username || "Verified Farmer"
          : "Verified Farmer";
      const dateStr = enq.createdAt ? new Date(enq.createdAt).toLocaleDateString("en-IN") : "N/A";
      const cleanRef = `ENQ-${(enq._id || "").slice(-6).toUpperCase()}`;

      return [
        `"${cleanRef}"`,
        `"${(enq.crop?.name || "Crop").replace(/"/g, '""')}"`,
        `"${(enq.crop?.category || "General").replace(/"/g, '""')}"`,
        `"${(enq.crop?.location || "India").replace(/"/g, '""')}"`,
        `"${farmerName.replace(/"/g, '""')}"`,
        `"${(parsed.requirement || "Not specified").replace(/"/g, '""')}"`,
        `"${enq.crop?.price ? `₹${enq.crop.price} / ${enq.crop.unit || "kg"}` : "--"}"`,
        `"${enquiryStatusLabel(enq.status)}"`,
        `"${dateStr}"`
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `AgroConnect_Purchase_Report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const confirmedEnquiryCount = useMemo(() => {
    return buyerEnquiries.filter((e) => (e.status || "").toLowerCase() === "confirmed").length;
  }, [buyerEnquiries]);

  const ordersCount = buyerConfirmedOrders.length || buyerNotifications.length;

  return (
    <main className="dashboard-page-view" id="buyer-dashboard">
      <div className="section-container">
        {/* 1. MODERN BREADCRUMB TRAIL */}
        <nav className="dashboard-breadcrumb-trail" aria-label="Breadcrumb">
          <button
            type="button"
            className="breadcrumb-link"
            onClick={() => handleSidebarNavigate("dashboard")}
            title="Return to Overview"
          >
            🛒 Buyer Portal
          </button>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">
            {buyerDashboardTab === "all"
              ? "Overview"
              : buyerDashboardTab === "enquiries"
              ? `My Enquiries (${buyerEnquiries.length})`
              : buyerDashboardTab === "orders"
              ? `Orders & Deals (${ordersCount})`
              : "Purchase Report"}
          </span>
        </nav>

        {/* 2. DEDICATED TOP HEADER PER MODULE */}
        <div className="dashboard-top-header">
          <div>
            {buyerDashboardTab === "all" && (
              <>
                <h2>{t("buyerDashboard.title") || "Buyer Dashboard"}</h2>
                <p>{t("buyerDashboard.subtitle") || "Manage crop enquiries, farmer quotations, and confirmed purchases in real-time."}</p>
              </>
            )}
            {buyerDashboardTab === "enquiries" && (
              <>
                <h2>{`My Crop Enquiries (${buyerEnquiries.length})`}</h2>
                <p>Track all crop procurement enquiries, price negotiations, and farmer counter-offers.</p>
              </>
            )}
            {buyerDashboardTab === "orders" && (
              <>
                <h2>{`Orders & Deals (${ordersCount})`}</h2>
                <p>Manage verified crop purchases, delivery status alerts, and direct farmer communications.</p>
              </>
            )}
            {buyerDashboardTab === "purchases-report" && (
              <>
                <h2>Purchase & Procurement Report</h2>
                <p>Procurement analytics, order spend, sourcing history, and farm audit trail.</p>
              </>
            )}
          </div>

          <div className="dashboard-action-buttons">
            {buyerDashboardTab === "purchases-report" && (
              <>
                <button
                  type="button"
                  className="btn-dashboard-refresh"
                  onClick={handleExportCSV}
                  title="Export Sourcing Data as CSV"
                >
                  <Download size={15} />
                  <span>Export CSV</span>
                </button>
                <button
                  type="button"
                  className="btn-dashboard-refresh"
                  onClick={() => window.print()}
                  title="Print or Save PDF"
                >
                  <Printer size={15} />
                  <span>Print / PDF</span>
                </button>
              </>
            )}
            <button
              type="button"
              className="btn-dashboard-refresh"
              onClick={fetchBuyerEnquiries}
              title={t("buyerDashboard.refresh") || "Refresh Data"}
            >
              <RefreshCw size={15} />
              <span>{t("buyerDashboard.refresh") || "Refresh"}</span>
            </button>
            <button
              type="button"
              className="btn-dashboard-add"
              onClick={navigateToMarketplace}
              title="Explore Fresh Harvests"
            >
              <Store size={16} />
              <span>{buyerDashboardTab === "enquiries" ? "Inquire for More Crops" : t("buyerDashboard.browseMoreCrops") || "Browse Produce"}</span>
            </button>
          </div>
        </div>

        {/* 3. SUB-NAV TABS (RENDERED ONLY IN OVERVIEW) */}
        {buyerDashboardTab === "all" && (
          <div className="dashboard-tabs-bar" role="tablist" aria-label="Buyer Modules Navigation">
            <button
              type="button"
              role="tab"
              aria-selected={buyerDashboardTab === "all"}
              className={`d-tab-btn ${buyerDashboardTab === "all" ? "active" : ""}`}
              onClick={() => handleSidebarNavigate("dashboard")}
              title="Overview"
            >
              {t("farmerDashboard.tabAll") || "Overview"}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={buyerDashboardTab === "enquiries"}
              className={`d-tab-btn ${buyerDashboardTab === "enquiries" ? "active" : ""}`}
              onClick={() => handleSidebarNavigate("enquiries")}
              title="My Enquiries"
            >
              <span>{`My Enquiries (${buyerEnquiries.length})`}</span>
              {buyerPendingCount > 0 && (
                <span className="tab-bubble-count" title={`${buyerPendingCount} awaiting reply`}>
                  {buyerPendingCount}
                </span>
              )}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={buyerDashboardTab === "orders"}
              className={`d-tab-btn ${buyerDashboardTab === "orders" ? "active" : ""}`}
              onClick={() => handleSidebarNavigate("orders")}
              title="Orders & Deals"
            >
              <span>{`Orders (${ordersCount})`}</span>
              {(buyerConfirmedOrders.length > 0 || unreadNotificationCount > 0) && (
                <span
                  className="tab-bubble-count success"
                  title={`${buyerConfirmedOrders.length || unreadNotificationCount} order alerts`}
                >
                  {buyerConfirmedOrders.length || unreadNotificationCount}
                </span>
              )}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={buyerDashboardTab === "purchases-report"}
              className={`d-tab-btn ${buyerDashboardTab === "purchases-report" ? "active" : ""}`}
              onClick={() => handleSidebarNavigate("purchases-report")}
              title="Purchase Report"
            >
              Purchase Report
            </button>
          </div>
        )}

        {/* LOADING & ERROR STATES */}
        {buyerLoading ? (
          <div className="state-box loading-box">
            <RefreshCw className="spinner-icon" size={28} />
            <h3>{t("marketplace.loadingTitle") || "Loading procurement data..."}</h3>
          </div>
        ) : buyerError ? (
          <div className="state-box error-box">
            <AlertCircle size={28} />
            <h3>{buyerError}</h3>
            <button type="button" className="btn-modal-submit green" onClick={fetchBuyerEnquiries}>
              {t("farmerDashboard.refresh") || "Retry"}
            </button>
          </div>
        ) : (
          <>
            {/* ========================================================= */}
            {/* MODULE 1: OVERVIEW PAGE (buyerDashboardTab === "all")      */}
            {/* ========================================================= */}
            {buyerDashboardTab === "all" && (
              <div className="overview-page-wrapper">
                {/* 5 KPI Stat Metric Cards */}
                <div className="stats-cards-grid">
                  <div
                    className="stat-metric-card"
                    onClick={() => handleSidebarNavigate("enquiries")}
                    style={{ cursor: "pointer" }}
                    title="View My Enquiries"
                  >
                    <div className="metric-icon-box blue">
                      <MessageSquare size={20} />
                    </div>
                    <div>
                      <span className="metric-val">{buyerEnquiries.length}</span>
                      <span className="metric-lbl">{t("buyerDashboard.statTotalSent") || "Total Sent"}</span>
                    </div>
                  </div>

                  <div
                    className="stat-metric-card alert"
                    onClick={() => handleSidebarNavigate("enquiries")}
                    style={{ cursor: "pointer" }}
                    title="View Awaiting Reply"
                  >
                    <div className="metric-icon-box amber">
                      <Clock size={20} />
                    </div>
                    <div>
                      <span className="metric-val">{buyerPendingCount}</span>
                      <span className="metric-lbl">{t("buyerDashboard.statAwaitingReply") || "Awaiting Reply"}</span>
                    </div>
                  </div>

                  <div
                    className="stat-metric-card success"
                    onClick={() => handleSidebarNavigate("enquiries")}
                    style={{ cursor: "pointer" }}
                    title="View Farmer Responses"
                  >
                    <div className="metric-icon-box green">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <span className="metric-val">{buyerRespondedCount}</span>
                      <span className="metric-lbl">{t("buyerDashboard.statFarmerResponded") || "Farmer Responded"}</span>
                    </div>
                  </div>

                  <div
                    className="stat-metric-card"
                    onClick={() => handleSidebarNavigate("orders")}
                    style={{ cursor: "pointer" }}
                    title="View Confirmed Orders"
                  >
                    <div className="metric-icon-box">
                      <Check size={20} />
                    </div>
                    <div>
                      <span className="metric-val">{buyerClosedCount}</span>
                      <span className="metric-lbl">{t("buyerDashboard.statClosedDeals") || "Closed Deals"}</span>
                    </div>
                  </div>

                  <div
                    className={`stat-metric-card ${unreadNotificationCount > 0 ? "alert" : ""}`}
                    onClick={() => handleSidebarNavigate("orders")}
                    style={{ cursor: "pointer" }}
                    title="View Order Updates"
                  >
                    <div className="metric-icon-box green">
                      <Bell size={20} />
                    </div>
                    <div>
                      <span className="metric-val">{unreadNotificationCount}</span>
                      <span className="metric-lbl">{t("buyerDashboard.statUnreadNotifications") || "Order Updates"}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Navigation Cards to Dedicated Modules */}
                <div className="dashboard-content-block">
                  <div className="block-title-row">
                    <h3>Quick Sourcing Navigation</h3>
                  </div>
                  <div className="overview-quick-links-grid">
                    <div
                      className="overview-quick-card"
                      onClick={() => handleSidebarNavigate("enquiries")}
                    >
                      <div className="quick-card-icon blue">
                        <MessageSquare size={22} />
                      </div>
                      <div className="quick-card-content">
                        <h4>My Enquiries ({buyerEnquiries.length})</h4>
                        <p>{buyerPendingCount > 0 ? `${buyerPendingCount} awaiting response from farmers.` : "All enquiries are currently up to date."}</p>
                      </div>
                      <div className="quick-card-action">
                        <span>Open Enquiries</span>
                        <ChevronRight size={16} />
                      </div>
                    </div>

                    <div
                      className="overview-quick-card"
                      onClick={() => handleSidebarNavigate("orders")}
                    >
                      <div className="quick-card-icon green">
                        <ShoppingCart size={22} />
                      </div>
                      <div className="quick-card-content">
                        <h4>Orders & Deals ({ordersCount})</h4>
                        <p>{buyerConfirmedOrders.length > 0 ? `${buyerConfirmedOrders.length} confirmed deals ready for fulfillment.` : "Review order alerts and farmer confirmations."}</p>
                      </div>
                      <div className="quick-card-action">
                        <span>Open Orders</span>
                        <ChevronRight size={16} />
                      </div>
                    </div>

                    <div
                      className="overview-quick-card"
                      onClick={() => handleSidebarNavigate("purchases-report")}
                    >
                      <div className="quick-card-icon amber">
                        <TrendingUp size={22} />
                      </div>
                      <div className="quick-card-content">
                        <h4>Purchase Report</h4>
                        <p>Procurement analytics, ₹{buyerTotalSpent.toLocaleString("en-IN")} total spend, and export.</p>
                      </div>
                      <div className="quick-card-action">
                        <span>Open Report</span>
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Notifications Summary */}
                {buyerNotifications && buyerNotifications.length > 0 && (
                  <div className="dashboard-content-block">
                    <div className="block-title-row">
                      <div className="block-title-with-badge">
                        <Bell size={18} className="block-header-icon" />
                        <h3>Recent Order Alerts</h3>
                        {unreadNotificationCount > 0 && (
                          <span className="badge-count-pulse">{unreadNotificationCount} new</span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn-small-link"
                        onClick={() => handleSidebarNavigate("orders")}
                      >
                        View all orders ({buyerNotifications.length}) →
                      </button>
                    </div>

                    <div className="notifications-list-stack">
                      {buyerNotifications.slice(0, 3).map((notif) => (
                        <div
                          key={notif._id}
                          className={`notification-item-card ${notif.read ? "read" : "unread"} ${notif.status || ""}`}
                          onClick={() => !notif.read && markNotificationAsRead(notif._id)}
                        >
                          <div className="notification-icon-box">
                            {notif.status === "confirmed" ? (
                              <CheckCircle2 size={20} className="notif-icon-success" />
                            ) : notif.status === "rejected" ? (
                              <XCircle size={20} className="notif-icon-danger" />
                            ) : (
                              <Bell size={20} className="notif-icon-info" />
                            )}
                          </div>
                          <div className="notification-content-area">
                            <div className="notif-header-line">
                              <strong className="notif-title">{notif.title}</strong>
                              <span className="notif-timestamp">
                                {formatEnquiryDate(notif.createdAt, language)}
                              </span>
                            </div>
                            <p className="notif-message-text">{notif.message}</p>
                          </div>
                          {!notif.read && (
                            <button
                              type="button"
                              className="btn-mark-read"
                              onClick={(e) => {
                                e.stopPropagation();
                                markNotificationAsRead(notif._id);
                              }}
                              title="Mark as read"
                            >
                              <Check size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* MODULE 2: MY ENQUIRIES PAGE (buyerDashboardTab === "enquiries") */}
            {/* ========================================================= */}
            {buyerDashboardTab === "enquiries" && (
              <div className="enquiries-page-wrapper">
                {/* Focused KPI strip for enquiries */}
                <div className="focused-module-kpi-bar">
                  <div className="focused-kpi-chip">
                    <div className="metric-icon-box blue small">
                      <MessageSquare size={16} />
                    </div>
                    <div>
                      <span className="chip-val">{buyerEnquiries.length}</span>
                      <span className="chip-lbl">Total Enquiries</span>
                    </div>
                  </div>

                  <div className="focused-kpi-chip">
                    <div className="metric-icon-box amber small">
                      <Clock size={16} />
                    </div>
                    <div>
                      <span className="chip-val">{buyerPendingCount}</span>
                      <span className="chip-lbl">Awaiting Reply</span>
                    </div>
                  </div>

                  <div className="focused-kpi-chip">
                    <div className="metric-icon-box green small">
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <span className="chip-val">{buyerRespondedCount}</span>
                      <span className="chip-lbl">Farmer Responded</span>
                    </div>
                  </div>

                  <div className="focused-kpi-chip">
                    <div className="metric-icon-box small">
                      <Check size={16} />
                    </div>
                    <div>
                      <span className="chip-val">{buyerClosedCount}</span>
                      <span className="chip-lbl">Closed / Finalized</span>
                    </div>
                  </div>
                </div>

                {/* Filter Chips Bar */}
                <div className="enquiry-filter-chips-bar">
                  <button
                    type="button"
                    className={`filter-chip ${enquiryFilter === "all" ? "active" : ""}`}
                    onClick={() => setEnquiryFilter("all")}
                  >
                    All ({buyerEnquiries.length})
                  </button>
                  <button
                    type="button"
                    className={`filter-chip ${enquiryFilter === "pending" ? "active" : ""}`}
                    onClick={() => setEnquiryFilter("pending")}
                  >
                    Awaiting Reply ({buyerPendingCount})
                  </button>
                  <button
                    type="button"
                    className={`filter-chip ${enquiryFilter === "responded" ? "active" : ""}`}
                    onClick={() => setEnquiryFilter("responded")}
                  >
                    Responded ({buyerRespondedCount})
                  </button>
                  <button
                    type="button"
                    className={`filter-chip ${enquiryFilter === "confirmed" ? "active" : ""}`}
                    onClick={() => setEnquiryFilter("confirmed")}
                  >
                    Confirmed Deals ({confirmedEnquiryCount})
                  </button>
                  <button
                    type="button"
                    className={`filter-chip ${enquiryFilter === "closed" ? "active" : ""}`}
                    onClick={() => setEnquiryFilter("closed")}
                  >
                    Closed ({buyerClosedCount})
                  </button>
                </div>

                {/* Enquiries Stack List */}
                <div className="dashboard-content-block">
                  {filteredEnquiries.length === 0 ? (
                    <div className="dashboard-empty-state">
                      <ShoppingCart size={36} className="empty-state-icon" />
                      <h4>
                        {enquiryFilter === "all"
                          ? t("buyerDashboard.emptyTitle") || "No Enquiries Sent Yet"
                          : `No Enquiries with status: ${enquiryFilter}`}
                      </h4>
                      <p>
                        {enquiryFilter === "all"
                          ? t("buyerDashboard.emptyDesc") || "Send procurement enquiries to verified farmers across India to begin sourcing fresh crops."
                          : "Try selecting a different filter above or explore the marketplace."}
                      </p>
                      <button
                        type="button"
                        className="btn-modal-submit green"
                        onClick={navigateToMarketplace}
                      >
                        <Store size={16} />
                        <span>{t("buyerDashboard.exploreBtn") || "Browse Fresh Produce"}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="enquiries-list-stack">
                      {filteredEnquiries.map((enquiry) => {
                        const statusRaw = (enquiry.status || "pending").toLowerCase();
                        const statusKey =
                          statusRaw === "confirmed"
                            ? "confirmed"
                            : statusRaw === "rejected"
                            ? "rejected"
                            : statusRaw === "responded"
                            ? "responded"
                            : statusRaw === "closed"
                            ? "closed"
                            : "pending";

                        const parsed = parseEnquiryMessage(enquiry.message);

                        return (
                          <div className={`enquiry-detail-card status-border-${statusKey}`} key={enquiry._id}>
                            {/* Card Top Row: Crop Badge + Info + Status Pill */}
                            <div className="enquiry-top-row">
                              <div className="enquiry-crop-hero">
                                <div className="crop-avatar-box">
                                  🌾
                                </div>
                                <div className="enquiry-crop-details">
                                  <div className="crop-title-line">
                                    <h4 className="crop-name-title">{enquiry.crop?.name || "Harvest Crop"}</h4>
                                    {enquiry.crop?.price && (
                                      <span className="crop-price-pill">
                                        ₹{enquiry.crop.price}{" "}
                                        <span className="unit-text">
                                          / {t(`units.${enquiry.crop?.unit}`) || enquiry.crop?.unit || "kg"}
                                        </span>
                                      </span>
                                    )}
                                  </div>
                                  <div className="crop-sub-metadata">
                                    {enquiry.crop?.location && (
                                      <span className="meta-item location">
                                        <MapPin size={12} />
                                        <span>{enquiry.crop.location}</span>
                                      </span>
                                    )}
                                    {enquiry.crop?.location && <span className="meta-sep">•</span>}
                                    <span className="meta-item date">
                                      <Clock size={12} />
                                      <span>
                                        {t("buyerDashboard.submittedOn", {
                                          date: formatEnquiryDate(enquiry.createdAt, language)
                                        })}
                                      </span>
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="enquiry-status-wrap">
                                <span className={`status-pill-badge status-${statusKey}`}>
                                  {statusKey === "confirmed" && <CheckCircle2 size={13} />}
                                  {statusKey === "rejected" && <XCircle size={13} />}
                                  {statusKey === "pending" && <Clock size={13} />}
                                  {statusKey === "responded" && <MessageSquare size={13} />}
                                  {statusKey === "closed" && <Check size={13} />}
                                  <span>
                                    {statusKey === "pending" && (t("statuses.buyerPendingBadge") || "Awaiting Reply")}
                                    {statusKey === "responded" && (t("statuses.buyerRespondedBadge") || "Farmer Responded")}
                                    {statusKey === "closed" && (t("statuses.buyerClosedBadge") || "Closed")}
                                    {statusKey === "confirmed" && (t("farmerDashboard.orderConfirmed") || "Order Confirmed")}
                                    {statusKey === "rejected" && (t("farmerDashboard.orderRejected") || "Order Rejected")}
                                  </span>
                                </span>
                              </div>
                            </div>

                            {/* Structured Procurement Requirement Box */}
                            <div className="enquiry-requirement-box">
                              <div className="requirement-box-header">
                                <FileText size={13} />
                                <span>{t("buyerDashboard.yourRequirementSent") || "YOUR REQUIREMENT / NOTE SENT"}</span>
                              </div>

                              {(parsed.requirement || parsed.contact) && (
                                <div className="requirement-meta-chips">
                                  {parsed.requirement && (
                                    <span className="req-meta-chip qty">
                                      <Tag size={12} />
                                      <span><strong>Required:</strong> {parsed.requirement}</span>
                                    </span>
                                  )}
                                  {parsed.contact && (
                                    <span className="req-meta-chip contact">
                                      <Mail size={12} />
                                      <span><strong>Contact:</strong> {parsed.contact}</span>
                                    </span>
                                  )}
                                </div>
                              )}

                              {parsed.note && (
                                <div className="requirement-note-body">
                                  <Quote size={13} className="quote-icon" />
                                  <p>{parsed.note}</p>
                                </div>
                              )}
                            </div>

                            {/* Contextual Status Guidance Note */}
                            <div className={`buyer-enquiry-footer-note status-${statusKey}`}>
                              {statusKey === "confirmed" ? (
                                <CheckCircle2 size={15} />
                              ) : statusKey === "rejected" ? (
                                <XCircle size={15} />
                              ) : statusKey === "responded" ? (
                                <MessageSquare size={15} />
                              ) : (
                                <Info size={15} />
                              )}
                              <span>
                                {statusKey === "pending"
                                  ? t("buyerDashboard.notePending") || "Sent to farmer. You will be notified once they reply."
                                  : statusKey === "responded"
                                  ? t("buyerDashboard.noteResponded") || "Farmer has sent counter-terms. Chat with them to confirm details."
                                  : statusKey === "confirmed"
                                  ? t("buyerDashboard.noteConfirmed") || "Good news! Your order has been confirmed by the farmer."
                                  : statusKey === "rejected"
                                  ? t("buyerDashboard.noteRejected") || "Your order could not be accepted by the farmer at this time. Browse other harvest listings."
                                  : t("buyerDashboard.noteClosed") || "This enquiry negotiation has been concluded."}
                              </span>
                            </div>

                            {/* Balanced Bottom Action Bar */}
                            <div className="enquiry-bottom-action-bar">
                              <div className="enquiry-producer-info">
                                <span className="producer-role-badge">🌾 PRODUCER</span>
                                <span className="producer-name">
                                  {typeof enquiry.crop?.farmer === "object"
                                    ? enquiry.crop.farmer.name || enquiry.crop.farmer.username || "Verified Farmer"
                                    : "Verified Harvest Producer"}
                                </span>
                              </div>

                              <button
                                type="button"
                                className="btn-chat-with-user modern"
                                onClick={() => {
                                  const farmerObj =
                                    typeof enquiry.crop?.farmer === "object"
                                      ? enquiry.crop.farmer
                                      : { _id: enquiry.crop?.farmer, role: "Farmer" };
                                  handleStartChat(farmerObj, enquiry.crop);
                                }}
                              >
                                <MessageSquare size={14} />
                                <span>{t("chat.chatWithFarmer") || "Chat with Farmer"}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* MODULE 3: ORDERS & CONFIRMED DEALS (buyerDashboardTab === "orders") */}
            {/* ========================================================= */}
            {buyerDashboardTab === "orders" && (
              <div className="orders-page-wrapper">
                {/* Focused KPI strip for Orders */}
                <div className="focused-module-kpi-bar">
                  <div className="focused-kpi-chip">
                    <div className="metric-icon-box green small">
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <span className="chip-val">{buyerConfirmedOrders.length}</span>
                      <span className="chip-lbl">Confirmed Deals</span>
                    </div>
                  </div>

                  <div className="focused-kpi-chip">
                    <div className="metric-icon-box green small">
                      <TrendingUp size={16} />
                    </div>
                    <div>
                      <span className="chip-val">₹{buyerTotalSpent.toLocaleString("en-IN")}</span>
                      <span className="chip-lbl">Sourcing Spend</span>
                    </div>
                  </div>

                  <div className="focused-kpi-chip">
                    <div className="metric-icon-box amber small">
                      <Bell size={16} />
                    </div>
                    <div>
                      <span className="chip-val">{unreadNotificationCount}</span>
                      <span className="chip-lbl">Unread Alerts</span>
                    </div>
                  </div>
                </div>

                {/* Notifications & Status Alerts */}
                {buyerNotifications && buyerNotifications.length > 0 && (
                  <div className="dashboard-content-block buyer-notifications-block">
                    <div className="block-title-row">
                      <div className="block-title-with-badge">
                        <Bell size={18} className="block-header-icon" />
                        <h3>{t("buyerDashboard.notificationsTitle") || "Order Notifications & Status Alerts"}</h3>
                        {unreadNotificationCount > 0 && (
                          <span className="badge-count-pulse">{unreadNotificationCount} new</span>
                        )}
                      </div>
                      {unreadNotificationCount > 0 && (
                        <button
                          type="button"
                          className="btn-mark-all-read"
                          onClick={markAllNotificationsAsRead}
                        >
                          <Check size={14} />
                          <span>{t("buyerDashboard.markAllRead") || "Mark all as read"}</span>
                        </button>
                      )}
                    </div>

                    <div className="notifications-list-stack">
                      {buyerNotifications.map((notif) => (
                        <div
                          key={notif._id}
                          className={`notification-item-card ${notif.read ? "read" : "unread"} ${notif.status || ""}`}
                          onClick={() => !notif.read && markNotificationAsRead(notif._id)}
                        >
                          <div className="notification-icon-box">
                            {notif.status === "confirmed" ? (
                              <CheckCircle2 size={20} className="notif-icon-success" />
                            ) : notif.status === "rejected" ? (
                              <XCircle size={20} className="notif-icon-danger" />
                            ) : (
                              <Bell size={20} className="notif-icon-info" />
                            )}
                          </div>
                          <div className="notification-content-area">
                            <div className="notif-header-line">
                              <strong className="notif-title">{notif.title}</strong>
                              <span className="notif-timestamp">
                                {formatEnquiryDate(notif.createdAt, language)}
                              </span>
                            </div>
                            <p className="notif-message-text">{notif.message}</p>
                            <div className="notif-meta-tags">
                              {notif.cropName && (
                                <span className="notif-tag-crop">🌾 {notif.cropName}</span>
                              )}
                              <span className={`notif-status-tag ${notif.status}`}>
                                {notif.status === "confirmed" ? "✓ Confirmed" : notif.status === "rejected" ? "✕ Rejected" : notif.status}
                              </span>
                              {!notif.read && <span className="notif-new-dot">● Unread</span>}
                            </div>
                          </div>
                          {!notif.read && (
                            <button
                              type="button"
                              className="btn-mark-read"
                              onClick={(e) => {
                                e.stopPropagation();
                                markNotificationAsRead(notif._id);
                              }}
                              title="Mark as read"
                            >
                              <Check size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Confirmed Purchases Section */}
                <div className="dashboard-content-block">
                  <div className="block-title-row">
                    <div className="block-title-with-badge">
                      <CheckCircle2 size={18} className="block-header-icon notif-icon-success" />
                      <h3>Confirmed Purchases ({buyerConfirmedOrders.length})</h3>
                    </div>
                  </div>

                  {buyerConfirmedOrders.length === 0 ? (
                    <div className="dashboard-empty-state">
                      <ShoppingCart size={36} className="empty-state-icon" />
                      <h4>No Confirmed Deals Yet</h4>
                      <p>
                        When a farmer confirms an enquiry, your verified deal contract, batch pricing, and delivery communications will show here.
                      </p>
                      <button
                        type="button"
                        className="btn-modal-submit green"
                        onClick={navigateToMarketplace}
                      >
                        <Store size={16} />
                        <span>Browse Produce Marketplace</span>
                      </button>
                    </div>
                  ) : (
                    <div className="orders-cards-list">
                      {buyerConfirmedOrders.map((order) => (
                        <div className="order-manage-card" key={order._id}>
                          <div className="order-card-header">
                            <div className="order-card-id-block">
                              <span className="order-ref-badge">ORDER #{order._id?.slice(-6).toUpperCase()}</span>
                              <span className="order-date-text">{formatEnquiryDate(order.createdAt, language)}</span>
                            </div>
                            <span className="order-status-pill confirmed">
                              <CheckCircle2 size={14} /> Confirmed by Farmer
                            </span>
                          </div>

                          <div className="order-card-body">
                            <div className="order-crop-summary">
                              <div className="order-crop-icon">🌾</div>
                              <div>
                                <h4 className="order-crop-name">{order.crop?.name || "Harvest Produce"}</h4>
                                <span className="order-crop-rate">
                                  ₹{order.crop?.price || "--"} / {t(`units.${order.crop?.unit}`) || order.crop?.unit || "kg"}
                                </span>
                              </div>
                            </div>

                            <div className="order-buyer-details">
                              <div className="order-detail-field">
                                <MapPin size={14} />
                                <span>Farm Location: <strong>{order.crop?.location || "India"}</strong></span>
                              </div>
                            </div>
                          </div>

                          {order.message && (
                            <div className="order-note-box">
                              <small>Your Order Requirement:</small>
                              <p>"{order.message}"</p>
                            </div>
                          )}

                          <div className="order-card-footer">
                            <div className="order-total-value">
                              <span>Estimated Batch Price: </span>
                              <strong>₹{Number(order.crop?.price || 0).toLocaleString("en-IN")}</strong>
                            </div>
                            <button
                              type="button"
                              className="btn-chat-with-user"
                              onClick={() => {
                                const farmerObj =
                                  typeof order.crop?.farmer === "object"
                                    ? order.crop.farmer
                                    : { _id: order.crop?.farmer, role: "Farmer" };
                                handleStartChat(farmerObj, order.crop);
                              }}
                            >
                              <MessageSquare size={14} />
                              <span>Chat with Farmer</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* MODULE 4: PURCHASE REPORT (buyerDashboardTab === "purchases-report") */}
            {/* ========================================================= */}
            {buyerDashboardTab === "purchases-report" && (
              <div className="dashboard-content-block purchase-report-container sales-report-view">
                {/* 1. PRINT-ONLY PROCUREMENT HEADER */}
                <div className="print-report-header">
                  <div className="print-header-brand">
                    <h2>AgroConnect Direct Sourcing & Procurement Audit Report</h2>
                    <p>Verified Farm-to-Buyer Transaction & Negotiation Records</p>
                  </div>
                  <div className="print-header-meta">
                    <div><strong>Generated Date:</strong> {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</div>
                    <div><strong>Total Spend:</strong> ₹{buyerTotalSpent.toLocaleString("en-IN")}</div>
                    <div><strong>Confirmed Purchases:</strong> {buyerConfirmedOrders.length}</div>
                    <div><strong>Total Enquiries Sent:</strong> {buyerEnquiries.length}</div>
                  </div>
                </div>

                {/* 2. PROCUREMENT SUMMARY BANNER */}
                <div className="procurement-summary-banner">
                  <div className="summary-banner-info">
                    <div className="summary-badge-row">
                      <span className="summary-role-tag">🏢 COMMERCIAL PROCUREMENT AUDIT</span>
                      <span className="summary-status-tag verified">
                        <CheckCircle2 size={13} />
                        Verified Buyer Account
                      </span>
                    </div>
                    <h3 className="summary-title">Procurement & Purchase Analytics</h3>
                    <p className="summary-desc">
                      Real-time visibility into your crop sourcing pipeline, confirmed farm contracts, unit prices, and producer direct records.
                    </p>
                  </div>

                  <div className="summary-banner-actions">
                    <button
                      type="button"
                      className="btn-report-action csv"
                      onClick={handleExportCSV}
                      title="Download Purchase Report in CSV / Excel format"
                    >
                      <Download size={15} />
                      <span>Export CSV</span>
                    </button>
                    <button
                      type="button"
                      className="btn-report-action print"
                      onClick={() => window.print()}
                      title="Print or Save PDF"
                    >
                      <Printer size={15} />
                      <span>Print / PDF</span>
                    </button>
                  </div>
                </div>

                {/* 3. SALES & SOURCING KPI METRICS GRID */}
                <div className="sales-kpi-grid">
                  <div className="sales-kpi-card highlight">
                    <div className="sales-kpi-top">
                      <span className="sales-kpi-label">Total Procurement Spend</span>
                      <div className="sales-kpi-icon-pill green">
                        <TrendingUp size={18} />
                      </div>
                    </div>
                    <div className="sales-kpi-val">₹{buyerTotalSpent.toLocaleString("en-IN")}</div>
                    <div className="sales-kpi-subtext">
                      <span>Across {buyerConfirmedOrders.length} verified purchases</span>
                      <span className="kpi-micro-tag success">Fulfilled</span>
                    </div>
                  </div>

                  <div className="sales-kpi-card">
                    <div className="sales-kpi-top">
                      <span className="sales-kpi-label">Sourcing Requirements</span>
                      <div className="sales-kpi-icon-pill blue">
                        <FileText size={18} />
                      </div>
                    </div>
                    <div className="sales-kpi-val">{buyerEnquiries.length}</div>
                    <div className="sales-kpi-subtext">
                      <span>{buyerPendingCount} awaiting response</span>
                      <span className="kpi-micro-tag blue">{buyerRespondedCount} quotes</span>
                    </div>
                  </div>

                  <div className="sales-kpi-card">
                    <div className="sales-kpi-top">
                      <span className="sales-kpi-label">Fulfillment Rate</span>
                      <div className="sales-kpi-icon-pill emerald">
                        <CheckCircle2 size={18} />
                      </div>
                    </div>
                    <div className="sales-kpi-val">{fulfillmentRate}%</div>
                    <div className="sales-kpi-subtext">
                      <span>{buyerConfirmedOrders.length} deals confirmed</span>
                      <span className="kpi-micro-tag emerald">Conversion</span>
                    </div>
                  </div>

                  <div className="sales-kpi-card">
                    <div className="sales-kpi-top">
                      <span className="sales-kpi-label">Farm Network Reached</span>
                      <div className="sales-kpi-icon-pill amber">
                        <Store size={18} />
                      </div>
                    </div>
                    <div className="sales-kpi-val">{uniqueProducersCount}</div>
                    <div className="sales-kpi-subtext">
                      <span>Direct farmer relationships</span>
                      <span className="kpi-micro-tag amber">Pan-India</span>
                    </div>
                  </div>
                </div>

                {/* 4. SOURCING BREAKDOWN & AUDIT TABLE */}
                <div className="sales-breakdown-card">
                  <div className="breakdown-card-top-bar">
                    <div className="breakdown-title-group">
                      <h4>Sourcing History & Crop Breakdown</h4>
                      <span className="breakdown-records-badge">
                        {filteredReportEnquiries.length} {filteredReportEnquiries.length === 1 ? "Record" : "Records"}
                      </span>
                    </div>

                    {/* Filter & Search Toolbar */}
                    <div className="breakdown-toolbar">
                      {/* Status Filter Pills */}
                      <div className="report-filter-pills" role="tablist" aria-label="Filter by status">
                        <button
                          type="button"
                          className={`report-pill-btn ${reportStatusFilter === "all" ? "active" : ""}`}
                          onClick={() => setReportStatusFilter("all")}
                        >
                          All ({buyerEnquiries.length})
                        </button>
                        <button
                          type="button"
                          className={`report-pill-btn ${reportStatusFilter === "confirmed" ? "active" : ""}`}
                          onClick={() => setReportStatusFilter("confirmed")}
                        >
                          Confirmed ({reportStatusCounts.confirmed})
                        </button>
                        <button
                          type="button"
                          className={`report-pill-btn ${reportStatusFilter === "responded" ? "active" : ""}`}
                          onClick={() => setReportStatusFilter("responded")}
                        >
                          Quotes Received ({reportStatusCounts.responded})
                        </button>
                        <button
                          type="button"
                          className={`report-pill-btn ${reportStatusFilter === "pending" ? "active" : ""}`}
                          onClick={() => setReportStatusFilter("pending")}
                        >
                          Pending ({reportStatusCounts.pending})
                        </button>
                      </div>

                      <div className="breakdown-inputs-group">
                        {/* Search Input */}
                        <div className="table-search-input-wrap">
                          <Search size={15} />
                          <input
                            type="text"
                            placeholder="Filter crop, farmer, location..."
                            value={reportSearch}
                            onChange={(e) => setReportSearch(e.target.value)}
                            className="table-search-input"
                          />
                          {reportSearch && (
                            <button
                              type="button"
                              className="btn-clear-search"
                              onClick={() => setReportSearch("")}
                              title="Clear search"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {/* Sort Selector */}
                        <div className="table-sort-wrap">
                          <ArrowUpDown size={14} className="sort-icon" />
                          <select
                            value={reportSort}
                            onChange={(e) => setReportSort(e.target.value)}
                            className="table-sort-select"
                            aria-label="Sort sourcing records"
                          >
                            <option value="recent">Latest Inquired</option>
                            <option value="price-desc">Price: High to Low</option>
                            <option value="price-asc">Price: Low to High</option>
                            <option value="crop-asc">Crop: A to Z</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {filteredReportEnquiries.length === 0 ? (
                    <div className="report-empty-state">
                      <div className="report-empty-icon">
                        <Search size={32} />
                      </div>
                      <h4>No Sourcing Records Found</h4>
                      <p>
                        {reportSearch || reportStatusFilter !== "all"
                          ? "No records matched your search query or filter selection."
                          : "You haven't initiated any crop enquiries yet. Browse verified harvest listings to connect with farmers."}
                      </p>
                      {reportSearch || reportStatusFilter !== "all" ? (
                        <button
                          type="button"
                          className="btn-reset-filters"
                          onClick={() => {
                            setReportSearch("");
                            setReportStatusFilter("all");
                          }}
                        >
                          Reset All Filters
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-browse-produce"
                          onClick={navigateToMarketplace}
                        >
                          <Store size={15} />
                          <span>Browse Produce Marketplace</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="sales-table-wrapper">
                        <table className="sales-breakdown-table">
                          <thead>
                            <tr>
                              <th>Crop & Category</th>
                              <th>Farm & Producer</th>
                              <th>Quantity / Need</th>
                              <th>Unit Rate</th>
                              <th>Status</th>
                              <th>Date</th>
                              <th className="th-action">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredReportEnquiries.map((enq) => {
                              const parsed = parseEnquiryMessage(enq.message);
                              const farmerObj =
                                typeof enq.crop?.farmer === "object"
                                  ? enq.crop.farmer
                                  : { _id: enq.crop?.farmer, role: "Farmer" };
                              const farmerDisplayName =
                                typeof enq.crop?.farmer === "object"
                                  ? enq.crop.farmer.name || enq.crop.farmer.username || "Verified Farmer"
                                  : "Verified Farmer";
                              const statusKey = (enq.status || "pending").toLowerCase();

                              return (
                                <tr key={enq._id} className={`report-row row-${statusKey}`}>
                                  {/* 1. Crop & Category */}
                                  <td className="cell-crop">
                                    <div className="crop-meta-flex">
                                      <div className="crop-avatar-wrap">
                                        {enq.crop?.image ? (
                                          <img
                                            src={enq.crop.image}
                                            alt={enq.crop.name || "Crop"}
                                            className="crop-thumb-img"
                                          />
                                        ) : (
                                          <div className="crop-thumb-placeholder">🌾</div>
                                        )}
                                      </div>
                                      <div className="crop-details">
                                        <strong className="crop-name">{enq.crop?.name || "Harvest Produce"}</strong>
                                        <div className="crop-sub-tags">
                                          <span className="ref-id-tag">#ENQ-{(enq._id || "").slice(-6).toUpperCase()}</span>
                                          {enq.crop?.category && (
                                            <span className="category-tag">{enq.crop.category}</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  {/* 2. Farm & Producer */}
                                  <td className="cell-farmer">
                                    <div className="farmer-meta-flex">
                                      <span className="farmer-title">{farmerDisplayName}</span>
                                      <span className="location-sub">
                                        <MapPin size={12} />
                                        {enq.crop?.location || "India"}
                                      </span>
                                    </div>
                                  </td>

                                  {/* 3. Quantity / Need */}
                                  <td className="cell-quantity">
                                    {parsed.requirement ? (
                                      <div className="requirement-pill">
                                        <Tag size={12} />
                                        <span>{parsed.requirement}</span>
                                      </div>
                                    ) : (
                                      <span className="text-dim">Standard inquiry</span>
                                    )}
                                    {parsed.note && (
                                      <div className="note-snippet" title={parsed.note}>
                                        "{parsed.note.length > 35 ? parsed.note.slice(0, 35) + "..." : parsed.note}"
                                      </div>
                                    )}
                                  </td>

                                  {/* 4. Unit Rate */}
                                  <td className="cell-rate">
                                    <div className="rate-flex">
                                      <span className="rate-amount">₹{enq.crop?.price ?? "--"}</span>
                                      <span className="rate-unit">/ {t(`units.${enq.crop?.unit}`) || enq.crop?.unit || "kg"}</span>
                                    </div>
                                  </td>

                                  {/* 5. Status Pill */}
                                  <td className="cell-status">
                                    <span className={`status-pill-badge status-${statusKey}`}>
                                      {statusKey === "confirmed" && <CheckCircle2 size={13} />}
                                      {statusKey === "rejected" && <XCircle size={13} />}
                                      {statusKey === "pending" && <Clock size={13} />}
                                      {statusKey === "responded" && <MessageSquare size={13} />}
                                      {statusKey === "closed" && <Check size={13} />}
                                      <span>{enquiryStatusLabel(enq.status)}</span>
                                    </span>
                                  </td>

                                  {/* 6. Date */}
                                  <td className="cell-date">
                                    <span className="date-text">{formatEnquiryDate(enq.createdAt, language)}</span>
                                  </td>

                                  {/* 7. Action */}
                                  <td className="cell-action">
                                    <button
                                      type="button"
                                      className="btn-chat-with-user small"
                                      onClick={() => handleStartChat(farmerObj, enq.crop)}
                                      title="Open live chat with producer"
                                    >
                                      <MessageSquare size={13} />
                                      <span>Chat</span>
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Table Summary Footer Strip */}
                      <div className="table-summary-strip">
                        <div className="summary-strip-left">
                          <span>
                            Showing <strong>{filteredReportEnquiries.length}</strong> of <strong>{buyerEnquiries.length}</strong> sourcing records
                          </span>
                          {(reportSearch || reportStatusFilter !== "all") && (
                            <button
                              type="button"
                              className="btn-strip-reset"
                              onClick={() => {
                                setReportSearch("");
                                setReportStatusFilter("all");
                              }}
                            >
                              Clear Filters
                            </button>
                          )}
                        </div>
                        <div className="summary-strip-right">
                          <span className="summary-tag-confirmed">
                            <CheckCircle2 size={13} />
                            <strong>{reportStatusCounts.confirmed}</strong> Confirmed Deals
                          </span>
                          <span className="summary-tag-spend">
                            Total Procurement: <strong>₹{buyerTotalSpent.toLocaleString("en-IN")}</strong>
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function enquiryStatusLabel(status) {
  if (!status) return "";
  const s = status.toLowerCase();
  if (s === "pending") return "Awaiting Reply";
  if (s === "confirmed") return "Confirmed";
  if (s === "rejected") return "Rejected";
  if (s === "responded") return "Responded";
  return status;
}

function parseEnquiryMessage(rawMsg) {
  if (!rawMsg || typeof rawMsg !== "string") {
    return { requirement: null, contact: null, note: "" };
  }
  const lines = rawMsg.split("\n").map((l) => l.trim()).filter(Boolean);
  let requirement = null;
  let contact = null;
  let noteParts = [];

  for (const line of lines) {
    if (/^[Rr]equirement:\s*/i.test(line)) {
      requirement = line.replace(/^[Rr]equirement:\s*/i, "").trim();
    } else if (/^(phone\/contact|contact):\s*/i.test(line)) {
      contact = line.replace(/^(phone\/contact|contact):\s*/i, "").trim();
    } else if (/^[Mm]essage:\s*/i.test(line)) {
      noteParts.push(line.replace(/^[Mm]essage:\s*/i, "").trim());
    } else {
      noteParts.push(line);
    }
  }

  return {
    requirement,
    contact,
    note: noteParts.join("\n").trim() || rawMsg
  };
}
