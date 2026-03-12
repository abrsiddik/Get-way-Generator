// ============================================================
// Get-wayGenerator - Bundled JS (state + templates + app combined)
// No ES module imports needed - works directly from file://
// ============================================================

// --- SECURITY: XSS sanitization helper ---
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// --- INPUT VALIDATION helpers ---
function clampRate(value) {
    const n = parseFloat(value);
    if (isNaN(n)) return 0;
    return Math.min(100, Math.max(0, n));
}

function clampPositive(value) {
    const n = parseFloat(value);
    if (isNaN(n)) return 0;
    return Math.max(0, n);
}

// --- CATEGORY SPECIFIC DATASETS ---
const categoryData = {
    hospital: {
        orgName: "City General Hospital",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Medical_cross_symbol.svg/1024px-Medical_cross_symbol.svg.png",
        address: "123 Health Ave, Dhaka, Bangladesh",
        phone: "+880 1711-000000",
        email: "billing@citygeneral.com",
        invoiceNo: "MED-2024-001",
        currency: "BDT",
        date: new Date().toISOString().split('T')[0],
        customerName: "Patient Name",
        items: [
            { id: 1, desc: "General Consultation", qty: 1, price: 1000 },
            { id: 2, desc: "Blood Test (CBC)", qty: 1, price: 450 },
            { id: 3, desc: "Chest X-Ray", qty: 1, price: 1200 }
        ],
        taxRate: 5.0,
        discountRate: 0,
        paid: 500
    },
    grocery: {
        orgName: "FreshMart Supermarket",
        logo: "https://cdn-icons-png.flaticon.com/512/3081/3081840.png",
        address: "Plot 45, Gulshan Avenue, Dhaka",
        phone: "+880 1811-000000",
        email: "sales@freshmart.com",
        invoiceNo: "GRO-88214",
        currency: "BDT",
        date: new Date().toISOString().split('T')[0],
        customerName: "Walk-in Customer",
        items: [
            { id: 1, desc: "Basmati Rice (5kg)", qty: 2, price: 850 },
            { id: 2, desc: "Soybean Oil (5L)", qty: 1, price: 910 },
            { id: 3, desc: "Farm Eggs (Dozen)", qty: 2, price: 145 }
        ],
        taxRate: 2.0,
        discountRate: 0,
        paid: 2000
    },
    education: {
        orgName: "Global Tech Academy",
        logo: "https://cdn-icons-png.flaticon.com/512/2232/2232688.png",
        address: "Sector 7, Uttara, Dhaka",
        phone: "+880 1911-000000",
        email: "accounts@globaltech.edu",
        invoiceNo: "FEE-2024-JAN",
        currency: "BDT",
        date: new Date().toISOString().split('T')[0],
        customerName: "Student Name / ID",
        items: [
            { id: 1, desc: "Monthly Tuition Fee", qty: 1, price: 5500 },
            { id: 2, desc: "Library & Lab Fee", qty: 1, price: 1200 },
            { id: 3, desc: "Exam Fee", qty: 1, price: 500 }
        ],
        taxRate: 0.0,
        discountRate: 0,
        paid: 5000
    },
    restaurant: {
        orgName: "The Spicy Spoon",
        logo: "https://cdn-icons-png.flaticon.com/512/3170/3170733.png",
        address: "Banani 11, Dhaka 1213",
        phone: "+880 1611-000000",
        email: "info@spicyspoon.com",
        invoiceNo: "CHK-4412",
        currency: "BDT",
        date: new Date().toISOString().split('T')[0],
        customerName: "Table 14",
        items: [
            { id: 1, desc: "Chicken Biryani (Full)", qty: 2, price: 450 },
            { id: 2, desc: "Borhani (Glass)", qty: 2, price: 80 },
            { id: 3, desc: "Mixed Salad", qty: 1, price: 120 }
        ],
        taxRate: 15.0,
        discountRate: 0,
        paid: 1000
    },
    transport: {
        orgName: "Fast Track Logistics",
        logo: "https://cdn-icons-png.flaticon.com/512/2766/2766156.png",
        address: "Tejgaon I/A, Dhaka",
        phone: "+880 1511-000000",
        email: "delivery@fasttrack.com",
        invoiceNo: "TRK-9901",
        currency: "BDT",
        date: new Date().toISOString().split('T')[0],
        customerName: "Acme Corp",
        items: [
            { id: 1, desc: "Inside Dhaka Delivery", qty: 10, price: 60 },
            { id: 2, desc: "Packaging Charge", qty: 1, price: 200 },
            { id: 3, desc: "Fuel Surcharge", qty: 1, price: 150 }
        ],
        taxRate: 5.0,
        discountRate: 0,
        paid: 0
    }
};

// --- STATE ---
const state = {
    currentStep: 1,
    category: "hospital",
    style: null,
    templateId: null,
    invoiceData: JSON.parse(JSON.stringify(categoryData.hospital)),
    mobileTab: 'edit'
};

// FIX: formatCurrency now accepts currency as parameter to avoid stale closure
const formatCurrency = (amount, currency) => {
    const cur = currency || state.invoiceData.currency || "BDT";
    return new Intl.NumberFormat("en-BD", {
        style: "currency",
        currency: cur,
        minimumFractionDigits: 0
    }).format(amount);
};

window.state = state;

// --- LOCALSTORAGE AUTOSAVE ---
const STORAGE_KEY = 'slipforge_autosave';

function saveToStorage() {
    try {
        const saveData = {
            category: state.category,
            style: state.style,
            templateId: state.templateId,
            invoiceData: state.invoiceData
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
    } catch (e) { /* Storage unavailable */ }
}

function showSavedToast() {
    const toast = document.getElementById('saved-toast');
    if (!toast) return;
    toast.classList.remove('opacity-0', 'translate-y-2');
    toast.classList.add('opacity-100', 'translate-y-0');
    setTimeout(() => {
        toast.classList.remove('opacity-100', 'translate-y-0');
        toast.classList.add('opacity-0', 'translate-y-2');
    }, 2000);
}

function autoSave() {
    saveToStorage();
    showSavedToast();
}


// --- BUSINESS PROFILE SAVE / LOAD ---
const PROFILE_KEY = 'gateway_business_profile';

function saveBusinessProfile() {
    try {
        const d = state.invoiceData;
        const profile = {
            orgName:  d.orgName,
            address:  d.address,
            phone:    d.phone,
            email:    d.email,
            currency: d.currency,
            logo:     d.logo || ''
        };
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
        showProfileToast('saved');
        renderEditorFormBase();   // re-render so badge updates
        renderItemsList();
    } catch (e) { /* storage unavailable */ }
}

function loadBusinessProfile() {
    try {
        const raw = localStorage.getItem(PROFILE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (e) { return null; }
}

function applyBusinessProfile() {
    const profile = loadBusinessProfile();
    if (!profile) return;
    const d = state.invoiceData;
    d.orgName  = profile.orgName  || d.orgName;
    d.address  = profile.address  || d.address;
    d.phone    = profile.phone    || d.phone;
    d.email    = profile.email    || d.email;
    d.currency = profile.currency || d.currency;
    if (profile.logo) d.logo = profile.logo;
    renderEditorFormBase();
    renderItemsList();
    renderPreview();
    showProfileToast('applied');
}

function clearBusinessProfile() {
    try {
        localStorage.removeItem(PROFILE_KEY);
        showProfileToast('cleared');
        renderEditorFormBase();
        renderItemsList();
    } catch (e) {}
}

function hasBusinessProfile() {
    // cloud profile takes priority
    if (window.hasCloudProfile && window.hasCloudProfile()) return true;
    try { return !!localStorage.getItem(PROFILE_KEY); } catch(e) { return false; }
}

function showProfileToast(type) {
    const messages = {
        saved:   '✓ Business profile saved!',
        applied: '✓ Profile applied to template',
        cleared: '✓ Profile cleared'
    };
    const colors = {
        saved:   'bg-blue-600',
        applied: 'bg-emerald-600',
        cleared: 'bg-gray-600'
    };
    const toast = document.getElementById('profile-toast');
    const msg   = document.getElementById('profile-toast-msg');
    if (!toast || !msg) return;
    msg.textContent = messages[type] || '';
    toast.className = toast.className.replace(/bg-\w+-\d+/g, colors[type] || 'bg-gray-700');
    toast.classList.remove('opacity-0', 'translate-y-2');
    toast.classList.add('opacity-100', 'translate-y-0');
    setTimeout(() => {
        toast.classList.remove('opacity-100', 'translate-y-0');
        toast.classList.add('opacity-0', 'translate-y-2');
    }, 2500);
}

// --- TEMPLATE DATABASE GENERATOR ---
const generateDatabase = () => {
    const db = [];
    const categories = ["hospital", "grocery", "education", "restaurant", "transport"];

    // --- OLD STYLE VARIANTS (6 per category) ---
    const oldVariants = [
        { suffix: "1", label: "Classic Receipt",    variant: "classic" },
        { suffix: "2", label: "Narrow Receipt",     variant: "narrow" },
        { suffix: "3", label: "Detailed Receipt",   variant: "detailed" },
        { suffix: "4", label: "Bold Receipt",       variant: "bold" },
        { suffix: "5", label: "Compact Receipt",    variant: "compact" },
        { suffix: "6", label: "Full-Width Receipt", variant: "fullwidth" },
    ];

    // --- MODERN STYLE THEMES (7 per category) ---
    const modernThemes = [
        { name: "Blue",      primary: "bg-blue-600",    secondary: "bg-blue-50",    text: "text-slate-800", accent: "text-blue-600",    border: "border-blue-200",    sideAccent: "bg-blue-600",    variant: "standard" },
        { name: "Emerald",   primary: "bg-emerald-600", secondary: "bg-emerald-50", text: "text-slate-800", accent: "text-emerald-600", border: "border-emerald-200", sideAccent: "bg-emerald-600", variant: "standard" },
        { name: "Indigo",    primary: "bg-indigo-600",  secondary: "bg-indigo-50",  text: "text-slate-800", accent: "text-indigo-600",  border: "border-indigo-200",  sideAccent: "bg-indigo-600",  variant: "standard" },
        { name: "Rose",      primary: "bg-rose-600",    secondary: "bg-rose-50",    text: "text-slate-800", accent: "text-rose-600",    border: "border-rose-200",    sideAccent: "bg-rose-600",    variant: "sidebar" },
        { name: "Violet",    primary: "bg-violet-600",  secondary: "bg-violet-50",  text: "text-slate-800", accent: "text-violet-600",  border: "border-violet-200",  sideAccent: "bg-violet-600",  variant: "sidebar" },
        { name: "Teal",      primary: "bg-teal-600",    secondary: "bg-teal-50",    text: "text-slate-800", accent: "text-teal-600",    border: "border-teal-200",    sideAccent: "bg-teal-600",    variant: "banner" },
        { name: "Slate",     primary: "bg-slate-800",   secondary: "bg-slate-50",   text: "text-slate-800", accent: "text-slate-700",   border: "border-slate-300",   sideAccent: "bg-slate-800",   variant: "banner" },
    ];

    // --- MINIMAL STYLE VARIANTS (6 per category) ---
    const minimalThemes = [
        { name: "Gray",      accent: "text-slate-800",  border: "border-slate-200", headerBg: "bg-slate-50",  variant: "classic" },
        { name: "Blue",      accent: "text-blue-700",   border: "border-blue-100",  headerBg: "bg-blue-50",   variant: "classic" },
        { name: "Green",     accent: "text-emerald-700",border: "border-emerald-100",headerBg:"bg-emerald-50", variant: "classic" },
        { name: "Rose",      accent: "text-rose-700",   border: "border-rose-100",  headerBg: "bg-rose-50",   variant: "centered" },
        { name: "Dark",      accent: "text-gray-900",   border: "border-gray-900",  headerBg: "bg-gray-900",  variant: "dark" },
        { name: "Serif",     accent: "text-amber-800",  border: "border-amber-200", headerBg: "bg-amber-50",  variant: "serif" },
    ];

    // --- TRENDY STYLE THEMES (8 per category) ---
    const trendyThemes = [
        { name: "Neon Indigo",   primary: "bg-gradient-to-br from-indigo-500 to-purple-600",   text: "text-slate-900", accent: "text-indigo-500",  variant: "standard" },
        { name: "Sunset Glow",   primary: "bg-gradient-to-br from-rose-500 to-orange-500",     text: "text-slate-900", accent: "text-rose-500",    variant: "standard" },
        { name: "Aqua Mint",     primary: "bg-gradient-to-br from-cyan-400 to-emerald-500",    text: "text-slate-900", accent: "text-cyan-600",    variant: "standard" },
        { name: "Midnight Blue", primary: "bg-gradient-to-br from-slate-900 to-indigo-700",    text: "text-slate-50",  accent: "text-indigo-300",  variant: "standard" },
        { name: "Royal Gold",    primary: "bg-gradient-to-br from-amber-400 to-yellow-500",    text: "text-slate-900", accent: "text-amber-600",   variant: "standard" },
        { name: "Deep Ocean",    primary: "bg-gradient-to-br from-blue-900 to-cyan-700",       text: "text-slate-50",  accent: "text-cyan-300",    variant: "split" },
        { name: "Forest",        primary: "bg-gradient-to-br from-green-800 to-teal-600",      text: "text-slate-50",  accent: "text-teal-300",    variant: "split" },
        { name: "Cherry Blossom",primary: "bg-gradient-to-br from-pink-500 to-fuchsia-600",    text: "text-slate-900", accent: "text-pink-600",    variant: "split" },
    ];

    categories.forEach(cat => {
        const title = cat.charAt(0).toUpperCase() + cat.slice(1);

        // OLD STYLE — 6 templates
        oldVariants.forEach(v => {
            db.push({
                id: `${cat}-old-${v.suffix}`,
                templateName: `${title} ${v.label}`,
                category: cat, style: "old", layout: "receipt", font: "font-mono",
                colors: { text: "text-gray-900", bg: "bg-white", border: "border-gray-800" },
                structure: { header: true, logo: true, itemsTable: true, totalsSection: true, divider: "dashed", variant: v.variant }
            });
        });

        // MODERN STYLE — 7 templates
        modernThemes.forEach((theme, i) => {
            db.push({
                id: `${cat}-mod-${i + 1}`,
                templateName: `${title} Pro - ${theme.name}`,
                category: cat, style: "modern", layout: "a4", font: "font-sans",
                colors: { primary: theme.primary, secondary: theme.secondary, text: theme.text, accent: theme.accent, border: theme.border, sideAccent: theme.sideAccent },
                structure: { header: true, logo: true, itemsTable: true, totalsSection: true, variant: theme.variant }
            });
        });

        // MINIMAL STYLE — 6 templates
        minimalThemes.forEach((theme, i) => {
            db.push({
                id: `${cat}-min-${i + 1}`,
                templateName: `${title} Minimal - ${theme.name}`,
                category: cat, style: "minimal", layout: "a4", font: theme.variant === 'serif' ? "font-serif" : "font-sans",
                colors: { primary: "bg-white", secondary: "bg-slate-50", text: "text-slate-800", accent: theme.accent, border: theme.border, headerBg: theme.headerBg },
                structure: { header: true, logo: true, itemsTable: true, totalsSection: true, variant: theme.variant }
            });
        });

        // TRENDY STYLE — 8 templates
        trendyThemes.forEach((theme, i) => {
            db.push({
                id: `${cat}-trend-${i + 1}`,
                templateName: `${title} Trendy - ${theme.name}`,
                category: cat, style: "trendy", layout: "a4", font: "font-sans",
                colors: { primary: theme.primary, text: theme.text, accent: theme.accent },
                structure: { header: true, logo: true, itemsTable: true, totalsSection: true, rounded: "rounded-3xl", variant: theme.variant }
            });
        });
    });

    return db;
};

const templateDatabase = generateDatabase();


// --- NAVIGATION & UI CONTROLLER ---
function navigate(targetView, payload = {}) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));

    // FIX: safe class replacement using regex to handle all occurrences
    for (let i = 1; i <= 4; i++) {
        const stepEl = document.getElementById(`step-${i}`);
        const lineEl = document.getElementById(`line-${i - 1}`);
        if (stepEl && stepEl.firstElementChild) {
            const circle = stepEl.firstElementChild;
            circle.className = circle.className.replace(/bg-blue-600/g, 'bg-gray-200').replace(/text-white/g, 'text-gray-500');
        }
        if (lineEl) lineEl.className = lineEl.className.replace(/bg-blue-600/g, 'bg-gray-200');
    }

    const activateStep = (num) => {
        for (let i = 1; i <= num; i++) {
            const stepEl = document.getElementById(`step-${i}`);
            const lineEl = document.getElementById(`line-${i - 1}`);
            if (stepEl && stepEl.firstElementChild) {
                const circle = stepEl.firstElementChild;
                circle.className = circle.className.replace(/bg-gray-200/g, 'bg-blue-600').replace(/text-gray-500/g, 'text-white');
            }
            if (lineEl) lineEl.className = lineEl.className.replace(/bg-gray-200/g, 'bg-blue-600');
        }
    };

    if (targetView === 'categories') {
        document.getElementById('view-categories').classList.remove('hidden');
        activateStep(1);
    } else if (targetView === 'styles') {
        state.category = payload.category || state.category;
        if (state.category && categoryData[state.category]) {
            state.invoiceData = JSON.parse(JSON.stringify(categoryData[state.category]));
        }
        document.getElementById('style-subtitle').innerText = `Select a design style for ${state.category} category.`;
        document.getElementById('view-styles').classList.remove('hidden');
        activateStep(2);
    } else if (targetView === 'templates') {
        state.style = payload.style || state.style;
        // FIX: dynamic template count
        const filtered = templateDatabase.filter(t => t.category === state.category && t.style === state.style);
        document.getElementById('gallery-title').innerText = `${state.style.charAt(0).toUpperCase() + state.style.slice(1)} Templates`;
        document.getElementById('template-count-badge').innerText = `${filtered.length} Templates`;
        renderTemplatesGallery();
        document.getElementById('view-templates').classList.remove('hidden');
        activateStep(3);
    } else if (targetView === 'editor') {
        state.templateId = payload.templateId;
        initEditor();
        document.getElementById('view-editor').classList.remove('hidden');
        activateStep(4);
        state.mobileTab = 'edit';
        updateMobileTab();
    }

    if (window.lucide) window.lucide.createIcons();
}

