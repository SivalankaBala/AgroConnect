import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const OPTIONS = [
  { code: "en", label: "English", nativeName: "English", sublabel: "English" },
  { code: "te", label: "తెలుగు", nativeName: "తెలుగు", sublabel: "Telugu" },
  { code: "hi", label: "हिन्दी", nativeName: "हिन्दी", sublabel: "Hindi" }
];

export function LanguageSelector({ className = "" }) {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const itemRefs = useRef([]);

  const currentOption = OPTIONS.find((opt) => opt.code === language) || OPTIONS[0];

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard events (Escape, Arrow navigation)
  function handleKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
      return;
    }

    if (!isOpen) {
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setIsOpen(true);
        setTimeout(() => {
          const currentIndex = OPTIONS.findIndex((opt) => opt.code === language);
          const focusIndex = currentIndex >= 0 ? currentIndex : 0;
          itemRefs.current[focusIndex]?.focus();
        }, 30);
      }
      return;
    }

    const currentIndex = itemRefs.current.findIndex((el) => el === document.activeElement);

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const nextIndex = (currentIndex + 1) % OPTIONS.length;
      itemRefs.current[nextIndex]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      const prevIndex = (currentIndex - 1 + OPTIONS.length) % OPTIONS.length;
      itemRefs.current[prevIndex]?.focus();
    } else if (event.key === "Tab") {
      setIsOpen(false);
    }
  }

  function handleSelect(code) {
    setLanguage(code);
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div
      ref={containerRef}
      className={`lang-selector-container ${className}`}
      onKeyDown={handleKeyDown}
    >
      <button
        ref={triggerRef}
        type="button"
        id="language-selector-button"
        className={`lang-selector-btn ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls="language-dropdown-menu"
        aria-label={`Change language, currently ${currentOption.nativeName}`}
      >
        <span className="lang-globe-icon" aria-hidden="true">🌐</span>
        <span className="lang-btn-text">{currentOption.nativeName}</span>
        <ChevronDown
          size={14}
          className={`lang-chevron ${isOpen ? "rotated" : ""}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          id="language-dropdown-menu"
          role="menu"
          aria-labelledby="language-selector-button"
          className="lang-dropdown-menu"
        >
          <div className="lang-menu-header">
            <span>Select Language / భాష / भाषा</span>
          </div>
          <div className="lang-options-list">
            {OPTIONS.map((opt, index) => {
              const isSelected = opt.code === language;
              return (
                <button
                  key={opt.code}
                  ref={(el) => (itemRefs.current[index] = el)}
                  type="button"
                  role="menuitem"
                  id={`lang-opt-${opt.code}`}
                  aria-current={isSelected ? "true" : undefined}
                  className={`lang-option-item ${isSelected ? "selected" : ""}`}
                  onClick={() => handleSelect(opt.code)}
                >
                  <div className="lang-opt-details">
                    <span className="lang-opt-native">{opt.nativeName}</span>
                    {opt.code !== "en" && (
                      <span className="lang-opt-english">({opt.sublabel})</span>
                    )}
                  </div>
                  {isSelected && (
                    <span className="lang-opt-check" aria-hidden="true">
                      <Check size={16} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default LanguageSelector;
