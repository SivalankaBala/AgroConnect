import { useEffect, useState } from "react";
import { Sprout, ArrowRight } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function SplashScreen({ onFinish }) {
  const { t } = useLanguage();
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Fast and snappy splash: fade after 600ms, complete in 800ms
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, 600);

    const endTimer = setTimeout(() => {
      onFinish();
    }, 800);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(endTimer);
    };
  }, [onFinish]);

  function handleSkip() {
    setFading(true);
    onFinish();
  }

  return (
    <div
      className={`agro-splash-screen ${fading ? "fade-out" : ""}`}
      role="dialog"
      aria-label="Loading AgroConnect"
    >
      <div className="splash-content-box">
        {/* Simple Logo Box */}
        <div className="splash-logo-box">
          <Sprout size={42} className="splash-sprout-icon" />
        </div>

        {/* Clean, Readable Typography */}
        <div className="splash-text-group">
          <h1 className="splash-title">AgroConnect</h1>
          <p className="splash-tagline">“{t("splash.tagline") || "Direct Farmers — Better Markets"}”</p>
        </div>

        {/* Simple Rotating Circle Loader */}
        <div className="simple-rotating-circle-wrapper">
          <div className="simple-rotating-circle" />
        </div>

        {/* Skip / Enter Button */}
        <button
          type="button"
          className="splash-simple-enter-btn"
          onClick={handleSkip}
        >
          <span>{t("splash.skipBtn") || "Enter Marketplace"}</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
