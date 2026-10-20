import React, { useState, useMemo } from "react";
import {
  Tractor,
  RefreshCw,
  MapPin,
  Eye,
  Search,
  X,
  ArrowUpDown,
  Users,
  Package
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function FarmerDiscoveryView({
  farmersList = [],
  farmersLoading = false,
  onRefreshFarmers,
  onOpenFarmerProfile
}) {
  const { t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // 'all' | 'with-crops' | 'popular'
  const [sortBy, setSortBy] = useState("default"); // 'default' | 'crops-desc' | 'followers-desc' | 'name-asc'

  // Counts for filter pills
  const withCropsCount = useMemo(() => {
    if (!Array.isArray(farmersList)) return 0;
    return farmersList.filter((f) => (f.crops?.length || 0) > 0).length;
  }, [farmersList]);

  const popularCount = useMemo(() => {
    if (!Array.isArray(farmersList)) return 0;
    return farmersList.filter((f) => (f.followersCount || f.followers?.length || 0) > 0).length;
  }, [farmersList]);

  // Filtered and sorted farmers
  const filteredFarmers = useMemo(() => {
    if (!Array.isArray(farmersList)) return [];
    let list = [...farmersList];

    // Search query filter (matches name, location, bio, crop names)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((f) => {
        const name = (f.name || "").toLowerCase();
        const location = (f.location || "").toLowerCase();
        const bio = (f.bio || "").toLowerCase();
        const cropNames = Array.isArray(f.crops)
          ? f.crops.map((c) => (typeof c === "object" ? c.name || "" : "")).join(" ").toLowerCase()
          : "";
        return (
          name.includes(q) ||
          location.includes(q) ||
          bio.includes(q) ||
          cropNames.includes(q)
        );
      });
    }

    // Category / quick filter
    if (filterType === "with-crops") {
      list = list.filter((f) => (f.crops?.length || 0) > 0);
    } else if (filterType === "popular") {
      list = list.filter((f) => (f.followersCount || f.followers?.length || 0) > 0);
    }

    // Sorting
    if (sortBy === "crops-desc") {
      list.sort((a, b) => (b.crops?.length || 0) - (a.crops?.length || 0));
    } else if (sortBy === "followers-desc") {
      const countA = a.followersCount || a.followers?.length || 0;
      const countB = b.followersCount || b.followers?.length || 0;
      list.sort((a, b) => countB - countA);
    } else if (sortBy === "name-asc") {
      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }

    return list;
  }, [farmersList, searchQuery, filterType, sortBy]);

  const isFiltered = searchQuery.trim() !== "" || filterType !== "all";

  return (
    <main className="discovery-page-view" id="farmers">
      <div className="section-container">
        {/* Top Header Row */}
        <div className="discovery-header-row">
          <div>
            <div className="market-badge">
              <Tractor size={15} />
              <span>{t("nav.farmers") || "Farmer Discovery"}</span>
            </div>
            <h2>{t("nav.farmers") || "Farmer Discovery"}</h2>
            <p>Browse and connect directly with verified farmers and producers across Andhra Pradesh.</p>
          </div>
          <button className="btn-dashboard-refresh" onClick={onRefreshFarmers} title="Refresh Farmers">
            <RefreshCw size={15} />
            <span>{t("buyerDashboard.refresh") || "Refresh"}</span>
          </button>
        </div>

        {/* Search & Discovery Toolbar */}
        {!farmersLoading && farmersList.length > 0 && (
          <div className="discovery-toolbar">
            <div className="discovery-search-row">
              {/* Search Input Bar */}
              <div className="discovery-search-wrap">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  className="discovery-search-input"
                  placeholder="Search farmers by name, location, or crop bio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search farmers"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="btn-clear-discovery-search"
                    onClick={() => setSearchQuery("")}
                    title="Clear search"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Sort Selector */}
              <div className="discovery-sort-wrap">
                <ArrowUpDown size={14} className="sort-icon" />
                <select
                  className="discovery-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort farmers"
                >
                  <option value="default">Sort: Default</option>
                  <option value="crops-desc">Most Crops Listed</option>
                  <option value="followers-desc">Most Followers</option>
                  <option value="name-asc">Name (A - Z)</option>
                </select>
              </div>
            </div>

            {/* Quick Filter Pills & Count Strip */}
            <div className="discovery-filters-strip">
              <div className="discovery-filter-pills" role="tablist" aria-label="Filter farmers">
                <button
                  type="button"
                  className={`discovery-pill-btn ${filterType === "all" ? "active" : ""}`}
                  onClick={() => setFilterType("all")}
                >
                  All Farmers ({farmersList.length})
                </button>
                <button
                  type="button"
                  className={`discovery-pill-btn ${filterType === "with-crops" ? "active" : ""}`}
                  onClick={() => setFilterType("with-crops")}
                >
                  With Crops ({withCropsCount})
                </button>
                <button
                  type="button"
                  className={`discovery-pill-btn ${filterType === "popular" ? "active" : ""}`}
                  onClick={() => setFilterType("popular")}
                >
                  Popular Growers ({popularCount})
                </button>
              </div>

              <div className="discovery-count-badge">
                <span>
                  Showing <strong>{filteredFarmers.length}</strong> of <strong>{farmersList.length}</strong> farmers
                </span>
                {isFiltered && (
                  <button
                    type="button"
                    className="discovery-clear-link"
                    onClick={() => {
                      setSearchQuery("");
                      setFilterType("all");
                    }}
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        {farmersLoading ? (
          <div className="state-box loading-box">
            <RefreshCw className="spinner-icon" size={28} />
            <h3>{t("marketplace.loadingTitle") || "Loading farmers..."}</h3>
          </div>
        ) : farmersList.length === 0 ? (
          <div className="state-box empty-box">
            <div className="empty-icon-circle">🧑‍🌾</div>
            <h3>No farmers found</h3>
            <p>Registered farmers will appear here as they join the platform.</p>
          </div>
        ) : filteredFarmers.length === 0 ? (
          <div className="discovery-empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No farmers matched your search</h3>
            <p>
              {searchQuery
                ? `No farmer profiles matched "${searchQuery}". Try searching by another district or produce name.`
                : "No farmers match the selected filter."}
            </p>
            <button
              type="button"
              className="btn-reset-discovery"
              onClick={() => {
                setSearchQuery("");
                setFilterType("all");
              }}
            >
              Clear Search & Show All
            </button>
          </div>
        ) : (
          <div className="farmers-discovery-grid">
            {filteredFarmers.map((farmer) => (
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
