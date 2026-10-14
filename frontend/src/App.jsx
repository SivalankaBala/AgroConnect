import { useEffect, useMemo, useState } from "react";
import "./App.css";

const initialCrops = [
  { _id: "demo-1", name: "Rice (Sona Masoori)", category: "Grains", price: 28, unit: "kg", location: "Tuni", quantity: 500, farmerName: "Ramesh Varma", isDemo: true },
  { _id: "demo-2", name: "Red Chillies (Guntur)", category: "Spices", price: 120, unit: "kg", location: "Anakapalli", quantity: 100, farmerName: "K. Satyanarayana", isDemo: true },
  { _id: "demo-3", name: "Yellow Maize", category: "Grains", price: 22, unit: "kg", location: "East Godavari", quantity: 800, farmerName: "S. Apparao", isDemo: true },
  { _id: "demo-4", name: "Country Tomatoes", category: "Vegetables", price: 25, unit: "kg", location: "Tuni", quantity: 200, farmerName: "N. Lakshmi", isDemo: true },
  { _id: "demo-5", name: "Organic Groundnuts", category: "Pulses & Nuts", price: 65, unit: "kg", location: "Kakinada", quantity: 300, farmerName: "B. Venkatesh", isDemo: true },
  { _id: "demo-6", name: "Dry Turmeric", category: "Spices", price: 90, unit: "kg", location: "Rajahmundry", quantity: 150, farmerName: "P. Suryanarayana", isDemo: true },
];

const categories = ["All", "Grains", "Vegetables", "Spices", "Pulses & Nuts"];