// --- MOBILE TAB TOGGLE ---
function updateMobileTab() {
    const editPane = document.getElementById('editor-left-pane');
    const previewPane = document.getElementById('preview-wrapper');
    const tabEdit = document.getElementById('tab-edit');
    const tabPreview = document.getElementById('tab-preview');
    if (!editPane || !previewPane) return;

    if (state.mobileTab === 'edit') {
        editPane.classList.remove('hidden');
        previewPane.classList.add('hidden', 'md:flex');
        previewPane.classList.remove('flex');
        editPane.classList.add('flex');
        if (tabEdit) { tabEdit.classList.add('bg-white', 'text-blue-600', 'shadow-sm'); tabEdit.classList.remove('text-gray-500'); }
        if (tabPreview) { tabPreview.classList.remove('bg-white', 'text-blue-600', 'shadow-sm'); tabPreview.classList.add('text-gray-500'); }
    } else {
        editPane.classList.add('hidden');
        editPane.classList.remove('flex');
        previewPane.classList.remove('hidden');
        previewPane.classList.add('flex');
        if (tabPreview) { tabPreview.classList.add('bg-white', 'text-blue-600', 'shadow-sm'); tabPreview.classList.remove('text-gray-500'); }
        if (tabEdit) { tabEdit.classList.remove('bg-white', 'text-blue-600', 'shadow-sm'); tabEdit.classList.add('text-gray-500'); }
    }
}

function switchMobileTab(tab) {
    state.mobileTab = tab;
    updateMobileTab();
}


