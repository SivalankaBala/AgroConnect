import React from "react";
import {
  CheckCircle2,
  Store,
  Tractor,
  ShoppingCart,
  Sparkles,
  ArrowRight,
  ChevronDown
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import desktopHeroBg from "../../assets/Farmer at Golden Hour Harvest.png";
import mobileHeroBg from "../../assets/Farmer’s Sunrise in Green Fields.png";

export default function HomeView({
  onNavigateMarketplace,
  onJoinRole
}) {
  const { t, language } = useLanguage();

  return (
    <div
      className="home-view-wrapper"
      style={{
        "--hero-bg-desktop": `url("${desktopHeroBg}")`,
        "--hero-bg-mobile": `url("${mobileHeroBg}")`
      }}
    >
      <div className="home-fixed-bg" aria-hidden="true" />

      {/* SECTION 1: DIRECT FARM MARKETPLACE FOR HARDWORKING FARMERS & SMART BUYERS */}
      <header
        className="hero-section"
        id="home"
      >
        <div className="hero-bg-overlay" aria-hidden="true" />
        <div className="hero-content">
          <h1 className="hero-heading">
            {t("hero.title")}
          </h1>

          <p className="hero-description">
            {t("hero.description")}
          </p>

          {/* KEY BENEFITS */}
          <div className="hero-benefits-wrapper">
            <ul className="hero-benefits-list">
              {(Array.isArray(t("hero.benefits")) ? t("hero.benefits") : []).map((benefit, idx) => (
                <li key={idx} className="hero-benefit-item">
                  <CheckCircle2 size={18} className="benefit-icon" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CALL-TO-ACTION BUTTONS */}
          <div className="hero-cta-group">
            <button
              type="button"
              className="btn-hero-primary"
              onClick={onNavigateMarketplace}
            >
              <Store size={19} />
              <span>{t("hero.exploreMarketplace")}</span>
            </button>
            <button
              type="button"
              className="btn-hero-secondary farmer-cta"
              onClick={() => onJoinRole("Farmer")}
            >
              <Tractor size={19} />
              <span>{t("hero.joinAsFarmer")}</span>
            </button>
            <button
              type="button"
              className="btn-hero-secondary buyer-cta"
              onClick={() => onJoinRole("Buyer")}
            >
              <ShoppingCart size={19} />
              <span>{t("hero.joinAsBuyer")}</span>
            </button>
          </div>

          {/* ROUND ARROW SIGN TO PULL/SCROLL SCREEN DOWN */}
          <div className="hero-scroll-pull-container">
            <button
              type="button"
              className="hero-scroll-pull-btn"
              onClick={() => {
                const el = document.getElementById("how-it-works");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth" });
                } else {
                  window.scrollTo({ top: window.innerHeight - 70, behavior: "smooth" });
                }
              }}
              title="Pull screen down"
              aria-label="Scroll down to explore"
            >
              <ChevronDown size={24} className="hero-pull-arrow-icon" />
            </button>
            <span className="hero-scroll-pull-hint">
              {language === "te" ? "క్రిందికి స్క్రోల్ చేయండి" : language === "hi" ? "नीचे देखें" : "Scroll down"}
            </span>
          </div>
        </div>
      </header>

      {/* SECTION 2: HOW AGROCONNECT WORKS FOR EVERYONE */}
      <section className="how-it-works-section" id="how-it-works" aria-labelledby="how-it-works-title">
        <div className="how-it-works-bg-overlay" aria-hidden="true" />
        <div className="how-it-works-container">
          <div className="how-it-works-header-center">
            <div className="how-it-works-badge">
              <Sparkles size={14} className="how-badge-icon" />
              <span>
                {language === "te"
                  ? "సరళమైన విధానం"
                  : language === "hi"
                    ? "सरल 4-चरणीय प्रक्रिया"
                    : "Direct & Transparent Process"}
              </span>
            </div>
            <h2 id="how-it-works-title" className="how-it-works-title">
              {t("howItWorks.title")}
            </h2>
            <p className="how-it-works-subtitle">
              {language === "te"
                ? "రైతులు మరియు కొనుగోలుదారులను నేరుగా అనుసంధానించే 0% కమీషన్ వ్యవసాయ వేదిక"
                : language === "hi"
                  ? "किसानों और खरीदारों को बिना किसी बिचौलिये के सीधे जोड़ने वाला 0% कमीशन कृषि मंच"
                  : "Zero-commission direct agricultural marketplace connecting verified growers directly with commercial and household buyers."}
            </p>
          </div>

          <div className="how-it-works-columns">
            {/* COLUMN 1: FOR FARMERS */}
            <div className="how-column farmer-how-col">
              <div className="how-col-accent-bar farmer-accent-bar" aria-hidden="true" />
              <div className="how-column-header">
                <div className="how-header-icon farmer-icon-box">
                  <Tractor size={26} strokeWidth={2.2} />
                </div>
                <div className="how-header-titles">
                  <span className="how-role-pill farmer-role-pill">
                    {language === "te" ? "రైతుల కోసం" : language === "hi" ? "उत्पादक" : "PRODUCERS"}
                  </span>
                  <h3 className="how-column-title">{t("howItWorks.farmersTitle")}</h3>
                </div>
              </div>

              <div className="how-steps-list">
                {(Array.isArray(t("howItWorks.farmerSteps")) ? t("howItWorks.farmerSteps") : []).map((item) => (
                  <div className="how-step-card farmer-step-card" key={item.num}>
                    <div className="step-num-badge farmer-badge">{item.num}</div>
                    <div className="step-body">
                      <h4 className="step-title">{item.title}</h4>
                      <p className="step-desc">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="how-column-footer">
                <button
                  type="button"
                  className="btn-how-cta farmer-how-cta"
                  onClick={() => onJoinRole("Farmer")}
                >
                  <Tractor size={18} />
                  <span>{t("hero.joinAsFarmer") || "Join as Farmer"}</span>
                  <ArrowRight size={16} className="cta-arrow" />
                </button>
              </div>
            </div>

            {/* COLUMN 2: FOR BUYERS */}
            <div className="how-column buyer-how-col">
              <div className="how-col-accent-bar buyer-accent-bar" aria-hidden="true" />
              <div className="how-column-header">
                <div className="how-header-icon buyer-icon-box">
                  <ShoppingCart size={26} strokeWidth={2.2} />
                </div>
                <div className="how-header-titles">
                  <span className="how-role-pill buyer-role-pill">
                    {language === "te" ? "కొనుగోలుదారుల కోసం" : language === "hi" ? "खरीदार" : "BUYERS & TRADERS"}
                  </span>
                  <h3 className="how-column-title">{t("howItWorks.buyersTitle")}</h3>
                </div>
              </div>

              <div className="how-steps-list">
                {(Array.isArray(t("howItWorks.buyerSteps")) ? t("howItWorks.buyerSteps") : []).map((item) => (
                  <div className="how-step-card buyer-step-card" key={item.num}>
                    <div className="step-num-badge buyer-badge">{item.num}</div>
                    <div className="step-body">
                      <h4 className="step-title">{item.title}</h4>
                      <p className="step-desc">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="how-column-footer">
                <button
                  type="button"
                  className="btn-how-cta buyer-how-cta"
                  onClick={() => onJoinRole("Buyer")}
                >
                  <ShoppingCart size={18} />
                  <span>{t("hero.joinAsBuyer") || "Join as Buyer"}</span>
                  <ArrowRight size={16} className="cta-arrow" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
