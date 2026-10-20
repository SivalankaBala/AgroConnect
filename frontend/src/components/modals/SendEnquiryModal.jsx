import React, { useState } from "react";
import { MessageSquare, X } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { getCropVisualTheme } from "../../utils/formatters";

export default function SendEnquiryModal({
  isOpen,
  selectedCrop,
  currentUser,
  onClose,
  onSubmitEnquiry
}) {
  const { t } = useLanguage();
  const [enquiryMessage, setEnquiryMessage] = useState("");

  if (!isOpen || !selectedCrop) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmitEnquiry) {
      onSubmitEnquiry(e, enquiryMessage);
    }
  };

  const cropVisual = getCropVisualTheme(selectedCrop.name, selectedCrop.category);

  return (
    <div className="modal-backdrop-modern" onClick={onClose}>
      <div
        className="modal-window"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-round" onClick={onClose} aria-label="Close dialog">
          <X size={18} />
        </button>

        <div className="modal-inner-scroll">
          <div className="modal-title-bar">
            <div className="modal-title-icon-box green">
              <MessageSquare size={22} />
            </div>
            <div>
              <span className="modal-eyebrow">{t("enquiryModal.eyebrow")}</span>
              <h2>{t("enquiryModal.title")}</h2>
              <p>{t("enquiryModal.subtitle")}</p>
            </div>
          </div>

          {/* Crop summary card inside modal */}
          <div className="enquiry-crop-preview-box">
            <div className="preview-emoji">{cropVisual.emoji}</div>
            <div className="preview-details">
              <h4>{selectedCrop.name}</h4>
              <span className="preview-location">
                📍 {selectedCrop.location} · {t("enquiryModal.grower")} {selectedCrop.farmerName || t("marketplace.card.verifiedLocalFarmer")}
              </span>
              <div className="preview-price-tag">
                <strong>₹{selectedCrop.price}</strong> /{t(`units.${selectedCrop.unit}`) || selectedCrop.unit || "kg"} · {t("enquiryModal.stock")} {selectedCrop.quantity} {t(`units.${selectedCrop.unit}`) || selectedCrop.unit || "kg"}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="modern-form">
            <div className="form-group">
              <label htmlFor="buyerNameInput">{t("enquiryModal.yourName")}</label>
              <input
                id="buyerNameInput"
                name="buyerName"
                required
                defaultValue={currentUser?.name || ""}
                placeholder={t("enquiryModal.yourNamePlaceholder")}
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="contactInput">{t("enquiryModal.contactPhone")}</label>
                <input
                  id="contactInput"
                  name="contact"
                  required
                  defaultValue={currentUser?.email || ""}
                  placeholder={t("enquiryModal.contactPlaceholder")}
                />
              </div>

              <div className="form-group">
                <label htmlFor="qtyInput">
                  {t("enquiryModal.quantityNeeded", { unit: t(`units.${selectedCrop.unit}`) || selectedCrop.unit || "kg" })}
                </label>
                <input
                  id="qtyInput"
                  name="quantity"
                  required
                  placeholder={t("enquiryModal.quantityPlaceholder", { unit: t(`units.${selectedCrop.unit}`) || selectedCrop.unit || "kg" })}
                />
              </div>
            </div>

            {/* Quick message suggestions */}
            <div className="quick-template-row">
              <span className="template-label">{t("enquiryModal.quickSuggestions")}</span>
              <div className="template-buttons">
                <button
                  type="button"
                  onClick={() => setEnquiryMessage(t("enquiryModal.templateBulk"))}
                >
                  {t("enquiryModal.templateBulkBtn")}
                </button>
                <button
                  type="button"
                  onClick={() => setEnquiryMessage(t("enquiryModal.templateSample"))}
                >
                  {t("enquiryModal.templateSampleBtn")}
                </button>
                <button
                  type="button"
                  onClick={() => setEnquiryMessage(t("enquiryModal.templatePickup"))}
                >
                  {t("enquiryModal.templatePickupBtn")}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="enquiryMsgInput">{t("enquiryModal.messageLabel")}</label>
              <textarea
                id="enquiryMsgInput"
                name="message"
                rows="3"
                value={enquiryMessage}
                onChange={(e) => setEnquiryMessage(e.target.value)}
                placeholder={t("enquiryModal.messagePlaceholder")}
              />
            </div>

            <div className="form-actions-row">
              <button type="submit" className="btn-modal-submit green">
                <MessageSquare size={18} />
                <span>{t("enquiryModal.sendBtn")}</span>
              </button>
              <button type="button" className="btn-modal-cancel" onClick={onClose}>
                {t("enquiryModal.cancelBtn")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
