import { useEffect, useMemo, useState } from "react";
import {
  Sprout,
  Leaf,
  Search,
  MapPin,
  User,
  Phone,
  Mail,
  ShoppingCart,
  Tractor,
  ArrowRight,
  Check,
  CheckCircle2,
  ShieldCheck,
  Tag,
  Filter,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  MessageSquare,
  AlertCircle,
  Info,
  ChevronRight,
  TrendingUp,
  SlidersHorizontal,
  ExternalLink,
  Clock,
  Sparkles,
  Award,
  Layers,
  ArrowUpRight,
  Store,
  DollarSign,
  Scale
} from "lucide-react";
import "./App.css";

const initialCrops = [
  {
    _id: "demo-1",
    name: "Rice (Sona Masoori)",
    category: "Grains",
    price: 28,
    unit: "kg",
    location: "Tuni, East Godavari",
    quantity: 500,
    farmerName: "Ramesh Varma",
    description: "Freshly harvested, naturally dried to 12% moisture. Premium Grade-A slender grain.",
    isDemo: true
  },
  {
    _id: "demo-2",
    name: "Red Chillies (Guntur Teja)",
    category: "Spices",
    price: 125,
    unit: "kg",
    location: "Anakapalli",
    quantity: 120,
    farmerName: "K. Satyanarayana",
    description: "High pungency, sun-dried bright red pods, ideal for spice processors and bulk buyers.",
    isDemo: true
  },
  {
    _id: "demo-3",
    name: "Yellow Hybrid Maize",
    category: "Grains",
    price: 22,
    unit: "kg",
    location: "Prathipadu, Kakinada",
    quantity: 850,
    farmerName: "S. Apparao",
    description: "Clean golden grain, properly separated and packed in standard 50kg bags.",
    isDemo: true
  },
  {
    _id: "demo-4",
    name: "Country Fresh Tomatoes",
    category: "Vegetables",
    price: 24,
    unit: "kg",
    location: "Payakaraopeta, Tuni",
    quantity: 250,
    farmerName: "N. Lakshmi",
    description: "Organically grown firm country variety with rich tangy flavor. Hand-picked daily.",
    isDemo: true
  },
  {
    _id: "demo-5",
    name: "Organic Groundnuts",
    category: "Pulses & Nuts",
    price: 68,
    unit: "kg",
    location: "Kakinada Rural",
    quantity: 320,
    farmerName: "B. Venkatesh",
    description: "High oil content, pod shells cleaned. Grown with zero chemical pesticides.",
    isDemo: true
  },
  {
    _id: "demo-6",
    name: "Dry Turmeric Fingers",
    category: "Spices",
    price: 92,
    unit: "kg",
    location: "Rajahmundry",
    quantity: 180,
    farmerName: "P. Suryanarayana",
    description: "Boiled and sun-polished finger turmeric with natural deep yellow curcumin rich color.",
    isDemo: true
  }
];

const categories = [
  { id: "All", label: "All Harvests", telugu: "అన్నీ", icon: "🌾" },
  { id: "Grains", label: "Grains & Paddy", telugu: "ధాన్యాలు", icon: "🍚" },
  { id: "Vegetables", label: "Fresh Vegetables", telugu: "కూరగాయలు", icon: "🍅" },
  { id: "Spices", label: "Spices & Chillies", telugu: "మసాలాలు", icon: "🌶️" },
  { id: "Pulses & Nuts", label: "Pulses & Nuts", telugu: "పప్పుధాన్యాలు", icon: "🥜" }
];

const popularLocations = ["All", "Tuni", "Anakapalli", "Kakinada", "Rajahmundry", "East Godavari"];

const popularCropsSuggestions = [
  { name: "Sona Masoori Paddy (వరి)", category: "Grains", unit: "kg", price: "28" },
  { name: "Guntur Red Chillies (మిరప)", category: "Spices", unit: "kg", price: "125" },
  { name: "Country Tomatoes (టమోటా)", category: "Vegetables", unit: "kg", price: "24" },
  { name: "Yellow Maize (మొక్కజొన్న)", category: "Grains", unit: "kg", price: "22" },
  { name: "Organic Groundnuts (వేరుశనగ)", category: "Pulses & Nuts", unit: "kg", price: "68" },
  { name: "Dry Turmeric (పసుపు)", category: "Spices", unit: "kg", price: "92" }
];

function getCropTeluguTag(name = "", category = "") {
  const lower = name.toLowerCase();
  if (lower.includes("sona masoori") || lower.includes("rice") || lower.includes("paddy")) return "సోనా మసూరి వరి";
  if (lower.includes("chilli") || lower.includes("mirchi")) return "గుంటూరు ఎండుమిర్చి";
  if (lower.includes("maize") || lower.includes("corn")) return "పసుపు మొక్కజొన్న";
  if (lower.includes("tomato")) return "నాటు టమోటాలు";
  if (lower.includes("groundnut") || lower.includes("peanut")) return "సేంద్రీయ వేరుశనగ";
  if (lower.includes("turmeric")) return "ఎండిన పసుపు కొమ్ములు";
  if (lower.includes("wheat")) return "నాణ్యమైన గోధుమలు";
  if (lower.includes("onion")) return "తాజా ఉల్లిపాయలు";
  if (category === "Grains") return "ధాన్యం పంట";
  if (category === "Vegetables") return "తాజా కూరగాయ";
  if (category === "Spices") return "నాణ్యమైన మసాలా";
  if (category === "Pulses & Nuts") return "పప్పుధాన్యాలు";
  return "తాజా రైతు పంట";
}

function getCropVisualTheme(name = "", category = "") {
  const lower = name.toLowerCase();
  if (lower.includes("rice") || lower.includes("paddy")) {
    return { emoji: "🌾", bgClass: "theme-grain", badge: "Paddy / వరి" };
  }
  if (lower.includes("chilli") || lower.includes("mirchi")) {
    return { emoji: "🌶️", bgClass: "theme-spice", badge: "Chilli / మిర్చి" };
  }
  if (lower.includes("maize") || lower.includes("corn")) {
    return { emoji: "🌽", bgClass: "theme-maize", badge: "Maize / మొక్కజొన్న" };
  }
  if (lower.includes("tomato")) {
    return { emoji: "🍅", bgClass: "theme-veg", badge: "Tomato / టమోటా" };
  }
  if (lower.includes("groundnut") || lower.includes("peanut")) {
    return { emoji: "🥜", bgClass: "theme-pulse", badge: "Groundnut / వేరుశనగ" };
  }
  if (lower.includes("turmeric")) {
    return { emoji: "🫚", bgClass: "theme-turmeric", badge: "Turmeric / పసుపు" };
  }
  if (category === "Vegetables") {
    return { emoji: "🥬", bgClass: "theme-veg", badge: "Vegetable / కూరగాయ" };
  }
  if (category === "Spices") {
    return { emoji: "🌿", bgClass: "theme-spice", badge: "Spice / మసాలా" };
  }
  if (category === "Pulses & Nuts") {
    return { emoji: "🫘", bgClass: "theme-pulse", badge: "Pulses / పప్పుధాన్యం" };
  }
  return { emoji: "🌱", bgClass: "theme-default", badge: "Fresh Crop / పంట" };
}

