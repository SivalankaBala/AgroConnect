import React from "react";
import {
  Tractor,
  RefreshCw,
  MapPin,
  Eye
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function FarmerDiscoveryView({
  farmersList = [],
  farmersLoading = false,
  onRefreshFarmers,
  onOpenFarmerProfile
}) {
  const { t } = useLanguage();

  return (
    <main className="discovery-page-view" id="farmers">
      <div className="section-container">
        <div className="discovery-header-row">
          <div>
            <div className="market-badge">
              <Tractor size={15} />
              <span>{t("nav.farmers") || "Farmer Discovery"}</span>
            </div>
            <h2>{t("nav.farmers") || "Farmer Discovery"}</h2>
            <p>Browse fellow farmers and producers across Andhra Pradesh.</p>
          </div>
          <button className="btn-dashboard-refresh" onClick={onRefreshFarmers} title="Refresh Farmers">
            <RefreshCw size={15} />
            <span>{t("buyerDashboard.refresh") || "Refresh"}</span>
          </button>
        </div>

        {farmersLoading ? (
          <div className="state-box loading-box">
            <RefreshCw className="spinner-icon" size={28} />
            <h3>{t("marketplace.loadingTitle")}</h3>
          </div>
        ) : farmersList.length === 0 ? (
          <div className="state-box empty-box">
            <div className="empty-icon-circle">🧑‍🌾</div>
            <h3>No farmers found</h3>
            <p>Registered farmers will appear here as they join the platform.</p>
          </div>
        ) : (
          <div className="farmers-discovery-grid">
            {farmersList.map((farmer) => (
              <div className="farmer-discovery-card" key={farmer._id}>
                <div className="farmer-card-top">
                  <div className="farmer-avatar-circle">
                    {farmer.avatar ? (
                      <img src={farmer.avatar} alt={farmer.name} />
                    ) : (
                      <span>{farmer.name ? farmer.name.charAt(0).toUpperCase() : "F"}</span>
                    )}
                  </div>
                  <div className="farmer-card-title-group">
                    <h4>{farmer.name}</h4>
                    <span className="farmer-location-tag">
                      <MapPin size={12} />
                      {farmer.location || "Andhra Pradesh, India"}
                    </span>
                  </div>
                </div>

                <p className="farmer-card-bio">
                  {farmer.bio || "Local farmer cultivating produce in Andhra Pradesh."}
                </p>

                <div className="farmer-card-stats-row">
                  <div className="farmer-stat">
                    <strong>{farmer.crops?.length || 0}</strong>
                    <span>Crops Listed</span>
                  </div>
                  <div className="farmer-stat">
                    <strong>{farmer.followersCount || farmer.followers?.length || 0}</strong>
                    <span>Followers</span>
                  </div>
                </div>

                <div className="farmer-card-actions">
                  <button
                    type="button"
                    className="btn-farmer-view"
                    onClick={() => onOpenFarmerProfile(farmer._id)}
                  >
                    <Eye size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
                    <span>View Profile</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
