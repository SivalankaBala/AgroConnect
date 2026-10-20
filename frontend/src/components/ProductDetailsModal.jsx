import {
  X,
  MapPin,
  CheckCircle2,
  Tractor,
  MessageSquare,
  ShieldCheck,
  Scale,
  Sparkles,
  ArrowRight,
  Package,
  Layers
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { getCropPhotoUrl } from "../utils/cropImage";

export function ProductDetailsModal({
  crop,
  currentUser,
  onClose,
  onOpenEnquiry,
  onStartChatWithFarmer,
  onOpenFarmerProfile
}) {
  const { t, getCropDisplayTag } = useLanguage();

  if (!crop) return null;

  const isOwner =
    currentUser &&
    (crop.farmer === currentUser.id ||
      crop.farmer?._id === currentUser.id ||
      crop.farmer === currentUser._id);

  const totalVal =
    crop.price && crop.quantity
      ? (crop.price * crop.quantity).toLocaleString("en-IN")
      : null;

  const translatedTag = getCropDisplayTag(crop.name, crop.category);
  const localizedUnit = t(`units.${crop.unit}`) || crop.unit || "kg";
  const localizedCategory = t(`categories.${crop.category}`) || crop.category;
  const photoUrl = getCropPhotoUrl(crop);

  return (
    <div className="modal-backdrop-modern" onClick={onClose}>
      <div
        className="modal-window product-details-modal-window"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP HEADER BAR: Badges & Close Button aligned cleanly without overlaps */}
        <div className="product-modal-topbar">
          <div className="product-modal-badges">
            <span className="pill-category">{localizedCategory}</span>
            {translatedTag && (
              <span className="pill-subtag">{translatedTag}</span>
            )}
            {isOwner && (
              <span className="pill-owner">
                <Sparkles size={12} />
                <span>{t("marketplace.card.yourListing")}</span>
              </span>
            )}
          </div>

          <button
            type="button"
            className="modal-close-round product-modal-close-btn"
            onClick={onClose}
            aria-label="Close product details"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-inner-scroll product-modal-scroll">
          <div className="product-details-body">
            {/* PRODUCT TITLE & VISUAL SHOWCASE */}
            <div className="product-identity-showcase">
              <div className="product-visual-wrapper">
                <img
                  src={photoUrl}
                  alt={crop.name}
                  className="product-crop-visual"
                  onError={(e) => {
                    e.currentTarget.src = "/crops/default.svg";
                  }}
                />
              </div>

              <div className="product-title-col">
                <h2 id="product-modal-title" className="product-headline-title">
                  {crop.name}
                </h2>
                <div className="product-location-pill">
                  <MapPin size={14} className="location-pin-icon" />
                  <span>{crop.location}</span>
                </div>
              </div>
            </div>

            {/* FARMER ATTRIBUTION BOX */}
            <div className="product-farmer-box">
              <div className="farmer-left">
                <div className="farmer-avatar-circle">
                  <span className="farmer-avatar-emoji">🧑‍🌾</span>
                  <span className="farmer-verified-tick" title="Verified Producer">
                    <CheckCircle2 size={11} />
                  </span>
                </div>
                <div className="farmer-meta-text">
                  <h4 className="farmer-name-heading">
                    {crop.farmerName || t("marketplace.card.verifiedLocalFarmer")}
                  </h4>
                  <div className="verified-status">
                    <CheckCircle2 size={13} className="check-verified-icon" />
                    <span>{t("marketplace.card.verifiedGrower")}</span>
                  </div>
                </div>
              </div>

              {crop.farmer && (
                <button
                  type="button"
                  className="btn-view-farmer-link"
                  onClick={() => {
                    const farmerId =
                      typeof crop.farmer === "object" ? crop.farmer._id : crop.farmer;
                    onClose();
                    onOpenFarmerProfile(farmerId);
                  }}
                >
                  <Tractor size={15} />
                  <span>View Farmer Profile</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>

            {/* HIGH-VISIBILITY SPECIFICATIONS GRID */}
            <div className="product-specs-grid">
              {/* RATE CARD */}
              <div className="product-spec-card spec-card-rate">
                <div className="spec-card-header">
                  <span className="spec-lbl">{t("productDetails.ratePerUnit")}</span>
                  <span className="spec-badge-chip rate">Direct Rate</span>
                </div>
                <div className="spec-price-huge">
                  <span className="currency">₹</span>
                  <strong className="rate-value">{crop.price}</strong>
                  <span className="unit">/{localizedUnit}</span>
                </div>
              </div>

              {/* AVAILABLE STOCK CARD */}
              <div className="product-spec-card spec-card-stock">
                <div className="spec-card-header">
                  <span className="spec-lbl">{t("productDetails.availableStock")}</span>
                  <span className="spec-badge-chip stock">
                    <Package size={11} />
                    <span>In Stock</span>
                  </span>
                </div>
                <div className="spec-val-highlight">
                  <strong className="stock-value">{crop.quantity}</strong>
                  <span className="stock-unit">{localizedUnit}</span>
                </div>
              </div>

              {/* ESTIMATED BATCH TOTAL */}
              {totalVal && (
                <div className="product-spec-card estimated-total-card span-2">
                  <div className="estimated-icon-bubble">
                    <Scale size={20} />
                  </div>
                  <div className="estimated-content-col">
                    <div className="estimated-header-row">
                      <span className="spec-lbl estimated-lbl">
                        {t("productDetails.estimatedTotal")}
                      </span>
                      <span className="estimated-formula-tag">
                        {crop.quantity} {localizedUnit} × ₹{crop.price}
                      </span>
                    </div>
                    <div className="spec-total-val">~₹{totalVal}</div>
                  </div>
                </div>
              )}
            </div>

            {/* HARVEST & QUALITY NOTES */}
            {crop.description && (
              <div className="product-notes-box">
                <div className="notes-header-row">
                  <Sparkles size={14} className="notes-icon-sparkle" />
                  <h4>{t("productDetails.harvestNotes")}</h4>
                </div>
                <p className="notes-body-text">“{crop.description}”</p>
              </div>
            )}

            {/* TRUST & ZERO COMMISSION GUARANTEE */}
            <div className="product-trust-strip">
              <div className="trust-icon-badge">
                <ShieldCheck size={18} />
              </div>
              <div className="trust-text-block">
                <strong>{t("productDetails.guaranteed")}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* DEDICATED STICKY ACTION FOOTER (Always visible, reliable, never clipped) */}
        <div className="product-modal-footer">
          {isOwner ? (
            <div className="owner-warning-box">
              <Sparkles size={16} />
              <span>{t("productDetails.ownCropWarning")}</span>
            </div>
          ) : (
            <div className="product-actions-cluster">
              {/* Instant direct messaging CTA */}
              <button
                type="button"
                className="btn-product-chat"
                onClick={() => {
                  onClose();
                  const farmerObj =
                    typeof crop.farmer === "object"
                      ? crop.farmer
                      : { _id: crop.farmer, name: crop.farmerName, role: "Farmer" };
                  onStartChatWithFarmer(farmerObj, crop);
                }}
              >
                <MessageSquare size={17} />
                <span>{t("productDetails.startChat")}</span>
                <ArrowRight size={15} />
              </button>

              {/* Formal enquiry CTA */}
              <button
                type="button"
                className="btn-product-enquire"
                onClick={() => {
                  onClose();
                  onOpenEnquiry(crop);
                }}
              >
                <span>{t("productDetails.sendEnquiry")}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductDetailsModal;