// --- VIEW RENDERERS ---
function renderTemplatesGallery() {
    const container = document.getElementById('templates-grid');
    const filtered = templateDatabase.filter(t => t.category === state.category && t.style === state.style);

    if (filtered.length === 0) {
        container.innerHTML = `<div class="col-span-4 text-center py-20 text-gray-400">
            <i data-lucide="inbox" class="w-12 h-12 mx-auto mb-4 opacity-40"></i>
            <p class="font-medium">No templates found for this combination.</p>
        </div>`;
        if (window.lucide) window.lucide.createIcons();
        return;
    }

    container.innerHTML = filtered.map((t, index) => {
        let previewGraphic = '';
        if (t.style === 'old') {
            previewGraphic = `<div class="w-16 h-20 bg-white border border-gray-300 thermal-paper flex flex-col items-center justify-start p-2 gap-1"><div class="w-10 h-1 bg-gray-200"></div><div class="w-8 h-1 bg-gray-200"></div><div class="w-full h-px bg-gray-400 border-b border-dashed mt-1"></div></div>`;
        } else if (t.style === 'modern' || t.style === 'minimal') {
            previewGraphic = `<div class="w-20 h-24 bg-white shadow-sm border border-gray-200 relative"><div class="absolute top-0 w-full h-1 ${t.colors.primary}"></div><div class="p-2"><div class="w-6 h-2 ${t.colors.primary} mb-2"></div><div class="w-full h-8 ${t.colors.secondary} mb-1"></div></div></div>`;
        } else {
            previewGraphic = `<div class="w-24 h-20 bg-white shadow-lg ${t.structure.rounded} relative overflow-hidden"><div class="absolute top-0 right-0 w-10 h-10 ${t.colors.primary} rounded-bl-full opacity-20"></div><div class="absolute bottom-0 left-0 w-10 h-10 ${t.colors.primary} rounded-tr-full opacity-20"></div><div class="w-full h-4 ${t.colors.primary}"></div></div>`;
        }

        return `
            <div onclick="navigate('editor', {templateId: '${escapeHtml(t.id)}'})" class="group flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-blue-400 transition-all duration-300 cursor-pointer" style="animation-delay: ${index * 0.05}s">
                <div class="h-40 w-full relative flex items-center justify-center overflow-hidden bg-slate-50 border-b border-gray-100">
                    ${t.style === 'trendy' ? `<div class="absolute inset-0 opacity-10 ${t.colors.primary}"></div>` : ''}
                    <div class="group-hover:scale-110 transition-transform duration-500 shadow-sm">${previewGraphic}</div>
                </div>
                <div class="p-5 flex-1 flex flex-col justify-between">
                    <div>
                        <h3 class="font-bold text-gray-900 mb-1 truncate">${escapeHtml(t.templateName)}</h3>
                        <div class="flex gap-2 mb-2">
                            <span class="text-[10px] uppercase font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">${escapeHtml(t.style)}</span>
                            <span class="text-[10px] uppercase font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">JSON</span>
                        </div>
                    </div>
                    <div class="flex items-center justify-between mt-4 border-t border-gray-100 pt-3">
                        <span class="text-sm font-semibold text-blue-600 group-hover:text-blue-700 flex items-center gap-1">Use Template <i data-lucide="arrow-right" class="w-4 h-4"></i></span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// --- EDITOR & LIVE DATA BINDING ---
function initEditor() {
    // Auto-apply cloud profile first, then localStorage fallback
    if (window._businessProfile && window.applyProfileToState) {
        window.applyProfileToState(window._businessProfile);
    }
    const profile = loadBusinessProfile();
    if (profile && !window._businessProfile) {
        const d = state.invoiceData;
        d.orgName  = profile.orgName  || d.orgName;
        d.address  = profile.address  || d.address;
        d.phone    = profile.phone    || d.phone;
        d.email    = profile.email    || d.email;
        d.currency = profile.currency || d.currency;
        if (profile.logo) d.logo = profile.logo;
    }
    renderEditorFormBase();
    renderItemsList();
    renderPreview();
}

function renderEditorFormBase() {
    const d = state.invoiceData;
    const profileExists = hasBusinessProfile();
    const html = `
        <div class="space-y-6">
            <div class="bg-gray-50 p-4 rounded-xl border border-gray-100">

                <!-- Business Details Header with Profile Badge -->
                <div class="flex items-center justify-between mb-3">
                    <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider">Business Details</h3>
                    ${profileExists
                        ? `<span class="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                <svg class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                                Profile Saved
                           </span>`
                        : `<span class="text-[10px] text-gray-400 italic">No profile saved</span>`
                    }
                </div>

                <!-- Profile Action Buttons -->
                <div class="flex gap-2 mb-4">
                    <button onclick="saveBusinessProfile()"
                        class="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3 rounded-lg transition-all active:scale-95 shadow-sm shadow-blue-200">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
                        Save as My Profile
                    </button>
                    ${profileExists ? `
                    <button onclick="applyBusinessProfile()"
                        title="Re-apply saved profile to current form"
                        class="flex items-center justify-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold py-2 px-3 rounded-lg transition-all active:scale-95">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                        Apply
                    </button>
                    <button onclick="clearBusinessProfile()"
                        title="Delete saved profile"
                        class="flex items-center justify-center gap-1 bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 text-xs font-bold py-2 px-3 rounded-lg transition-all active:scale-95">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>` : ''}
                </div>

                <div class="space-y-3">
                    <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Company Logo</label>
                        <input type="file" id="logo-input" accept="image/*" onchange="handleLogoUpload(event)" class="hidden">
                        <button onclick="document.getElementById('logo-input').click()"
                            class="w-full bg-white border-2 border-dashed border-gray-300 py-2 rounded-lg text-xs text-gray-500 hover:border-blue-500 transition-all flex items-center justify-center gap-2">
                            ${d.logo
                                ? `<img src="${d.logo}" class="h-6 w-6 object-contain rounded"/> Change Logo`
                                : `<svg class="w-4 h-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg> Upload PNG/JPG`
                            }
                        </button>
                        <p class="text-[10px] text-amber-600 mt-1">&#9888; Upload from device for best export quality. Saved in profile.</p>
                    </div>

                    <div class="space-y-2">
                        <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider">Currency</label>
                        <select onchange="updateCurrency(this.value)" class="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                            <option value="BDT" ${d.currency==='BDT'?'selected':''}>BDT (৳) - Taka</option>
                            <option value="USD" ${d.currency==='USD'?'selected':''}>USD ($) - US Dollar</option>
                            <option value="EUR" ${d.currency==='EUR'?'selected':''}>EUR (€) - Euro</option>
                            <option value="GBP" ${d.currency==='GBP'?'selected':''}>GBP (£) - British Pound</option>
                            <option value="INR" ${d.currency==='INR'?'selected':''}>INR (₹) - Indian Rupee</option>
                            <option value="CAD" ${d.currency==='CAD'?'selected':''}>CAD ($) - Canadian Dollar</option>
                            <option value="AUD" ${d.currency==='AUD'?'selected':''}>AUD ($) - Australian Dollar</option>
                            <option value="JPY" ${d.currency==='JPY'?'selected':''}>JPY (¥) - Japanese Yen</option>
                            <option value="AED" ${d.currency==='AED'?'selected':''}>AED (د.إ) - UAE Dirham</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Company Name</label>
                        <input type="text" value="${escapeHtml(d.orgName)}" oninput="updateData('orgName', this.value)" class="w-full text-sm p-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Address</label>
                        <input type="text" value="${escapeHtml(d.address)}" oninput="updateData('address', this.value)" class="w-full text-sm p-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                            <input type="text" value="${escapeHtml(d.phone)}" oninput="updateData('phone', this.value)" class="w-full text-sm p-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-gray-700 mb-1">Email</label>
                            <input type="text" value="${escapeHtml(d.email)}" oninput="updateData('email', this.value)" class="w-full text-sm p-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2"><i data-lucide="file-text" class="w-4 h-4"></i> Invoice Details</h3>
                <div class="space-y-3">
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-medium text-gray-700 mb-1">Invoice Number</label>
                            <input type="text" value="${escapeHtml(d.invoiceNo)}" oninput="updateData('invoiceNo', this.value)" class="w-full text-sm p-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-gray-700 mb-1">Date</label>
                            <input type="date" value="${escapeHtml(d.date)}" oninput="updateData('date', this.value)" class="w-full text-sm p-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Billed To (Customer/Patient)</label>
                        <input type="text" value="${escapeHtml(d.customerName)}" oninput="updateData('customerName', this.value)" class="w-full text-sm p-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    </div>
                </div>
            </div>

            <div class="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2"><i data-lucide="list" class="w-4 h-4"></i> Line Items</h3>
                    <button onclick="addItem()" class="text-xs bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 shadow-sm"><i data-lucide="plus" class="w-3 h-3"></i> Add Item</button>
                </div>
                <div id="items-list-container" class="space-y-3"></div>
            </div>

            <div class="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-8">
                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <i data-lucide="dollar-sign" class="w-4 h-4"></i> Totals & Finance
                </h3>
                <div class="grid grid-cols-3 gap-3">
                    <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Discount (%)</label>
                        <input type="number" step="0.1" min="0" max="100" value="${d.discountRate}"
                            oninput="updateRateData('discountRate', this.value)"
                            class="w-full text-sm p-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                        <p class="text-[10px] text-gray-400 mt-0.5">0 – 100%</p>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                        <input type="number" step="0.1" min="0" max="100" value="${d.taxRate}"
                            oninput="updateRateData('taxRate', this.value)"
                            class="w-full text-sm p-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                        <p class="text-[10px] text-gray-400 mt-0.5">0 – 100%</p>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Paid Amount</label>
                        <input type="number" step="0.01" min="0" value="${d.paid}"
                            oninput="updateRateData('paid', this.value)"
                            class="w-full text-sm p-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                        <p class="text-[10px] text-gray-400 mt-0.5">min: 0</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.getElementById('editor-form-container').innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
}

// --- IMAGE & CURRENCY HANDLERS ---
function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        state.invoiceData.logo = e.target.result;
        autoSave();
        renderPreview();
    };
    reader.readAsDataURL(file);
}

function updateCurrency(val) {
    state.invoiceData.currency = val;
    autoSave();
    renderPreview();
}

