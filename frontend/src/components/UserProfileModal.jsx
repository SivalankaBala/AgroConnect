import { useState } from "react";
import {
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Briefcase,
  Edit2,
  Check,
  X,
  ShieldCheck,
  Package,
  FileText,
  MessageSquare,
  Globe,
  Bell,
  HelpCircle,
  LogOut,
  CreditCard,
  Loader2
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { apiUrl } from "../config/api";

export default function UserProfileModal({
  isOpen,
  onClose,
  currentUser,
  onUserUpdate,
  onLogout,
  onOpenFarmerDashboard,
  onOpenBuyerDashboard,
  onOpenChat
}) {
  const { language, setLanguage, t } = useLanguage();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'settings'
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [form, setForm] = useState({
    name: currentUser?.name || "",
    phone: currentUser?.phone || "",
    location: currentUser?.location || "",
    bio: currentUser?.bio || "",
    businessType: currentUser?.businessType || ""
  });

  if (!isOpen || !currentUser) return null;

  const isFarmer = currentUser.role === "Farmer";

  const handleStartEdit = () => {
    setForm({
      name: currentUser.name || "",
      phone: currentUser.phone || "",
      location: currentUser.location || "",
      bio: currentUser.bio || "",
      businessType: currentUser.businessType || ""
    });
    setErrorMsg("");
    setSuccessMsg("");
    setIsEditModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    const token = sessionStorage.getItem("agroconnectToken");
    if (!token) {
      setErrorMsg("Session expired. Please log in again.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(apiUrl("/api/auth/profile"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      if (data.user) {
        onUserUpdate(data.user);
        sessionStorage.setItem("agroconnectUser", JSON.stringify(data.user));
      }
      setSuccessMsg("Profile updated successfully!");
      setIsEditModalOpen(false);
    } catch (err) {
      setErrorMsg(err.message || "Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  const formattedDate = currentUser.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString(
        language === "te" ? "te-IN" : language === "hi" ? "hi-IN" : "en-US",
        { month: "short", year: "numeric", day: "numeric" }
      )
    : "Active Member";

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="profile-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="profile-modal-header">
          <div className="profile-header-title-box">
            <h2 className="profile-modal-title">
              <User size={22} className="leaf-icon" />
              {t("profile.title") || "My AgroConnect Profile"}
            </h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="profile-subnav">
          <button
            type="button"
            className={`profile-subnav-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <User size={16} />
            <span>{t("profile.tabDetails") || "Profile Details"}</span>
          </button>
          <button
            type="button"
            className={`profile-subnav-btn ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            <HelpCircle size={16} />
            <span>{t("profile.appSettingsTab") || "Settings & Support"}</span>
          </button>
        </div>

        <div className="profile-modal-body">
          {errorMsg && (
            <div className="profile-alert error">
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="profile-alert success">
              <Check size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {activeTab === "overview" && (
            <>
              {/* Profile Card Banner */}
              <div className="profile-hero-card">
                <div className="profile-avatar-circle">
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt={currentUser.name} className="avatar-img" />
                  ) : (
                    <span>{currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U"}</span>
                  )}
                </div>

                <div className="profile-hero-info">
                  <div className="profile-name-row">
                    <h3 className="profile-display-name">{currentUser.name}</h3>
                    <span className={`profile-role-tag ${isFarmer ? "farmer" : "buyer"}`}>
                      <ShieldCheck size={14} />
                      {isFarmer ? (t("nav.roleFarmer") || "Farmer") : (t("nav.roleBuyer") || "Buyer")}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="profile-edit-btn"
                  onClick={handleStartEdit}
                >
                  <Edit2 size={15} />
                  <span>{t("profile.editProfileBtn") || "Edit Profile"}</span>
                </button>
              </div>

              {/* Read-only Details Grid */}
              <div className="profile-details-grid">
                <div className="profile-detail-card">
                  <div className="detail-icon-wrap">
                    <Phone size={18} />
                  </div>
                  <div>
                    <span className="detail-label">{t("profile.phone") || "Phone / WhatsApp:"}</span>
                    <p className="detail-value">{currentUser.phone || "Not provided yet"}</p>
                  </div>
                </div>

                <div className="profile-detail-card">
                  <div className="detail-icon-wrap">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <span className="detail-label">{t("profile.location") || "Farm / Business Location:"}</span>
                    <p className="detail-value">{currentUser.location || "Andhra Pradesh, India"}</p>
                  </div>
                </div>

                <div className="profile-detail-card">
                  <div className="detail-icon-wrap">
                    <Briefcase size={18} />
                  </div>
                  <div>
                    <span className="detail-label">{t("profile.businessType") || "Business / Operation Type:"}</span>
                    <p className="detail-value">
                      {currentUser.businessType || (isFarmer ? "Progressive Farmer" : "Direct Crop Buyer")}
                    </p>
                  </div>
                </div>

                <div className="profile-detail-card">
                  <div className="detail-icon-wrap">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <span className="detail-label">{t("profile.roleBadge") || "Account Role:"}</span>
                    <p className="detail-value">{currentUser.role}</p>
                  </div>
                </div>

                <div className="profile-detail-card full-width">
                  <div className="detail-icon-wrap">
                    <FileText size={18} />
                  </div>
                  <div>
                    <span className="detail-label">{t("profile.bio") || "About Me / Bio:"}</span>
                    <p className="detail-value bio-text">
                      {currentUser.bio || (isFarmer
                        ? "Experienced grower supplying direct harvested farm produce to wholesale buyers and distributors."
                        : "Commercial or household buyer sourcing fresh crops directly from local farmers.")}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "settings" && (
            <div className="profile-settings-section">
              {/* Language Preference */}
              <div className="settings-block">
                <div className="settings-block-header">
                  <Globe size={18} className="settings-icon" />
                  <div>
                    <h5>{t("profile.appLanguage")}</h5>
                  </div>
                </div>
                <div className="language-pills-row">
                  <button
                    type="button"
                    className={`lang-pill-btn ${language === "en" ? "active" : ""}`}
                    onClick={() => setLanguage("en")}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    className={`lang-pill-btn ${language === "te" ? "active" : ""}`}
                    onClick={() => setLanguage("te")}
                  >
                    తెలుగు (Telugu)
                  </button>
                  <button
                    type="button"
                    className={`lang-pill-btn ${language === "hi" ? "active" : ""}`}
                    onClick={() => setLanguage("hi")}
                  >
                    हिन्दी (Hindi)
                  </button>
                </div>
              </div>

              {/* Produce Notifications */}
              <div className="settings-block">
                <div className="settings-block-header">
                  <Bell size={18} className="settings-icon" />
                  <div>
                    <h5>{t("profile.notificationsPref")}</h5>
                    <p>{t("profile.notificationsOn")}</p>
                  </div>
                </div>
                <div className="toggle-indicator-box">
                  <span className="badge badge-success">Active</span>
                </div>
              </div>

              {/* Upcoming Orders and Payment Milestone */}
              <div className="settings-block upcoming">
                <div className="settings-block-header">
                  <CreditCard size={18} className="settings-icon upcoming-icon" />
                  <div>
                    <h5>{t("profile.ordersHeader")}</h5>
                    <p className="upcoming-note">{t("profile.ordersUpcomingNotice")}</p>
                  </div>
                </div>
                <span className="future-feature-tag">Under Development</span>
              </div>

              {/* Support & Helpline */}
              <div className="settings-block support">
                <div className="settings-block-header">
                  <HelpCircle size={18} className="settings-icon support-icon" />
                  <div>
                    <h5>{t("profile.supportTitle")}</h5>
                    <p>{t("profile.supportDesc")}</p>
                    <div className="helpline-badge">
                      {t("profile.helplineNumber")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Logout */}
        <div className="profile-modal-footer">
          <button
            type="button"
            className="profile-logout-btn"
            onClick={() => {
              onClose();
              if (onLogout) onLogout();
            }}
          >
            <LogOut size={16} />
            <span>{t("nav.logout") || "Logout"}</span>
          </button>
          <button type="button" className="btn-secondary" onClick={onClose}>
            <span>{t("profile.cancelBtn") || "Close"}</span>
          </button>
        </div>
      </div>
    </div>

    {/* SEPARATE EDIT PROFILE MODAL WINDOW */}
    {isEditModalOpen && (
      <div className="edit-profile-modal-overlay" onClick={() => setIsEditModalOpen(false)}>
        <div
          className="edit-profile-modal-window"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <div className="edit-profile-header">
            <div className="edit-header-title-row">
              <Edit2 size={18} className="edit-title-icon" />
              <h3>{t("profile.editProfileTitle") || "Edit Profile"}</h3>
            </div>
            <button
              type="button"
              className="modal-close-btn edit-profile-close-btn"
              onClick={() => setIsEditModalOpen(false)}
              aria-label="Close edit profile"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSave} className="edit-profile-form">
            <div className="edit-profile-body">
              {errorMsg && (
                <div className="profile-alert error">
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">{t("profile.fullName") || "Full Name"} *</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t("profile.phone") || "Phone / WhatsApp"}</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t("profile.location") || "Farm / Business Location"}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Tuni, Kakinada District, AP"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t("profile.businessType") || "Business / Operation Type"}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={
                    isFarmer
                      ? "e.g. Paddy & Organic Vegetables Grower"
                      : "e.g. Wholesale Mandi Trader / Retail Store"
                  }
                  value={form.businessType}
                  onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">{t("profile.bio") || "About Me / Bio"}</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  placeholder={
                    isFarmer
                      ? "Brief introduction to your agricultural produce, farming methods, and harvest schedule..."
                      : "Brief description of the crops and quantities you are interested in sourcing..."
                  }
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                />
              </div>
            </div>

            <div className="edit-profile-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsEditModalOpen(false)}
                disabled={saving}
              >
                <X size={16} />
                <span>{t("profile.cancelBtn") || "Cancel"}</span>
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 size={16} className="spinner" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>{t("profile.saveProfileBtn") || "Save Profile Changes"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  );
}