function App() {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [sortBy, setSortBy] = useState("featured"); // 'featured' | 'price-asc' | 'price-desc' | 'qty-desc'

  const [modal, setModal] = useState(""); // '' | 'listing' | 'editCrop' | 'login' | 'register' | 'enquiry' | 'dashboard' | 'buyerDashboard'
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [notice, setNotice] = useState(null); // { message: string, type: 'success' | 'info' | 'error' }

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
    name: "",
    category: "Grains",
    price: "",
    unit: "kg",
    quantity: "",
    location: "",
    description: ""
  });

  // Crop editing state
  const [editingCrop, setEditingCrop] = useState(null);

  // Authentication form state
  const [account, setAccount] = useState({
    name: "",
    email: "",
    password: "",
    role: "Farmer"
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

  // Enquiry quick message templates
  const [enquiryMessage, setEnquiryMessage] = useState("");

  // Auto-dismiss notice after 5 seconds
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => {
        setNotice(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [notice]);

  // Fetch crops & verify authentication on mount
  useEffect(() => {
    fetchCrops();
    verifyAuthSession();
  }, []);

  function triggerNotice(message, type = "info") {
    setNotice({ message, type });
  }

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
        sessionStorage.removeItem("agroconnectToken");
        sessionStorage.removeItem("agroconnectUser");
        setCurrentUser(null);
      }
    } catch (err) {
      console.warn("Session check failed or offline:", err);
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
        setCrops(initialCrops);
      }
    } catch (error) {
      console.error("Backend fetch error:", error);
      setCrops(initialCrops);
      triggerNotice("Viewing in offline demo mode with authentic sample harvest listings.", "info");
    } finally {
      setLoading(false);
    }
  }

  const filteredCrops = useMemo(() => {
    let result = crops.filter((crop) => {
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        `${crop.name} ${crop.location} ${crop.farmerName || ""} ${crop.category}`.toLowerCase().includes(query);

      const matchesCategory = category === "All" || crop.category === category;

      const matchesLocation =
        locationFilter === "All" ||
        (crop.location && crop.location.toLowerCase().includes(locationFilter.toLowerCase()));

      return matchesSearch && matchesCategory && matchesLocation;
    });

    if (sortBy === "price-asc") {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortBy === "qty-desc") {
      result.sort((a, b) => Number(b.quantity) - Number(a.quantity));
    }

    return result;
  }, [crops, search, category, locationFilter, sortBy]);

  function handleLogout() {
    sessionStorage.removeItem("agroconnectToken");
    sessionStorage.removeItem("agroconnectUser");
    setCurrentUser(null);
    setDashboardListings([]);
    setDashboardEnquiries([]);
    setBuyerEnquiries([]);
    triggerNotice("You have logged out successfully. Come back soon!", "success");
    setModal("");
  }

  function showEnquiry(crop) {
    if (crop.isDemo) {
      triggerNotice(
        "This is an authentic sample listing. You can register/login as a Farmer to list your real crops and receive live enquiries!",
        "info"
      );
      return;
    }

    const token = sessionStorage.getItem("agroconnectToken");
    if (!token || !currentUser) {
      triggerNotice("Please log in with a Buyer account to send an enquiry to this farmer.", "info");
      setAccount({ name: "", email: "", password: "", role: "Buyer" });
      setModal("login");
      return;
    }

    const isOwnCrop =
      crop.farmer === currentUser.id ||
      crop.farmer?._id === currentUser.id ||
      crop.farmer === currentUser._id;

    if (isOwnCrop) {
      triggerNotice("You own this crop listing! You can manage enquiries in your Farmer Dashboard.", "info");
      openFarmerDashboard();
      return;
    }

    setSelectedCrop(crop);
    setEnquiryMessage("");
    setModal("enquiry");
  }

  function openListingModal() {
    const token = sessionStorage.getItem("agroconnectToken");
    if (!token || !currentUser) {
      triggerNotice("Please log in or register with a Farmer account to list your produce.", "info");
      setAccount({ name: "", email: "", password: "", role: "Farmer" });
      setModal("register");
      return;
    }

    if (currentUser.role !== "Farmer") {
      triggerNotice(
        "You are currently logged in as a Buyer. Crop listing is reserved for Farmer accounts.",
        "error"
      );
      return;
    }

    setListing({
      name: "",
      category: "Grains",
      price: "",
      unit: "kg",
      quantity: "",
      location: "",
      description: ""
    });
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
        description: listing.description ? listing.description.trim() : ""
      };

      const res = await fetch("/api/crops", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Could not publish crop listing");
      }

      const savedCrop = await res.json();
      setCrops((current) => [savedCrop, ...current.filter((c) => !c.isDemo)]);
      setListing({
        name: "",
        category: "Grains",
        price: "",
        unit: "kg",
        quantity: "",
        location: "",
        description: ""
      });
      setModal("");
      setSearch("");
      setCategory("All");
      triggerNotice("🎉 Your crop listing is live in the marketplace! Buyers can now send direct purchase enquiries.", "success");
      const el = document.getElementById("marketplace");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      console.error("Save listing error:", error);
      triggerNotice(`Failed to save listing: ${error.message}`, "error");
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
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update crop listing.");
      }

      const updated = data.crop || { ...editingCrop, ...payload };

      setCrops((current) => current.map((c) => (c._id === updated._id ? updated : c)));
      setDashboardListings((current) => current.map((c) => (c._id === updated._id ? updated : c)));

      triggerNotice("Crop details updated successfully!", "success");
      setModal("dashboard");
      setEditingCrop(null);
    } catch (error) {
      triggerNotice(error.message || "Failed to update listing.", "error");
    }
  }

  async function handleDeleteCrop(cropId, cropName) {
    if (!window.confirm(`Are you sure you want to remove "${cropName}" from the marketplace?`)) {
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

      setCrops((current) => current.filter((c) => c._id !== cropId));
      setDashboardListings((current) => current.filter((c) => c._id !== cropId));
      triggerNotice("Crop listing has been removed from marketplace.", "info");
    } catch (error) {
      triggerNotice(error.message || "Failed to delete listing.", "error");
    }
  }

  async function submitAccount(event) {
    event.preventDefault();

    const isRegister = modal === "register";
    const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";

    if (isRegister && account.password.length < 8) {
      triggerNotice("Password must be at least 8 characters long for account security.", "error");
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

      triggerNotice(
        `Welcome to AgroConnect, ${data.user.name}! Signed in as ${data.user.role}.`,
        "success"
      );

      setModal("");
      setAccount({ name: "", email: "", password: "", role: "Farmer" });
    } catch (error) {
      triggerNotice(error.message || "Something went wrong. Please check your credentials.", "error");
    }
  }

  async function submitEnquiry(event) {
    event.preventDefault();

    const token = sessionStorage.getItem("agroconnectToken");

    if (!token || !currentUser) {
      triggerNotice("Please log in before sending a produce enquiry.", "info");
      setModal("login");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const buyerName = formData.get("buyerName").trim();
    const contact = formData.get("contact").trim();
    const quantity = formData.get("quantity").trim();
    const messageText = formData.get("message").trim();

    if (!selectedCrop?._id || selectedCrop.isDemo) {
      triggerNotice("This is a demo listing. Try submitting an enquiry on live farmer crops!", "info");
      setModal("");
      return;
    }

    const buyerEmail = contact.includes("@") ? contact : currentUser.email;
    const fullMessage = `Requirement: ${quantity ? `${quantity} needed` : "Bulk purchase enquiry"}
Phone/Contact: ${contact}
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
          message: fullMessage,
          cropId: selectedCrop._id
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Could not submit enquiry.");
      }

      triggerNotice(
        `Enquiry sent to farmer ${selectedCrop.farmerName}! You can track responses anytime in your Buyer Dashboard.`,
        "success"
      );
      setModal("");
    } catch (error) {
      triggerNotice(error.message || "Failed to submit enquiry.", "error");
    }
  }

  async function openFarmerDashboard() {
    const token = sessionStorage.getItem("agroconnectToken");

    if (!token || !currentUser) {
      triggerNotice("Please log in to open your Farmer Dashboard.", "info");
      setModal("login");
      return;
    }

    if (currentUser.role !== "Farmer") {
      triggerNotice("The Farmer Dashboard is exclusive to Farmer accounts.", "info");
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
        throw new Error("Could not load dashboard data from server.");
      }

      const [listings, enquiries] = await Promise.all([
        listingsRes.json(),
        enquiriesRes.json()
      ]);

      setDashboardListings(Array.isArray(listings) ? listings : []);
      setDashboardEnquiries(Array.isArray(enquiries) ? enquiries : []);
    } catch (error) {
      triggerNotice(error.message || "Failed to load dashboard data.", "error");
    } finally {
      setDashboardLoading(false);
    }
  }

  async function openBuyerDashboard() {
    const token = sessionStorage.getItem("agroconnectToken");

    if (!token || !currentUser) {
      triggerNotice("Please log in to check your Buyer Dashboard.", "info");
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
        throw new Error(data.message || "Could not update status.");
      }

      setDashboardEnquiries((current) =>
        current.map((item) => (item._id === enquiryId ? { ...item, status } : item))
      );

      triggerNotice(`Enquiry status updated to "${status}".`, "success");
    } catch (error) {
      triggerNotice(error.message || "Failed to update enquiry status.", "error");
    }
  }

  // Dashboard counter statistics
  const farmerPendingCount = dashboardEnquiries.filter((e) => e.status === "Pending").length;
  const farmerRespondedCount = dashboardEnquiries.filter((e) => e.status === "Responded").length;
  const farmerClosedCount = dashboardEnquiries.filter((e) => e.status === "Closed").length;

  const buyerPendingCount = buyerEnquiries.filter((e) => e.status === "Pending").length;
  const buyerRespondedCount = buyerEnquiries.filter((e) => e.status === "Responded").length;
  const buyerClosedCount = buyerEnquiries.filter((e) => e.status === "Closed").length;

  // Live estimated batch value in crop creation
  const estimatedBatchValue =
    Number(listing.price) > 0 && Number(listing.quantity) > 0
      ? (Number(listing.price) * Number(listing.quantity)).toLocaleString("en-IN")
      : null;

  return (
    <div className="agro-app">
      {/* GLOBAL TOAST NOTIFICATION */}
      {notice && (
        <div className={`toast-banner toast-${notice.type}`} role="alert">
          <div className="toast-body">
            {notice.type === "success" && <CheckCircle2 className="toast-icon success" size={20} />}
            {notice.type === "error" && <AlertCircle className="toast-icon error" size={20} />}
            {notice.type === "info" && <Sparkles className="toast-icon info" size={20} />}
            <span className="toast-text">{notice.message}</span>
          </div>
          <button className="toast-close" onClick={() => setNotice(null)} aria-label="Close alert">
            <X size={16} />
          </button>
        </div>
      )}

      {/* TOP REGIONAL BANNER */}
      <div className="top-regional-banner">
        <div className="banner-inner">
          <div className="banner-left">
            <span className="regional-tag">🌾 Andhra Pradesh Agri Portal</span>
            <span className="banner-sep">|</span>
            <span className="banner-subtext">Direct trade between local farmers & wholesale/retail buyers · Zero Commission</span>
          </div>
          <div className="banner-right">
            <span className="location-pill">📍 Focus: Tuni, Godavari & AP Mandals</span>
          </div>
        </div>
      </div>

      {/* NAVIGATION BAR */}
      <nav className="main-navbar">
        <div className="navbar-container">
          <a className="brand-logo" href="#home">
            <div className="brand-icon-box">
              <Sprout className="sprout-icon" size={24} />
            </div>
            <div className="brand-text">
              <span className="brand-title">AgroConnect</span>
              <span className="brand-telugu">రైతు సేవా వేదిక</span>
            </div>
          </a>

          <div className="nav-center-links">
            <a href="#marketplace" className="nav-link active">
              <Store size={16} />
              <span>Marketplace (సంత)</span>
            </a>
            <a href="#how-it-works" className="nav-link">
              <Layers size={16} />
              <span>How It Works</span>
            </a>
            <a href="#farmer-section" className="nav-link">
              <Tractor size={16} />
              <span>For Farmers (రైతులకు)</span>
            </a>
          </div>

          <div className="nav-actions">
            {currentUser ? (
              <div className="user-action-cluster">
                {currentUser.role === "Farmer" ? (
                  <>
                    <button className="btn-primary-glow" onClick={openListingModal}>
                      <Plus size={16} />
                      <span>List Crop (పంట నమోదు)</span>
                    </button>
                    <button className="btn-dashboard-pill" onClick={openFarmerDashboard}>
                      <Tractor size={17} />
                      <span>Farmer Dashboard</span>
                      {farmerPendingCount > 0 && <span className="badge-count-pulse">{farmerPendingCount}</span>}
                    </button>
                  </>
                ) : (
                  <button className="btn-dashboard-pill" onClick={openBuyerDashboard}>
                    <ShoppingCart size={17} />
                    <span>Buyer Dashboard</span>
                    {buyerRespondedCount > 0 && <span className="badge-count-pulse">{buyerRespondedCount}</span>}
                  </button>
                )}

                <div className="user-profile-badge">
                  <div className="profile-avatar">
                    {currentUser.role === "Farmer" ? "🧑‍🌾" : "🛒"}
                  </div>
                  <div className="profile-info">
                    <span className="profile-name">{currentUser.name}</span>
                    <span className="profile-role">{currentUser.role}</span>
                  </div>
                </div>

                <button className="btn-logout" onClick={handleLogout} title="Log out">
                  Logout
                </button>
              </div>
            ) : (
              <div className="guest-action-cluster">
                <button
                  className="btn-text-login"
                  onClick={() => {
                    setAccount({ name: "", email: "", password: "", role: "Buyer" });
                    setModal("login");
                  }}
                >
                  <User size={16} />
                  <span>Log In</span>
                </button>
                <button
                  className="btn-register-highlight"
                  onClick={() => {
                    setAccount({ name: "", email: "", password: "", role: "Farmer" });
                    setModal("register");
                  }}
                >
                  <Sparkles size={16} />
                  <span>Join AgroConnect</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="hero-section" id="home">
        <div className="hero-content">
          <div className="hero-badge">
            <Award size={15} />
            <span>Fair Prices Directly To Farmers · Fresh Quality For Buyers</span>
          </div>

          <h1 className="hero-heading">
            Direct Farm Marketplace for <br />
            <span className="text-highlight-green">Hardworking Farmers</span> &amp; <span className="text-highlight-amber">Smart Buyers</span>
          </h1>

          <p className="hero-description">
            Connecting agriculture growers across Tuni, Kakinada, and Andhra Pradesh directly with wholesale traders, grocery businesses, and families. No mandi commissions, no hidden middleman cuts.
          </p>

          <div className="hero-interactive-cards">
            {/* FARMER QUICK CARD */}
            <div className="role-promo-card card-farmer">
              <div className="promo-badge">రైతుల కోసం · FOR FARMERS</div>
              <div className="promo-header">
                <div className="promo-icon farmer-bg">
                  <Tractor size={28} />
                </div>
                <div>
                  <h3>Sell Your Harvest Directly</h3>
                  <p>Get true market rates. List in 2 minutes and receive buyer calls.</p>
                </div>
              </div>
              <ul className="promo-points">
                <li><Check size={14} /> 100% Free - Zero brokerage fees</li>
                <li><Check size={14} /> Direct buyer WhatsApp &amp; phone inquiries</li>
                <li><Check size={14} /> Instant price transparency</li>
              </ul>
              <button className="btn-promo-action farmer-btn" onClick={openListingModal}>
                <Plus size={16} />
                <span>+ List Your Produce (పంటను అమ్మండి)</span>
              </button>
            </div>

            {/* BUYER QUICK CARD */}
            <div className="role-promo-card card-buyer">
              <div className="promo-badge">కొనుగోలుదారులకు · FOR BUYERS</div>
              <div className="promo-header">
                <div className="promo-icon buyer-bg">
                  <ShoppingCart size={28} />
                </div>
                <div>
                  <h3>Source Farm-Fresh Produce</h3>
                  <p>Discover paddy, red chillies, spices, and fresh vegetables from local farms.</p>
                </div>
              </div>
              <ul className="promo-points">
                <li><Check size={14} /> Direct origin quality from verified AP growers</li>
                <li><Check size={14} /> Wholesale lots &amp; competitive farm gate rates</li>
                <li><Check size={14} /> Direct negotiations &amp; sample inspection</li>
              </ul>
              <a className="btn-promo-action buyer-btn" href="#marketplace">
                <Search size={16} />
                <span>Browse Harvests (పంటల సంత)</span>
              </a>
            </div>
          </div>

          <div className="trust-ribbon">
            <div className="trust-item">
              <ShieldCheck className="trust-icon" size={20} />
              <div>
                <strong>Verified Farmers</strong>
                <span>Direct regional growers</span>
              </div>
            </div>
            <div className="trust-item">
              <DollarSign className="trust-icon" size={20} />
              <div>
                <strong>Zero Commission</strong>
                <span>100% money stays with farmers</span>
              </div>
            </div>
            <div className="trust-item">
              <Phone className="trust-icon" size={20} />
              <div>
                <strong>Direct Contact</strong>
                <span>Call &amp; negotiate directly</span>
              </div>
            </div>
            <div className="trust-item">
              <MapPin className="trust-icon" size={20} />
              <div>
                <strong>Local Sourcing</strong>
                <span>Tuni, Godavari &amp; AP region</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* HOW IT WORKS SECTION */}
      <section className="how-it-works-section" id="how-it-works">
        <div className="section-container">
          <div className="section-title-center">
            <span className="eyebrow-chip">SIMPLE 3-STEP SYSTEM</span>
            <h2>How AgroConnect Works for Everyone</h2>
            <p>Designed to be crystal-clear, fast, and accessible on any mobile phone.</p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-icon-wrap">
                <Tractor size={30} />
              </div>
              <h3>Farmer Lists Produce</h3>
              <p>Farmer inputs crop name, available quantity, price per kg/bag, and town location in under 2 minutes.</p>
            </div>

            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-icon-wrap">
                <Search size={30} />
              </div>
              <h3>Buyer Browses &amp; Enquires</h3>
              <p>Traders and consumers search by crop or town, view verified farm prices, and submit direct enquiries.</p>
            </div>

            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-icon-wrap">
                <CheckCircle2 size={30} />
              </div>
              <h3>Direct Deal &amp; Delivery</h3>
              <p>Farmer and buyer connect directly via phone/WhatsApp to finalize pickup, transport, and instant payment.</p>
            </div>
          </div>
        </div>
      </section>

      {/* MARKETPLACE SECTION */}
      <main className="marketplace-section" id="marketplace">
        <div className="section-container">
          <div className="marketplace-header-row">
            <div>
              <div className="market-badge">
                <Store size={15} />
                <span>DIRECT AGRI-EXCHANGE</span>
              </div>
              <h2>Fresh Harvests Available Today</h2>
              <p>Browse fresh farm produce verified directly from growers across Andhra Pradesh.</p>
            </div>

            <button className="btn-add-crop-accent" onClick={openListingModal}>
              <Plus size={18} />
              <span>List Your Crop (పంట చేర్చండి)</span>
            </button>
          </div>

          {/* SEARCH & FILTERS BAR */}
          <div className="filter-panel-card">
            <div className="search-input-group">
              <Search className="search-icon-inside" size={20} />
              <input
                type="text"
                className="search-field"
                placeholder="Search crops (e.g. Sona Masoori, Chilli, Tomato), farmers, or towns..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search crops"
              />
              {search && (
                <button className="search-clear-btn" onClick={() => setSearch("")} aria-label="Clear search">
                  <X size={16} />
                </button>
              )}
            </div>

            {/* SORT & LOCATION SELECTORS */}
            <div className="filter-controls-row">
              <div className="filter-control-item">
                <MapPin size={15} className="control-icon" />
                <label htmlFor="locationSelect">Location:</label>
                <select
                  id="locationSelect"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="control-select"
                >
                  {popularLocations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc === "All" ? "All Locations (అన్ని ప్రాంతాలు)" : loc}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-control-item">
                <SlidersHorizontal size={15} className="control-icon" />
                <label htmlFor="sortSelect">Sort By:</label>
                <select
                  id="sortSelect"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="control-select"
                >
                  <option value="featured">Featured First</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="qty-desc">Largest Quantity First</option>
                </select>
              </div>

              <div className="results-counter-pill">
                <strong>{filteredCrops.length}</strong> crops available
              </div>
            </div>

            {/* CATEGORY TABS */}
            <div className="category-chips-row" role="tablist">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`category-tab-btn ${category === cat.id ? "active" : ""}`}
                  onClick={() => setCategory(cat.id)}
                  role="tab"
                  aria-selected={category === cat.id}
                >
                  <span className="cat-icon">{cat.icon}</span>
                  <span className="cat-label">{cat.label}</span>
                  <span className="cat-telugu">({cat.telugu})</span>
                </button>
              ))}
            </div>
          </div>

          {/* CROPS GRID */}
          {loading ? (
            <div className="state-box loading-box">
              <RefreshCw className="spinner-icon" size={32} />
              <h3>Loading Fresh Produce...</h3>
              <p>Fetching active harvest listings directly from farmers.</p>
            </div>
          ) : filteredCrops.length > 0 ? (
            <div className="crops-grid">
              {filteredCrops.map((crop, index) => {
                const theme = getCropVisualTheme(crop.name, crop.category);
                const teluguName = getCropTeluguTag(crop.name, crop.category);
                const isOwner =
                  currentUser &&
                  (crop.farmer === currentUser.id ||
                    crop.farmer?._id === currentUser.id ||
                    crop.farmer === currentUser._id);

                const totalVal =
                  crop.price && crop.quantity
                    ? (crop.price * crop.quantity).toLocaleString("en-IN")
                    : null;

                return (
                  <article className="crop-card-modern" key={crop._id || index}>
                    <div className={`crop-card-banner ${theme.bgClass}`}>
                      <div className="card-top-badges">
                        <span className="pill-category">{crop.category}</span>
                        {isOwner ? (
                          <span className="pill-owner">Your Listing</span>
                        ) : crop.isDemo ? (
                          <span className="pill-sample">Sample Harvest</span>
                        ) : (
                          <span className="pill-fresh">Fresh Stock</span>
                        )}
                      </div>

                      <div className="crop-center-emoji" aria-hidden="true">
                        {theme.emoji}
                      </div>

                      <div className="crop-telugu-subtag">
                        <span>{teluguName}</span>
                      </div>
                    </div>

                    <div className="crop-card-body">
                      <div className="crop-heading-area">
                        <h3 className="crop-name">{crop.name}</h3>
                        <div className="crop-location-badge">
                          <MapPin size={13} />
                          <span>{crop.location}</span>
                        </div>
                      </div>

                      <div className="farmer-attribution">
                        <div className="farmer-avatar-mini">🧑‍🌾</div>
                        <div className="farmer-meta">
                          <span className="farmer-name">{crop.farmerName || "Verified Local Farmer"}</span>
                          <span className="verified-status">
                            <CheckCircle2 size={12} /> Verified Grower
                          </span>
                        </div>
                      </div>

                      {crop.description && (
                        <p className="crop-notes">"{crop.description}"</p>
                      )}

                      <div className="crop-specs-container">
                        <div className="spec-item">
                          <span className="spec-label">Available Lot:</span>
                          <strong className="spec-value">{crop.quantity} {crop.unit || "kg"}</strong>
                        </div>
                        {totalVal && (
                          <div className="spec-item right">
                            <span className="spec-label">Total Lot Value:</span>
                            <span className="spec-value-sub">~₹{totalVal}</span>
                          </div>
                        )}
                      </div>

                      <div className="crop-price-action-bar">
                        <div className="price-box">
                          <span className="price-tag-label">Farmer Rate</span>
                          <div className="price-main">
                            <span className="currency-symbol">₹</span>
                            <span className="price-amount">{crop.price}</span>
                            <span className="price-unit">/{crop.unit || "kg"}</span>
                          </div>
                        </div>

                        {isOwner ? (
                          <button className="btn-manage-crop" onClick={openFarmerDashboard}>
                            <Edit2 size={15} />
                            <span>Manage</span>
                          </button>
                        ) : (
                          <button className="btn-enquire-crop" onClick={() => showEnquiry(crop)}>
                            <span>Enquire / కొనుగోలు</span>
                            <ArrowRight size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="state-box empty-box">
              <div className="empty-icon-circle">🌱</div>
              <h3>No matching crops found</h3>
              <p>We couldn't find any produce matching "{search}" in {locationFilter === "All" ? "any location" : locationFilter}.</p>
              <div className="empty-actions">
                <button
                  className="btn-reset-filters"
                  onClick={() => {
                    setSearch("");
                    setCategory("All");
                    setLocationFilter("All");
                  }}
                >
                  Clear All Filters (అన్ని ఫిల్టర్లు తొలగించండి)
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* FARMER OUTREACH BANNER */}
      <section className="farmer-outreach-section" id="farmer-section">
        <div className="section-container">
          <div className="outreach-card">
            <div className="outreach-text">
              <span className="outreach-eyebrow">రైతు సోదరులారా · FOR ALL GROWERS</span>
              <h2>Earn Fair Value for Every Kilo of Your Harvest</h2>
              <p>
                Don't sell for low mandi prices to middlemen. On AgroConnect, retail buyers and bulk traders from Andhra Pradesh contact you directly to purchase your crops at fair prices.
              </p>
              <div className="outreach-highlights">
                <div><CheckCircle2 size={16} /> Free listing forever</div>
                <div><CheckCircle2 size={16} /> Direct payment to your bank/UPI</div>
                <div><CheckCircle2 size={16} /> Complete control over your pricing</div>
              </div>
            </div>
            <div className="outreach-action">
              <button className="btn-outreach-cta" onClick={openListingModal}>
                <Plus size={18} />
                <span>List Your Harvest Now (పంట నమోదు చేయండి)</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* MODERN FOOTER */}
      <footer className="agro-footer">
        <div className="footer-container">
          <div className="footer-main-row">
            <div className="footer-brand-col">
              <div className="brand-logo footer-logo">
                <div className="brand-icon-box">
                  <Sprout size={22} />
                </div>
                <div className="brand-text">
                  <span className="brand-title">AgroConnect</span>
                  <span className="brand-telugu">రైతు సేవా వేదిక</span>
                </div>
              </div>
              <p className="footer-summary">
                Direct agricultural marketplace empowering local farmers in Tuni, East Godavari, and Andhra Pradesh to trade transparently with buyers.
              </p>
            </div>

            <div className="footer-nav-col">
              <h4>Quick Links</h4>
              <a href="#marketplace">Marketplace (సంత)</a>
              <a href="#how-it-works">How It Works</a>
              <a href="#farmer-section">For Farmers</a>
              <button className="footer-link-btn" onClick={openListingModal}>List Produce</button>
            </div>

            <div className="footer-nav-col">
              <h4>Account Portals</h4>
              {currentUser ? (
                <>
                  {currentUser.role === "Farmer" ? (
                    <button className="footer-link-btn" onClick={openFarmerDashboard}>Farmer Dashboard</button>
                  ) : (
                    <button className="footer-link-btn" onClick={openBuyerDashboard}>Buyer Dashboard</button>
                  )}
                  <button className="footer-link-btn" onClick={handleLogout}>Log Out</button>
                </>
              ) : (
                <>
                  <button className="footer-link-btn" onClick={() => { setAccount({ ...account, role: "Farmer" }); setModal("register"); }}>Join as Farmer</button>
                  <button className="footer-link-btn" onClick={() => { setAccount({ ...account, role: "Buyer" }); setModal("register"); }}>Join as Buyer</button>
                  <button className="footer-link-btn" onClick={() => setModal("login")}>Sign In</button>
                </>
              )}
            </div>
          </div>

          <div className="footer-bottom-bar">
            <span>© {new Date().getFullYear()} AgroConnect · Connecting AP Farmers &amp; Buyers</span>
            <span className="footer-tagline">100% Direct · Zero Middlemen · Andhra Pradesh</span>
          </div>
        </div>
      </footer>

      {/* ========================================================= */}
      {/* MODALS */}
      {/* ========================================================= */}
      {modal && (
        <div className="modal-backdrop-modern" onClick={() => setModal("")}>
          <div
            className={`modal-window ${modal === "dashboard" || modal === "buyerDashboard" ? "modal-large" : ""}`}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close-round" onClick={() => setModal("")} aria-label="Close dialog">
              <X size={18} />
            </button>

            {/* ----------------------------------------------------- */}
            {/* 1. FARMER: POST CROP MODAL */}
            {/* ----------------------------------------------------- */}
            {modal === "listing" && (
              <div className="modal-inner-scroll">
                <div className="modal-title-bar">
                  <div className="modal-title-icon-box green">
                    <Plus size={22} />
                  </div>
                  <div>
                    <span className="modal-eyebrow">రైతు పంట నమోదు · FOR FARMERS</span>
                    <h2>List Your Harvest for Sale</h2>
                    <p>Enter your produce details so verified buyers can view and send purchase enquiries.</p>
                  </div>
                </div>

                {/* Quick suggestions */}
                <div className="suggestion-box">
                  <span className="suggestion-label">Quick Pick Popular Crops:</span>
                  <div className="suggestion-chips">
                    {popularCropsSuggestions.map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        className="suggestion-chip-btn"
                        onClick={() =>
                          setListing({
                            ...listing,
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

                <form onSubmit={submitListing} className="modern-form">
                  <div className="form-group">
                    <label htmlFor="cropName">Crop Name &amp; Variety (పంట పేరు)</label>
                    <input
                      id="cropName"
                      required
                      placeholder="e.g. Sona Masoori Rice, Guntur Teja Chillies, Country Tomatoes"
                      value={listing.name}
                      onChange={(e) => setListing({ ...listing, name: e.target.value })}
                    />
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label htmlFor="cropCategory">Category (రకం)</label>
                      <select
                        id="cropCategory"
                        value={listing.category}
                        onChange={(e) => setListing({ ...listing, category: e.target.value })}
                      >
                        {categories.filter((c) => c.id !== "All").map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label} ({c.telugu})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="cropUnit">Unit of Sale (కొలత యూనిట్)</label>
                      <select
                        id="cropUnit"
                        value={listing.unit}
                        onChange={(e) => setListing({ ...listing, unit: e.target.value })}
                      >
                        <option value="kg">Kilograms (kg)</option>
                        <option value="quintal">Quintal (100 kg)</option>
                        <option value="bag">Bag (50 kg)</option>
                        <option value="tonne">Tonne (1000 kg)</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label htmlFor="cropPrice">Price per {listing.unit} (ధర ₹)</label>
                      <input
                        id="cropPrice"
                        type="number"
                        min="0.1"
                        step="0.1"
                        required
                        placeholder="e.g. 28"
                        value={listing.price}
                        onChange={(e) => setListing({ ...listing, price: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="cropQty">Available Quantity (స్టాక్ మొత్తం)</label>
                      <input
                        id="cropQty"
                        type="number"
                        min="1"
                        step="1"
                        required
                        placeholder="e.g. 500"
                        value={listing.quantity}
                        onChange={(e) => setListing({ ...listing, quantity: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* LIVE ESTIMATED REVENUE CALCULATOR */}
                  {estimatedBatchValue && (
                    <div className="calculator-preview-box">
                      <Scale size={18} className="calc-icon" />
                      <div>
                        <strong>Estimated Harvest Value: ₹{estimatedBatchValue}</strong>
                        <span>({listing.quantity} {listing.unit} × ₹{listing.price})</span>
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="cropLocation">Farm / Town Location (గ్రామం / మండలం)</label>
                    <input
                      id="cropLocation"
                      required
                      placeholder="e.g. Tuni, Anakapalli, Prathipadu, Kakinada Dist"
                      value={listing.location}
                      onChange={(e) => setListing({ ...listing, location: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="cropDesc">Harvest &amp; Quality Notes (నాణ్యత వివరాలు - ఐచ్ఛికం)</label>
                    <textarea
                      id="cropDesc"
                      rows="2"
                      placeholder="e.g. Grade A quality, dried naturally in sun, moisture 12%, pesticide-free."
                      value={listing.description}
                      onChange={(e) => setListing({ ...listing, description: e.target.value })}
                    />
                  </div>

                  <div className="form-actions-row">
                    <button type="submit" className="btn-modal-submit green">
                      <Check size={18} />
                      <span>Publish Crop to Marketplace →</span>
                    </button>
                    <button type="button" className="btn-modal-cancel" onClick={() => setModal("")}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ----------------------------------------------------- */}
            {/* 2. FARMER: EDIT CROP MODAL */}
            {/* ----------------------------------------------------- */}
            {modal === "editCrop" && editingCrop && (
              <div className="modal-inner-scroll">
                <div className="modal-title-bar">
                  <div className="modal-title-icon-box amber">
                    <Edit2 size={22} />
                  </div>
                  <div>
                    <span className="modal-eyebrow">UPDATE DETAILS</span>
                    <h2>Edit Crop Listing</h2>
                    <p>Adjust price, stock, or location for {editingCrop.name}.</p>
                  </div>
                </div>

                <form onSubmit={submitEditCrop} className="modern-form">
                  <div className="form-group">
                    <label>Crop Name</label>
                    <input
                      required
                      value={editingCrop.name}
                      onChange={(e) => setEditingCrop({ ...editingCrop, name: e.target.value })}
                    />
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Category</label>
                      <select
                        value={editingCrop.category}
                        onChange={(e) => setEditingCrop({ ...editingCrop, category: e.target.value })}
                      >
                        {categories.filter((c) => c.id !== "All").map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label} ({c.telugu})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Unit</label>
                      <select
                        value={editingCrop.unit}
                        onChange={(e) => setEditingCrop({ ...editingCrop, unit: e.target.value })}
                      >
                        <option value="kg">kg</option>
                        <option value="quintal">quintal</option>
                        <option value="bag">bag</option>
                        <option value="tonne">tonne</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Price per {editingCrop.unit} (₹)</label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        required
                        value={editingCrop.price}
                        onChange={(e) => setEditingCrop({ ...editingCrop, price: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Available Quantity</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={editingCrop.quantity}
                        onChange={(e) => setEditingCrop({ ...editingCrop, quantity: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Farm Location</label>
                    <input
                      required
                      value={editingCrop.location}
                      onChange={(e) => setEditingCrop({ ...editingCrop, location: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Quality &amp; Harvest Notes</label>
                    <textarea
                      rows="2"
                      value={editingCrop.description || ""}
                      onChange={(e) => setEditingCrop({ ...editingCrop, description: e.target.value })}
                    />
                  </div>

                  <div className="form-actions-row">
                    <button type="submit" className="btn-modal-submit green">
                      <Check size={18} />
                      <span>Save Changes</span>
                    </button>
                    <button type="button" className="btn-modal-cancel" onClick={() => setModal("dashboard")}>
                      Back to Dashboard
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ----------------------------------------------------- */}
            {/* 3. AUTHENTICATION: LOGIN & REGISTER */}
            {/* ----------------------------------------------------- */}
            {(modal === "login" || modal === "register") && (
              <div className="modal-inner-scroll">
                <div className="auth-tab-switch">
                  <button
                    className={`auth-tab-btn ${modal === "login" ? "active" : ""}`}
                    onClick={() => setModal("login")}
                  >
                    Log In (లాగిన్)
                  </button>
                  <button
                    className={`auth-tab-btn ${modal === "register" ? "active" : ""}`}
                    onClick={() => setModal("register")}
                  >
                    Register Free (కొత్త ఖాతా)
                  </button>
                </div>

                <div className="modal-title-bar">
                  <div>
                    <h2>{modal === "register" ? "Create Your Free Account" : "Welcome Back to AgroConnect"}</h2>
                    <p>
                      {modal === "register"
                        ? "Join as a Farmer to sell your harvest, or as a Buyer to purchase directly from growers."
                        : "Enter your credentials to manage your crop listings and purchase enquiries."}
                    </p>
                  </div>
                </div>

                <form onSubmit={submitAccount} className="modern-form">
                  {modal === "register" && (
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
                          <strong>I am a Farmer (రైతు)</strong>
                          <small>List produce, set rates &amp; receive direct buyer calls</small>
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
                          <strong>I am a Buyer (కొనుగోలుదారు)</strong>
                          <small>Source farm-fresh produce directly from local farms</small>
                        </div>
                      </label>
                    </div>
                  )}

                  {modal === "register" && (
                    <div className="form-group">
                      <label htmlFor="accName">Full Name (మీ పూర్తి పేరు)</label>
                      <input
                        id="accName"
                        required
                        placeholder="e.g. Ramesh Varma or Rajesh Kumar"
                        value={account.name}
                        onChange={(e) => setAccount({ ...account, name: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="accEmail">Email Address (ఈమెయిల్)</label>
                    <input
                      id="accEmail"
                      type="email"
                      required
                      placeholder="e.g. farmer@gmail.com"
                      value={account.email}
                      onChange={(e) => setAccount({ ...account, email: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="accPassword">Password (పాస్‌వర్డ్)</label>
                    <input
                      id="accPassword"
                      type="password"
                      required
                      minLength={8}
                      placeholder="At least 8 characters"
                      value={account.password}
                      onChange={(e) => setAccount({ ...account, password: e.target.value })}
                    />
                  </div>

                  <button type="submit" className="btn-modal-submit green full-width">
                    <span>{modal === "register" ? "Create Free Account →" : "Sign In to AgroConnect →"}</span>
                  </button>

                  <div className="auth-footer-prompt">
                    {modal === "register" ? (
                      <p>
                        Already have an account?{" "}
                        <button type="button" onClick={() => setModal("login")} className="link-text">
                          Log in here
                        </button>
                      </p>
                    ) : (
                      <p>
                        Don't have an account yet?{" "}
                        <button type="button" onClick={() => setModal("register")} className="link-text">
                          Create account for free
                        </button>
                      </p>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* ----------------------------------------------------- */}
            {/* 4. BUYER: ENQUIRY MODAL */}
            {/* ----------------------------------------------------- */}
            {modal === "enquiry" && selectedCrop && (
              <div className="modal-inner-scroll">
                <div className="modal-title-bar">
                  <div className="modal-title-icon-box green">
                    <MessageSquare size={22} />
                  </div>
                  <div>
                    <span className="modal-eyebrow">BUYER DIRECT ENQUIRY</span>
                    <h2>Enquire with Farmer</h2>
                    <p>Send your purchase requirement directly to the grower.</p>
                  </div>
                </div>

                {/* Crop summary card inside modal */}
                <div className="enquiry-crop-preview-box">
                  <div className="preview-emoji">{getCropVisualTheme(selectedCrop.name, selectedCrop.category).emoji}</div>
                  <div className="preview-details">
                    <h4>{selectedCrop.name}</h4>
                    <span className="preview-location">📍 {selectedCrop.location} · Grower: {selectedCrop.farmerName || "Local Farmer"}</span>
                    <div className="preview-price-tag">
                      <strong>₹{selectedCrop.price}</strong> /{selectedCrop.unit || "kg"} · Stock: {selectedCrop.quantity} {selectedCrop.unit || "kg"}
                    </div>
                  </div>
                </div>

                <form onSubmit={submitEnquiry} className="modern-form">
                  <div className="form-group">
                    <label htmlFor="buyerNameInput">Your Name (మీ పేరు)</label>
                    <input
                      id="buyerNameInput"
                      name="buyerName"
                      required
                      defaultValue={currentUser?.name || ""}
                      placeholder="e.g. S. Venkata Rao"
                    />
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label htmlFor="contactInput">Contact Phone / WhatsApp (ఫోన్ నంబర్)</label>
                      <input
                        id="contactInput"
                        name="contact"
                        required
                        defaultValue={currentUser?.email || ""}
                        placeholder="e.g. 9848012345 or email"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="qtyInput">Quantity Needed ({selectedCrop.unit || "kg"})</label>
                      <input
                        id="qtyInput"
                        name="quantity"
                        required
                        placeholder={`e.g. 50 ${selectedCrop.unit || "kg"}`}
                      />
                    </div>
                  </div>

                  {/* Quick message suggestions */}
                  <div className="quick-template-row">
                    <span className="template-label">Quick Message Suggestions:</span>
                    <div className="template-buttons">
                      <button
                        type="button"
                        onClick={() => setEnquiryMessage("Is rate negotiable for bulk purchase? Can arrange own pickup.")}
                      >
                        Negotiate Bulk Rate?
                      </button>
                      <button
                        type="button"
                        onClick={() => setEnquiryMessage("Can I inspect a sample lot first? Looking for ongoing supply.")}
                      >
                        Inspect Sample Lot?
                      </button>
                      <button
                        type="button"
                        onClick={() => setEnquiryMessage("Ready for immediate pickup. Please contact via WhatsApp/phone.")}
                      >
                        Immediate Pickup Ready
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="enquiryMsgInput">Message &amp; Requirements to Farmer</label>
                    <textarea
                      id="enquiryMsgInput"
                      name="message"
                      rows="3"
                      value={enquiryMessage}
                      onChange={(e) => setEnquiryMessage(e.target.value)}
                      placeholder="Mention preferred delivery or pickup timeline, quality questions, or negotiation..."
                    />
                  </div>

                  <div className="form-actions-row">
                    <button type="submit" className="btn-modal-submit green">
                      <MessageSquare size={18} />
                      <span>Send Enquiry to Farmer →</span>
                    </button>
                    <button type="button" className="btn-modal-cancel" onClick={() => setModal("")}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ----------------------------------------------------- */}
            {/* 5. FARMER DASHBOARD MODAL */}
            {/* ----------------------------------------------------- */}
            {modal === "dashboard" && (
              <div className="modal-inner-scroll">
                <div className="dashboard-top-header">
                  <div>
                    <span className="modal-eyebrow">FARMER PORTAL · రైతు నిర్వహణ కేంద్రం</span>
                    <h2>Farmer Management Center</h2>
                    <p>Track your active crop listings and review buyer purchase enquiries.</p>
                  </div>
                  <div className="dashboard-action-buttons">
                    <button className="btn-dashboard-refresh" onClick={openFarmerDashboard} title="Refresh">
                      <RefreshCw size={15} />
                      <span>Refresh</span>
                    </button>
                    <button className="btn-dashboard-add" onClick={() => setModal("listing")}>
                      <Plus size={16} />
                      <span>Add New Crop</span>
                    </button>
                  </div>
                </div>

                {dashboardLoading ? (
                  <div className="state-box loading-box">
                    <RefreshCw className="spinner-icon" size={28} />
                    <h3>Loading your farmer dashboard...</h3>
                  </div>
                ) : (
                  <>
                    {/* STATS OVERVIEW CARDS */}
                    <div className="stats-cards-grid">
                      <div className="stat-metric-card">
                        <div className="metric-icon-box green">
                          <Sprout size={20} />
                        </div>
                        <div>
                          <span className="metric-val">{dashboardListings.length}</span>
                          <span className="metric-lbl">Active Crops</span>
                        </div>
                      </div>

                      <div className="stat-metric-card">
                        <div className="metric-icon-box blue">
                          <MessageSquare size={20} />
                        </div>
                        <div>
                          <span className="metric-val">{dashboardEnquiries.length}</span>
                          <span className="metric-lbl">Total Enquiries</span>
                        </div>
                      </div>

                      <div className="stat-metric-card alert">
                        <div className="metric-icon-box amber">
                          <Clock size={20} />
                        </div>
                        <div>
                          <span className="metric-val">{farmerPendingCount}</span>
                          <span className="metric-lbl">Pending Response</span>
                        </div>
                      </div>

                      <div className="stat-metric-card success">
                        <div className="metric-icon-box green">
                          <CheckCircle2 size={20} />
                        </div>
                        <div>
                          <span className="metric-val">{farmerRespondedCount}</span>
                          <span className="metric-lbl">Responded</span>
                        </div>
                      </div>
                    </div>

                    {/* DASHBOARD TAB CONTROLS */}
                    <div className="dashboard-tabs-bar">
                      <button
                        className={`d-tab-btn ${dashboardTab === "all" ? "active" : ""}`}
                        onClick={() => setDashboardTab("all")}
                      >
                        All Overview
                      </button>
                      <button
                        className={`d-tab-btn ${dashboardTab === "listings" ? "active" : ""}`}
                        onClick={() => setDashboardTab("listings")}
                      >
                        My Crop Listings ({dashboardListings.length})
                      </button>
                      <button
                        className={`d-tab-btn ${dashboardTab === "enquiries" ? "active" : ""}`}
                        onClick={() => setDashboardTab("enquiries")}
                      >
                        Buyer Enquiries ({dashboardEnquiries.length})
                        {farmerPendingCount > 0 && <span className="tab-bubble-count">{farmerPendingCount}</span>}
                      </button>
                    </div>

                    {/* LISTINGS SECTION */}
                    {(dashboardTab === "all" || dashboardTab === "listings") && (
                      <div className="dashboard-content-block">
                        <div className="block-title-row">
                          <h3>My Published Crops ({dashboardListings.length})</h3>
                          <button className="btn-small-link" onClick={() => setModal("listing")}>
                            + List another crop
                          </button>
                        </div>

                        {dashboardListings.length === 0 ? (
                          <div className="dashboard-empty-state">
                            <Tractor size={36} className="empty-state-icon" />
                            <h4>You haven't listed any crops yet</h4>
                            <p>Publish your harvest to start receiving purchase offers from verified buyers.</p>
                            <button className="btn-modal-submit green" onClick={() => setModal("listing")}>
                              <Plus size={16} />
                              <span>List Your First Crop</span>
                            </button>
                          </div>
                        ) : (
                          <div className="dashboard-listings-grid">
                            {dashboardListings.map((crop) => (
                              <div className="farmer-crop-manage-card" key={crop._id}>
                                <div className="manage-card-header">
                                  <div>
                                    <span className="category-pill-sm">{crop.category}</span>
                                    <h4>{crop.name}</h4>
                                  </div>
                                  <div className="manage-price-box">
                                    <strong>₹{crop.price}</strong>
                                    <small>/{crop.unit || "kg"}</small>
                                  </div>
                                </div>

                                <div className="manage-card-meta">
                                  <span>📦 Stock: <strong>{crop.quantity} {crop.unit || "kg"}</strong></span>
                                  <span>📍 Location: <strong>{crop.location}</strong></span>
                                </div>

                                {crop.description && (
                                  <p className="manage-card-notes">"{crop.description}"</p>
                                )}

                                <div className="manage-card-buttons">
                                  <button className="btn-manage-edit" onClick={() => openEditModal(crop)}>
                                    <Edit2 size={14} />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    className="btn-manage-del"
                                    onClick={() => handleDeleteCrop(crop._id, crop.name)}
                                  >
                                    <Trash2 size={14} />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ENQUIRIES SECTION */}
                    {(dashboardTab === "all" || dashboardTab === "enquiries") && (
                      <div className="dashboard-content-block">
                        <div className="block-title-row">
                          <h3>Incoming Buyer Enquiries ({dashboardEnquiries.length})</h3>
                        </div>

                        {dashboardEnquiries.length === 0 ? (
                          <div className="dashboard-empty-state">
                            <MessageSquare size={36} className="empty-state-icon" />
                            <h4>No enquiries received yet</h4>
                            <p>When buyers browse your listings and express interest, their contact details and requirements will appear right here.</p>
                          </div>
                        ) : (
                          <div className="enquiries-list-stack">
                            {dashboardEnquiries.map((enquiry) => (
                              <div className="enquiry-detail-card" key={enquiry._id}>
                                <div className="enquiry-top-row">
                                  <div className="enquiry-crop-identifier">
                                    <span className="crop-tag-title">
                                      🌾 {enquiry.crop?.name || "Crop"} · ₹{enquiry.crop?.price || "--"} / {enquiry.crop?.unit || "kg"}
                                    </span>
                                    <span className="enquiry-timestamp">
                                      {enquiry.createdAt
                                        ? new Date(enquiry.createdAt).toLocaleDateString("en-IN", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit"
                                          })
                                        : ""}
                                    </span>
                                  </div>

                                  <span className={`status-pill-badge status-${enquiry.status.toLowerCase()}`}>
                                    {enquiry.status === "Pending" && "🕒 Pending"}
                                    {enquiry.status === "Responded" && "✅ Responded"}
                                    {enquiry.status === "Closed" && "📁 Closed"}
                                  </span>
                                </div>

                                <div className="buyer-contact-cardlet">
                                  <div className="contact-item">
                                    <User size={15} />
                                    <span><strong>Buyer:</strong> {enquiry.buyerName}</span>
                                  </div>
                                  <div className="contact-item">
                                    <Mail size={15} />
                                    <span><strong>Contact:</strong> <a href={`mailto:${enquiry.buyerEmail}`}>{enquiry.buyerEmail}</a></span>
                                  </div>
                                </div>

                                <div className="enquiry-message-bubble">
                                  <span className="msg-label">Buyer Message:</span>
                                  <p>{enquiry.message}</p>
                                </div>

                                <div className="enquiry-status-row">
                                  <label htmlFor={`enq-status-${enquiry._id}`}>Update Status:</label>
                                  <select
                                    id={`enq-status-${enquiry._id}`}
                                    className="status-select-control"
                                    value={enquiry.status}
                                    onChange={(e) => updateEnquiryStatus(enquiry._id, e.target.value)}
                                  >
                                    <option value="Pending">🕒 Pending (Awaiting contact)</option>
                                    <option value="Responded">✅ Responded (Contacted buyer)</option>
                                    <option value="Closed">📁 Closed (Deal done / finished)</option>
                                  </select>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ----------------------------------------------------- */}
            {/* 6. BUYER DASHBOARD MODAL */}
            {/* ----------------------------------------------------- */}
            {modal === "buyerDashboard" && (
              <div className="modal-inner-scroll">
                <div className="dashboard-top-header">
                  <div>
                    <span className="modal-eyebrow">BUYER TRACKER · కొనుగోలుదారు కేంద్రం</span>
                    <h2>Buyer Purchase Enquiries</h2>
                    <p>Track all produce purchase requests sent to local farmers.</p>
                  </div>
                  <div className="dashboard-action-buttons">
                    <button className="btn-dashboard-refresh" onClick={openBuyerDashboard} title="Refresh">
                      <RefreshCw size={15} />
                      <span>Refresh</span>
                    </button>
                    <button className="btn-dashboard-add" onClick={() => setModal("")}>
                      <Store size={16} />
                      <span>Browse More Crops</span>
                    </button>
                  </div>
                </div>

                {buyerLoading ? (
                  <div className="state-box loading-box">
                    <RefreshCw className="spinner-icon" size={28} />
                    <h3>Loading your enquiry history...</h3>
                  </div>
                ) : buyerError ? (
                  <div className="state-box error-box">
                    <AlertCircle size={28} />
                    <h3>{buyerError}</h3>
                    <button className="btn-modal-submit green" onClick={openBuyerDashboard}>
                      Try Again
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="stats-cards-grid">
                      <div className="stat-metric-card">
                        <div className="metric-icon-box blue">
                          <MessageSquare size={20} />
                        </div>
                        <div>
                          <span className="metric-val">{buyerEnquiries.length}</span>
                          <span className="metric-lbl">Total Sent</span>
                        </div>
                      </div>

                      <div className="stat-metric-card alert">
                        <div className="metric-icon-box amber">
                          <Clock size={20} />
                        </div>
                        <div>
                          <span className="metric-val">{buyerPendingCount}</span>
                          <span className="metric-lbl">Awaiting Reply</span>
                        </div>
                      </div>

                      <div className="stat-metric-card success">
                        <div className="metric-icon-box green">
                          <CheckCircle2 size={20} />
                        </div>
                        <div>
                          <span className="metric-val">{buyerRespondedCount}</span>
                          <span className="metric-lbl">Farmer Responded</span>
                        </div>
                      </div>

                      <div className="stat-metric-card">
                        <div className="metric-icon-box">
                          <Check size={20} />
                        </div>
                        <div>
                          <span className="metric-val">{buyerClosedCount}</span>
                          <span className="metric-lbl">Closed Deals</span>
                        </div>
                      </div>
                    </div>

                    <div className="dashboard-content-block">
                      <div className="block-title-row">
                        <h3>My Enquiry History ({buyerEnquiries.length})</h3>
                      </div>

                      {buyerEnquiries.length === 0 ? (
                        <div className="dashboard-empty-state">
                          <ShoppingCart size={36} className="empty-state-icon" />
                          <h4>No enquiries sent yet</h4>
                          <p>Explore farm-fresh paddy, chillies, and vegetables in the marketplace and connect directly with local farmers.</p>
                          <button
                            className="btn-modal-submit green"
                            onClick={() => {
                              setModal("");
                              const el = document.getElementById("marketplace");
                              if (el) el.scrollIntoView({ behavior: "smooth" });
                            }}
                          >
                            <span>Explore Marketplace (సంతకు వెళ్ళండి)</span>
                          </button>
                        </div>
                      ) : (
                        <div className="enquiries-list-stack">
                          {buyerEnquiries.map((enquiry) => (
                            <div className="enquiry-detail-card" key={enquiry._id}>
                              <div className="enquiry-top-row">
                                <div className="enquiry-crop-identifier">
                                  <span className="crop-tag-title">
                                    🌾 {enquiry.crop?.name || "Crop"}
                                  </span>
                                  {enquiry.crop?.location && (
                                    <span className="enquiry-location-sub">
                                      📍 {enquiry.crop.location} · ₹{enquiry.crop.price} / {enquiry.crop.unit}
                                    </span>
                                  )}
                                  <span className="enquiry-timestamp">
                                    Submitted:{" "}
                                    {enquiry.createdAt
                                      ? new Date(enquiry.createdAt).toLocaleDateString("en-IN", {
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric"
                                        })
                                      : ""}
                                  </span>
                                </div>

                                <span className={`status-pill-badge status-${enquiry.status.toLowerCase()}`}>
                                  {enquiry.status === "Pending" && "🕒 Awaiting Farmer Reply"}
                                  {enquiry.status === "Responded" && "✅ Farmer Responded"}
                                  {enquiry.status === "Closed" && "📁 Closed"}
                                </span>
                              </div>

                              <div className="enquiry-message-bubble">
                                <span className="msg-label">Your Requirement Sent:</span>
                                <p style={{ whiteSpace: "pre-line" }}>{enquiry.message}</p>
                              </div>

                              <div className="buyer-enquiry-footer-note">
                                <Info size={14} />
                                <span>
                                  {enquiry.status === "Pending"
                                    ? "The farmer has received your requirement and will contact you directly on your phone/email."
                                    : enquiry.status === "Responded"
                                    ? "The farmer has acknowledged your request! Please check your phone calls or WhatsApp messages."
                                    : "This enquiry has concluded."}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