function renderItemsList() {
    const container = document.getElementById('items-list-container');
    if (!container) return;

    // FIX: Empty state UI
    if (state.invoiceData.items.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                <i data-lucide="package" class="w-8 h-8 mx-auto mb-2 opacity-40"></i>
                <p class="text-sm font-medium">No items yet</p>
                <p class="text-xs mt-1">Click <strong>+ Add Item</strong> to get started</p>
            </div>`;
        if (window.lucide) window.lucide.createIcons();
        return;
    }

    container.innerHTML = state.invoiceData.items.map((item, index) => `
        <div class="bg-white border border-gray-200 rounded-lg p-3 shadow-sm relative group transition-all hover:border-blue-300">
            <button onclick="removeItem(${index})" class="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-200 z-10"><i data-lucide="x" class="w-3 h-3"></i></button>
            <input type="text" value="${escapeHtml(item.desc)}" oninput="updateItem(${index}, 'desc', this.value)" placeholder="Description" class="w-full text-sm p-1.5 border-b border-transparent hover:border-gray-200 focus:border-blue-500 outline-none transition-all mb-2 font-medium bg-transparent">
            <div class="flex gap-2">
                <div class="flex-1 flex items-center bg-gray-50 rounded-md px-2 border border-gray-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                    <span class="text-xs font-bold text-gray-400 mr-1 w-6">QTY</span>
                    <input type="number" min="0" value="${item.qty}" oninput="updateItem(${index}, 'qty', this.value)" class="w-full text-sm py-1.5 bg-transparent outline-none text-right font-medium">
                </div>
                <div class="flex-1 flex items-center bg-gray-50 rounded-md px-2 border border-gray-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                    <span class="text-xs font-bold text-gray-400 mr-1">$</span>
                    <input type="number" min="0" step="0.01" value="${item.price}" oninput="updateItem(${index}, 'price', this.value)" class="w-full text-sm py-1.5 bg-transparent outline-none text-right font-medium">
                </div>
            </div>
        </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
}

function updateData(field, value) {
    state.invoiceData[field] = value;
    autoSave();
    renderPreview();
}

// FIX: Validated rate/amount updates with clamping
function updateRateData(field, value) {
    if (field === 'paid') {
        state.invoiceData[field] = clampPositive(value);
    } else {
        state.invoiceData[field] = clampRate(value);
    }
    autoSave();
    renderPreview();
}

function updateItem(index, field, value) {
    if (field === 'desc') {
        state.invoiceData.items[index][field] = value;
    } else {
        state.invoiceData.items[index][field] = clampPositive(value);
    }
    autoSave();
    renderPreview();
}

function addItem() {
    state.invoiceData.items.push({ id: Date.now(), desc: "New Item", qty: 1, price: 0 });
    renderItemsList();
    autoSave();
    renderPreview();
}

function removeItem(index) {
    state.invoiceData.items.splice(index, 1);
    renderItemsList();
    autoSave();
    renderPreview();
}

// --- JSON-DRIVEN TEMPLATE RENDER ENGINE ---
function renderPreview() {
    const container = document.getElementById('invoice-preview-content');
    const data = state.invoiceData;
    const template = templateDatabase.find(t => t.id === state.templateId);
    if (!template || !container) return;

    // FIX: pass currency explicitly to avoid stale closure
    const cur = data.currency || 'BDT';
    const fmt = (amount) => formatCurrency(amount, cur);

    const subtotal = data.items.reduce((sum, item) => sum + (item.qty * item.price), 0);
    const discountRate = Number(data.discountRate) || 0;
    const taxRate = Number(data.taxRate) || 0;
    const paidAmount = Number(data.paid) || 0;
    const discountAmount = subtotal * (discountRate / 100);
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * (taxRate / 100);
    const total = taxableAmount + taxAmount;
    const due = total - paidAmount;

    let html = '';

    // ENGINE: OLD STYLE
    if (template.style === 'old') {
        const v = template.structure.variant || 'classic';
        const maxW = v === 'narrow' ? 'max-w-[280px]' : v === 'fullwidth' ? 'max-w-[480px]' : 'max-w-[380px]';
        const titleSize = v === 'bold' ? 'text-2xl font-black' : 'text-xl font-bold';
        const headerAlign = v === 'compact' ? 'text-left' : 'text-center';
        const showEmail = (v === 'detailed' || v === 'fullwidth');
        const showBarcode = (v === 'detailed' || v === 'bold' || v === 'fullwidth');
        const unitCol = (v === 'detailed' || v === 'fullwidth');

        html = `
            <div id="export-target" class="bg-white p-6 mx-auto thermal-paper min-h-full w-full ${maxW} ${template.font} ${template.colors.text}">
                <div class="${headerAlign} mb-6">
                    ${template.structure.logo && data.logo ? `<img src="${data.logo}" class="${v==='compact'?'h-8':'h-14'} ${headerAlign==='text-center'?'mx-auto':''} mb-3 grayscale mix-blend-multiply" />` : ''}
                    <h1 class="${titleSize} uppercase mb-1 tracking-widest">${escapeHtml(data.orgName)}</h1>
                    <p class="text-xs uppercase">${escapeHtml(data.address)}</p>
                    <p class="text-xs uppercase mt-0.5">T: ${escapeHtml(data.phone)}</p>
                    ${showEmail ? `<p class="text-xs uppercase mt-0.5">${escapeHtml(data.email)}</p>` : ''}
                    ${v === 'bold' ? `<div class="mt-3 border-t-2 border-b-2 border-gray-900 py-1"><p class="text-sm font-black tracking-widest uppercase">INVOICE / RECEIPT</p></div>` : ''}
                </div>
                <div class="mb-4 border-y ${template.colors.border} py-2 border-dashed">
                    <div class="flex justify-between text-xs mb-1 uppercase"><span>RCPT#:</span> <span class="font-bold">${escapeHtml(data.invoiceNo)}</span></div>
                    <div class="flex justify-between text-xs mb-1 uppercase"><span>DATE:</span> <span>${escapeHtml(data.date)}</span></div>
                    <div class="flex justify-between text-xs uppercase"><span>CUST:</span> <span>${escapeHtml(data.customerName)}</span></div>
                </div>
                <div class="mb-4">
                    <div class="flex justify-between font-bold text-xs border-b ${template.colors.border} border-dashed pb-1 mb-2 uppercase">
                        <span class="${unitCol?'w-5/12':'w-1/2'}">Item</span>
                        <span class="w-1/6 text-center">Qty</span>
                        ${unitCol ? `<span class="w-1/6 text-right">Price</span>` : ''}
                        <span class="w-1/4 text-right">Amt</span>
                    </div>
                    ${data.items.length === 0 ? '<p class="text-xs text-center text-gray-400 py-2">No items</p>' : data.items.map(item => `
                        <div class="flex justify-between text-xs mb-1.5">
                            <span class="${unitCol?'w-5/12':'w-1/2'} pr-2 uppercase truncate">${escapeHtml(item.desc)}</span>
                            <span class="w-1/6 text-center">${item.qty}</span>
                            ${unitCol ? `<span class="w-1/6 text-right">${fmt(item.price)}</span>` : ''}
                            <span class="w-1/4 text-right">${fmt(item.qty * item.price)}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="border-t ${template.colors.border} border-dashed pt-2">
                    <div class="flex justify-between text-xs mb-1 uppercase"><span>Subtotal:</span><span>${fmt(subtotal)}</span></div>
                    <div class="flex justify-between text-xs mb-1 uppercase"><span>Discount (${discountRate}%):</span><span>-${fmt(discountAmount)}</span></div>
                    <div class="flex justify-between text-xs mb-2 uppercase"><span>Tax (${taxRate}%):</span><span>${fmt(taxAmount)}</span></div>
                    <div class="flex justify-between ${v==='bold'?'text-base font-black':'text-sm font-bold'} mb-2 mt-1 pt-2 border-t ${template.colors.border} border-dashed"><span>TOTAL:</span><span>${fmt(total)}</span></div>
                    <div class="flex justify-between text-xs mb-1 uppercase"><span>Tendered:</span><span>${fmt(data.paid)}</span></div>
                    <div class="flex justify-between text-xs font-bold mt-1 pt-2 border-t ${template.colors.border} border-dashed uppercase"><span>BALANCE DUE:</span><span>${fmt(due)}</span></div>
                </div>
                ${showBarcode ? `
                <div class="mt-4 text-center">
                    <div class="inline-flex gap-px">${Array.from({length:40},(_,i)=>`<div class="bg-gray-900" style="width:${[1,2,1,3,1,2,1,1,3,2][i%10]}px;height:32px"></div>`).join('')}</div>
                    <p class="text-[9px] mt-1 tracking-widest">${escapeHtml(data.invoiceNo)}</p>
                </div>` : ''}
                <div class="mt-6 text-center text-xs uppercase">
                    <p class="mb-1">*** THANK YOU ***</p>
                    <p>${escapeHtml(data.orgName)}</p>
                </div>
            </div>`;
    }
    // ENGINE: MODERN STYLE
    else if (template.style === 'modern') {
        const v = template.structure.variant || 'standard';
        const ac = template.colors.accent;
        const pr = template.colors.primary;
        const sc = template.colors.secondary;
        const bd = template.colors.border;
        const sa = template.colors.sideAccent || pr;

        if (v === 'sidebar') {
            html = `
            <div id="export-target" class="bg-white mx-auto relative ${template.font} w-full max-w-[794px] min-h-[1123px] box-border flex">
                <div class="${sa} w-[180px] shrink-0 p-8 flex flex-col text-white">
                    ${data.logo ? `<img src="${data.logo}" class="h-14 object-contain mb-6 brightness-0 invert" />` : ''}
                    <h1 class="text-lg font-black tracking-tight mb-1 leading-tight">${escapeHtml(data.orgName)}</h1>
                    <p class="text-white/70 text-xs leading-relaxed mb-6">${escapeHtml(data.address)}</p>
                    <div class="mt-auto space-y-3 text-xs text-white/80">
                        <p>${escapeHtml(data.phone)}</p>
                        <p class="break-all">${escapeHtml(data.email)}</p>
                    </div>
                </div>
                <div class="flex-1 p-10">
                    <div class="flex justify-between items-start mb-10">
                        <h2 class="text-5xl font-black ${ac} uppercase tracking-wider opacity-80">Invoice</h2>
                        <div class="text-right text-sm space-y-1">
                            <p><span class="text-gray-400 uppercase text-xs font-bold">No: </span><span class="font-semibold">${escapeHtml(data.invoiceNo)}</span></p>
                            <p><span class="text-gray-400 uppercase text-xs font-bold">Date: </span><span class="font-semibold">${escapeHtml(data.date)}</span></p>
                        </div>
                    </div>
                    <div class="mb-8 p-5 ${sc} rounded-lg border ${bd}">
                        <p class="text-xs uppercase font-bold text-gray-400 mb-1">Billed To</p>
                        <p class="text-xl font-bold text-gray-900">${escapeHtml(data.customerName)}</p>
                    </div>
                    <table class="w-full text-left mb-8 border-collapse">
                        <thead><tr class="${sc} border-y ${bd}">
                            <th class="py-3 px-3 text-xs font-bold uppercase tracking-wider w-1/2">Description</th>
                            <th class="py-3 px-3 text-xs font-bold uppercase tracking-wider text-center">Qty</th>
                            <th class="py-3 px-3 text-xs font-bold uppercase tracking-wider text-right">Rate</th>
                            <th class="py-3 px-3 text-xs font-bold uppercase tracking-wider text-right">Amount</th>
                        </tr></thead>
                        <tbody>${data.items.length === 0 ? `<tr><td colspan="4" class="text-center py-8 text-gray-400 text-sm">No items.</td></tr>` : data.items.map((item,i)=>`
                        <tr class="border-b border-gray-100 ${i%2!==0?'bg-gray-50/40':''}">
                            <td class="py-3 px-3 text-sm font-medium">${escapeHtml(item.desc)}</td>
                            <td class="py-3 px-3 text-sm text-center text-gray-500">${item.qty}</td>
                            <td class="py-3 px-3 text-sm text-right text-gray-500">${fmt(item.price)}</td>
                            <td class="py-3 px-3 text-sm text-right font-bold">${fmt(item.qty*item.price)}</td>
                        </tr>`).join('')}</tbody>
                    </table>
                    <div class="flex justify-end">
                        <div class="w-64 space-y-1.5 text-sm">
                            <div class="flex justify-between text-gray-500"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
                            <div class="flex justify-between text-gray-500"><span>Discount (${discountRate}%)</span><span>-${fmt(discountAmount)}</span></div>
                            <div class="flex justify-between text-gray-500 border-b ${bd} pb-2"><span>Tax (${taxRate}%)</span><span>${fmt(taxAmount)}</span></div>
                            <div class="flex justify-between font-bold text-lg pt-1"><span>Total</span><span>${fmt(total)}</span></div>
                            <div class="flex justify-between text-gray-500"><span>Paid</span><span class="text-emerald-600">${fmt(data.paid)}</span></div>
                            <div class="flex justify-between font-bold ${ac} ${sc} px-3 py-2 rounded-lg mt-2"><span>Balance Due</span><span>${fmt(due)}</span></div>
                        </div>
                    </div>
                </div>
            </div>`;
        } else if (v === 'banner') {
            html = `
            <div id="export-target" class="bg-white mx-auto relative ${template.font} w-full max-w-[794px] min-h-[1123px] box-border">
                <div class="${pr} px-10 py-8 flex justify-between items-center text-white">
                    <div class="flex items-center gap-4">
                        ${data.logo ? `<img src="${data.logo}" class="h-14 object-contain brightness-0 invert" />` : ''}
                        <div>
                            <h1 class="text-2xl font-black tracking-tight">${escapeHtml(data.orgName)}</h1>
                            <p class="text-white/70 text-xs mt-1">${escapeHtml(data.address)}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-4xl font-black tracking-widest opacity-80">INVOICE</div>
                        <p class="text-white/80 text-sm mt-1"># ${escapeHtml(data.invoiceNo)}</p>
                    </div>
                </div>
                <div class="px-10 py-8">
                    <div class="grid grid-cols-3 gap-6 mb-10 text-sm">
                        <div class="col-span-1 ${sc} p-5 rounded-xl border ${bd}">
                            <p class="text-xs uppercase font-bold text-gray-400 mb-2">Billed To</p>
                            <p class="font-bold text-gray-900 text-base">${escapeHtml(data.customerName)}</p>
                        </div>
                        <div class="col-span-1 p-5 border ${bd} rounded-xl">
                            <p class="text-xs uppercase font-bold text-gray-400 mb-2">Date</p>
                            <p class="font-semibold text-gray-800">${escapeHtml(data.date)}</p>
                        </div>
                        <div class="col-span-1 p-5 border ${bd} rounded-xl">
                            <p class="text-xs uppercase font-bold text-gray-400 mb-2">Contact</p>
                            <p class="text-gray-600 text-xs">${escapeHtml(data.phone)}</p>
                            <p class="text-gray-600 text-xs mt-1">${escapeHtml(data.email)}</p>
                        </div>
                    </div>
                    <table class="w-full text-left mb-8 border-collapse rounded-xl overflow-hidden">
                        <thead><tr class="${pr} text-white">
                            <th class="py-4 px-5 text-xs font-bold uppercase tracking-wider w-1/2">Description</th>
                            <th class="py-4 px-5 text-xs font-bold uppercase tracking-wider text-center">Qty</th>
                            <th class="py-4 px-5 text-xs font-bold uppercase tracking-wider text-right">Unit Price</th>
                            <th class="py-4 px-5 text-xs font-bold uppercase tracking-wider text-right">Total</th>
                        </tr></thead>
                        <tbody>${data.items.length===0?`<tr><td colspan="4" class="text-center py-8 text-gray-400">No items.</td></tr>`:data.items.map((item,i)=>`
                        <tr class="border-b border-gray-100 ${i%2!==0?sc:'bg-white'}">
                            <td class="py-4 px-5 text-sm font-medium text-gray-800">${escapeHtml(item.desc)}</td>
                            <td class="py-4 px-5 text-sm text-center text-gray-500">${item.qty}</td>
                            <td class="py-4 px-5 text-sm text-right text-gray-500">${fmt(item.price)}</td>
                            <td class="py-4 px-5 text-sm text-right font-bold text-gray-900">${fmt(item.qty*item.price)}</td>
                        </tr>`).join('')}</tbody>
                    </table>
                    <div class="flex justify-end">
                        <div class="w-72 text-sm space-y-2">
                            <div class="flex justify-between text-gray-500"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
                            <div class="flex justify-between text-gray-500"><span>Discount (${discountRate}%)</span><span>-${fmt(discountAmount)}</span></div>
                            <div class="flex justify-between text-gray-500 pb-2 border-b ${bd}"><span>Tax (${taxRate}%)</span><span>${fmt(taxAmount)}</span></div>
                            <div class="flex justify-between font-bold text-xl pt-1"><span>Total</span><span>${fmt(total)}</span></div>
                            <div class="flex justify-between text-gray-500"><span>Amount Paid</span><span class="text-emerald-600">${fmt(data.paid)}</span></div>
                            <div class="${pr} text-white flex justify-between font-bold px-4 py-3 rounded-xl mt-3"><span>Balance Due</span><span>${fmt(due)}</span></div>
                        </div>
                    </div>
                </div>
            </div>`;
        } else {
            // standard (original layout)
            html = `
            <div id="export-target" class="bg-white mx-auto relative ${template.font} ${template.colors.text} w-full max-w-[794px] min-h-[1123px] box-border px-4 py-6 sm:px-10 sm:py-12">
                <div class="absolute top-0 left-0 w-full h-3 ${pr}"></div>
                <div class="flex justify-between items-start mb-12 mt-6">
                    <div class="flex items-center gap-4 max-w-[50%]">
                        ${data.logo ? `<img src="${data.logo}" class="h-16 object-contain" />` : ''}
                        <div>
                            <h1 class="text-3xl font-extrabold mb-1 tracking-tight">${escapeHtml(data.orgName)}</h1>
                            <p class="text-xs text-gray-500 leading-relaxed">${escapeHtml(data.address)}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <h2 class="text-4xl font-black ${ac} mb-4 uppercase tracking-wider opacity-90">Invoice</h2>
                        <div class="text-sm bg-gray-50 p-3 rounded border border-gray-100 inline-block text-left">
                            <p class="mb-1 flex justify-between gap-6"><span class="font-bold text-gray-500 uppercase text-xs">Invoice No</span><span class="font-semibold">${escapeHtml(data.invoiceNo)}</span></p>
                            <p class="flex justify-between gap-6"><span class="font-bold text-gray-500 uppercase text-xs">Date</span><span class="font-semibold">${escapeHtml(data.date)}</span></p>
                        </div>
                    </div>
                </div>
                <div class="mb-12 border-t border-gray-200 pt-8">
                    <div class="grid grid-cols-2 gap-12 text-sm">
                        <div>
                            <h3 class="font-bold text-gray-400 uppercase tracking-widest text-xs mb-3 border-b ${bd} pb-2">Billed To</h3>
                            <p class="text-lg">${escapeHtml(data.customerName)}</p>
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-400 uppercase tracking-widest text-xs mb-3 border-b ${bd} pb-2">Provider Details</h3>
                            <p class="text-gray-600 mb-1">${escapeHtml(data.phone)}</p>
                            <p class="text-gray-600">${escapeHtml(data.email)}</p>
                        </div>
                    </div>
                </div>
                <table class="w-full text-left mb-12 border-collapse">
                    <thead><tr class="${sc} ${ac} border-y ${bd}">
                        <th class="py-4 px-4 font-bold text-xs uppercase tracking-wider w-1/2">Description</th>
                        <th class="py-4 px-4 font-bold text-xs uppercase tracking-wider text-center">Qty</th>
                        <th class="py-4 px-4 font-bold text-xs uppercase tracking-wider text-right">Unit Price</th>
                        <th class="py-4 px-4 font-bold text-xs uppercase tracking-wider text-right">Amount</th>
                    </tr></thead>
                    <tbody>${data.items.length===0?`<tr><td colspan="4" class="text-center py-8 text-gray-400 text-sm">No items added yet.</td></tr>`:data.items.map((item,i)=>`
                    <tr class="border-b border-gray-100 ${i%2!==0?'bg-gray-50/30':'bg-white'}">
                        <td class="py-4 px-4 text-sm font-medium text-gray-800">${escapeHtml(item.desc)}</td>
                        <td class="py-4 px-4 text-sm text-gray-600 text-center">${item.qty}</td>
                        <td class="py-4 px-4 text-sm text-gray-600 text-right">${fmt(item.price)}</td>
                        <td class="py-4 px-4 text-sm text-gray-900 font-bold text-right">${fmt(item.qty*item.price)}</td>
                    </tr>`).join('')}</tbody>
                </table>
                <div class="flex justify-end mb-16">
                    <div class="w-1/2 md:w-5/12">
                        <div class="flex justify-between py-2 text-sm text-gray-600"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
                        <div class="flex justify-between py-2 text-sm text-gray-600"><span>Discount (${discountRate}%)</span><span>-${fmt(discountAmount)}</span></div>
                        <div class="flex justify-between py-2 text-sm text-gray-600 border-b border-gray-200"><span>Tax (${taxRate}%)</span><span>${fmt(taxAmount)}</span></div>
                        <div class="flex justify-between py-4 text-xl font-bold"><span>Total</span><span>${fmt(total)}</span></div>
                        <div class="flex justify-between py-2 text-sm text-gray-600 mt-2"><span>Amount Paid</span><span class="font-medium text-emerald-600">${fmt(data.paid)}</span></div>
                        <div class="flex justify-between items-center py-4 text-lg font-bold ${ac} ${sc} px-4 mt-4 border border-gray-100 rounded-lg">
                            <span class="uppercase text-sm tracking-wider">Balance Due</span><span class="text-2xl">${fmt(due)}</span>
                        </div>
                    </div>
                </div>
                <div class="border-t border-gray-200 pt-8 text-center">
                    <p class="text-sm font-bold text-gray-800 mb-1">Thank you for your business.</p>
                    <p class="text-xs text-gray-500">Please contact us if you have any questions.</p>
                </div>
            </div>`;
        }
    }
    // ENGINE: MINIMAL STYLE
    else if (template.style === 'minimal') {
        const v = template.structure.variant || 'classic';
        const ac = template.colors.accent;
        const bd = template.colors.border;
        const hb = template.colors.headerBg || 'bg-slate-50';
        const fontClass = template.font || 'font-sans';

        if (v === 'dark') {
            html = `
            <div id="export-target" class="bg-gray-900 mx-auto relative ${fontClass} text-gray-100 w-full max-w-[794px] min-h-[1123px] box-border px-10 py-12">
                <div class="flex justify-between items-start mb-12 border-b border-gray-700 pb-8">
                    <div class="flex items-center gap-4">
                        ${data.logo?`<img src="${data.logo}" class="h-12 object-contain brightness-0 invert opacity-80"/>`:''}
                        <div>
                            <h1 class="text-2xl font-bold text-white">${escapeHtml(data.orgName)}</h1>
                            <p class="text-xs text-gray-400 mt-1">${escapeHtml(data.address)}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-xs uppercase tracking-widest text-gray-400 font-semibold">Invoice</div>
                        <div class="text-white font-semibold mt-1">${escapeHtml(data.invoiceNo)}</div>
                        <div class="text-gray-400 text-xs mt-1">${escapeHtml(data.date)}</div>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-10 mb-10">
                    <div><p class="text-xs text-gray-400 uppercase tracking-widest mb-2">Billed To</p><p class="text-white font-semibold">${escapeHtml(data.customerName)}</p></div>
                    <div><p class="text-xs text-gray-400 uppercase tracking-widest mb-2">Contact</p><p class="text-gray-300 text-sm">${escapeHtml(data.phone)}</p><p class="text-gray-300 text-sm">${escapeHtml(data.email)}</p></div>
                </div>
                <table class="w-full text-left mb-10 border-collapse">
                    <thead><tr class="border-b border-gray-700">
                        <th class="py-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400 w-1/2">Description</th>
                        <th class="py-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400 text-center">Qty</th>
                        <th class="py-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400 text-right">Rate</th>
                        <th class="py-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400 text-right">Amount</th>
                    </tr></thead>
                    <tbody>${data.items.length===0?`<tr><td colspan="4" class="py-8 text-center text-gray-500">No items.</td></tr>`:data.items.map(item=>`
                    <tr class="border-b border-gray-800">
                        <td class="py-3 text-sm text-gray-200">${escapeHtml(item.desc)}</td>
                        <td class="py-3 text-sm text-gray-400 text-center">${item.qty}</td>
                        <td class="py-3 text-sm text-gray-400 text-right">${fmt(item.price)}</td>
                        <td class="py-3 text-sm text-white font-semibold text-right">${fmt(item.qty*item.price)}</td>
                    </tr>`).join('')}</tbody>
                </table>
                <div class="flex justify-end">
                    <div class="w-64 text-sm space-y-2">
                        <div class="flex justify-between text-gray-400"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
                        <div class="flex justify-between text-gray-400"><span>Discount (${discountRate}%)</span><span>-${fmt(discountAmount)}</span></div>
                        <div class="flex justify-between text-gray-400 pb-2 border-b border-gray-700"><span>Tax (${taxRate}%)</span><span>${fmt(taxAmount)}</span></div>
                        <div class="flex justify-between text-white font-bold text-lg pt-1"><span>Total</span><span>${fmt(total)}</span></div>
                        <div class="flex justify-between text-gray-400"><span>Paid</span><span class="text-emerald-400">${fmt(data.paid)}</span></div>
                        <div class="flex justify-between text-white font-semibold border border-gray-700 px-3 py-2 rounded-lg mt-2"><span>Balance Due</span><span>${fmt(due)}</span></div>
                    </div>
                </div>
            </div>`;
        } else if (v === 'centered') {
            html = `
            <div id="export-target" class="bg-white mx-auto relative ${fontClass} text-slate-800 w-full max-w-[794px] min-h-[1123px] box-border px-10 py-12">
                <div class="text-center mb-10 pb-6 border-b ${bd}">
                    ${data.logo?`<img src="${data.logo}" class="h-14 object-contain mx-auto mb-4"/>`:''}
                    <h1 class="text-2xl font-bold text-gray-900">${escapeHtml(data.orgName)}</h1>
                    <p class="text-xs text-gray-400 mt-1">${escapeHtml(data.address)} · ${escapeHtml(data.phone)}</p>
                    <div class="mt-4 inline-block ${hb} px-6 py-2 rounded-full text-xs font-semibold uppercase tracking-widest ${ac}">Invoice #${escapeHtml(data.invoiceNo)} · ${escapeHtml(data.date)}</div>
                </div>
                <div class="text-center mb-8">
                    <p class="text-xs text-gray-400 uppercase tracking-widest mb-1">Billed To</p>
                    <p class="text-xl font-semibold text-gray-900">${escapeHtml(data.customerName)}</p>
                </div>
                <table class="w-full text-left mb-10 border-t border-b ${bd} border-collapse">
                    <thead class="${hb}"><tr>
                        <th class="py-3 px-4 text-[11px] font-semibold uppercase tracking-widest text-gray-500 w-1/2">Description</th>
                        <th class="py-3 px-4 text-[11px] font-semibold uppercase tracking-widest text-gray-500 text-center">Qty</th>
                        <th class="py-3 px-4 text-[11px] font-semibold uppercase tracking-widest text-gray-500 text-right">Rate</th>
                        <th class="py-3 px-4 text-[11px] font-semibold uppercase tracking-widest text-gray-500 text-right">Amount</th>
                    </tr></thead>
                    <tbody>${data.items.length===0?`<tr><td colspan="4" class="py-8 text-center text-gray-400">No items.</td></tr>`:data.items.map((item,i)=>`
                    <tr class="${i%2!==0?hb:'bg-white'}">
                        <td class="py-3 px-4 text-sm text-gray-800">${escapeHtml(item.desc)}</td>
                        <td class="py-3 px-4 text-sm text-gray-500 text-center">${item.qty}</td>
                        <td class="py-3 px-4 text-sm text-gray-500 text-right">${fmt(item.price)}</td>
                        <td class="py-3 px-4 text-sm text-gray-900 font-semibold text-right">${fmt(item.qty*item.price)}</td>
                    </tr>`).join('')}</tbody>
                </table>
                <div class="flex justify-center">
                    <div class="w-72 text-sm space-y-1.5">
                        <div class="flex justify-between text-gray-500"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
                        <div class="flex justify-between text-gray-500"><span>Discount (${discountRate}%)</span><span>-${fmt(discountAmount)}</span></div>
                        <div class="flex justify-between text-gray-500 border-b ${bd} pb-2"><span>Tax (${taxRate}%)</span><span>${fmt(taxAmount)}</span></div>
                        <div class="flex justify-between font-bold text-base pt-1"><span>Total</span><span>${fmt(total)}</span></div>
                        <div class="flex justify-between text-gray-500"><span>Paid</span><span class="text-emerald-600">${fmt(data.paid)}</span></div>
                        <div class="flex justify-between font-semibold ${ac} ${hb} px-3 py-2 rounded-lg mt-2"><span>Balance Due</span><span>${fmt(due)}</span></div>
                    </div>
                </div>
            </div>`;
        } else if (v === 'serif') {
            html = `
            <div id="export-target" class="bg-white mx-auto relative ${fontClass} text-slate-800 w-full max-w-[794px] min-h-[1123px] box-border px-12 py-14">
                <div class="flex justify-between items-start mb-8">
                    <div>
                        ${data.logo?`<img src="${data.logo}" class="h-12 object-contain mb-3"/>`:''}
                        <h1 class="text-3xl font-black tracking-tight ${ac}">${escapeHtml(data.orgName)}</h1>
                        <p class="text-xs text-gray-500 mt-1 italic">${escapeHtml(data.address)}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-4xl font-black text-gray-200 uppercase tracking-widest">Invoice</p>
                        <p class="text-sm font-semibold mt-1">${escapeHtml(data.invoiceNo)}</p>
                        <p class="text-xs text-gray-500">${escapeHtml(data.date)}</p>
                    </div>
                </div>
                <div class="border-t-2 border-b-2 ${bd} py-4 mb-8 grid grid-cols-2 gap-8">
                    <div><p class="text-xs text-gray-400 uppercase tracking-widest mb-1">Billed To</p><p class="font-semibold text-gray-900">${escapeHtml(data.customerName)}</p></div>
                    <div class="text-right"><p class="text-xs text-gray-400 uppercase tracking-widest mb-1">From</p><p class="text-xs text-gray-500">${escapeHtml(data.phone)} · ${escapeHtml(data.email)}</p></div>
                </div>
                <table class="w-full text-left mb-10 border-collapse">
                    <thead><tr class="border-b-2 ${bd}">
                        <th class="py-2 text-xs font-bold uppercase tracking-widest text-gray-600 w-1/2">Description</th>
                        <th class="py-2 text-xs font-bold uppercase tracking-widest text-gray-600 text-center">Qty</th>
                        <th class="py-2 text-xs font-bold uppercase tracking-widest text-gray-600 text-right">Rate</th>
                        <th class="py-2 text-xs font-bold uppercase tracking-widest text-gray-600 text-right">Amount</th>
                    </tr></thead>
                    <tbody>${data.items.length===0?`<tr><td colspan="4" class="py-8 text-center text-gray-400 italic">No items.</td></tr>`:data.items.map(item=>`
                    <tr class="border-b ${bd}">
                        <td class="py-3 text-sm italic text-gray-700">${escapeHtml(item.desc)}</td>
                        <td class="py-3 text-sm text-gray-500 text-center">${item.qty}</td>
                        <td class="py-3 text-sm text-gray-500 text-right">${fmt(item.price)}</td>
                        <td class="py-3 text-sm font-semibold text-right">${fmt(item.qty*item.price)}</td>
                    </tr>`).join('')}</tbody>
                </table>
                <div class="flex justify-end">
                    <div class="w-64 text-sm">
                        <div class="flex justify-between py-1 text-gray-500"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
                        <div class="flex justify-between py-1 text-gray-500"><span>Discount (${discountRate}%)</span><span>-${fmt(discountAmount)}</span></div>
                        <div class="flex justify-between py-1 border-b-2 ${bd} pb-2 text-gray-500"><span>Tax (${taxRate}%)</span><span>${fmt(taxAmount)}</span></div>
                        <div class="flex justify-between py-2 font-black text-lg ${ac}"><span>TOTAL</span><span>${fmt(total)}</span></div>
                        <div class="flex justify-between text-gray-400"><span>Paid</span><span class="text-emerald-600">${fmt(data.paid)}</span></div>
                        <div class="flex justify-between font-bold mt-1 ${ac}"><span>Balance Due</span><span>${fmt(due)}</span></div>
                    </div>
                </div>
            </div>`;
        } else {
            html = `
            <div id="export-target" class="bg-white mx-auto relative ${fontClass} text-slate-800 w-full max-w-[794px] min-h-[1123px] box-border px-6 py-8 sm:px-10 sm:py-12">
                <div class="flex justify-between items-start mb-10">
                    <div class="flex items-center gap-4 max-w-[60%]">
                        ${data.logo?`<img src="${data.logo}" class="h-14 object-contain"/>`:''}
                        <div>
                            <h1 class="text-2xl font-semibold tracking-tight">${escapeHtml(data.orgName)}</h1>
                            <p class="text-xs text-gray-500 leading-relaxed mt-1">${escapeHtml(data.address)}</p>
                        </div>
                    </div>
                    <div class="text-right text-xs space-y-1">
                        <div class="font-semibold uppercase tracking-widest text-gray-500">Invoice</div>
                        <div><span class="text-gray-500">No:</span> <span class="font-medium text-gray-800">${escapeHtml(data.invoiceNo)}</span></div>
                        <div><span class="text-gray-500">Date:</span> <span class="font-medium text-gray-800">${escapeHtml(data.date)}</span></div>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-10 text-sm mb-10">
                    <div><h3 class="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-2">Billed To</h3><p class="text-base font-medium text-gray-900">${escapeHtml(data.customerName)}</p></div>
                    <div><h3 class="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-2">Contact</h3><p class="text-gray-600 mb-1">${escapeHtml(data.phone)}</p><p class="text-gray-600">${escapeHtml(data.email)}</p></div>
                </div>
                <table class="w-full text-left mb-10 border-t border-b ${bd} border-collapse">
                    <thead class="${hb}"><tr>
                        <th class="py-3 px-3 text-[11px] font-semibold uppercase tracking-widest text-gray-500 w-1/2">Description</th>
                        <th class="py-3 px-3 text-[11px] font-semibold uppercase tracking-widest text-gray-500 text-center w-1/6">Qty</th>
                        <th class="py-3 px-3 text-[11px] font-semibold uppercase tracking-widest text-gray-500 text-right w-1/6">Rate</th>
                        <th class="py-3 px-3 text-[11px] font-semibold uppercase tracking-widest text-gray-500 text-right w-1/6">Amount</th>
                    </tr></thead>
                    <tbody>${data.items.length===0?`<tr><td colspan="4" class="py-8 text-center text-gray-400 text-sm">No items.</td></tr>`:data.items.map((item,i)=>`
                    <tr class="${i%2!==0?hb:'bg-white'}">
                        <td class="py-3 px-3 text-sm text-gray-800">${escapeHtml(item.desc)}</td>
                        <td class="py-3 px-3 text-sm text-gray-600 text-center">${item.qty}</td>
                        <td class="py-3 px-3 text-sm text-gray-600 text-right">${fmt(item.price)}</td>
                        <td class="py-3 px-3 text-sm text-gray-900 text-right">${fmt(item.qty*item.price)}</td>
                    </tr>`).join('')}</tbody>
                </table>
                <div class="flex justify-end mb-12">
                    <div class="w-full max-w-xs space-y-1 text-sm">
                        <div class="flex justify-between py-1"><span class="text-gray-500">Subtotal</span><span>${fmt(subtotal)}</span></div>
                        <div class="flex justify-between py-1"><span class="text-gray-500">Discount (${discountRate}%)</span><span>-${fmt(discountAmount)}</span></div>
                        <div class="flex justify-between py-1 border-b border-dashed ${bd} pb-2"><span class="text-gray-500">Tax (${taxRate}%)</span><span>${fmt(taxAmount)}</span></div>
                        <div class="flex justify-between pt-3 text-base"><span class="font-semibold text-gray-900">Total</span><span class="font-semibold text-gray-900">${fmt(total)}</span></div>
                        <div class="flex justify-between pt-2"><span class="text-gray-500">Paid</span><span class="font-medium text-emerald-600">${fmt(data.paid)}</span></div>
                        <div class="flex justify-between pt-2"><span class="text-gray-500">Balance Due</span><span class="font-semibold ${ac}">${fmt(due)}</span></div>
                    </div>
                </div>
                <div class="border-t ${bd} pt-6 text-xs text-gray-500"><p>Thank you for your business.</p></div>
            </div>`;
        }
    }
    // ENGINE: TRENDY STYLE
    else if (template.style === 'trendy') {
        const v = template.structure.variant || 'standard';
        const pr = template.colors.primary;
        const tx = template.colors.text;
        const ac = template.colors.accent;

        if (v === 'split') {
            html = `
            <div id="export-target" class="bg-white mx-auto relative ${template.font} overflow-hidden w-full max-w-[794px] min-h-[1123px] box-border flex">
                <div class="${pr} w-[220px] shrink-0 relative flex flex-col justify-between p-8 text-white overflow-hidden">
                    <div class="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full"></div>
                    <div class="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full"></div>
                    <div class="relative z-10">
                        ${data.logo?`<div class="bg-white/20 p-3 rounded-2xl inline-block mb-6"><img src="${data.logo}" class="h-12 w-12 object-contain" style="filter:brightness(0) invert(1)"/></div>`:''}
                        <h1 class="text-xl font-black leading-tight mb-2">${escapeHtml(data.orgName)}</h1>
                        <p class="text-white/70 text-xs leading-relaxed">${escapeHtml(data.address)}</p>
                    </div>
                    <div class="relative z-10 space-y-3 text-xs">
                        <div class="bg-white/20 rounded-xl p-3">
                            <p class="text-white/60 uppercase tracking-widest text-[10px] mb-1">Invoice</p>
                            <p class="font-bold">${escapeHtml(data.invoiceNo)}</p>
                        </div>
                        <div class="bg-white/20 rounded-xl p-3">
                            <p class="text-white/60 uppercase tracking-widest text-[10px] mb-1">Date</p>
                            <p class="font-bold">${escapeHtml(data.date)}</p>
                        </div>
                        <div class="bg-white/20 rounded-xl p-3">
                            <p class="text-white/60 uppercase tracking-widest text-[10px] mb-1">Contact</p>
                            <p class="text-white/80">${escapeHtml(data.phone)}</p>
                        </div>
                    </div>
                </div>
                <div class="flex-1 p-10 flex flex-col">
                    <div class="mb-8">
                        <p class="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Billed To</p>
                        <p class="text-2xl font-black ${tx}">${escapeHtml(data.customerName)}</p>
                    </div>
                    <div class="flex-1">
                        <table class="w-full text-left mb-8 border-collapse">
                            <thead><tr class="border-b-2 border-gray-100">
                                <th class="py-3 text-xs font-black text-gray-400 uppercase tracking-widest w-1/2">Item</th>
                                <th class="py-3 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Qty</th>
                                <th class="py-3 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Rate</th>
                                <th class="py-3 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Total</th>
                            </tr></thead>
                            <tbody>${data.items.length===0?`<tr><td colspan="4" class="py-8 text-center text-gray-400">No items.</td></tr>`:data.items.map(item=>`
                            <tr class="border-b border-gray-50">
                                <td class="py-4 text-sm font-bold ${tx}">${escapeHtml(item.desc)}</td>
                                <td class="py-4 text-sm text-gray-400 text-center">${item.qty}</td>
                                <td class="py-4 text-sm text-gray-400 text-right">${fmt(item.price)}</td>
                                <td class="py-4 text-sm font-black ${tx} text-right">${fmt(item.qty*item.price)}</td>
                            </tr>`).join('')}</tbody>
                        </table>
                    </div>
                    <div class="mt-auto">
                        <div class="space-y-1.5 text-sm mb-4">
                            <div class="flex justify-between text-gray-400"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
                            <div class="flex justify-between text-gray-400"><span>Discount (${discountRate}%)</span><span>-${fmt(discountAmount)}</span></div>
                            <div class="flex justify-between text-gray-400 pb-2 border-b border-gray-100"><span>Tax (${taxRate}%)</span><span>${fmt(taxAmount)}</span></div>
                        </div>
                        <div class="${pr} text-white flex justify-between font-black text-xl px-6 py-4 rounded-2xl shadow-lg">
                            <span>Total Due</span><span>${fmt(due)}</span>
                        </div>
                        <div class="flex justify-between text-sm text-gray-400 mt-3 px-2">
                            <span>Amount Paid</span><span class="text-emerald-500 font-semibold">${fmt(data.paid)}</span>
                        </div>
                    </div>
                </div>
            </div>`;
        } else {
            // standard
            html = `
            <div id="export-target" class="bg-white mx-auto relative ${template.font} overflow-hidden rounded-none w-full max-w-[794px] min-h-[1123px] box-border">
                <div class="absolute top-0 right-0 w-[500px] h-[500px] ${pr} rounded-bl-full opacity-[0.05] pointer-events-none"></div>
                <div class="absolute bottom-0 left-0 w-[300px] h-[300px] ${pr} rounded-tr-full opacity-[0.05] pointer-events-none"></div>
                <div class="${pr} p-12 text-white shadow-md relative z-10 ${template.structure.rounded ? 'rounded-b-[40px] mx-4 mt-4' : ''}">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-5">
                            ${data.logo ? `
                            <div class="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 shadow-xl">
                                <img src="${data.logo}" class="h-16 w-16 object-contain drop-shadow-lg" style="filter: brightness(0) invert(1);" />
                            </div>` : ''}
                            <div>
                                <h1 class="text-3xl font-black tracking-tight drop-shadow-md">${escapeHtml(data.orgName)}</h1>
                                <p class="text-white/80 mt-1 text-sm font-medium flex gap-3">
                                    <span>${escapeHtml(data.email)}</span>
                                    <span>${escapeHtml(data.phone)}</span>
                                </p>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-5xl font-black tracking-tighter opacity-90 mb-3 drop-shadow-md">INVOICE</div>
                            <div class="bg-black/20 px-4 py-1.5 rounded-full backdrop-blur-md inline-block text-sm border border-white/10 shadow-inner">
                                <span class="font-bold text-white tracking-widest"># ${escapeHtml(data.invoiceNo)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="p-12 relative z-10">
                    <div class="flex justify-between mb-12 bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 gap-8">
                        <div class="flex-1">
                            <p class="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Billed To</p>
                            <p class="text-xl font-bold ${tx}">${escapeHtml(data.customerName)}</p>
                            <p class="text-sm text-gray-500 mt-2">Invoice Date: <span class="font-semibold text-gray-700">${escapeHtml(data.date)}</span></p>
                        </div>
                        <div class="w-px bg-gray-100 hidden md:block"></div>
                        <div class="flex-1 text-right flex flex-col justify-center">
                            <p class="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Total Due</p>
                            <p class="text-4xl font-black ${ac} drop-shadow-sm">${fmt(due)}</p>
                        </div>
                    </div>
                    <div class="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden mb-10">
                        <table class="w-full text-left border-collapse">
                            <thead><tr class="bg-gray-50 border-b border-gray-100">
                                <th class="py-5 px-8 font-bold text-xs text-gray-400 uppercase tracking-widest">Item Description</th>
                                <th class="py-5 px-8 font-bold text-xs text-gray-400 uppercase tracking-widest text-center">Qty</th>
                                <th class="py-5 px-8 font-bold text-xs text-gray-400 uppercase tracking-widest text-right">Rate</th>
                                <th class="py-5 px-8 font-bold text-xs text-gray-400 uppercase tracking-widest text-right">Amount</th>
                            </tr></thead>
                            <tbody>${data.items.length===0?`<tr><td colspan="4" class="text-center py-8 text-gray-400 text-sm">No items added yet.</td></tr>`:data.items.map(item=>`
                            <tr class="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                                <td class="py-5 px-8 text-sm font-bold ${tx}">${escapeHtml(item.desc)}</td>
                                <td class="py-5 px-8 text-sm font-medium text-gray-500 text-center bg-gray-50/30">${item.qty}</td>
                                <td class="py-5 px-8 text-sm font-medium text-gray-500 text-right">${fmt(item.price)}</td>
                                <td class="py-5 px-8 text-sm font-black ${tx} text-right bg-gray-50/30">${fmt(item.qty*item.price)}</td>
                            </tr>`).join('')}</tbody>
                        </table>
                    </div>
                    <div class="flex justify-end mb-16">
                        <div class="w-1/2 space-y-2">
                            <div class="flex justify-between text-sm text-gray-500 px-6 py-2"><span>Subtotal</span><span class="font-bold text-gray-800">${fmt(subtotal)}</span></div>
                            <div class="flex justify-between text-sm text-gray-500 px-6 py-2"><span>Discount (${discountRate}%)</span><span class="font-bold text-gray-800">-${fmt(discountAmount)}</span></div>
                            <div class="flex justify-between text-sm text-gray-500 px-6 py-2"><span>Tax (${taxRate}%)</span><span class="font-bold text-gray-800">${fmt(taxAmount)}</span></div>
                            <div class="flex justify-between text-xl font-black text-white ${pr} p-6 rounded-2xl shadow-lg transform translate-x-4 my-4">
                                <span>Total</span><span>${fmt(total)}</span>
                            </div>
                            <div class="flex justify-between text-sm text-gray-500 px-6 py-2 border-b border-gray-100 pb-4">
                                <span>Amount Paid</span><span class="font-bold text-emerald-500">${fmt(data.paid)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="absolute bottom-0 w-full p-8 text-center border-t border-gray-100 bg-white/50 backdrop-blur-sm z-10">
                    <p class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Thank you for your business</p>
                    <p class="text-xs text-gray-500 font-medium">${escapeHtml(data.address)}</p>
                </div>
            </div>`;
        }
    }

    container.innerHTML = html;
    if (window.lucide) setTimeout(() => window.lucide.createIcons(), 10);
}

// --- EXPORT LOGIC with loading/disabled state ---
function setExportLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
        btn.disabled = true;
        btn.dataset.originalHtml = btn.innerHTML;
        btn.innerHTML = `<svg class="animate-spin w-4 h-4 inline mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg> Exporting...`;
        btn.classList.add('opacity-70', 'cursor-not-allowed');
    } else {
        btn.disabled = false;
        btn.innerHTML = btn.dataset.originalHtml || btn.innerHTML;
        btn.classList.remove('opacity-70', 'cursor-not-allowed');
    }
}

// ── WATERMARK helpers ────────────────────────────────────────
function injectWatermark(element) {
    const wm = document.createElement('div');
    wm.id = 'gwg-watermark';
    wm.style.cssText = `
        position:absolute; bottom:14px; right:16px; z-index:9999;
        display:flex; align-items:center; gap:5px;
        background:rgba(0,0,0,0.07); border:1px solid rgba(0,0,0,0.12);
        border-radius:6px; padding:4px 8px; pointer-events:none;
    `;
    wm.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="2.5">
            <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
        <span style="font-size:9px;font-family:sans-serif;color:#555;font-weight:600;letter-spacing:0.03em;">
            Generated by Get-wayGenerator.com
        </span>`;
    // Make sure element is positioned relative for absolute child
    const prev = element.style.position;
    if (!prev || prev === 'static') element.style.position = 'relative';
    element.appendChild(wm);
    return () => { wm.remove(); element.style.position = prev; };
}

function exportToPDF() {
    const element = document.getElementById('export-target');
    const btn = document.getElementById('btn-export-pdf');
    const tmpl = templateDatabase.find(t => t.id === state.templateId);
    if (!element) return;

    const isGuest = !window._currentUser;
    let removeWatermark = () => {};
    if (isGuest) removeWatermark = injectWatermark(element);

    let pdfFormat = 'a4';
    if (tmpl && tmpl.style === 'old') pdfFormat = [80, 200];
    const opt = {
        margin: 0,
        filename: `GetWayGenerator_${state.invoiceData.invoiceNo || 'invoice'}.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: pdfFormat, orientation: 'portrait' }
    };
    if (window.html2pdf) {
        setExportLoading(btn, true);
        window.html2pdf().set(opt).from(element).save()
            .then(() => {
                setExportLoading(btn, false);
                removeWatermark();
                if (isGuest) showConversionPopup('pdf');
            })
            .catch(() => { setExportLoading(btn, false); removeWatermark(); });
    }
}

