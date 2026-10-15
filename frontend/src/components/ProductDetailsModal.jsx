import {
  X,
  MapPin,
  CheckCircle2,
  Tractor,
  MessageSquare,
  ShieldCheck,
  Scale,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

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

  return (
    <div className="modal-backdrop-modern" onClick={onClose}>
      <div
        className="modal-window product-details-modal-window"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-round" onClick={onClose} aria-label="Close product details">
          <X size={18} />
        </button>

        <div className="modal-inner-scroll">
          {/* PRODUCT BANNER */}
          <div className="product-details-banner">
            <div className="product-banner-badges">
              <span className="pill-category">{localizedCategory}</span>
              {isOwner ? (
                <span className="pill-owner">{t("marketplace.card.yourListing")}</span>
              ) : (
                <span className="pill-fresh">{t("marketplace.card.freshStock")}</span>
              )}
            </div>

            <div className="product-banner-subtag">
              <span>{translatedTag}</span>
            </div>
          </div>

          <div className="product-details-body">
            {/* TITLE & LOCATION */}
            <div className="product-header-block">
              <h2>{crop.name}</h2>
              <div className="product-location-pill">
                <MapPin size={15} />
                <span>{crop.location}</span>
              </div>
            </div>

            {/* FARMER ATTRIBUTION BOX */}
            <div className="product-farmer-box">
              <div className="farmer-left">
                <div className="farmer-avatar-circle">🧑‍🌾</div>
                <div>
                  <h4>{crop.farmerName || t("marketplace.card.verifiedLocalFarmer")}</h4>
                  <span className="verified-status">
                    <CheckCircle2 size={13} /> {t("marketplace.card.verifiedGrower")}
                  </span>
                </div>
              </div>

              {crop.farmer && (
                <button
                  type="button"
                  className="btn-view-farmer-link"
                  onClick={() => {
                    const farmerId = typeof crop.farmer === "object" ? crop.farmer._id : crop.farmer;
                    onOpenFarmerProfile(farmerId);
                  }}
                >
                  <Tractor size={15} />
                  <span>View Farmer Profile</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>

            {/* SPECIFICATIONS GRID */}
            <div className="product-specs-grid">
              <div className="product-spec-card">
                <span className="spec-lbl">{t("productDetails.ratePerUnit")}</span>
                <div className="spec-price-huge">
                  <span className="currency">₹</span>
                  <strong>{crop.price}</strong>
                  <span className="unit">/{localizedUnit}</span>
                </div>
              </div>

              <div className="product-spec-card">
                <span className="spec-lbl">{t("productDetails.availableStock")}</span>
                <div className="spec-val-highlight">
                  <strong>{crop.quantity}</strong>
                  <span>{localizedUnit}</span>
                </div>
              </div>

              {totalVal && (
                <div className="product-spec-card span-2">
                  <Scale size={18} className="scale-icon" />
                  <div>
                    <span className="spec-lbl">{t("productDetails.estimatedTotal")}</span>
                    <strong className="spec-total-val">~₹{totalVal}</strong>
                    <small>({crop.quantity} {localizedUnit} × ₹{crop.price})</small>
                  </div>
                </div>
              )}
            </div>

            {/* HARVEST & QUALITY NOTES */}
            {crop.description && (
              <div className="product-notes-box">
                <h4>{t("productDetails.harvestNotes")}</h4>
                <p>"{crop.description}"</p>
              </div>
            )}

            {/* TRUST & ZERO COMMISSION GUARANTEE */}
            <div className="product-trust-strip">
              <ShieldCheck size={18} />
              <span>{t("productDetails.guaranteed")}</span>
            </div>

            {/* ACTION BUTTONS */}
            {isOwner ? (
              <div className="owner-warning-box">
                <Sparkles size={16} />
                <span>{t("productDetails.ownCropWarning")}</span>
              </div>
            ) : (
              <div className="product-actions-cluster">
                <button
                  type="button"
                  className="btn-product-enquire"
                  onClick={() => {
                    onClose();
                    onOpenEnquiry(crop);
                  }}
                >
                  <MessageSquare size={17} />
                  <span>{t("productDetails.sendEnquiry")}</span>
                </button>

                <button
                  type="button"
                  className="btn-product-chat"
                  onClick={() => {
                    onClose();
                    const farmerObj = typeof crop.farmer === "object"
                      ? crop.farmer
                      : { _id: crop.farmer, name: crop.farmerName, role: "Farmer" };
                    onStartChatWithFarmer(farmerObj, crop);
                  }}
                >
                  <span>{t("productDetails.startChat")}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailsModal;
