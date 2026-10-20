import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Edit2,
  Scale,
  Camera,
  Upload,
  CheckCircle2,
  RefreshCw,
  Trash2,
  Check
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function CropListingModal({
  isOpen,
  mode = "create", // 'create' | 'edit'
  initialData = null,
  categories = [],
  popularCropsSuggestions = [],
  onClose,
  onSubmit,
  onImageUpload
}) {
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    name: "",
    category: "Grains",
    unit: "kg",
    price: "",
    quantity: "",
    location: "",
    description: "",
    image: ""
  });

  useEffect(() => {
    if (initialData && mode === "edit") {
      setFormData({
        name: initialData.name || "",
        category: initialData.category || "Grains",
        unit: initialData.unit || "kg",
        price: initialData.price || "",
        quantity: initialData.quantity || "",
        location: initialData.location || "",
        description: initialData.description || "",
        image: initialData.image || ""
      });
    } else if (mode === "create") {
      setFormData({
        name: "",
        category: "Grains",
        unit: "kg",
        price: "",
        quantity: "",
        location: "",
        description: "",
        image: ""
      });
    }
  }, [initialData, mode, isOpen]);

  if (!isOpen) return null;

  const isEdit = mode === "edit";

  const estimatedBatchValue =
    Number(formData.price) > 0 && Number(formData.quantity) > 0
      ? (Number(formData.price) * Number(formData.quantity)).toLocaleString("en-IN")
      : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(e, formData);
    }
  };

  const handleFileChange = (e) => {
    if (onImageUpload) {
      onImageUpload(e, isEdit ? "edit" : "create", (imageUrl) => {
        setFormData((prev) => ({ ...prev, image: imageUrl }));
      });
    }
  };

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
            <div className={`modal-title-icon-box ${isEdit ? "amber" : "green"}`}>
              {isEdit ? <Edit2 size={22} /> : <Plus size={22} />}
            </div>
            <div>
              <span className="modal-eyebrow">
                {isEdit ? t("editModal.eyebrow") : t("listingModal.eyebrow")}
              </span>
              <h2>{isEdit ? t("editModal.title") : t("listingModal.title")}</h2>
              <p>
                {isEdit
                  ? t("editModal.subtitle", { name: formData.name })
                  : t("listingModal.subtitle")}
              </p>
            </div>
          </div>

          {/* Quick suggestions for Create mode */}
          {!isEdit && popularCropsSuggestions && popularCropsSuggestions.length > 0 && (
            <div className="suggestion-box">
              <span className="suggestion-label">{t("listingModal.quickPick")}</span>
              <div className="suggestion-chips">
                {popularCropsSuggestions.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    className="suggestion-chip-btn"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        name: item.name,
                        category: item.category,
                        unit: item.unit,
                        price: item.price
                      })
                    }
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="modern-form">
            <div className="form-group">
              <label htmlFor="cropName">
                {isEdit ? t("editModal.cropName") : t("listingModal.cropName")}
              </label>
              <input
                id="cropName"
                required
                placeholder={t("listingModal.cropNamePlaceholder")}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="cropCategory">
                  {isEdit ? t("editModal.category") : t("listingModal.category")}
                </label>
                <select
                  id="cropCategory"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {categories.filter((c) => c.id !== "All").map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="cropUnit">
                  {isEdit ? t("editModal.unit") : t("listingModal.unit")}
                </label>
                <select
                  id="cropUnit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                >
                  <option value="kg">{t("units.kgFull")}</option>
                  <option value="quintal">{t("units.quintalFull")}</option>
                  <option value="bag">{t("units.bagFull")}</option>
                  <option value="tonne">{t("units.tonneFull")}</option>
                </select>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="cropPrice">
                  {isEdit
                    ? t("editModal.price", { unit: t(`units.${formData.unit}`) || formData.unit })
                    : t("listingModal.pricePerUnit", { unit: t(`units.${formData.unit}`) || formData.unit })}
                </label>
                <input
                  id="cropPrice"
                  type="number"
                  min="0.1"
                  step="0.1"
                  required
                  placeholder={t("listingModal.pricePlaceholder")}
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="cropQty">
                  {isEdit ? t("editModal.availableQuantity") : t("listingModal.availableQuantity")}
                </label>
                <input
                  id="cropQty"
                  type="number"
                  min="1"
                  step="1"
                  required
                  placeholder={t("listingModal.qtyPlaceholder")}
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
              </div>
            </div>

            {/* LIVE ESTIMATED REVENUE CALCULATOR */}
            {estimatedBatchValue && (
              <div className="calculator-preview-box">
                <Scale size={18} className="calc-icon" />
                <div>
                  <strong>{t("listingModal.estimatedValue")} ₹{estimatedBatchValue}</strong>
                  <span>({formData.quantity} {t(`units.${formData.unit}`) || formData.unit} × ₹{formData.price})</span>
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="cropLocation">
                {isEdit ? t("editModal.location") : t("listingModal.location")}
              </label>
              <input
                id="cropLocation"
                required
                placeholder={t("listingModal.locationPlaceholder")}
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="cropDesc">
                {isEdit ? t("editModal.notes") : t("listingModal.notes")}
              </label>
              <textarea
                id="cropDesc"
                rows="2"
                placeholder={t("listingModal.notesPlaceholder")}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* CROP PHOTO ATTACHMENT SECTION (Upload + Direct Camera) */}
            <div className="form-group crop-photo-upload-group">
              <div className="crop-photo-header">
                <div className="crop-photo-label-clean">
                  <span className="photo-label-title">
                    🌾 {t("listingModal.cropPhoto") ? t("listingModal.cropPhoto").replace(/\s*\(.*\)/, "") : "Crop Photo"}
                  </span>
                  <span className="photo-tag-optional">{t("listingModal.optional") || t("common.optional") || "Optional"}</span>
                </div>
                <span className="crop-photo-subnote">JPG, PNG, WebP · Max 8MB</span>
              </div>

              {!formData.image ? (
                <div className="photo-dropzone-box">
                  <div className="dropzone-guide">
                    <div className="dropzone-icon-bubble">
                      <Camera size={20} />
                    </div>
                    <div className="dropzone-text-group">
                      <span className="dropzone-main-text">Attach Real Harvest Photo</span>
                      <span className="dropzone-sub-text">Helps buyers verify quality and buy your produce faster</span>
                    </div>
                  </div>

                  <div className="dropzone-action-buttons">
                    <label className="btn-dropzone-action" title="Upload from Device / Gallery">
                      <Upload size={15} />
                      <span>{t("listingModal.uploadPhoto") || "Upload Photo"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleFileChange}
                      />
                    </label>

                    <label className="btn-dropzone-action" title="Take a photo with your Camera">
                      <Camera size={15} />
                      <span>{t("listingModal.takePhoto") || "Take Photo"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        style={{ display: "none" }}
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="crop-photo-card-preview">
                  <div className="preview-image-holder">
                    <img src={formData.image} alt="Crop preview" className="crop-preview-thumb" />
                    <div className="preview-status-pill">
                      <CheckCircle2 size={13} />
                      <span>Photo Attached</span>
                    </div>
                  </div>
                  <div className="preview-actions-col">
                    <div className="preview-info-text">
                      <strong>Harvest Photo Ready</strong>
                      <small>Displayed on crop card in marketplace</small>
                    </div>
                    <div className="preview-button-row">
                      <label className="btn-preview-action change" title="Change photo">
                        <RefreshCw size={13} />
                        <span>Change</span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={handleFileChange}
                        />
                      </label>
                      <button
                        type="button"
                        className="btn-preview-action delete"
                        onClick={() => setFormData((prev) => ({ ...prev, image: "" }))}
                        title="Remove photo"
                      >
                        <Trash2 size={13} />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="form-actions-row">
              <button type="submit" className="btn-modal-submit green">
                <Check size={18} />
                <span>{isEdit ? t("editModal.saveChanges") : t("listingModal.publishBtn")}</span>
              </button>
              <button type="button" className="btn-modal-cancel" onClick={onClose}>
                {isEdit ? t("editModal.backToDashboard") : t("listingModal.cancelBtn")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
