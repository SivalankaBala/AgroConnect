import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function AuthModal({
  isOpen,
  initialMode = "login", // 'login' | 'register'
  initialRole = "Farmer", // 'Farmer' | 'Buyer'
  onClose,
  onSubmitAccount
}) {
  const { t } = useLanguage();
  const [mode, setMode] = useState(initialMode);
  const [account, setAccount] = useState({
    name: "",
    email: "",
    password: "",
    role: initialRole
  });
  const [formReady, setFormReady] = useState(false);
  const [authModalKey, setAuthModalKey] = useState(0);

  useEffect(() => {
    setMode(initialMode || "login");
    setAccount({ name: "", email: "", password: "", role: initialRole || "Farmer" });
  }, [initialMode, initialRole, isOpen]);

  if (!isOpen) return null;

  const handleSwitchMode = (newMode) => {
    setAccount({ name: "", email: "", password: "", role: account.role || "Farmer" });
    setFormReady(false);
    setAuthModalKey((k) => k + 1);
    setMode(newMode);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmitAccount) {
      onSubmitAccount(e, account, mode === "register");
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
            <div>
              <span className="modal-eyebrow">
                {mode === "register" ? (t("authModal.tabRegister") || "Create New Account") : (t("authModal.tabLogin") || "Log In")}
              </span>
              <h2>{mode === "register" ? t("authModal.registerTitle") : t("authModal.loginTitle")}</h2>
              <p>{mode === "register" ? t("authModal.registerDesc") : t("authModal.loginDesc")}</p>
            </div>
          </div>

          <form key={`${mode}-${authModalKey}`} onSubmit={handleSubmit} className="modern-form" autoComplete="off">
            {/* Invisible decoy inputs to divert aggressive browser credential autofill */}
            <input
              type="text"
              name="prevent_autofill_email_decoy"
              autoComplete="off"
              tabIndex={-1}
              aria-hidden="true"
              style={{ position: "absolute", opacity: 0, height: 0, width: 0, pointerEvents: "none" }}
            />
            <input
              type="password"
              name="prevent_autofill_pwd_decoy"
              autoComplete="new-password"
              tabIndex={-1}
              aria-hidden="true"
              style={{ position: "absolute", opacity: 0, height: 0, width: 0, pointerEvents: "none" }}
            />

            {mode === "register" && (
              <div className="role-selector-cards">
                <label
                  className={`role-choice-card ${account.role === "Farmer" ? "selected" : ""}`}
                  onClick={() => setAccount({ ...account, role: "Farmer" })}
                >
                  <input
                    type="radio"
                    name="role"
                    checked={account.role === "Farmer"}
                    onChange={() => setAccount({ ...account, role: "Farmer" })}
                  />
                  <div className="role-choice-content">
                    <span className="role-emoji">🧑‍🌾</span>
                    <strong>{t("authModal.roleFarmerTitle")}</strong>
                    <small>{t("authModal.roleFarmerSub")}</small>
                  </div>
                </label>

                <label
                  className={`role-choice-card ${account.role === "Buyer" ? "selected" : ""}`}
                  onClick={() => setAccount({ ...account, role: "Buyer" })}
                >
                  <input
                    type="radio"
                    name="role"
                    checked={account.role === "Buyer"}
                    onChange={() => setAccount({ ...account, role: "Buyer" })}
                  />
                  <div className="role-choice-content">
                    <span className="role-emoji">🛒</span>
                    <strong>{t("authModal.roleBuyerTitle")}</strong>
                    <small>{t("authModal.roleBuyerSub")}</small>
                  </div>
                </label>
              </div>
            )}

            {mode === "register" && (
              <div className="form-group">
                <label htmlFor="accName">{t("authModal.fullName")}</label>
                <input
                  id="accName"
                  name="agro_reg_name"
                  type="text"
                  autoComplete="off"
                  required
                  placeholder={t("authModal.fullNamePlaceholder")}
                  value={account.name}
                  onChange={(e) => setAccount({ ...account, name: e.target.value })}
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="accEmail">{t("authModal.email")}</label>
              <input
                id="accEmail"
                name="agro_login_email"
                type="email"
                autoComplete="off"
                readOnly={!formReady}
                onFocus={() => setFormReady(true)}
                required
                placeholder={t("authModal.emailPlaceholder")}
                value={account.email}
                onChange={(e) => setAccount({ ...account, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="accPassword">{t("authModal.password")}</label>
              <input
                id="accPassword"
                name="agro_login_password"
                type="password"
                autoComplete="new-password"
                readOnly={!formReady}
                onFocus={() => setFormReady(true)}
                required
                minLength={8}
                placeholder={t("authModal.passwordPlaceholder")}
                value={account.password}
                onChange={(e) => setAccount({ ...account, password: e.target.value })}
              />
            </div>

            <button type="submit" className="btn-modal-submit green full-width">
              <span>{mode === "register" ? t("authModal.createAccountBtn") : t("authModal.signInBtn")}</span>
            </button>

            <div className="auth-footer-prompt">
              {mode === "register" ? (
                <p>
                  {t("authModal.alreadyAccount")}{" "}
                  <button
                    type="button"
                    onClick={() => handleSwitchMode("login")}
                    className="link-text"
                  >
                    {t("authModal.loginHere")}
                  </button>
                </p>
              ) : (
                <p>
                  {t("authModal.noAccount")}{" "}
                  <button
                    type="button"
                    onClick={() => handleSwitchMode("register")}
                    className="link-text"
                  >
                    {t("authModal.createFree")}
                  </button>
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