function exportToPNG() {
    const element = document.getElementById('export-target');
    const btn = document.getElementById('btn-export-png');
    if (!window.html2canvas || !element) return;

    const isGuest = !window._currentUser;
    let removeWatermark = () => {};
    if (isGuest) removeWatermark = injectWatermark(element);

    setExportLoading(btn, true);
    window.html2canvas(element, { scale: 3, useCORS: true, backgroundColor: '#ffffff' })
        .then(canvas => {
            const link = document.createElement('a');
            link.download = `GetWayGenerator_${state.invoiceData.invoiceNo || 'invoice'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            setExportLoading(btn, false);
            removeWatermark();
            if (isGuest) showConversionPopup('png');
        })
        .catch(() => { setExportLoading(btn, false); removeWatermark(); });
}

// ── CONVERSION POPUP (guest → register) ──────────────────────
function showConversionPopup(trigger) {
    let popup = document.getElementById('conversion-popup');
    if (!popup) { popup = document.createElement('div'); popup.id = 'conversion-popup'; document.body.appendChild(popup); }
    popup.innerHTML = `
    <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[8000] flex items-end sm:items-center justify-center p-4">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-[slideUp_.3s_ease]">
            <!-- Header -->
            <div class="bg-gradient-to-r from-blue-600 to-indigo-600 px-7 pt-7 pb-5 text-white relative overflow-hidden">
                <div class="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full"></div>
                <div class="absolute -right-2 top-8 w-12 h-12 bg-white/10 rounded-full"></div>
                <div class="text-3xl mb-2">⚡</div>
                <h2 class="text-xl font-black">Want to save this invoice?</h2>
                <p class="text-blue-100 text-sm mt-1">Create a free account and unlock the full experience.</p>
            </div>
            <!-- Benefits -->
            <div class="px-7 py-5 space-y-3">
                ${[
                    ['✅', 'Save invoices & access them anytime'],
                    ['✅', 'No watermark on exported PDFs & PNGs'],
                    ['✅', 'Auto-fill customer & business details'],
                    ['✅', 'Invoice history with edit & delete'],
                    ['✅', 'Team workspace & shared access'],
                ].map(([icon, text]) => `
                <div class="flex items-center gap-3 text-sm text-gray-700">
                    <span class="text-base shrink-0">${icon}</span>
                    <span>${text}</span>
                </div>`).join('')}
            </div>
            <!-- CTAs -->
            <div class="px-7 pb-7 space-y-3">
                <button onclick="closeConversionPopup(); if(window.showAuthModal) window.showAuthModal({tab:'register'})"
                    class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl text-sm transition-all active:scale-95 shadow-lg shadow-blue-200">
                    🚀 Create Free Account
                </button>
                <button onclick="closeConversionPopup(); if(window.showAuthModal) window.showAuthModal({tab:'login'})"
                    class="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold py-3 rounded-2xl text-sm transition-all border border-gray-200">
                    Already have an account? Sign in
                </button>
                <button onclick="closeConversionPopup()"
                    class="w-full text-xs text-gray-400 hover:text-gray-600 py-1 transition-colors">
                    Continue as guest (watermark stays on exports)
                </button>
            </div>
        </div>
    </div>`;
}
window.closeConversionPopup = function() {
    document.getElementById('conversion-popup')?.remove();
};

// ── SAVE GATE (gated save button) ────────────────────────────
function guardedSaveInvoice() {
    if (window._currentUser) {
        if (window.saveInvoiceToHistory) window.saveInvoiceToHistory();
    } else {
        showConversionPopup('save');
    }
}

// ── DASHBOARD ────────────────────────────────────────────────
window.renderDashboard = async function() {
    const container = document.getElementById('dashboard-section');
    if (!container) return;

    const user = window._currentUser;

    // Guest state
    if (!user) {
        container.innerHTML = `
        <div class="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-7 mb-8 text-white relative overflow-hidden">
            <div class="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
            <div class="relative">
                <p class="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">Welcome, Guest</p>
                <h2 class="text-2xl font-black mb-1">You're in Guest Mode</h2>
                <p class="text-blue-100 text-sm mb-4">Create & download invoices freely. Sign in to save history, remove watermarks, and unlock all features.</p>
                <div class="flex gap-3 flex-wrap">
                    <button onclick="if(window.showAuthModal) window.showAuthModal({tab:'register'})"
                        class="bg-white text-blue-700 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-blue-50 transition-all active:scale-95 shadow-md">
                        🚀 Create Free Account
                    </button>
                    <button onclick="if(window.showAuthModal) window.showAuthModal({tab:'login'})"
                        class="bg-white/20 hover:bg-white/30 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all border border-white/30">
                        Sign In
                    </button>
                </div>
            </div>
        </div>`;
        return;
    }

    // Loading state
    container.innerHTML = `
    <div class="mb-8">
        <div class="flex items-center justify-between mb-5">
            <div>
                <p class="text-xs text-gray-400 font-bold uppercase tracking-widest">Dashboard</p>
                <h2 class="text-2xl font-black text-gray-900">Welcome back, ${escapeHtml(user.displayName || user.email?.split('@')[0] || 'there')} 👋</h2>
            </div>
            <button onclick="openInvoiceHistory()" class="text-sm text-blue-600 font-semibold hover:underline flex items-center gap-1">
                View all <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
            </button>
        </div>
        <div class="grid grid-cols-3 gap-4 mb-5" id="dash-stats">
            ${[1,2,3].map(() => `<div class="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse"><div class="w-8 h-8 bg-gray-100 rounded-xl mb-3"></div><div class="w-16 h-6 bg-gray-100 rounded mb-1"></div><div class="w-20 h-3 bg-gray-50 rounded"></div></div>`).join('')}
        </div>
        <div id="dash-recent"></div>
    </div>`;

    const stats = await window.loadDashboardStats?.();

    // Stats cards
    const statsEl = document.getElementById('dash-stats');
    if (statsEl && stats) {
        const fmt = (n, cur) => { try { return new Intl.NumberFormat('en-BD',{style:'currency',currency:cur||'BDT',minimumFractionDigits:0,notation:'compact'}).format(n); } catch(e) { return n; }};
        statsEl.innerHTML = `
        <div class="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-all">
            <div class="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
            <p class="text-2xl font-black text-gray-900">${stats.total}</p>
            <p class="text-xs text-gray-400 font-medium mt-0.5">Total Invoices</p>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-all">
            <div class="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center mb-3">
                <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <p class="text-2xl font-black text-gray-900">${fmt(stats.revenue, stats.currency)}</p>
            <p class="text-xs text-gray-400 font-medium mt-0.5">Total Revenue</p>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-all">
            <div class="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center mb-3">
                <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
            <p class="text-2xl font-black text-gray-900">${stats.thisMonth}</p>
            <p class="text-xs text-gray-400 font-medium mt-0.5">This Month</p>
        </div>`;
    }

    // Recent invoices
    const recentEl = document.getElementById('dash-recent');
    if (recentEl && stats?.recent?.length) {
        const styleBadge = s => ({'trendy':'bg-purple-100 text-purple-700','modern':'bg-blue-100 text-blue-700','minimal':'bg-gray-100 text-gray-700'}[s]||'bg-amber-100 text-amber-700');
        const fmt2 = (n, cur) => { try { return new Intl.NumberFormat('en-BD',{style:'currency',currency:cur||'BDT',minimumFractionDigits:0}).format(n); } catch(e) { return n; }};
        recentEl.innerHTML = `
        <p class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Recent Invoices</p>
        <div class="space-y-2">
            ${stats.recent.map(inv => {
                const total = (inv.items||[]).reduce((s,i)=>s+(i.qty*i.price),0);
                const dateStr = inv.savedAt?.toDate ? inv.savedAt.toDate().toLocaleDateString('en-GB',{day:'2-digit',month:'short'}) : '—';
                return `
                <div class="bg-white rounded-xl px-4 py-3 border border-gray-100 flex items-center justify-between gap-3 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer" onclick="loadInvoiceIntoEditor && loadInvoiceIntoEditor('${inv.id||''}')">
                    <div class="flex items-center gap-3 min-w-0">
                        <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${styleBadge(inv.style)}">${inv.style||'—'}</span>
                        <span class="text-sm font-semibold text-gray-800 truncate">${escapeHtml(inv.orgName||'Unnamed')}</span>
                    </div>
                    <div class="flex items-center gap-3 shrink-0">
                        <span class="text-xs text-gray-400">${dateStr}</span>
                        <span class="text-sm font-bold text-gray-900">${fmt2(total,inv.currency)}</span>
                    </div>
                </div>`;
            }).join('')}
        </div>`;
    } else if (recentEl && stats) {
        recentEl.innerHTML = `<p class="text-sm text-gray-400 text-center py-4">No invoices saved yet — hit the green Save button in the editor!</p>`;
    }
};

// ── CUSTOMER MANAGEMENT MODAL ─────────────────────────────────
window.openCustomerManager = async function() {
    let modal = document.getElementById('customer-modal');
    if (!modal) { modal = document.createElement('div'); modal.id = 'customer-modal'; document.body.appendChild(modal); }

    if (!window._currentUser) {
        modal.innerHTML = `
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[900] flex items-center justify-center p-4">
            <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center">
                <div class="text-4xl mb-3">🔒</div>
                <h3 class="text-lg font-black text-gray-900 mb-2">Sign in to manage customers</h3>
                <p class="text-sm text-gray-500 mb-6">Save and auto-fill customer details across all your invoices.</p>
                <button onclick="document.getElementById('customer-modal').remove(); if(window.showAuthModal) window.showAuthModal({tab:'login'})"
                    class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-2xl text-sm transition-all mb-2">Sign In</button>
                <button onclick="document.getElementById('customer-modal').remove()" class="w-full text-sm text-gray-400 py-2 hover:text-gray-600">Cancel</button>
            </div>
        </div>`;
        return;
    }

    modal.innerHTML = `
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[900] flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden">
            <div class="flex items-center justify-between p-6 border-b border-gray-100">
                <div>
                    <h2 class="text-xl font-black text-gray-900">Customers</h2>
                    <p class="text-xs text-gray-400 mt-0.5">Save & auto-fill customer details</p>
                </div>
                <button onclick="document.getElementById('customer-modal').remove()" class="bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors">
                    <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>

            <!-- Add Customer -->
            <div class="p-5 border-b border-gray-100 bg-gray-50">
                <p class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Save Current Customer</p>
                <div class="grid grid-cols-2 gap-2 mb-2">
                    <input id="cust-name"  type="text"  placeholder="Customer name"  value="${escapeHtml(state.invoiceData.customerName||'')}"
                        class="text-sm px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <input id="cust-email" type="email" placeholder="Email address"
                        class="text-sm px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                </div>
                <div class="grid grid-cols-2 gap-2 mb-3">
                    <input id="cust-phone"   type="tel"  placeholder="Phone number"
                        class="text-sm px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <input id="cust-address" type="text" placeholder="Address"
                        class="text-sm px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                </div>
                <button onclick="saveCurrentCustomer()"
                    class="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 rounded-xl transition-all active:scale-95">
                    Save Customer
                </button>
            </div>

            <!-- Customer List -->
            <div class="flex-1 overflow-y-auto p-5" id="customer-list">
                <div class="flex items-center justify-center py-8 text-gray-400 gap-2">
                    <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                    Loading customers…
                </div>
            </div>
        </div>
    </div>`;

    window.renderCustomerManager();
};

window.renderCustomerManager = async function() {
    const list = document.getElementById('customer-list');
    if (!list) return;
    const customers = await (window.loadCustomers?.() || Promise.resolve([]));
    if (!customers.length) {
        list.innerHTML = `
        <div class="text-center py-10 text-gray-400">
            <svg class="w-12 h-12 mx-auto mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            <p class="font-semibold">No customers saved yet</p>
            <p class="text-sm mt-1">Fill the form above to save a customer</p>
        </div>`;
        return;
    }
    list.innerHTML = `
    <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Saved Customers (${customers.length})</p>
    <div class="space-y-2">
        ${customers.map(c => `
        <div class="bg-gray-50 rounded-xl p-4 flex items-center justify-between gap-3 hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-all">
            <div class="min-w-0">
                <p class="font-semibold text-gray-900 text-sm truncate">${escapeHtml(c.name||'')}</p>
                <p class="text-xs text-gray-400 truncate">${escapeHtml(c.email||'')} ${c.phone ? '· '+escapeHtml(c.phone) : ''}</p>
            </div>
            <div class="flex gap-2 shrink-0">
                <button onclick="applyCustomer(${JSON.stringify(c).replace(/"/g,'&quot;')})"
                    class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95">
                    Use
                </button>
                <button onclick="deleteCustomer('${c.id}')"
                    class="bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 text-xs font-bold px-2 py-1.5 rounded-lg transition-all">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
            </div>
        </div>`).join('')}
    </div>`;
};

window.saveCurrentCustomer = async function() {
    const name    = document.getElementById('cust-name')?.value.trim();
    const email   = document.getElementById('cust-email')?.value.trim();
    const phone   = document.getElementById('cust-phone')?.value.trim();
    const address = document.getElementById('cust-address')?.value.trim();
    if (!name)  return window._fbToast?.('Enter a customer name', 'error') || alert('Enter a customer name');
    if (!email) return window._fbToast?.('Enter an email address', 'error') || alert('Enter email');
    await window.saveCustomer?.({ name, email, phone, address });
    window._fbToast?.('✓ Customer saved!', 'success');
    window.renderCustomerManager();
};

window.applyCustomer = function(c) {
    if (typeof c === 'string') try { c = JSON.parse(c); } catch(e) { return; }
    updateData('customerName', c.name || '');
    document.getElementById('customer-modal')?.remove();
    renderEditorFormBase();
    renderPreview();
    window._fbToast?.('✓ Customer applied!', 'success');
};

// --- INITIALIZATION ---
window.addEventListener('load', () => {
    if (window.lucide) window.lucide.createIcons();
    navigate('categories');
    // Render dashboard in guest state immediately; Firebase will update it when auth resolves
    if (window.renderDashboard) window.renderDashboard();
});

// Expose to inline HTML handlers
window.navigate = navigate;
window.updateData = updateData;
window.updateRateData = updateRateData;
window.updateItem = updateItem;
window.addItem = addItem;
window.removeItem = removeItem;
window.exportToPDF = exportToPDF;
window.exportToPNG = exportToPNG;
window.handleLogoUpload = handleLogoUpload;
window.updateCurrency = updateCurrency;
window.switchMobileTab = switchMobileTab;
window.saveBusinessProfile  = function() {
    // Use cloud save if logged in, fall back to localStorage
    if (window._currentUser && window.saveBusinessProfileCloud) {
        window.saveBusinessProfileCloud();
    } else {
        saveBusinessProfile();
    }
};
window.applyBusinessProfile  = applyBusinessProfile;
window.clearBusinessProfile  = function() {
    if (window._currentUser && window.clearBusinessProfileCloud) {
        window.clearBusinessProfileCloud();
    } else {
        clearBusinessProfile();
    }
};
window.saveInvoiceToHistory  = window.saveInvoiceToHistory  || function() { showConversionPopup('save'); };
window.openInvoiceHistory    = window.openInvoiceHistory    || function() { if(window.showAuthModal) window.showAuthModal({tab:'login'}); };
window.openTeamManager       = window.openTeamManager       || function() { if(window.showAuthModal) window.showAuthModal({tab:'login'}); };
window.toggleUserMenu        = window.toggleUserMenu        || function() {};
window.authSignOut           = window.authSignOut           || function() {};
window.authShowTab           = window.authShowTab           || function() {};
window.authGoogleSignIn      = window.authGoogleSignIn      || function() {};
window.authEmailLogin        = window.authEmailLogin        || function() {};
window.authEmailRegister     = window.authEmailRegister     || function() {};
window.authForgotPassword    = window.authForgotPassword    || function() {};
window.authSendOTP           = window.authSendOTP           || function() {};
window.authVerifyOTP         = window.authVerifyOTP         || function() {};
window.guardedSaveInvoice    = guardedSaveInvoice;
window.openCustomerManager   = window.openCustomerManager   || function() {};
window.closeConversionPopup  = window.closeConversionPopup  || function() {};
window.renderDashboard       = window.renderDashboard       || function() {};
