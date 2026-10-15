import { useEffect, useState, useCallback } from "react";
import {
  Tractor,
  X,
  MapPin,
  Calendar,
  Users,
  CheckCircle2,
  MessageSquare,
  ArrowRight,
  RefreshCw,
  Plus
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export function FarmerProfileModal({
  farmerId,
  currentUser,
  onClose,
  onSelectCropForDetails,
  onStartChatWithFarmer,
  onRequestLogin
}) {
  const { t, language, getCropDisplayTag } = useLanguage();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError] = useState("");

  const token = sessionStorage.getItem("agroconnectToken");

  const fetchFarmer = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/farmers/${farmerId}`, { headers });
      if (!res.ok) {
        throw new Error("Could not load farmer profile.");
      }
      const data = await res.json();
      setProfileData(data);
      setFollowing(data.isFollowing || false);
      setFollowerCount(data.followerCount || 0);
    } catch (err) {
      console.error("Farmer profile error:", err);
      setError(err.message || "Failed to load farmer.");
    } finally {
      setLoading(false);
    }
  }, [farmerId, token]);

  useEffect(() => {
    if (farmerId) {
      fetchFarmer();
    }
  }, [farmerId, fetchFarmer]);

  async function handleToggleFollow() {
    if (!token || !currentUser) {
      onRequestLogin();
      return;
    }

    try {
      setFollowLoading(true);
      const res = await fetch(`/api/farmers/${farmerId}/follow`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFollowing(data.following);
        setFollowerCount(data.followerCount);
      }
    } catch (err) {
      console.error("Follow error:", err);
    } finally {
      setFollowLoading(false);
    }
  }

  function formatJoinDate(dateStr) {
    if (!dateStr) return "";
    try {
      const locale = language === "te" ? "te-IN" : language === "hi" ? "hi-IN" : "en-IN";
      return new Date(dateStr).toLocaleDateString(locale, {
        month: "long",
        year: "numeric"
      });
    } catch {
      return dateStr;
    }
  }

  return (
    <div className="modal-backdrop-modern" onClick={onClose}>
      <div
        className="modal-window farmer-profile-modal-window"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-round" onClick={onClose} aria-label="Close farmer profile">
          <X size={18} />
        </button>

        <div className="modal-inner-scroll">
          {loading ? (
            <div className="state-box loading-box">
              <RefreshCw className="spinner-icon" size={32} />
              <h3>Loading farmer profile...</h3>
            </div>
          ) : error || !profileData ? (
            <div className="state-box error-box">
              <Tractor size={32} />
              <h3>{error || "Farmer not found"}</h3>
            </div>
          ) : (
            <div className="farmer-profile-body">
              {/* HERO HEADER */}
              <div className="farmer-hero-header">
                <div className="farmer-avatar-giant">
                  <span>🧑‍🌾</span>
                </div>
                <div className="farmer-hero-info">
                  <div className="farmer-title-row">
                    <h2>{profileData.farmer.name}</h2>
                    <span className="verified-badge-pill">
                      <CheckCircle2 size={14} /> Verified AP Farmer
                    </span>
                  </div>

                  <div className="farmer-meta-badges">
                    <span className="meta-pill">
                      <MapPin size={13} /> {profileData.farmer.location || "Andhra Pradesh"}
                    </span>
                    <span className="meta-pill">
                      <Calendar size={13} /> {formatJoinDate(profileData.farmer.createdAt)}
                    </span>
                    <span className="meta-pill">
                      <Users size={13} /> {followerCount} {t("farmerDiscovery.follow")}ers
                    </span>
                  </div>

                  {profileData.farmer.bio && (
                    <p className="farmer-bio-text">“{profileData.farmer.bio}”</p>
                  )}
                </div>

                <div className="farmer-hero-actions">
                  <button
                    type="button"
                    className={`btn-follow-toggle ${following ? "following" : ""}`}
                    onClick={handleToggleFollow}
                    disabled={followLoading}
                  >
                    {following ? (
                      <>
                        <CheckCircle2 size={15} />
                        <span>{t("farmerDiscovery.following")}</span>
                      </>
                    ) : (
                      <>
                        <Plus size={15} />
                        <span>{t("farmerDiscovery.follow")}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn-chat-farmer"
                    onClick={() => {
                      onClose();
                      onStartChatWithFarmer(profileData.farmer);
                    }}
                  >
                    <MessageSquare size={15} />
                    <span>{t("farmerDiscovery.contact")}</span>
                  </button>
                </div>
              </div>

              {/* HARVEST CATALOG */}
              <div className="farmer-crops-section">
                <div className="section-header-mini">
                  <h3>
                    {t("farmerDiscovery.cropsListed", { count: profileData.crops.length })}
                  </h3>
                </div>

                {profileData.crops.length === 0 ? (
                  <div className="state-box empty-box">
                    <p>{t("farmerDiscovery.noFarmers")}</p>
                  </div>
                ) : (
                  <div className="farmer-crops-grid">
                    {profileData.crops.map((crop) => {
                      const tag = getCropDisplayTag(crop.name, crop.category);
                      return (
                        <div className="farmer-crop-card-mini" key={crop._id}>
                          <div className="mini-crop-top">
                            <div>
                              <span className="crop-cat-pill">{t(`categories.${crop.category}`) || crop.category}</span>
                              <h4>{crop.name}</h4>
                              <small className="crop-tag-sub">{tag}</small>
                            </div>
                            <div className="mini-price">
                              <strong>₹{crop.price}</strong>
                              <span>/{t(`units.${crop.unit}`) || crop.unit || "kg"}</span>
                            </div>
                          </div>

                          <div className="mini-crop-footer">
                            <span className="stock-info">
                              📦 {crop.quantity} {t(`units.${crop.unit}`) || crop.unit || "kg"} available
                            </span>
                            <button
                              type="button"
                              className="btn-view-crop-link"
                              onClick={() => {
                                onClose();
                                onSelectCropForDetails(crop);
                              }}
                            >
                              <span>{t("marketplace.card.viewDetails")}</span>
                              <ArrowRight size={13} />
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
        </div>
      </div>
    </div>
  );
}

export default FarmerProfileModal;
