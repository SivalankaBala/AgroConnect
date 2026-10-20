import React from "react";
import {
  RefreshCw,
  Plus,
  Sprout,
  Clock,
  CheckCircle2,
  MessageSquare,
  Tractor,
  Edit2,
  Trash2,
  User,
  Mail,
  Check,
  X,
  XCircle,
  ShoppingCart,
  TrendingUp,
  Package,
  Scale
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { formatEnquiryDate } from "../../utils/formatters";

export default function FarmerDashboardView({
  dashboardLoading = false,
  dashboardListings = [],
  dashboardEnquiries = [],
  farmerPendingCount = 0,
  farmerRespondedCount = 0,
  confirmedOrders = [],
  totalConfirmedSalesValue = 0,
  dashboardTab = "all",
  processingOrderAction = false,
  fetchFarmerDashboardData,
  openListingModal,
  openEditModal,
  handleDeleteCrop,
  handleSidebarNavigate,
  handlePromptOrderAction,
  handleStartChat
}) {
  const { t, language } = useLanguage();

  return (
    <main className="dashboard-page-view" id="farmer-dashboard">
      <div className="section-container">
        <div className="dashboard-top-header">
          <div>
            <span className="modal-eyebrow">{t("farmerDashboard.eyebrow")}</span>
            <h2>{t("farmerDashboard.title")}</h2>
            <p>{t("farmerDashboard.subtitle")}</p>
          </div>
          <div className="dashboard-action-buttons">
            <button className="btn-dashboard-refresh" onClick={fetchFarmerDashboardData} title={t("farmerDashboard.refresh")}>
              <RefreshCw size={15} />
              <span>{t("farmerDashboard.refresh")}</span>
            </button>
            <button className="btn-dashboard-add" onClick={openListingModal}>
              <Plus size={16} />
              <span>{t("farmerDashboard.addNewCrop")}</span>
            </button>
          </div>
        </div>

        {dashboardLoading ? (
          <div className="state-box loading-box">
            <RefreshCw className="spinner-icon" size={28} />
            <h3>{t("marketplace.loadingTitle")}</h3>
          </div>
        ) : (
          <>
            <div className="stats-cards-grid">
              <div className="stat-metric-card">
                <div className="metric-icon-box green">
                  <Sprout size={20} />
                </div>
                <div>
                  <span className="metric-val">{dashboardListings.length}</span>
                  <span className="metric-lbl">{t("farmerDashboard.statPublishedCrops")}</span>
                </div>
              </div>

              <div className="stat-metric-card alert">
                <div className="metric-icon-box amber">
                  <Clock size={20} />
                </div>
                <div>
                  <span className="metric-val">{farmerPendingCount}</span>
                  <span className="metric-lbl">{t("farmerDashboard.statPendingReplies")}</span>
                </div>
              </div>

              <div className="stat-metric-card success">
                <div className="metric-icon-box blue">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <span className="metric-val">{farmerRespondedCount}</span>
                  <span className="metric-lbl">{t("farmerDashboard.statRespondedEnquiries")}</span>
                </div>
              </div>

              <div className="stat-metric-card">
                <div className="metric-icon-box">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <span className="metric-val">{dashboardEnquiries.length}</span>
                  <span className="metric-lbl">{t("farmerDashboard.statTotalEnquiries")}</span>
                </div>
              </div>
            </div>

            <div className="dashboard-tabs-bar">
              <button
                className={`d-tab-btn ${dashboardTab === "all" ? "active" : ""}`}
                onClick={() => handleSidebarNavigate("dashboard")}
              >
                {t("farmerDashboard.tabAll") || "Overview"}
              </button>
              <button
                className={`d-tab-btn ${dashboardTab === "listings" ? "active" : ""}`}
                onClick={() => handleSidebarNavigate("products")}
              >
                {t("farmerDashboard.tabListings", { count: dashboardListings.length }) || `My Products (${dashboardListings.length})`}
              </button>
              <button
                className={`d-tab-btn d-tab-enquiries ${dashboardTab === "enquiries" ? "active" : ""}`}
                onClick={() => handleSidebarNavigate("enquiries")}
              >
                {t("farmerDashboard.tabEnquiries", { count: dashboardEnquiries.length }) || `Buyer Enquiries (${dashboardEnquiries.length})`}
                {farmerPendingCount > 0 && <span className="tab-bubble-count">{farmerPendingCount}</span>}
              </button>
              <button
                className={`d-tab-btn ${dashboardTab === "orders" ? "active" : ""}`}
                onClick={() => handleSidebarNavigate("orders")}
              >
                Orders ({confirmedOrders.length})
                {confirmedOrders.length > 0 && <span className="tab-bubble-count success">{confirmedOrders.length}</span>}
              </button>
              <button
                className={`d-tab-btn ${dashboardTab === "sales-report" ? "active" : ""}`}
                onClick={() => handleSidebarNavigate("sales-report")}
              >
                Sales Report
              </button>
            </div>

            {(dashboardTab === "all" || dashboardTab === "listings") && (
              <div className="dashboard-content-block">
                <div className="block-title-row">
                  <h3>{t("farmerDashboard.myPublishedCrops", { count: dashboardListings.length })}</h3>
                  <button className="btn-small-link" onClick={openListingModal}>
                    {t("farmerDashboard.listAnotherCrop")}
                  </button>
                </div>

                {dashboardListings.length === 0 ? (
                  <div className="dashboard-empty-state">
                    <Tractor size={36} className="empty-state-icon" />
                    <h4>{t("farmerDashboard.emptyListingsTitle")}</h4>
                    <p>{t("farmerDashboard.emptyListingsDesc")}</p>
                    <button className="btn-modal-submit green" onClick={openListingModal}>
                      <Plus size={16} />
                      <span>{t("farmerDashboard.listFirstCropBtn")}</span>
                    </button>
                  </div>
                ) : (
                  <div className="dashboard-listings-grid">
                    {dashboardListings.map((crop) => (
                      <div className="farmer-crop-manage-card" key={crop._id}>
                        <div className="manage-card-header">
                          <div>
                            <span className="category-pill-sm">{t(`categories.${crop.category}`) || crop.category}</span>
                            <h4>{crop.name}</h4>
                          </div>
                          <div className="manage-price-box">
                            <strong>₹{crop.price}</strong>
                            <small>/{t(`units.${crop.unit}`) || crop.unit || "kg"}</small>
                          </div>
                        </div>

                        <div className="manage-card-meta">
                          <span>📦 {t("farmerDashboard.stockLabel")} <strong>{crop.quantity} {t(`units.${crop.unit}`) || crop.unit || "kg"}</strong></span>
                          <span>📍 {t("farmerDashboard.locationLabel")} <strong>{crop.location}</strong></span>
                        </div>

                        {crop.description && (
                          <p className="manage-card-notes">"{crop.description}"</p>
                        )}

                        <div className="manage-card-buttons">
                          <button className="btn-manage-edit" onClick={() => openEditModal(crop)}>
                            <Edit2 size={14} />
                            <span>{t("farmerDashboard.editBtn")}</span>
                          </button>
                          <button
                            className="btn-manage-del"
                            onClick={() => handleDeleteCrop(crop._id, crop.name)}
                          >
                            <Trash2 size={14} />
                            <span>{t("farmerDashboard.deleteBtn")}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {(dashboardTab === "all" || dashboardTab === "enquiries") && (
              <div className="dashboard-content-block">
                <div className="block-title-row">
                  <h3>{t("farmerDashboard.incomingEnquiries", { count: dashboardEnquiries.length })}</h3>
                </div>

                {dashboardEnquiries.length === 0 ? (
                  <div className="dashboard-empty-state">
                    <MessageSquare size={36} className="empty-state-icon" />
                    <h4>{t("farmerDashboard.emptyEnquiriesTitle")}</h4>
                    <p>{t("farmerDashboard.emptyEnquiriesDesc")}</p>
                  </div>
                ) : (
                  <div className="enquiries-list-stack">
                    {dashboardEnquiries.map((enquiry) => (
                      <div className="enquiry-detail-card" key={enquiry._id}>
                        <div className="enquiry-top-row">
                          <div className="enquiry-crop-identifier">
                            <span className="crop-tag-title">
                              🌾 {enquiry.crop?.name || "Crop"} · ₹{enquiry.crop?.price || "--"} / {t(`units.${enquiry.crop?.unit}`) || enquiry.crop?.unit || "kg"}
                            </span>
                            <span className="enquiry-timestamp">
                              {formatEnquiryDate(enquiry.createdAt, language)}
                            </span>
                          </div>

                          <span className={`status-pill-badge status-${(enquiry.status || "").toLowerCase()}`}>
                            {enquiry.status === "Pending" && `🕒 ${t("statuses.Pending")}`}
                            {enquiry.status === "Responded" && `✅ ${t("statuses.Responded")}`}
                            {enquiry.status === "Closed" && `📁 ${t("statuses.Closed")}`}
                            {(enquiry.status === "confirmed" || enquiry.status === "Confirmed") && `✓ ${t("farmerDashboard.orderConfirmed") || "Order Confirmed"}`}
                            {(enquiry.status === "rejected" || enquiry.status === "Rejected") && `✕ ${t("farmerDashboard.orderRejected") || "Order Rejected"}`}
                          </span>
                        </div>

                        <div className="buyer-contact-cardlet">
                          <div className="contact-item">
                            <User size={15} />
                            <span><strong>{t("farmerDashboard.buyerLabel")}</strong> {enquiry.buyerName}</span>
                          </div>
                          <div className="contact-item">
                            <Mail size={15} />
                            <span><strong>{t("farmerDashboard.contactLabel")}</strong> <a href={`mailto:${enquiry.buyerEmail}`}>{enquiry.buyerEmail}</a></span>
                          </div>
                        </div>

                        <div className="enquiry-message-bubble">
                          <span className="msg-label">{t("farmerDashboard.buyerMessageLabel")}</span>
                          <p>{enquiry.message}</p>
                        </div>

                        <div className="enquiry-status-row enquiry-action-toolbar">
                          {(enquiry.status === "confirmed" || enquiry.status === "Confirmed") ? (
                            <div className="order-final-status confirmed" role="status">
                              <CheckCircle2 size={16} />
                              <span>{t("farmerDashboard.orderConfirmed") || "Order Confirmed"}</span>
                            </div>
                          ) : (enquiry.status === "rejected" || enquiry.status === "Rejected") ? (
                            <div className="order-final-status rejected" role="status">
                              <XCircle size={16} />
                              <span>{t("farmerDashboard.orderRejected") || "Order Rejected"}</span>
                            </div>
                          ) : (
                            <div className="order-action-buttons-group">
                              <button
                                type="button"
                                className="btn-order-action confirm"
                                onClick={() => handlePromptOrderAction(enquiry, "confirm")}
                                disabled={processingOrderAction}
                                title={t("farmerDashboard.confirmOrderTooltip") || "Confirm this order"}
                              >
                                <Check size={16} />
                                <span>{t("farmerDashboard.confirmOrder") || "Confirm Order"}</span>
                              </button>
                              <button
                                type="button"
                                className="btn-order-action reject"
                                onClick={() => handlePromptOrderAction(enquiry, "reject")}
                                disabled={processingOrderAction}
                                title={t("farmerDashboard.rejectOrderTooltip") || "Reject this order"}
                              >
                                <X size={16} />
                                <span>{t("farmerDashboard.rejectOrder") || "Reject Order"}</span>
                              </button>
                            </div>
                          )}

                          <button
                            type="button"
                            className="btn-chat-with-user"
                            onClick={() => {
                              const buyerObj = typeof enquiry.buyer === "object"
                                ? enquiry.buyer
                                : { _id: enquiry.buyer, name: enquiry.buyerName, email: enquiry.buyerEmail, role: "Buyer" };
                              handleStartChat(buyerObj, enquiry.crop);
                            }}
                          >
                            <MessageSquare size={14} />
                            <span>{t("chat.chatWithBuyer") || "Chat with Buyer"}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. ORDERS VIEW TAB */}
            {dashboardTab === "orders" && (
              <div className="dashboard-content-block">
                <div className="block-title-row">
                  <div>
                    <h3>Confirmed Orders ({confirmedOrders.length})</h3>
                    <p className="block-subtitle">Buyer orders confirmed by you, ready for packing and fulfillment.</p>
                  </div>
                  <button className="btn-dashboard-refresh" onClick={fetchFarmerDashboardData} title="Refresh Orders">
                    <RefreshCw size={14} />
                    <span>Refresh Orders</span>
                  </button>
                </div>

                <div className="orders-summary-strip">
                  <div className="orders-summary-item">
                    <span className="summary-lbl">Total Confirmed Orders</span>
                    <strong className="summary-val green">{confirmedOrders.length}</strong>
                  </div>
                  <div className="orders-summary-item">
                    <span className="summary-lbl">Gross Value</span>
                    <strong className="summary-val">₹{totalConfirmedSalesValue.toLocaleString("en-IN")}</strong>
                  </div>
                  <div className="orders-summary-item">
                    <span className="summary-lbl">Active Deliveries</span>
                    <strong className="summary-val">{confirmedOrders.length} In Progress</strong>
                  </div>
                </div>

                {confirmedOrders.length === 0 ? (
                  <div className="dashboard-empty-state">
                    <ShoppingCart size={38} className="empty-state-icon" />
                    <h4>No confirmed orders yet</h4>
                    <p>When buyers submit enquiries and you confirm them, they will appear here as confirmed orders.</p>
                    <button className="btn-modal-submit green" onClick={() => handleSidebarNavigate("enquiries")}>
                      <MessageSquare size={16} />
                      <span>View Buyer Enquiries</span>
                    </button>
                  </div>
                ) : (
                  <div className="orders-cards-list">
                    {confirmedOrders.map((order) => (
                      <div className="order-manage-card" key={order._id}>
                        <div className="order-card-header">
                          <div className="order-card-id-block">
                            <span className="order-ref-badge">ORDER #{order._id?.slice(-6).toUpperCase()}</span>
                            <span className="order-date-text">{formatEnquiryDate(order.createdAt, language)}</span>
                          </div>
                          <span className="order-status-pill confirmed">
                            <CheckCircle2 size={14} /> Confirmed Order
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
                              <User size={14} />
                              <span>Buyer: <strong>{order.buyerName}</strong></span>
                            </div>
                            <div className="order-detail-field">
                              <Mail size={14} />
                              <span>Email: <a href={`mailto:${order.buyerEmail}`}>{order.buyerEmail}</a></span>
                            </div>
                          </div>
                        </div>

                        {order.message && (
                          <div className="order-note-box">
                            <small>Buyer Request Note:</small>
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
                              const buyerObj = typeof order.buyer === "object"
                                ? order.buyer
                                : { _id: order.buyer, name: order.buyerName, email: order.buyerEmail, role: "Buyer" };
                              handleStartChat(buyerObj, order.crop);
                            }}
                          >
                            <MessageSquare size={14} />
                            <span>Chat with Buyer</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 5. SALES REPORT VIEW TAB */}
            {dashboardTab === "sales-report" && (
              <div className="dashboard-content-block sales-report-view">
                <div className="block-title-row">
                  <div>
                    <h3>Sales & Revenue Report</h3>
                    <p className="block-subtitle">Performance metrics, revenue analytics, and crop breakdown.</p>
                  </div>
                  <button className="btn-dashboard-refresh" onClick={fetchFarmerDashboardData} title="Refresh Report">
                    <RefreshCw size={14} />
                    <span>Refresh Report</span>
                  </button>
                </div>

                <div className="sales-kpi-grid">
                  <div className="sales-kpi-card highlight">
                    <div className="sales-kpi-top">
                      <span className="sales-kpi-label">Total Realized Revenue</span>
                      <div className="sales-kpi-icon-pill green"><TrendingUp size={18} /></div>
                    </div>
                    <div className="sales-kpi-val">₹{totalConfirmedSalesValue.toLocaleString("en-IN")}</div>
                    <div className="sales-kpi-subtext">From {confirmedOrders.length} confirmed orders</div>
                  </div>

                  <div className="sales-kpi-card">
                    <div className="sales-kpi-top">
                      <span className="sales-kpi-label">Active Crop Inventory</span>
                      <div className="sales-kpi-icon-pill blue"><Package size={18} /></div>
                    </div>
                    <div className="sales-kpi-val">{dashboardListings.length} Products</div>
                    <div className="sales-kpi-subtext">Listed on Andhra marketplace</div>
                  </div>

                  <div className="sales-kpi-card">
                    <div className="sales-kpi-top">
                      <span className="sales-kpi-label">Order Conversion Rate</span>
                      <div className="sales-kpi-icon-pill amber"><Scale size={18} /></div>
                    </div>
                    <div className="sales-kpi-val">
                      {dashboardEnquiries.length > 0
                        ? `${Math.round((confirmedOrders.length / dashboardEnquiries.length) * 100)}%`
                        : "0%"}
                    </div>
                    <div className="sales-kpi-subtext">{confirmedOrders.length} of {dashboardEnquiries.length} enquiries confirmed</div>
                  </div>

                  <div className="sales-kpi-card">
                    <div className="sales-kpi-top">
                      <span className="sales-kpi-label">Buyer Inquiries</span>
                      <div className="sales-kpi-icon-pill purple"><MessageSquare size={18} /></div>
                    </div>
                    <div className="sales-kpi-val">{dashboardEnquiries.length} Total</div>
                    <div className="sales-kpi-subtext">{farmerPendingCount} pending response</div>
                  </div>
                </div>

                <div className="sales-analytics-section">
                  <h4 className="sales-section-title">Crop-Wise Performance Breakdown</h4>
                  <div className="sales-table-wrapper">
                    <table className="sales-performance-table">
                      <thead>
                        <tr>
                          <th>Crop Name</th>
                          <th>Category</th>
                          <th>Unit Price</th>
                          <th>Listed Stock</th>
                          <th>Inquiries</th>
                          <th>Confirmed Orders</th>
                          <th>Est. Realized Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardListings.map((crop) => {
                          const cropEnquiries = dashboardEnquiries.filter((e) => e.crop?._id === crop._id || e.crop === crop._id);
                          const cropOrders = cropEnquiries.filter((e) => (e.status || "").toLowerCase() === "confirmed");
                          const cropRev = cropOrders.length * Number(crop.price || 0);
                          return (
                            <tr key={crop._id}>
                              <td><strong>🌾 {crop.name}</strong></td>
                              <td><span className="category-pill-sm">{crop.category}</span></td>
                              <td>₹{crop.price} / {crop.unit || "kg"}</td>
                              <td>{crop.quantity} {crop.unit || "kg"}</td>
                              <td><span className="badge-cell count">{cropEnquiries.length}</span></td>
                              <td><span className="badge-cell success">{cropOrders.length} orders</span></td>
                              <td><strong className="rev-bold">₹{cropRev.toLocaleString("en-IN")}</strong></td>
                            </tr>
                          );
                        })}
                        {dashboardListings.length === 0 && (
                          <tr>
                            <td colSpan={7} className="table-empty-cell">No crops listed yet to analyze.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
