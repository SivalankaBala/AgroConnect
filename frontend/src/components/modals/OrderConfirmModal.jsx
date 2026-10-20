import React from "react";
import {
  X,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Check
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function OrderConfirmModal({
  isOpen,
  action, // 'confirm' | 'reject'
  enquiry,
  processing = false,
  onClose,
  onConfirmAction
}) {
  const { t } = useLanguage();

  if (!isOpen || !enquiry) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-container modal-order-confirm">
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-eyebrow">
              {action === "confirm" ? "Order Action" : "Order Action"}
            </span>
            <h3 className="modal-title">
              {action === "confirm"
                ? (t("farmerDashboard.confirmOrderModalTitle") || "Confirm Buyer Order?")
                : (t("farmerDashboard.rejectOrderModalTitle") || "Reject Buyer Order?")}
            </h3>
          </div>
          <button
            className="btn-modal-close"
            onClick={() => !processing && onClose()}
            disabled={processing}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className={`order-confirm-warning-box ${action}`}>
            {action === "confirm" ? (
              <CheckCircle2 size={30} className="warning-icon green" />
            ) : (
              <XCircle size={30} className="warning-icon red" />
            )}
            <div className="warning-copy">
              <p className="warning-main-text">
                {action === "confirm"
                  ? (t("farmerDashboard.confirmOrderPrompt") || "Are you sure you want to confirm this order?")
                  : (t("farmerDashboard.rejectOrderPrompt") || "Are you sure you want to reject this order?")}
              </p>
              <p className="warning-sub-text">
                {action === "confirm"
                  ? (t("farmerDashboard.confirmOrderBuyerNote", {
                      buyer: enquiry.buyerName,
                      crop: enquiry.crop?.name || "crop"
                    }) || "The buyer will be instantly notified that their order has been confirmed.")
                  : (t("farmerDashboard.rejectOrderBuyerNote", {
                      buyer: enquiry.buyerName,
                      crop: enquiry.crop?.name || "crop"
                    }) || "The buyer will be notified that this order could not be accepted.")}
              </p>
            </div>
          </div>

          <div className="order-summary-cardlet">
            <div className="summary-row">
              <span className="summary-label">{t("farmerDashboard.cropLabel") || "Crop"}:</span>
              <span className="summary-val">🌾 {enquiry.crop?.name || "Crop"}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">{t("farmerDashboard.buyerLabel")}:</span>
              <span className="summary-val">{enquiry.buyerName}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">{t("farmerDashboard.contactLabel")}:</span>
              <span className="summary-val">{enquiry.buyerEmail}</span>
            </div>
            {enquiry.message && (
              <div className="summary-requirement">
                <span className="summary-label">{t("farmerDashboard.buyerMessageLabel")}:</span>
                <p className="summary-msg">{enquiry.message}</p>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn-modal-cancel"
            onClick={onClose}
            disabled={processing}
          >
            {t("buttons.cancel") || "Cancel"}
          </button>
          <button
            type="button"
            className={`btn-modal-submit ${action === "confirm" ? "green" : "red"}`}
            onClick={onConfirmAction}
            disabled={processing}
          >
            {processing ? (
              <>
                <RefreshCw size={16} className="spinner-icon" />
                <span>Processing...</span>
              </>
            ) : action === "confirm" ? (
              <>
                <Check size={16} />
                <span>{t("farmerDashboard.confirmOrder") || "Confirm Order"}</span>
              </>
            ) : (
              <>
                <X size={16} />
                <span>{t("farmerDashboard.rejectOrder") || "Reject Order"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
