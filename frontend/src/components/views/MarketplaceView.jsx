import React from "react";
import {
  Search,
  SlidersHorizontal,
  AlertCircle,
  RefreshCw,
  MapPin,
  CheckCircle2,
  ShoppingCart,
  Edit2,
  ArrowRight,
  Plus,
  X
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import LocationSelector from "../LocationSelector";
import { getCropPhotoUrl } from "../../utils/formatters";

export default function MarketplaceView({
  search,
  setSearch,
  category,
  setCategory,
  categories = [],
  locationFilter,
  setLocationFilter,
  availableLocations = [],
  sortBy,
  setSortBy,
  loading = false,
  cropsError = "",
  fetchCrops,
  filteredCrops = [],
  crops = [],
  currentUser,
  openListingModal,
  openFarmerDashboard,
  handleOpenProductDetails,
  handleOpenFarmerProfile
}) {
  const { t } = useLanguage();

  return (
    <main className="marketplace-section" id="marketplace">
      <div className="section-container">
        {/* HERO AREA (Large friendly heading & prominent search bar) */}
        <div className="marketplace-hero-area">
          <h1 className="marketplace-main-title">
            Fresh from the farm to your business
          </h1>
          <p className="marketplace-main-subtitle">
            {t("marketplace.subtitle") || "Directly sourced from verified regional growers in Andhra Pradesh. Zero middlemen."}
          </p>

          {/* PROMINENT SEARCH BAR (Seamless borderless, saffron search button) */}
          <div className="prominent-search-bar">
            <div className="search-input-wrapper">
              <input
                type="text"
                className="prominent-search-input"
                placeholder={t("marketplace.searchPlaceholder") || "Search fresh crops (e.g. Paddy, Guntur Chillies, Sweet Corn, Tomatoes)..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search crops"
                style={{
                  border: "none",
                  outline: "none",
                  boxShadow: "none",
                  background: "transparent"
                }}
              />
              {search && (
                <button className="search-clear-action" onClick={() => setSearch("")} aria-label="Clear search">
                  <X size={16} />
                </button>
              )}
            </div>
            <button type="button" className="btn-search-saffron" aria-label="Search button">
              <Search size={16} />
              <span>Search</span>
            </button>
          </div>
        </div>

        {/* FILTERS AREA: Horizontal pills for categories, location/sort dropdowns on same row, plain muted text count */}
        <div className="marketplace-filter-section">
          {/* CATEGORY PILL CHIPS */}
          <div className="category-pill-track" role="tablist">
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`filter-pill-chip ${category === cat.id ? "active" : ""}`}
                onClick={() => setCategory(cat.id)}
                role="tab"
                aria-selected={category === cat.id}
              >
                <span className="pill-icon">{cat.icon}</span>
                <span className="pill-text">{cat.label}</span>
              </button>
            ))}
          </div>

          {/* COMPACT CONTROLS ROW */}
          <div className="compact-filter-row">
            <div className="dropdowns-group">
              <LocationSelector
                value={locationFilter}
                onChange={setLocationFilter}
                availableLocations={availableLocations}
                t={t}
              />

              <div className="compact-sort-dropdown">
                <SlidersHorizontal size={14} className="control-icon" />
                <select
                  id="sortSelect"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-dropdown-select"
                  aria-label={t("marketplace.sortByLabel")}
                >
                  <option value="featured">{t("marketplace.sortFeatured")}</option>
                  <option value="price-asc">{t("marketplace.sortPriceAsc")}</option>
                  <option value="price-desc">{t("marketplace.sortPriceDesc")}</option>
                  <option value="qty-desc">{t("marketplace.sortQtyDesc")}</option>
                </select>
              </div>
            </div>

            {/* Plain muted count text, not a boxed badge */}
            <div className="plain-crop-count">
              <span>{filteredCrops.length} {t("marketplace.cropsAvailable") || "crops available"}</span>
            </div>
          </div>
        </div>

        {/* CROPS GRID */}
        {loading ? (
          <div className="crops-grid">
            {[1, 2, 3, 4].map((item) => (
              <div className="crop-card-skeleton" key={item}>
                <div className="skeleton-photo-box" />
                <div className="skeleton-content-box">
                  <div className="skeleton-bar skeleton-title" />
                  <div className="skeleton-bar skeleton-location" />
                  <div className="skeleton-bar skeleton-farmer" />
                  <div className="skeleton-row-split">
                    <div className="skeleton-bar skeleton-price" />
                    <div className="skeleton-bar skeleton-qty" />
                  </div>
                  <div className="skeleton-bar skeleton-button" />
                </div>
              </div>
            ))}
          </div>
        ) : cropsError ? (
          <div className="state-box error-box">
            <AlertCircle size={32} />
            <h3>{t("marketplace.loadErrorTitle")}</h3>
            <p>{cropsError}</p>
            <div className="empty-actions">
              <button className="btn-reset-filters" onClick={fetchCrops}>
                <RefreshCw size={15} /> {t("marketplace.retryBtn")}
              </button>
            </div>
          </div>
        ) : filteredCrops.length > 0 ? (
          <div className="crops-grid">
            {filteredCrops.map((crop, index) => {
              const isOwner =
                currentUser &&
                (crop.farmer === currentUser.id ||
                  crop.farmer?._id === currentUser.id ||
                  crop.farmer === currentUser._id);

              const localizedUnit = t(`units.${crop.unit}`) || crop.unit || "kg";
              const photoUrl = getCropPhotoUrl(crop);

              return (
                <article className="crop-card-modern" key={crop._id || index}>
                  {/* Real Crop Photo: 4:3 Ratio, Hover Zoom, Rounded Top */}
                  <div className="crop-photo-wrap">
                    <img
                      src={photoUrl}
                      alt={crop.name}
                      className="crop-card-photo"
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/crops/default.svg";
                      }}
                    />
                    {/* Owner badge on image corner if current user */}
                    {isOwner && (
                      <div className="crop-card-badge-tag">
                        <span className="badge-tag-owner">🧑‍🌾 {t("marketplace.card.yourListing") || "Your Listing"}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Details Body */}
                  <div className="crop-card-details">
                    {/* Crop Name (18px, bold) */}
                    <h3 className="crop-title-heading">{crop.name}</h3>

                    {/* Location with Pin Icon */}
                    <div className="crop-location-row">
                      <MapPin size={13} className="pin-icon-warm" />
                      <span>{crop.location}</span>
                    </div>

                    {/* Farmer name with small green Verified tick */}
                    <div
                      className="crop-farmer-row clickable"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (crop.farmer) {
                          handleOpenFarmerProfile(crop.farmer._id || crop.farmer);
                        }
                      }}
                      title={crop.farmer ? t("farmerProfile.viewProfileBtn") : ""}
                      role="button"
                      tabIndex={0}
                    >
                      <span className="farmer-name-text">🧑‍🌾 {crop.farmerName || t("marketplace.card.verifiedLocalFarmer")}</span>
                      <span className="verified-badge-inline">
                        <CheckCircle2 size={12} className="verified-check-icon" />
                        <span>Verified</span>
                      </span>
                    </div>

                    {/* Price & Quantity Available */}
                    <div className="crop-price-stock-row">
                      <div className="crop-price-display">
                        <span className="currency-sign">₹</span>
                        <span className="price-bold">{crop.price}</span>
                        <span className="price-unit-tag">/{localizedUnit}</span>
                      </div>
                      <div className="crop-stock-display">
                        <span>{crop.quantity} {localizedUnit} available</span>
                      </div>
                    </div>

                    {/* ONE Primary Button: "View / Buy" (or "Manage Listing" if owner) */}
                    <div className="crop-action-single">
                      {isOwner ? (
                        <button
                          type="button"
                          className="btn-card-primary is-owner-btn"
                          onClick={openFarmerDashboard}
                          title={t("marketplace.card.manage") || "Manage Listing"}
                        >
                          <Edit2 size={15} />
                          <span>{t("marketplace.card.manage") || "Manage Listing"}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-card-primary"
                          onClick={() => handleOpenProductDetails(crop)}
                          title="View / Buy"
                          aria-label={`View or Buy ${crop.name}`}
                        >
                          <ShoppingCart size={15} />
                          <span>View / Buy</span>
                          <ArrowRight size={14} className="btn-arrow-icon" />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : crops.length === 0 ? (
          <div className="state-box empty-box">
            <div className="empty-icon-circle">🌱</div>
            <h3>{t("marketplace.noListingsTitle")}</h3>
            <p>{t("marketplace.noListingsDesc")}</p>
            {currentUser?.role === "Farmer" && (
              <div className="empty-actions">
                <button className="btn-add-crop-accent" onClick={openListingModal}>
                  <Plus size={16} /> {t("marketplace.addCropBtn")}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="state-box empty-box">
            <div className="empty-icon-circle">🌱</div>
            <h3>
              {locationFilter !== "All"
                ? (t("marketplace.noCropsInLocation") || "No crops found in this location.")
                : t("marketplace.emptyTitle")}
            </h3>
            <p>
              {locationFilter !== "All"
                ? (t("marketplace.noCropsInLocationDesc", { location: locationFilter }) ||
                  `No crops currently listed in "${locationFilter}". Try switching to "All Locations" or adjusting other filters.`)
                : t("marketplace.emptyDesc", { query: search, location: locationFilter === "All" ? t("marketplace.allLocations") : locationFilter })}
            </p>
            <div className="empty-actions">
              {locationFilter !== "All" && (
                <button
                  className="btn-reset-filters btn-reset-location-primary"
                  onClick={() => setLocationFilter("All")}
                >
                  <MapPin size={15} /> {t("marketplace.viewAllLocations") || "View All Locations"}
                </button>
              )}
              <button
                className="btn-reset-filters"
                onClick={() => {
                  setSearch("");
                  setCategory("All");
                  setLocationFilter("All");
                }}
              >
                {t("marketplace.clearFiltersBtn")}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
