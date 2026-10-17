import { useEffect, useState, useCallback } from "react";
import {
  ShoppingCart,
  X,
  Search,
  MapPin,
  ShieldCheck,
  MessageSquare,
  Building,
  RefreshCw,
  Calendar
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { apiUrl } from "../config/api";

export function BuyerDirectoryModal({
  currentUser,
  onClose,
  onStartChatWithBuyer,
  onRequestLogin
}) {
  const { t, language } = useLanguage();
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [businessType, setBusinessType] = useState("All");

  const fetchBuyers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      const res = await fetch(apiUrl(`/api/buyers?${params.toString()}`));
      if (res.ok) {
        const data = await res.json();
        setBuyers(data || []);
      }
    } catch (err) {
      console.warn("Could not fetch buyers:", err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchBuyers();
  }, [fetchBuyers]);

  const filteredBuyers = buyers.filter((buyer) => {
    if (businessType === "All") return true;
    return buyer.businessType === businessType;
  });

  function formatJoinDate(dateStr) {
    if (!dateStr) return "";
    try {
      const locale = language === "te" ? "te-IN" : language === "hi" ? "hi-IN" : "en-IN";
      return new Date(dateStr).toLocaleDateString(locale, {
        month: "short",
        year: "numeric"
      });
    } catch {
      return dateStr;
    }
  }

  return (
    <div className="modal-backdrop-modern" onClick={onClose}>
      <div
        className="modal-window buyer-directory-modal-window"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-round" onClick={onClose} aria-label="Close buyer directory">
          <X size={18} />
        </button>

        <div className="modal-inner-scroll">
          <div className="modal-title-bar">
            <div className="modal-title-icon-box blue">
              <ShoppingCart size={24} />
            </div>
            <div>
              <span className="modal-eyebrow">BUYER DIRECTORY · కొనుగోలుదారుల జాబితా</span>
              <h2>{t("buyerDiscovery.title")}</h2>
              <p>{t("buyerDiscovery.subtitle")}</p>
            </div>
          </div>

          {/* Privacy Guarantee Ribbon */}
          <div className="buyer-privacy-ribbon">
            <ShieldCheck size={16} />
            <span>{t("buyerDiscovery.safeNotice")}</span>
          </div>

          {/* Search & Filter Controls */}
          <div className="buyer-filter-row">
            <div className="search-input-group">
              <Search className="search-icon-inside" size={18} />
              <input
                type="text"
                className="search-field"
                placeholder={t("buyerDiscovery.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="type-select-wrap">
              <Building size={16} className="type-icon" />
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="control-select"
              >
                <option value="All">{t("buyerDiscovery.allTypes")}</option>
                <option value="Wholesale Trader">{t("buyerDiscovery.wholesale")}</option>
                <option value="Retail Grocery">{t("buyerDiscovery.retail")}</option>
                <option value="Grain Miller / Processor">{t("buyerDiscovery.miller")}</option>
                <option value="Individual Buyer">{t("buyerDiscovery.individual")}</option>
              </select>
            </div>
          </div>

          {/* Buyers Grid */}
          {loading ? (
            <div className="state-box loading-box">
              <RefreshCw className="spinner-icon" size={32} />
              <h3>Loading verified buyer directory...</h3>
            </div>
          ) : filteredBuyers.length === 0 ? (
            <div className="state-box empty-box">
              <ShoppingCart size={36} />
              <p>{t("buyerDiscovery.noBuyers")}</p>
            </div>
          ) : (
            <div className="buyers-grid-modern">
              {filteredBuyers.map((buyer) => (
                <div className="buyer-card-modern" key={buyer._id}>
                  <div className="buyer-card-top">
                    <div className="buyer-avatar-box">🛒</div>
                    <div className="buyer-card-meta">
                      <h4>{buyer.name}</h4>
                      <span className="buyer-trade-badge">
                        {buyer.businessType || "Verified Produce Buyer"}
                      </span>
                    </div>
                  </div>

                  <div className="buyer-details-list">
                    <div className="detail-item">
                      <MapPin size={13} />
                      <span>{buyer.location || "Andhra Pradesh"}</span>
                    </div>
                    <div className="detail-item">
                      <Calendar size={13} />
                      <span>Member since {formatJoinDate(buyer.createdAt)}</span>
                    </div>
                  </div>

                  {buyer.bio && (
                    <p className="buyer-bio-snippet">"{buyer.bio}"</p>
                  )}

                  <div className="buyer-card-action">
                    <button
                      type="button"
                      className="btn-buyer-chat"
                      onClick={() => {
                        onClose();
                        if (!currentUser) {
                          onRequestLogin();
                        } else {
                          onStartChatWithBuyer(buyer);
                        }
                      }}
                    >
                      <MessageSquare size={14} />
                      <span>{t("buyerDiscovery.sendOffer")}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BuyerDirectoryModal;
