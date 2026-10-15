import { useState, useRef, useEffect } from "react";
import { MapPin, Search, ChevronDown, Check, X } from "lucide-react";

export function LocationSelector({
  value = "All",
  onChange,
  availableLocations = ["All", "Tuni", "Anakapalli", "Kakinada", "Rajahmundry", "East Godavari"],
  t = (key) => key
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      // Focus search input on open
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => {
        clearTimeout(timer);
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("touchstart", handleClickOutside);
      };
    }
  }, [isOpen]);

  // Handle keyboard events (Escape to close)
  function handleKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      setSearchQuery("");
      triggerRef.current?.focus();
    }
  }

  // Filter options based on dropdown search input
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredOptions = availableLocations.filter((loc) => {
    if (!normalizedQuery) return true;
    const label = loc === "All" ? (t("marketplace.allLocations") || "All Locations") : loc;
    return label.toLowerCase().includes(normalizedQuery) || loc.toLowerCase().includes(normalizedQuery);
  });

  function handleSelect(loc) {
    if (onChange) {
      onChange(loc);
    }
    setIsOpen(false);
    setSearchQuery("");
    triggerRef.current?.focus();
  }

  // Display label for selected location
  const displayLabel = value === "All" ? (t("marketplace.allLocations") || "All Locations") : value;

  return (
    <div
      ref={containerRef}
      className="location-selector-container"
      onKeyDown={handleKeyDown}
    >
      <button
        ref={triggerRef}
        type="button"
        id="location-filter-button"
        className={`location-trigger-btn ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls="location-dropdown-panel"
        aria-label={`Filter by location, currently ${displayLabel}`}
      >
        <MapPin size={16} className="location-pin-icon" aria-hidden="true" />
        <span className="location-trigger-label">
          {t("marketplace.locationLabel") ? t("marketplace.locationLabel").replace(/:$/, "") : "Location"}
        </span>
        <span className="location-trigger-divider" aria-hidden="true">:</span>
        <span className="location-trigger-value">{displayLabel}</span>
        <ChevronDown
          size={14}
          className={`location-chevron ${isOpen ? "rotated" : ""}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          id="location-dropdown-panel"
          className="location-dropdown-panel"
          role="listbox"
          aria-labelledby="location-filter-button"
        >
          {/* Dropdown Search Bar */}
          <div className="location-search-wrap">
            <Search size={14} className="location-search-icon" aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="text"
              className="location-search-input"
              placeholder={t("marketplace.searchLocationPlaceholder") || "Search location..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search location options"
            />
            {searchQuery && (
              <button
                type="button"
                className="location-search-clear"
                onClick={() => {
                  setSearchQuery("");
                  searchInputRef.current?.focus();
                }}
                aria-label="Clear location search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Options List */}
          <div ref={listRef} className="location-options-list">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((loc) => {
                const isSelected = value === loc;
                const itemLabel = loc === "All" ? (t("marketplace.allLocations") || "All Locations") : loc;

                return (
                  <button
                    key={loc}
                    type="button"
                    role="option"
                    id={`location-option-${loc.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                    aria-selected={isSelected}
                    className={`location-option-item ${isSelected ? "selected" : ""}`}
                    onClick={() => handleSelect(loc)}
                  >
                    <span className="location-option-text">{itemLabel}</span>
                    {isSelected && (
                      <Check size={15} className="location-check-icon" aria-hidden="true" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="location-empty-search">
                <p>{t("marketplace.noLocationsFound") || "No locations match"}</p>
                {searchQuery && (
                  <button
                    type="button"
                    className="location-empty-clear-btn"
                    onClick={() => {
                      setSearchQuery("");
                      searchInputRef.current?.focus();
                    }}
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default LocationSelector;
