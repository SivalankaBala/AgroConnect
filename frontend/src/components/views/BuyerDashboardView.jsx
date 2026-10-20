import React from "react";
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
  TrendingUp
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

  return (
    <main className="dashboard-page-view" id="buyer-dashboard">
      <div className="section-container">
        <div className="dashboard-top-header">
          <div>
            <span className="modal-eyebrow">{t("buyerDashboard.eyebrow")}</span>
            <h2>{t("buyerDashboard.title")}</h2>
            <p>{t("buyerDashboard.subtitle")}</p>
          </div>
          <div className="dashboard-action-buttons">
            <button className="btn-dashboard-refresh" onClick={fetchBuyerEnquiries} title={t("buyerDashboard.refresh")}>
              <RefreshCw size={15} />
              <span>{t("buyerDashboard.refresh")}</span>
            </button>
            <button className="btn-dashboard-add" onClick={navigateToMarketplace}>
              <Store size={16} />
              <span>{t("buyerDashboard.browseMoreCrops")}</span>
            </button>
          </div>
        </div>

        {buyerLoading ? (
          <div className="state-box loading-box">
            <RefreshCw className="spinner-icon" size={28} />
            <h3>{t("marketplace.loadingTitle")}</h3>
          </div>
        ) : buyerError ? (
          <div className="state-box error-box">
            <AlertCircle size={28} />
            <h3>{buyerError}</h3>
            <button className="btn-modal-submit green" onClick={fetchBuyerEnquiries}>
              {t("farmerDashboard.refresh")}
            </button>
          </div>
        ) : (
          <>
            <div className="stats-cards-grid">
              <div className="stat-metric-card">
                <div className="metric-icon-box blue">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <span className="metric-val">{buyerEnquiries.length}</span>
                  <span className="metric-lbl">{t("buyerDashboard.statTotalSent")}</span>
                </div>
              </div>

              <div className="stat-metric-card alert">
                <div className="metric-icon-box amber">
                  <Clock size={20} />
                </div>
                <div>
                  <span className="metric-val">{buyerPendingCount}</span>
                  <span className="metric-lbl">{t("buyerDashboard.statAwaitingReply")}</span>
                </div>
              </div>

              <div className="stat-metric-card success">
                <div className="metric-icon-box green">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <span className="metric-val">{buyerRespondedCount}</span>
                  <span className="metric-lbl">{t("buyerDashboard.statFarmerResponded")}</span>
                </div>
              </div>

              <div className="stat-metric-card">
                <div className="metric-icon-box">
                  <Check size={20} />
                </div>
                <div>
                  <span className="metric-val">{buyerClosedCount}</span>
                  <span className="metric-lbl">{t("buyerDashboard.statClosedDeals")}</span>
                </div>
              </div>

              <div className={`stat-metric-card ${unreadNotificationCount > 0 ? "alert" : ""}`}>
                <div className="metric-icon-box green">
                  <Bell size={20} />
                </div>
                <div>
                  <span className="metric-val">{unreadNotificationCount}</span>
                  <span className="metric-lbl">{t("buyerDashboard.statUnreadNotifications") || "Order Updates"}</span>
                </div>
              </div>
            </div>

            <div className="dashboard-tabs-bar">
              <button
                className={`d-tab-btn ${buyerDashboardTab === "all" ? "active" : ""}`}
                onClick={() => handleSidebarNavigate("dashboard")}
              >
                {t("farmerDashboard.tabAll") || "Overview"}
              </button>
              <button
                className={`d-tab-btn ${buyerDashboardTab === "enquiries" ? "active" : ""}`}
                onClick={() => handleSidebarNavigate("enquiries")}
              >
                {`My Enquiries (${buyerEnquiries.length})`}
                {buyerPendingCount > 0 && <span className="tab-bubble-count">{buyerPendingCount}</span>}
              </button>
              <button
                className={`d-tab-btn ${buyerDashboardTab === "orders" ? "active" : ""}`}
                onClick={() => handleSidebarNavigate("orders")}
              >
                {`Orders (${buyerConfirmedOrders.length || buyerNotifications.length})`}
                {buyerConfirmedOrders.length > 0 && (
                  <span className="tab-bubble-count success">{buyerConfirmedOrders.length}</span>
                )}
              </button>
              <button
                className={`d-tab-btn ${buyerDashboardTab === "purchases-report" ? "active" : ""}`}
                onClick={() => handleSidebarNavigate("purchases-report")}
              >
                Purchase Report
              </button>
            </div>

            {(buyerDashboardTab === "all" || buyerDashboardTab === "orders") && (
              buyerNotifications && buyerNotifications.length > 0 ? (
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
                            {!notif.read && (
                              <span className="notif-new-dot">● Unread</span>
                            )}
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
              ) : buyerDashboardTab === "orders" ? (
                <div className="dashboard-content-block">
                  <div className="dashboard-empty-state">
                    <Bell size={36} className="empty-state-icon" />
                    <h4>No Order Updates Yet</h4>
                    <p>You have no recent order updates or status notifications from farmers.</p>
                    <button className="btn-modal-submit green" onClick={navigateToMarketplace}>
                      <Store size={16} />
                      <span>Browse Fresh Produce</span>
                    </button>
                  </div>
                </div>
              ) : null
            )}

            {(buyerDashboardTab === "all" || buyerDashboardTab === "enquiries") && (
              <div className="dashboard-content-block">
                <div className="block-title-row">
                  <h3>{t("buyerDashboard.myEnquiryHistory", { count: buyerEnquiries.length })}</h3>
                </div>

                {buyerEnquiries.length === 0 ? (
                  <div className="dashboard-empty-state">
                    <ShoppingCart size={36} className="empty-state-icon" />
                    <h4>{t("buyerDashboard.emptyTitle")}</h4>
                    <p>{t("buyerDashboard.emptyDesc")}</p>
                    <button
                      className="btn-modal-submit green"
                      onClick={navigateToMarketplace}
                    >
                      <span>{t("buyerDashboard.exploreBtn")}</span>
                    </button>
                  </div>
                ) : (
                  <div className="enquiries-list-stack">
                    {buyerEnquiries.map((enquiry) => (
                      <div className="enquiry-detail-card" key={enquiry._id}>
                        <div className="enquiry-top-row">
                          <div className="enquiry-crop-identifier">
                            <span className="crop-tag-title">
                              🌾 {enquiry.crop?.name || "Crop"}
                            </span>
                            {enquiry.crop?.location && (
                              <span className="enquiry-location-sub">
                                📍 {enquiry.crop.location} · ₹{enquiry.crop.price} / {t(`units.${enquiry.crop.unit}`) || enquiry.crop.unit || "kg"}
                              </span>
                            )}
                            <span className="enquiry-timestamp">
                              {t("buyerDashboard.submittedOn", {
                                date: formatEnquiryDate(enquiry.createdAt, language)
                              })}
                            </span>
                          </div>

                          <span className={`status-pill-badge status-${(enquiry.status || "").toLowerCase()}`}>
                            {enquiry.status === "Pending" && t("statuses.buyerPendingBadge")}
                            {enquiry.status === "Responded" && t("statuses.buyerRespondedBadge")}
                            {enquiry.status === "Closed" && t("statuses.buyerClosedBadge")}
                            {(enquiry.status === "confirmed" || enquiry.status === "Confirmed") && `✓ ${t("farmerDashboard.orderConfirmed") || "Order Confirmed"}`}
                            {(enquiry.status === "rejected" || enquiry.status === "Rejected") && `✕ ${t("farmerDashboard.orderRejected") || "Order Rejected"}`}
                          </span>
                        </div>

                        <div className="enquiry-message-bubble">
                          <span className="msg-label">{t("buyerDashboard.yourRequirementSent")}</span>
                          <p style={{ whiteSpace: "pre-line" }}>{enquiry.message}</p>
                        </div>

                        <div className="buyer-enquiry-footer-note">
                          <Info size={14} />
                          <span>
                            {enquiry.status === "Pending"
                              ? t("buyerDashboard.notePending")
                              : enquiry.status === "Responded"
                                ? t("buyerDashboard.noteResponded")
                                : (enquiry.status === "confirmed" || enquiry.status === "Confirmed")
                                  ? (t("buyerDashboard.noteConfirmed") || "Good news! Your order has been confirmed by the farmer.")
                                  : (enquiry.status === "rejected" || enquiry.status === "Rejected")
                                    ? (t("buyerDashboard.noteRejected") || "Your order could not be accepted by the farmer at this time.")
                                    : t("buyerDashboard.noteClosed")}
                          </span>
                        </div>

                        <div className="enquiry-chat-action-strip">
                          <button
                            type="button"
                            className="btn-chat-with-user"
                            onClick={() => {
                              const farmerObj = typeof enquiry.crop?.farmer === "object"
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
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* BUYER CONFIRMED ORDERS SECTION */}
            {buyerDashboardTab === "orders" && buyerConfirmedOrders.length > 0 && (
              <div className="dashboard-content-block">
                <div className="block-title-row">
                  <div className="block-title-with-badge">
                    <CheckCircle2 size={18} className="block-header-icon notif-icon-success" />
                    <h3>Confirmed Purchases ({buyerConfirmedOrders.length})</h3>
                  </div>
                </div>

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
                            <span className="order-crop-rate">₹{order.crop?.price || "--"} / {t(`units.${order.crop?.unit}`) || order.crop?.unit || "kg"}</span>
                          </div>
                        </div>

                        <div className="order-buyer-details">
                          <div className="order-detail-field">
                            <MapPin size={14} />
                            <span>Farm Location: <strong>{order.crop?.location || "Andhra Pradesh"}</strong></span>
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
                            const farmerObj = typeof order.crop?.farmer === "object"
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
              </div>
            )}

            {/* BUYER PURCHASE & PROCUREMENT REPORT TAB */}
            {buyerDashboardTab === "purchases-report" && (
              <div className="dashboard-content-block sales-report-view">
                <div className="block-title-row">
                  <div>
                    <h3>Procurement & Purchase Report</h3>
                    <p className="block-subtitle">Procurement analytics, order spend, and sourcing summary.</p>
                  </div>
                  <button className="btn-dashboard-refresh" onClick={fetchBuyerEnquiries} title="Refresh Report">
                    <RefreshCw size={14} />
                    <span>Refresh Report</span>
                  </button>
                </div>

                <div className="sales-kpi-grid">
                  <div className="sales-kpi-card highlight">
                    <div className="sales-kpi-top">
                      <span className="sales-kpi-label">Total Procurement Value</span>
                      <div className="sales-kpi-icon-pill green"><TrendingUp size={18} /></div>
                    </div>
                    <div className="sales-kpi-val">₹{buyerTotalSpent.toLocaleString("en-IN")}</div>
                    <div className="sales-kpi-subtext">From {buyerConfirmedOrders.length} confirmed purchases</div>
                  </div>

                  <div className="sales-kpi-card">
                    <div className="sales-kpi-top">
                      <span className="sales-kpi-label">Active Requirements Sent</span>
                      <div className="sales-kpi-icon-pill blue"><MessageSquare size={18} /></div>
                    </div>
                    <div className="sales-kpi-val">{buyerEnquiries.length}</div>
                    <div className="sales-kpi-subtext">{buyerPendingCount} awaiting response</div>
                  </div>

                  <div className="sales-kpi-card">
                    <div className="sales-kpi-top">
                      <span className="sales-kpi-label">Confirmed Orders</span>
                      <div className="sales-kpi-icon-pill green"><CheckCircle2 size={18} /></div>
                    </div>
                    <div className="sales-kpi-val">{buyerConfirmedOrders.length}</div>
                    <div className="sales-kpi-subtext">{buyerRespondedCount} farmer responses received</div>
                  </div>

                  <div className="sales-kpi-card">
                    <div className="sales-kpi-top">
                      <span className="sales-kpi-label">Order Alerts & Updates</span>
                      <div className="sales-kpi-icon-pill amber"><Bell size={18} /></div>
                    </div>
                    <div className="sales-kpi-val">{buyerNotifications.length}</div>
                    <div className="sales-kpi-subtext">{unreadNotificationCount} unread status alerts</div>
                  </div>
                </div>

                <div className="sales-breakdown-card">
                  <h4>Sourcing Breakdown</h4>
                  {buyerEnquiries.length === 0 ? (
                    <p className="empty-subtext">No crop orders placed yet. Browse the marketplace to connect with verified farmers.</p>
                  ) : (
                    <div className="sales-table-wrapper">
                      <table className="sales-breakdown-table">
                        <thead>
                          <tr>
                            <th>Crop Name</th>
                            <th>Farm Location</th>
                            <th>Unit Price</th>
                            <th>Requirement Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {buyerEnquiries.map((enq) => (
                            <tr key={enq._id}>
                              <td className="crop-cell">
                                <span className="crop-dot" />
                                <strong>{enq.crop?.name || "Crop"}</strong>
                              </td>
                              <td>{enq.crop?.location || "Andhra Pradesh"}</td>
                              <td className="metric-cell">₹{enq.crop?.price || "--"} / {enq.crop?.unit || "kg"}</td>
                              <td>
                                <span className={`status-pill-badge status-${(enq.status || "").toLowerCase()}`}>
                                  {enquiryStatusLabel(enq.status)}
                                </span>
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="btn-chat-with-user small"
                                  onClick={() => {
                                    const farmerObj = typeof enq.crop?.farmer === "object"
                                      ? enq.crop.farmer
                                      : { _id: enq.crop?.farmer, role: "Farmer" };
                                    handleStartChat(farmerObj, enq.crop);
                                  }}
                                >
                                  <MessageSquare size={13} />
                                  <span>Chat</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