function App() {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [modal, setModal] = useState("");
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [notice, setNotice] = useState("");

  // Authenticated user state
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem("agroconnectUser");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Crop creation form state
  const [listing, setListing] = useState({
    name: "", category: "Grains", price: "", unit: "kg",
    quantity: "", location: "", description: ""
  });

  // Crop editing state
  const [editingCrop, setEditingCrop] = useState(null);

  // Authentication form state
  const [account, setAccount] = useState({
    name: "", email: "", password: "", role: "Buyer"
  });

  // Farmer Dashboard states
  const [dashboardListings, setDashboardListings] = useState([]);
  const [dashboardEnquiries, setDashboardEnquiries] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardTab, setDashboardTab] = useState("all"); // 'all' | 'listings' | 'enquiries'

  // Buyer Dashboard states
  const [buyerEnquiries, setBuyerEnquiries] = useState([]);
  const [buyerLoading, setBuyerLoading] = useState(false);
  const [buyerError, setBuyerError] = useState("");

  // Fetch crops & verify authentication on mount
  useEffect(() => {
    fetchCrops();
    verifyAuthSession();
  }, []);

  async function verifyAuthSession() {
    const token = sessionStorage.getItem("agroconnectToken");
    if (!token) return;

    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        sessionStorage.setItem("agroconnectUser", JSON.stringify(data.user));
      } else {
        // Token invalid or expired
        sessionStorage.removeItem("agroconnectToken");
        sessionStorage.removeItem("agroconnectUser");
        setCurrentUser(null);
      }
    } catch (err) {
      console.warn("Session check offline or failed:", err);
    }
  }

  async function fetchCrops() {
    try {
      setLoading(true);
      const res = await fetch("/api/crops");
      if (!res.ok) throw new Error("Failed to fetch crops from server");
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setCrops(data);
      } else {
        // Fallback to sample crops if database is empty so marketplace has initial items
        setCrops(initialCrops);
      }
    } catch (error) {
      console.error("Backend fetch error:", error);
      setCrops(initialCrops);
      setNotice("Notice: Connected in offline demo mode with sample listings.");
    } finally {
      setLoading(false);
    }
  }

  const filteredCrops = useMemo(() => {
    return crops.filter((crop) => {
      const query = search.toLowerCase();
      const matchesSearch =
        `${crop.name} ${crop.location} ${crop.farmerName || ""}`.toLowerCase().includes(query);
      const matchesCategory =
        category === "All" || crop.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [crops, search, category]);

  function handleLogout() {
    sessionStorage.removeItem("agroconnectToken");
    sessionStorage.removeItem("agroconnectUser");
    setCurrentUser(null);
    setDashboardListings([]);
    setDashboardEnquiries([]);
    setBuyerEnquiries([]);
    setNotice("You have logged out successfully.");
    setModal("");
  }

  function showEnquiry(crop) {
    if (crop.isDemo) {
      setNotice("This is a demo sample crop. To send real enquiries, browse listings saved by farmers in MongoDB!");
      return;
    }

    const token = sessionStorage.getItem("agroconnectToken");
    if (!token || !currentUser) {
      setNotice("Please log in with a Buyer account to send an enquiry.");
      setModal("login");
      return;
    }

    const isOwnCrop = crop.farmer === currentUser.id ||
      crop.farmer?._id === currentUser.id ||
      crop.farmer === currentUser._id;

    if (isOwnCrop) {
      setNotice("You are the owner of this crop listing. You can view its enquiries in your Farmer Dashboard.");
      return;
    }

    setSelectedCrop(crop);
    setModal("enquiry");
  }

  function openListingModal() {
    const token = sessionStorage.getItem("agroconnectToken");
    if (!token || !currentUser) {
      setNotice("Please log in with a Farmer account to list crops.");
      setModal("login");
      return;
    }

    if (currentUser.role !== "Farmer") {
      setNotice("Only accounts with the Farmer role can list crops. You are currently logged in as a Buyer.");
      return;
    }

    setModal("listing");
  }

  async function submitListing(event) {
    event.preventDefault();

    try {
      const token = sessionStorage.getItem("agroconnectToken");
      const payload = {
        name: listing.name.trim(),
        category: listing.category,
        price: Number(listing.price),
        unit: listing.unit,
        quantity: Number(listing.quantity),
        location: listing.location.trim(),
        farmerName: currentUser?.name || "Local Farmer",
        description: listing.description ? listing.description.trim() : "",
      };

      const res = await fetch("/api/crops", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Could not save crop listing");
      }

      const savedCrop = await res.json();
      setCrops((current) => [savedCrop, ...current.filter(c => !c.isDemo)]);
      setListing({
        name: "", category: "Grains", price: "", unit: "kg",
        quantity: "", location: "", description: ""
      });
      setModal("");
      setSearch("");
      setCategory("All");
      setNotice("Your crop listing has been saved to the database successfully!");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Save listing error:", error);
      setNotice(`Failed to save listing: ${error.message}`);
    }
  }

  function openEditModal(crop) {
    setEditingCrop({
      _id: crop._id,
      name: crop.name,
      category: crop.category,
      price: crop.price,
      unit: crop.unit || "kg",
      quantity: crop.quantity,
      location: crop.location,
      description: crop.description || ""
    });
    setModal("editCrop");
  }

  async function submitEditCrop(event) {
    event.preventDefault();
    if (!editingCrop?._id) return;

    try {
      const token = sessionStorage.getItem("agroconnectToken");
      const payload = {
        name: editingCrop.name.trim(),
        category: editingCrop.category,
        price: Number(editingCrop.price),
        unit: editingCrop.unit,
        quantity: Number(editingCrop.quantity),
        location: editingCrop.location.trim(),
        description: editingCrop.description ? editingCrop.description.trim() : ""
      };

      const res = await fetch(`/api/crops/${editingCrop._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update crop listing.");
      }

      const updated = data.crop || { ...editingCrop, ...payload };

      // Update in marketplace crops state
      setCrops(current => current.map(c => c._id === updated._id ? updated : c));
      // Update in farmer dashboard state
      setDashboardListings(current => current.map(c => c._id === updated._id ? updated : c));

      setNotice("Crop listing updated successfully!");
      setModal("dashboard");
      setEditingCrop(null);
    } catch (error) {
      setNotice(error.message || "Failed to update listing.");
    }
  }

  async function handleDeleteCrop(cropId, cropName) {
    if (!window.confirm(`Are you sure you want to delete "${cropName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = sessionStorage.getItem("agroconnectToken");
      const res = await fetch(`/api/crops/${cropId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete crop listing.");
      }

      setCrops(current => current.filter(c => c._id !== cropId));
      setDashboardListings(current => current.filter(c => c._id !== cropId));
      setNotice("Crop listing deleted successfully.");
    } catch (error) {
      setNotice(error.message || "Failed to delete listing.");
    }
  }

  async function submitAccount(event) {
    event.preventDefault();

    const isRegister = modal === "register";
    const endpoint = isRegister
      ? "/api/auth/register"
      : "/api/auth/login";

    if (isRegister && account.password.length < 8) {
      setNotice("Password must be at least 8 characters long.");
      return;
    }

    try {
      const payload = isRegister
        ? {
            name: account.name.trim(),
            email: account.email.trim().toLowerCase(),
            password: account.password,
            role: account.role
          }
        : {
            email: account.email.trim().toLowerCase(),
            password: account.password
          };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Authentication failed.");
      }

      sessionStorage.setItem("agroconnectToken", data.token);
      sessionStorage.setItem("agroconnectUser", JSON.stringify(data.user));
      setCurrentUser(data.user);

      setNotice(
        `${isRegister ? "Registration" : "Login"} successful! Welcome, ${data.user.name} (${data.user.role}).`
      );

      setModal("");
      setAccount({ name: "", email: "", password: "", role: "Buyer" });
    } catch (error) {
      setNotice(error.message || "Something went wrong. Please try again.");
    }
  }

  async function submitEnquiry(event) {
    event.preventDefault();

    const token = sessionStorage.getItem("agroconnectToken");

    if (!token || !currentUser) {
      setNotice("Please log in before submitting an enquiry.");
      setModal("login");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const buyerName = formData.get("buyerName").trim();
    const contact = formData.get("contact").trim();
    const quantity = formData.get("quantity").trim();
    const messageText = formData.get("message").trim();

    if (!selectedCrop?._id || selectedCrop.isDemo) {
      setNotice("This crop is a demo listing. Please select a crop saved in the database.");
      setModal("");
      return;
    }

    const buyerEmail = contact.includes("@") ? contact : currentUser.email;
    const message = `Requirement: ${quantity ? `${quantity} needed` : "Bulk enquiry"}
Contact Details: ${contact}
Message: ${messageText}`;

    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          buyerName,
          buyerEmail,
          message,
          cropId: selectedCrop._id
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Could not submit enquiry.");
      }

      setNotice("Your enquiry has been sent to the farmer successfully! You can track its status in your Buyer Dashboard.");
      setModal("");
    } catch (error) {
      setNotice(error.message || "Failed to submit enquiry.");
    }
  }

  async function openFarmerDashboard() {
    const token = sessionStorage.getItem("agroconnectToken");

    if (!token || !currentUser) {
      setNotice("Please log in to access your farmer dashboard.");
      setModal("login");
      return;
    }

    if (currentUser.role !== "Farmer") {
      setNotice("The Farmer Dashboard is only available to Farmer accounts. You are currently logged in as a Buyer.");
      return;
    }

    setModal("dashboard");
    setDashboardLoading(true);

    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [listingsRes, enquiriesRes] = await Promise.all([
        fetch("/api/crops/my-listings", { headers }),
        fetch("/api/enquiries/farmer", { headers })
      ]);

      if (!listingsRes.ok || !enquiriesRes.ok) {
        throw new Error("Could not load dashboard data. Check backend connection.");
      }

      const [listings, enquiries] = await Promise.all([
        listingsRes.json(),
        enquiriesRes.json()
      ]);

      setDashboardListings(Array.isArray(listings) ? listings : []);
      setDashboardEnquiries(Array.isArray(enquiries) ? enquiries : []);
    } catch (error) {
      setNotice(error.message || "Failed to load dashboard.");
    } finally {
      setDashboardLoading(false);
    }
  }

  async function openBuyerDashboard() {
    const token = sessionStorage.getItem("agroconnectToken");

    if (!token || !currentUser) {
      setNotice("Please log in to access your buyer dashboard.");
      setModal("login");
      return;
    }

    setModal("buyerDashboard");
    setBuyerLoading(true);
    setBuyerError("");

    try {
      const res = await fetch("/api/enquiries/my-enquiries", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Could not load your enquiries.");
      }

      const data = await res.json();
      setBuyerEnquiries(Array.isArray(data) ? data : []);
    } catch (error) {
      setBuyerError(error.message || "Failed to load enquiries.");
    } finally {
      setBuyerLoading(false);
    }
  }

  async function updateEnquiryStatus(enquiryId, status) {
    const token = sessionStorage.getItem("agroconnectToken");

    try {
      const res = await fetch(`/api/enquiries/${enquiryId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Could not update enquiry status.");
      }

      setDashboardEnquiries(current =>
        current.map(item =>
          item._id === enquiryId
            ? { ...item, status }
            : item
        )
      );

      setNotice(`Enquiry status updated to "${status}".`);
    } catch (error) {
      setNotice(error.message || "Failed to update enquiry status.");
    }
  }

  // Dashboard counters
  const farmerPendingCount = dashboardEnquiries.filter(e => e.status === "Pending").length;
  const farmerRespondedCount = dashboardEnquiries.filter(e => e.status === "Responded").length;
  const farmerClosedCount = dashboardEnquiries.filter(e => e.status === "Closed").length;

  const buyerPendingCount = buyerEnquiries.filter(e => e.status === "Pending").length;
  const buyerRespondedCount = buyerEnquiries.filter(e => e.status === "Responded").length;
  const buyerClosedCount = buyerEnquiries.filter(e => e.status === "Closed").length;

  return (
    <div className="app-shell">
      <nav className="navbar">
        <a className="brand" href="#home">
          <span className="brand-icon">✳</span> AgroConnect
        </a>
        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#marketplace">Marketplace</a>

          {currentUser ? (
            <>
              {currentUser.role === "Farmer" ? (
                <>
                  <button className="nav-secondary-action" onClick={openListingModal}>
                    ＋ List Crop
                  </button>
                  <button className="nav-login" onClick={openFarmerDashboard}>
                    Farmer Dashboard {farmerPendingCount > 0 && <span className="nav-badge-dot" />}
                  </button>
                </>
              ) : (
                <button className="nav-login" onClick={openBuyerDashboard}>
                  Buyer Dashboard
                </button>
              )}

              <div className="user-badge" title={`Signed in as ${currentUser.email}`}>
                <span className="user-avatar">{currentUser.role === "Farmer" ? "🧑‍🌾" : "🛒"}</span>
                <span className="user-name">{currentUser.name}</span>
                <span className="user-role-tag">{currentUser.role}</span>
              </div>

              <button className="nav-logout-btn" onClick={handleLogout} title="Log out of AgroConnect">
                Logout
              </button>
            </>
          ) : (
            <>
              <button className="nav-login" onClick={() => setModal("login")}>
                Login
              </button>
              <button className="nav-button" onClick={() => setModal("register")}>
                Join AgroConnect
              </button>
            </>
          )}
        </div>
      </nav>

      {notice && (
        <div className="notice" role="status">
          <div className="notice-content">
            <span className="notice-icon">ℹ</span>
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice("")} aria-label="Dismiss message">×</button>
        </div>
      )}

      <header className="hero" id="home">
        <div className="hero-copy">
          <span className="eyebrow">A BETTER MARKET FOR EVERY FARMER</span>
          <h1>From our farms<br />to your <span>business.</span></h1>
          <p>Discover fresh agricultural produce and connect directly with farmers across Tuni and nearby areas of Andhra Pradesh.</p>
          <div className="hero-actions">
            <a className="primary-button" href="#marketplace">Explore crops <span>→</span></a>
            <button className="secondary-button" onClick={openListingModal}>＋ List your crops</button>
          </div>
          <div className="hero-note"><span>✓</span> Local produce · Direct connections · Better opportunities</div>
        </div>
        <div className="hero-art" aria-label="Illustration of an agricultural field">
          <div className="sun" />
          <div className="hill hill-back" />
          <div className="hill hill-front" />
          <div className="field-row row-one" />
          <div className="field-row row-two" />
          <div className="field-row row-three" />
          <div className="art-label"><span>✳</span><div><strong>Grow together.</strong><small>Trade with confidence.</small></div></div>
        </div>
      </header>

      <section className="benefits">
        <div><span className="benefit-icon">🌾</span><div><strong>Farm fresh</strong><small>Produce from local growers</small></div></div>
        <div><span className="benefit-icon">🤝</span><div><strong>Direct connection</strong><small>Buyers meet farmers</small></div></div>
        <div><span className="benefit-icon">📍</span><div><strong>Locally focused</strong><small>Tuni and nearby districts</small></div></div>
      </section>

      <main id="marketplace" className="marketplace">
        <div className="section-heading">
          <div>
            <span className="eyebrow">THE LOCAL MARKETPLACE</span>
            <h2>Explore available crops</h2>
            <p>Find produce that matches your business or household needs directly from growers.</p>
          </div>
          <button className="outline-button" onClick={openListingModal}>＋ Add a crop</button>
        </div>

        <div className="search-row">
          <label className="search-box">
            <span>⌕</span>
            <input
              aria-label="Search crops, locations, or farmers"
              placeholder="Search crops, locations, or farmers..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search && <button onClick={() => setSearch("")} aria-label="Clear search">×</button>}
          </label>
          <span className="result-count">{loading ? "Loading crops..." : `${filteredCrops.length} crops found`}</span>
        </div>

        <div className="category-list" aria-label="Filter crops by category">
          {categories.map((item) => (
            <button
              key={item}
              className={category === item ? "category-chip active" : "category-chip"}
              onClick={() => setCategory(item)}
            >{item}</button>
          ))}
        </div>

        {loading ? (
          <div className="marketplace-loading">
            <span className="spinner">⏳</span>
            <p>Loading fresh crops from the database...</p>
          </div>
        ) : filteredCrops.length ? (
          <div className="crop-grid">
            {filteredCrops.map((crop, index) => {
              const cropKey = crop._id || crop.id || index;
              const quantityDisplay = typeof crop.quantity === "number"
                ? `${crop.quantity} ${crop.unit || "kg"}`
                : crop.quantity;

              const isOwner = currentUser && (
                crop.farmer === currentUser.id ||
                crop.farmer?._id === currentUser.id ||
                crop.farmer === currentUser._id
              );

              return (
                <article className="crop-card" key={cropKey}>
                  <div className={`crop-visual crop-visual-${index % 4}`}>
                    <span className="crop-category">{crop.category}</span>
                    {isOwner && <span className="owner-badge">Your Listing</span>}
                    {crop.isDemo && <span className="demo-tag">Sample</span>}
                    <span className="crop-emoji" aria-hidden="true">
                      {crop.name.toLowerCase().includes("rice") || crop.name.toLowerCase().includes("paddy") ? "🌾" :
                        crop.name.toLowerCase().includes("chilli") ? "🌶️" :
                          crop.name.toLowerCase().includes("maize") || crop.name.toLowerCase().includes("corn") ? "🌽" :
                            crop.name.toLowerCase().includes("tomato") ? "🍅" :
                              crop.name.toLowerCase().includes("groundnut") || crop.name.toLowerCase().includes("peanut") ? "🥜" :
                                crop.name.toLowerCase().includes("turmeric") ? "🫚" :
                                  crop.name.toLowerCase().includes("wheat") ? "🌾" : "🌱"}
                    </span>
                  </div>
                  <div className="crop-details">
                    <div className="crop-title-row">
                      <h3>{crop.name}</h3>
                      <span className="available-dot">Available</span>
                    </div>
                    <p className="crop-location">⌖ {crop.location}</p>
                    <p className="crop-farmer">🧑‍🌾 Grower: <strong>{crop.farmerName || "Local Farmer"}</strong></p>
                    {crop.description && <p className="crop-desc">{crop.description}</p>}
                    <div className="crop-meta">
                      <span>Available stock</span>
                      <strong>{quantityDisplay}</strong>
                    </div>
                    <div className="crop-footer">
                      <div>
                        <small>Price per {crop.unit || "kg"}</small>
                        <strong>₹{crop.price}<small> / {crop.unit || "kg"}</small></strong>
                      </div>
                      {isOwner ? (
                        <button className="manage-listing-btn" onClick={openFarmerDashboard}>
                          Manage <span>⚙</span>
                        </button>
                      ) : (
                        <button onClick={() => showEnquiry(crop)}>
                          Enquire <span>→</span>
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <span>🌱</span>
            <h3>No matching crops found</h3>
            <p>Try searching with another crop name or clear your category filter.</p>
            <button className="outline-button" onClick={() => { setSearch(""); setCategory("All"); }}>
              Clear all filters
            </button>
          </div>
        )}
        <p className="demo-disclaimer">
          AgroConnect connects verified farmers in Andhra Pradesh directly with prospective bulk and retail buyers.
        </p>
      </main>

      <section className="farmer-banner">
        <div>
          <span className="eyebrow">ARE YOU A FARMER?</span>
          <h2>Your harvest deserves a wider market.</h2>
          <p>List your crops online to reach verified buyers across Andhra Pradesh directly without middleman markups.</p>
        </div>
        <button className="banner-button" onClick={openListingModal}>
          List your crops <span>→</span>
        </button>
      </section>

      <footer className="footer">
        <a className="brand footer-brand" href="#home">
          <span className="brand-icon">✳</span> AgroConnect
        </a>
        <p>Direct agricultural commerce connecting local farmers and buyers in Tuni, AP.</p>
        <span>AgroConnect · Verified Marketplace</span>
      </footer>

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal("")}>
          <section
            className={`modal ${modal === "dashboard" || modal === "buyerDashboard" ? "modal-large" : ""}`}
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <button className="modal-close" onClick={() => setModal("")} aria-label="Close dialog">×</button>

            {/* FARMER: LIST CROP MODAL */}
            {modal === "listing" && (
              <>
                <span className="eyebrow">FOR FARMERS</span>
                <h2>List your crop</h2>
                <p className="modal-intro">Enter your crop details to create a verified listing saved directly in the marketplace.</p>
                <form onSubmit={submitListing} className="form-stack">
                  <label>
                    Crop name
                    <input required value={listing.name} onChange={(event) => setListing({ ...listing, name: event.target.value })} placeholder="e.g. Sona Masoori Paddy" />
                  </label>
                  <label>
                    Category
                    <select value={listing.category} onChange={(event) => setListing({ ...listing, category: event.target.value })}>
                      {categories.filter((item) => item !== "All").map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                  <div className="form-two">
                    <label>
                      Price (₹ per unit)
                      <input required type="number" min="0.01" step="0.01" value={listing.price} onChange={(event) => setListing({ ...listing, price: event.target.value })} placeholder="e.g. 28" />
                    </label>
                    <label>
                      Unit
                      <select value={listing.unit} onChange={(event) => setListing({ ...listing, unit: event.target.value })}>
                        <option value="kg">Kilogram (kg)</option>
                        <option value="quintal">Quintal (100 kg)</option>
                        <option value="tonne">Tonne</option>
                        <option value="bag">Bag</option>
                      </select>
                    </label>
                  </div>
                  <div className="form-two">
                    <label>
                      Quantity available
                      <input required type="number" min="0.01" step="0.01" value={listing.quantity} onChange={(event) => setListing({ ...listing, quantity: event.target.value })} placeholder="e.g. 500" />
                    </label>
                    <label>
                      Location (Town / Mandal)
                      <input required value={listing.location} onChange={(event) => setListing({ ...listing, location: event.target.value })} placeholder="e.g. Tuni, East Godavari" />
                    </label>
                  </div>
                  <label>
                    Description / Quality notes (optional)
                    <textarea rows="2" value={listing.description} onChange={(event) => setListing({ ...listing, description: event.target.value })} placeholder="e.g. Freshly harvested, dried to optimal moisture, grade A quality." />
                  </label>
                  <button className="primary-button form-submit" type="submit">
                    Publish crop listing →
                  </button>
                </form>
              </>
            )}

            {/* FARMER: EDIT CROP MODAL */}
            {modal === "editCrop" && editingCrop && (
              <>
                <span className="eyebrow">EDIT LISTING</span>
                <h2>Update crop details</h2>
                <p className="modal-intro">Modify quantity, pricing, or location for {editingCrop.name}.</p>
                <form onSubmit={submitEditCrop} className="form-stack">
                  <label>
                    Crop name
                    <input required value={editingCrop.name} onChange={(e) => setEditingCrop({ ...editingCrop, name: e.target.value })} />
                  </label>
                  <label>
                    Category
                    <select value={editingCrop.category} onChange={(e) => setEditingCrop({ ...editingCrop, category: e.target.value })}>
                      {categories.filter((item) => item !== "All").map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                  <div className="form-two">
                    <label>
                      Price (₹ per {editingCrop.unit})
                      <input required type="number" min="0.01" step="0.01" value={editingCrop.price} onChange={(e) => setEditingCrop({ ...editingCrop, price: e.target.value })} />
                    </label>
                    <label>
                      Unit
                      <select value={editingCrop.unit} onChange={(e) => setEditingCrop({ ...editingCrop, unit: e.target.value })}>
                        <option value="kg">Kilogram (kg)</option>
                        <option value="quintal">Quintal (100 kg)</option>
                        <option value="tonne">Tonne</option>
                        <option value="bag">Bag</option>
                      </select>
                    </label>
                  </div>
                  <div className="form-two">
                    <label>
                      Available quantity
                      <input required type="number" min="0.01" step="0.01" value={editingCrop.quantity} onChange={(e) => setEditingCrop({ ...editingCrop, quantity: e.target.value })} />
                    </label>
                    <label>
                      Location
                      <input required value={editingCrop.location} onChange={(e) => setEditingCrop({ ...editingCrop, location: e.target.value })} />
                    </label>
                  </div>
                  <label>
                    Description
                    <textarea rows="2" value={editingCrop.description || ""} onChange={(e) => setEditingCrop({ ...editingCrop, description: e.target.value })} />
                  </label>
                  <div className="modal-button-group">
                    <button className="primary-button" type="submit">Save changes →</button>
                    <button className="secondary-button" type="button" onClick={() => setModal("dashboard")}>Cancel</button>
                  </div>
                </form>
              </>
            )}

            {/* AUTH: LOGIN & REGISTER */}
            {(modal === "login" || modal === "register") && (
              <>
                <span className="eyebrow">AGROCONNECT ACCESS</span>
                <h2>{modal === "register" ? "Create your account" : "Welcome back"}</h2>
                <p className="modal-intro">
                  {modal === "register"
                    ? "Register as a Farmer to list produce or as a Buyer to connect with growers."
                    : "Enter your credentials to access your listings and enquiries."}
                </p>
                <form onSubmit={submitAccount} className="form-stack">
                  {modal === "register" && (
                    <label>
                      Full name
                      <input required value={account.name} onChange={(event) => setAccount({ ...account, name: event.target.value })} placeholder="e.g. Ramesh Varma" />
                    </label>
                  )}
                  <label>
                    Email address
                    <input required type="email" value={account.email} onChange={(event) => setAccount({ ...account, email: event.target.value })} placeholder="you@example.com" />
                  </label>
                  <label>
                    Password
                    <input required type="password" minLength="8" value={account.password} onChange={(event) => setAccount({ ...account, password: event.target.value })} placeholder="At least 8 characters" />
                  </label>
                  {modal === "register" && (
                    <label>
                      Account role
                      <select value={account.role} onChange={(event) => setAccount({ ...account, role: event.target.value })}>
                        <option value="Buyer">Buyer (Purchase crops & enquire)</option>
                        <option value="Farmer">Farmer (List produce & manage sales)</option>
                      </select>
                    </label>
                  )}
                  <button className="primary-button form-submit" type="submit">
                    {modal === "register" ? "Create account" : "Log in"} →
                  </button>
                </form>
                <p className="modal-switch">
                  {modal === "register" ? "Already have an account?" : "New to AgroConnect?"}{" "}
                  <button onClick={() => setModal(modal === "register" ? "login" : "register")}>
                    {modal === "register" ? "Log in here" : "Create an account"}
                  </button>
                </p>
              </>
            )}

            {/* BUYER: ENQUIRY MODAL */}
            {modal === "enquiry" && selectedCrop && (
              <>
                <span className="eyebrow">BUYER ENQUIRY</span>
                <h2>Enquire about {selectedCrop.name}</h2>
                <div className="enquiry-crop-summary">
                  <div><strong>Price:</strong> ₹{selectedCrop.price} / {selectedCrop.unit || "kg"}</div>
                  <div><strong>Location:</strong> {selectedCrop.location}</div>
                  <div><strong>Grower:</strong> {selectedCrop.farmerName || "Local Farmer"}</div>
                </div>
                <form className="form-stack" onSubmit={submitEnquiry}>
                  <label>
                    Your full name
                    <input required name="buyerName" defaultValue={currentUser?.name || ""} placeholder="e.g. Rajesh Kumar" />
                  </label>
                  <label>
                    Contact phone or email
                    <input required name="contact" defaultValue={currentUser?.email || ""} placeholder="e.g. 9848022338 or rajesh@example.com" />
                  </label>
                  <label>
                    Quantity needed ({selectedCrop.unit || "kg"})
                    <input required name="quantity" placeholder={`e.g. 50 ${selectedCrop.unit || "kg"}`} />
                  </label>
                  <label>
                    Message & requirements
                    <textarea name="message" rows="3" placeholder="Specify pickup preferences, required delivery timeframe, or price negotiation..." />
                  </label>
                  <button className="primary-button form-submit" type="submit">
                    Send enquiry to farmer →
                  </button>
                </form>
              </>
            )}

            {/* FARMER DASHBOARD MODAL */}
            {modal === "dashboard" && (
              <div className="dashboard-content">
                <div className="dashboard-header-row">
                  <div>
                    <span className="eyebrow">FARMER MANAGEMENT</span>
                    <h2>Farmer Dashboard</h2>
                    <p className="modal-intro">Manage your active crop listings and review buyer purchase enquiries.</p>
                  </div>
                  <div className="dashboard-header-actions">
                    <button className="refresh-btn" onClick={openFarmerDashboard} title="Refresh Dashboard">
                      ↻ Refresh
                    </button>
                    <button className="primary-button add-crop-quick-btn" onClick={() => setModal("listing")}>
                      ＋ Add Crop
                    </button>
                  </div>
                </div>

                {dashboardLoading ? (
                  <div className="dashboard-loading">
                    <span className="spinner">⏳</span>
                    <p>Loading your listings and incoming enquiries...</p>
                  </div>
                ) : (
                  <>
                    {/* Stat counters */}
                    <div className="stats-grid">
                      <div className="stat-card">
                        <span className="stat-value">{dashboardListings.length}</span>
                        <span className="stat-label">My Listings</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-value">{dashboardEnquiries.length}</span>
                        <span className="stat-label">Total Enquiries</span>
                      </div>
                      <div className="stat-card stat-pending">
                        <span className="stat-value">{farmerPendingCount}</span>
                        <span className="stat-label">Pending</span>
                      </div>
                      <div className="stat-card stat-responded">
                        <span className="stat-value">{farmerRespondedCount}</span>
                        <span className="stat-label">Responded</span>
                      </div>
                      <div className="stat-card stat-closed">
                        <span className="stat-value">{farmerClosedCount}</span>
                        <span className="stat-label">Closed</span>
                      </div>
                    </div>

                    {/* Section tabs */}
                    <div className="dashboard-tabs">
                      <button
                        className={`tab-btn ${dashboardTab === "all" ? "active" : ""}`}
                        onClick={() => setDashboardTab("all")}
                      >
                        All Overview
                      </button>
                      <button
                        className={`tab-btn ${dashboardTab === "listings" ? "active" : ""}`}
                        onClick={() => setDashboardTab("listings")}
                      >
                        My Crops ({dashboardListings.length})
                      </button>
                      <button
                        className={`tab-btn ${dashboardTab === "enquiries" ? "active" : ""}`}
                        onClick={() => setDashboardTab("enquiries")}
                      >
                        Buyer Enquiries ({dashboardEnquiries.length})
                        {farmerPendingCount > 0 && <span className="tab-pending-badge">{farmerPendingCount}</span>}
                      </button>
                    </div>

                    {/* Listings section */}
                    {(dashboardTab === "all" || dashboardTab === "listings") && (
                      <section className="dashboard-section">
                        <div className="section-title-row">
                          <h3>My Crop Listings ({dashboardListings.length})</h3>
                          <button className="link-button" onClick={() => setModal("listing")}>＋ Add New Crop</button>
                        </div>

                        {dashboardListings.length === 0 ? (
                          <div className="empty-substate">
                            <p>You haven't listed any crops yet.</p>
                            <button className="primary-button" onClick={() => setModal("listing")}>
                              Create your first crop listing →
                            </button>
                          </div>
                        ) : (
                          <div className="dashboard-cards-grid">
                            {dashboardListings.map(crop => (
                              <article className="dashboard-crop-card" key={crop._id}>
                                <div className="crop-card-top">
                                  <div>
                                    <span className="crop-category-pill">{crop.category}</span>
                                    <h4>{crop.name}</h4>
                                  </div>
                                  <div className="crop-card-price">
                                    <strong>₹{crop.price}</strong>
                                    <small>/{crop.unit || "kg"}</small>
                                  </div>
                                </div>
                                <div className="crop-card-meta">
                                  <span>📦 Stock: <strong>{crop.quantity} {crop.unit || "kg"}</strong></span>
                                  <span>⌖ Location: <strong>{crop.location}</strong></span>
                                </div>
                                {crop.description && <p className="crop-card-desc">{crop.description}</p>}
                                <div className="crop-card-actions">
                                  <button className="card-action-btn edit" onClick={() => openEditModal(crop)}>
                                    ✏️ Edit
                                  </button>
                                  <button className="card-action-btn delete" onClick={() => handleDeleteCrop(crop._id, crop.name)}>
                                    🗑️ Delete
                                  </button>
                                </div>
                              </article>
                            ))}
                          </div>
                        )}
                      </section>
                    )}

                    {/* Enquiries section */}
                    {(dashboardTab === "all" || dashboardTab === "enquiries") && (
                      <section className="dashboard-section">
                        <div className="section-title-row">
                          <h3>Buyer Enquiries ({dashboardEnquiries.length})</h3>
                        </div>

                        {dashboardEnquiries.length === 0 ? (
                          <div className="empty-substate">
                            <p>No buyer enquiries received yet.</p>
                            <small>When buyers view your crop listings and submit purchase requests, they will appear here with contact details.</small>
                          </div>
                        ) : (
                          <div className="dashboard-enquiries-list">
                            {dashboardEnquiries.map(enquiry => (
                              <article className="enquiry-card" key={enquiry._id}>
                                <div className="enquiry-card-header">
                                  <div>
                                    <span className="enquiry-crop-title">
                                      🌾 {enquiry.crop?.name || "Crop"} · ₹{enquiry.crop?.price || "--"} / {enquiry.crop?.unit || "kg"}
                                    </span>
                                    <span className="enquiry-date">
                                      {enquiry.createdAt ? new Date(enquiry.createdAt).toLocaleDateString("en-IN", {
                                        day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                                      }) : ""}
                                    </span>
                                  </div>
                                  <span className={`status-badge status-${enquiry.status.toLowerCase()}`}>
                                    {enquiry.status === "Pending" ? "🕒 Pending" : enquiry.status === "Responded" ? "✅ Responded" : "📁 Closed"}
                                  </span>
                                </div>

                                <div className="enquiry-buyer-info">
                                  <p><strong>Buyer Name:</strong> {enquiry.buyerName}</p>
                                  <p>
                                    <strong>Contact / Email:</strong>{" "}
                                    {enquiry.buyerEmail ? (
                                      <a href={`mailto:${enquiry.buyerEmail}`} className="contact-link">{enquiry.buyerEmail}</a>
                                    ) : "Provided in message"}
                                  </p>
                                </div>

                                <div className="enquiry-message-box">
                                  <p>{enquiry.message}</p>
                                </div>

                                <div className="enquiry-status-control">
                                  <label htmlFor={`status-${enquiry._id}`}>Update enquiry status:</label>
                                  <select
                                    id={`status-${enquiry._id}`}
                                    value={enquiry.status}
                                    onChange={event => updateEnquiryStatus(enquiry._id, event.target.value)}
                                  >
                                    <option value="Pending">Pending (Awaiting reply)</option>
                                    <option value="Responded">Responded (Buyer contacted)</option>
                                    <option value="Closed">Closed (Deal finished or resolved)</option>
                                  </select>
                                </div>
                              </article>
                            ))}
                          </div>
                        )}
                      </section>
                    )}
                  </>
                )}
              </div>
            )}

            {/* BUYER DASHBOARD MODAL */}
            {modal === "buyerDashboard" && (
              <div className="dashboard-content">
                <div className="dashboard-header-row">
                  <div>
                    <span className="eyebrow">BUYER MANAGEMENT</span>
                    <h2>Buyer Dashboard</h2>
                    <p className="modal-intro">Track all produce enquiries you have submitted to local farmers.</p>
                  </div>
                  <div className="dashboard-header-actions">
                    <button className="refresh-btn" onClick={openBuyerDashboard} title="Refresh enquiries">
                      ↻ Refresh
                    </button>
                    <button className="secondary-button" onClick={() => setModal("")}>
                      Explore Marketplace
                    </button>
                  </div>
                </div>

                {buyerLoading ? (
                  <div className="dashboard-loading">
                    <span className="spinner">⏳</span>
                    <p>Loading your submitted enquiries...</p>
                  </div>
                ) : buyerError ? (
                  <div className="error-state">
                    <p>⚠️ {buyerError}</p>
                    <button className="primary-button" onClick={openBuyerDashboard}>Retry</button>
                  </div>
                ) : (
                  <>
                    {/* Buyer stats */}
                    <div className="stats-grid">
                      <div className="stat-card">
                        <span className="stat-value">{buyerEnquiries.length}</span>
                        <span className="stat-label">Enquiries Sent</span>
                      </div>
                      <div className="stat-card stat-pending">
                        <span className="stat-value">{buyerPendingCount}</span>
                        <span className="stat-label">Pending Response</span>
                      </div>
                      <div className="stat-card stat-responded">
                        <span className="stat-value">{buyerRespondedCount}</span>
                        <span className="stat-label">Responded</span>
                      </div>
                      <div className="stat-card stat-closed">
                        <span className="stat-value">{buyerClosedCount}</span>
                        <span className="stat-label">Closed</span>
                      </div>
                    </div>

                    <div className="dashboard-section">
                      <div className="section-title-row">
                        <h3>My Enquiry History ({buyerEnquiries.length})</h3>
                      </div>

                      {buyerEnquiries.length === 0 ? (
                        <div className="empty-substate">
                          <span>🛒</span>
                          <p>You have not submitted any enquiries yet.</p>
                          <small>Browse the marketplace to find fresh crops directly from local farmers and send enquiries.</small>
                          <button
                            className="primary-button"
                            style={{ marginTop: "14px" }}
                            onClick={() => {
                              setModal("");
                              const el = document.getElementById("marketplace");
                              if (el) el.scrollIntoView({ behavior: "smooth" });
                            }}
                          >
                            Explore Available Crops →
                          </button>
                        </div>
                      ) : (
                        <div className="dashboard-enquiries-list">
                          {buyerEnquiries.map(enquiry => (
                            <article className="enquiry-card" key={enquiry._id}>
                              <div className="enquiry-card-header">
                                <div>
                                  <span className="enquiry-crop-title">
                                    🌾 {enquiry.crop?.name || "Crop listing"}
                                  </span>
                                  {enquiry.crop?.location && (
                                    <span className="crop-location" style={{ margin: "4px 0" }}>
                                      ⌖ {enquiry.crop.location} · ₹{enquiry.crop.price} / {enquiry.crop.unit}
                                    </span>
                                  )}
                                  <span className="enquiry-date">
                                    Submitted: {enquiry.createdAt ? new Date(enquiry.createdAt).toLocaleDateString("en-IN", {
                                      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                                    }) : ""}
                                  </span>
                                </div>
                                <span className={`status-badge status-${enquiry.status.toLowerCase()}`}>
                                  {enquiry.status === "Pending" ? "🕒 Pending Response" :
                                    enquiry.status === "Responded" ? "✅ Farmer Responded" : "📁 Closed"}
                                </span>
                              </div>

                              <div className="enquiry-message-box">
                                <strong>My Message:</strong>
                                <p style={{ whiteSpace: "pre-line", margin: "6px 0 0" }}>{enquiry.message}</p>
                              </div>

                              <div className="buyer-enquiry-footer">
                                <small>
                                  {enquiry.status === "Pending"
                                    ? "The farmer will review your enquiry and contact you via your provided phone/email."
                                    : enquiry.status === "Responded"
                                      ? "The farmer has acknowledged your request and will contact you directly."
                                      : "This enquiry has been closed."}
                                </small>
                              </div>
                            </article>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
