// ============================================================
// Get-wayGenerator — Firebase Auth + Firestore System
// Google Sign-In, Email/Password, Phone OTP
// Business Profile, Invoice History, Team Workspace
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getAuth, onAuthStateChanged, signOut,
    createUserWithEmailAndPassword, signInWithEmailAndPassword,
    signInWithPopup, GoogleAuthProvider,
    RecaptchaVerifier, signInWithPhoneNumber,
    updateProfile, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
    getFirestore, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc,
    collection, query, where, orderBy, getDocs, serverTimestamp,
    arrayUnion, arrayRemove
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── Config ────────────────────────────────────────────────────
const firebaseConfig = {
    apiKey: "AIzaSyC7aYd0Mc7BKK7hQRKYyy-4gPR3EWeTOAc",
    authDomain: "get-way-generator.firebaseapp.com",
    projectId: "get-way-generator",
    storageBucket: "get-way-generator.firebasestorage.app",
    messagingSenderId: "652840448326",
    appId: "1:652840448326:web:c4f86cb8f70f0ada28b547"
};
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);
window._firebase = { auth, db, serverTimestamp };

// ── Toast utility ─────────────────────────────────────────────
function toast(msg, type = 'info') {
    const colors = { success:'bg-emerald-600', error:'bg-red-500', info:'bg-slate-700' };
    let el = document.getElementById('fb-toast');
    if (!el) {
        el = document.createElement('div');
        el.id = 'fb-toast';
        el.className = 'fixed top-5 right-5 z-[9998] text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 opacity-0 -translate-y-2 transition-all duration-300 pointer-events-none max-w-xs';
        document.body.appendChild(el);
    }
    el.className = el.className.replace(/bg-\S+/g, '');
    el.classList.add(colors[type] || 'bg-slate-700');
    el.innerHTML = msg;
    el.classList.remove('opacity-0','-translate-y-2');
    el.classList.add('opacity-100','translate-y-0');
    clearTimeout(window._toastT);
    window._toastT = setTimeout(() => {
        el.classList.remove('opacity-100','translate-y-0');
        el.classList.add('opacity-0','-translate-y-2');
    }, 3200);
}
window._fbToast = toast;

// ── Auth state listener ───────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
    if (user) {
        window._currentUser = user;
        await ensureUserDoc(user);
        hideAuthModal();
        await loadUserProfile(user);
        updateNavUI(user);
        revealNavBtns();
        // Refresh dashboard if visible
        setTimeout(() => { if (window.renderDashboard) window.renderDashboard(); }, 100);
    } else {
        window._currentUser = null;
        window._businessProfile = null;
        // Guest mode: app stays visible, just update nav
        updateNavForGuest();
        hideNavBtns();
        // Refresh dashboard to show guest state
        setTimeout(() => { if (window.renderDashboard) window.renderDashboard(); }, 100);
    }
});

function showAuthModal(opts) {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    modal.style.cssText = modal.style.cssText.replace('display:none','');
    modal.style.display = 'flex';
    if (opts?.tab && window.authShowTab) window.authShowTab(opts.tab);
}
function hideAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    modal.style.display = 'none';
}
// App is always visible — guest mode means no login wall
function showApp() { /* always visible */ }
function hideApp() { /* never hide — guest mode */ }

function updateNavForGuest() {
    const uname  = document.getElementById('nav-username');
    const avatar = document.getElementById('nav-avatar');
    if (uname)  uname.textContent = 'Guest';
    if (avatar) avatar.src = 'https://ui-avatars.com/api/?name=G&background=94a3b8&color=fff&bold=true';
    // Show login button in nav
    const loginBtn = document.getElementById('nav-login-btn');
    if (loginBtn) loginBtn.classList.remove('hidden');
}

function hideNavBtns() {
    ['nav-history-btn','nav-team-btn'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.classList.add('hidden'); el.classList.remove('flex'); }
    });
    // Show guest notice in editor
    document.getElementById('guest-export-notice')?.classList.remove('hidden');
}

function updateNavUI(user) {
    const avatar = document.getElementById('nav-avatar');
    const uname  = document.getElementById('nav-username');
    const mu     = document.getElementById('menu-username');
    const me     = document.getElementById('menu-email');
    const src    = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName||user.email||'U')}&background=0D8ABC&color=fff&bold=true`;
    if (avatar) avatar.src = src;
    if (uname)  uname.textContent  = user.displayName || user.email?.split('@')[0] || 'User';
    if (mu)     mu.textContent     = user.displayName || user.email?.split('@')[0] || 'User';
    if (me)     me.textContent     = user.email || '';
}

function revealNavBtns() {
    ['nav-history-btn','nav-team-btn'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.classList.remove('hidden'); el.classList.add('flex'); }
    });
    // Hide the guest login button
    document.getElementById('nav-login-btn')?.classList.add('hidden');
    // Hide guest watermark notice in editor
    document.getElementById('guest-export-notice')?.classList.add('hidden');
}

// ── User document (created on first sign-in) ─────────────────
async function ensureUserDoc(user) {
    const ref  = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    // Use pending name set during registration if displayName not propagated yet
    const displayName = user.displayName || window._pendingDisplayName || '';
    if (!snap.exists()) {
        await setDoc(ref, {
            uid: user.uid,
            displayName,
            email: user.email || '',
            photoURL: user.photoURL || '',
            createdAt: serverTimestamp(),
            workspaceId: user.uid
        });
        // personal workspace
        await setDoc(doc(db, 'workspaces', user.uid), {
            name:      (displayName || 'My') + "'s Workspace",
            ownerId:   user.uid,
            memberIds: [user.uid],
            editorIds: [user.uid],
            adminIds:  [user.uid],
            members: [{ uid: user.uid, email: user.email||'', name: displayName, role:'admin' }],
            createdAt: serverTimestamp()
        });
    }
}

// ── Business Profile ─────────────────────────────────────────
async function loadUserProfile(user) {
    try {
        const snap = await getDoc(doc(db, 'users', user.uid, 'profile', 'business'));
        if (snap.exists()) {
            window._businessProfile = snap.data();
            if (window.applyProfileToState) window.applyProfileToState(snap.data());
        }
    } catch(e) { console.warn('profile load', e); }
}

window.applyProfileToState = function(p) {
    if (!p || !window.state) return;
    const d = window.state.invoiceData;
    if (p.orgName)  d.orgName  = p.orgName;
    if (p.address)  d.address  = p.address;
    if (p.phone)    d.phone    = p.phone;
    if (p.email)    d.email    = p.email;
    if (p.currency) d.currency = p.currency;
    if (p.logo)     d.logo     = p.logo;
};

window.saveBusinessProfileCloud = async function() {
    const user = window._currentUser;
    if (!user) return toast('Please sign in first', 'error');
    const d = window.state?.invoiceData;
    if (!d) return;
    const profile = { orgName:d.orgName||'', address:d.address||'', phone:d.phone||'', email:d.email||'', currency:d.currency||'BDT', logo:d.logo||'', updatedAt:serverTimestamp() };
    try {
        await setDoc(doc(db, 'users', user.uid, 'profile', 'business'), profile);
        window._businessProfile = profile;
        toast('✓ Business profile saved to cloud!', 'success');
        if (window.renderEditorFormBase) { window.renderEditorFormBase(); window.renderItemsList(); }
    } catch(e) { toast('Save failed: ' + e.message, 'error'); }
};

window.hasCloudProfile = () => !!(window._businessProfile?.orgName);

window.clearBusinessProfileCloud = async function() {
    const user = window._currentUser;
    if (!user) return;
    try {
        await deleteDoc(doc(db, 'users', user.uid, 'profile', 'business'));
        window._businessProfile = null;
        toast('Profile cleared', 'info');
        if (window.renderEditorFormBase) { window.renderEditorFormBase(); window.renderItemsList(); }
    } catch(e) { toast('Error: ' + e.message, 'error'); }
};

// ── Customer Management ───────────────────────────────────────
window.saveCustomer = async function(customerData) {
    const user = window._currentUser;
    if (!user) return;
    const ref = doc(db, 'users', user.uid, 'customers', customerData.email.replace(/[^a-zA-Z0-9]/g,'_'));
    await setDoc(ref, { ...customerData, updatedAt: serverTimestamp() }, { merge: true });
};

window.loadCustomers = async function() {
    const user = window._currentUser;
    if (!user) return [];
    try {
        const snap = await getDocs(collection(db, 'users', user.uid, 'customers'));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch(e) { return []; }
};

window.deleteCustomer = async function(customerId) {
    const user = window._currentUser;
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'customers', customerId));
    if (window.renderCustomerManager) window.renderCustomerManager();
    toast('Customer deleted', 'info');
};

// ── Dashboard Stats ───────────────────────────────────────────
window.loadDashboardStats = async function() {
    const user = window._currentUser;
    if (!user) return null;
    try {
        await ensureUserDoc(user);
        const wsId = await getWorkspaceId();
        if (!wsId) return null;
        const snap     = await getDocs(collection(db, 'workspaces', wsId, 'invoices'));
        const invoices = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const now      = new Date();
        const getTotal = inv => (inv.items||[]).reduce((s,i)=>s+((i.qty||0)*(i.price||0)),0);
        const thisMonthInvs = invoices.filter(inv => {
            if (!inv.savedAt?.toDate) return false;
            const d = inv.savedAt.toDate();
            return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear();
        });
        const totalRevenue = invoices.reduce((s,inv)=>s+getTotal(inv),0);
        const monthRevenue = thisMonthInvs.reduce((s,inv)=>s+getTotal(inv),0);
        const totalPaid    = invoices.reduce((s,inv)=>s+(inv.paid||0),0);
        const totalUnpaid  = Math.max(0, totalRevenue - totalPaid);
        const currency     = invoices[0]?.currency || 'BDT';
        const catCount     = {};
        invoices.forEach(inv => { const c=inv.category||'other'; catCount[c]=(catCount[c]||0)+1; });
        const topCategory  = Object.entries(catCount).sort((a,b)=>b[1]-a[1])[0]?.[0] || '—';
        const sorted       = [...invoices].sort((a,b)=>(b.savedAt?.seconds||0)-(a.savedAt?.seconds||0));
        return { total:invoices.length, thisMonth:thisMonthInvs.length, revenue:totalRevenue,
                 monthRevenue, totalPaid, totalUnpaid, topCategory, currency, catCount, recent:sorted.slice(0,5) };
    } catch(e) { console.warn('loadDashboardStats:', e); return null; }
};

// ── Expose showAuthModal globally so app-bundle can call it ───
window.showAuthModal = showAuthModal;

// ── Invoice History ───────────────────────────────────────────
async function getWorkspaceId() {
    const user = window._currentUser;
    if (!user) return null;
    const snap = await getDoc(doc(db, 'users', user.uid));
    return snap.data()?.workspaceId || user.uid;
}

window.saveInvoiceToHistory = async function() {
    const user = window._currentUser;
    if (!user) return toast('Please sign in first', 'error');
    if (!window.state) return;
    try {
        // Ensure workspace exists first (fixes new account race condition)
        await ensureUserDoc(user);
        const wsId = await getWorkspaceId();
        if (!wsId) return toast('Workspace not found — sign out and back in.', 'error');
        const d = window.state.invoiceData;
        // DO NOT spread invoiceData — logo is base64 and can exceed Firestore 1MB limit
        const inv = {
            orgName:      d.orgName      || '',
            address:      d.address      || '',
            phone:        d.phone        || '',
            email:        d.email        || '',
            currency:     d.currency     || 'BDT',
            invoiceNo:    d.invoiceNo    || '',
            date:         d.date         || '',
            customerName: d.customerName || '',
            items:        (d.items || []).map(i => ({
                id:    i.id    || 0,
                desc:  i.desc  || '',
                qty:   i.qty   || 1,
                price: i.price || 0
            })),
            taxRate:      d.taxRate      ?? 0,
            discountRate: d.discountRate ?? 0,
            paid:         d.paid         ?? 0,
            templateId:   window.state.templateId || '',
            category:     window.state.category   || '',
            style:        window.state.style      || '',
            savedBy:      user.uid,
            savedByName:  user.displayName || user.email || 'User',
            savedAt:      serverTimestamp(),
            workspaceId:  wsId
        };
        await addDoc(collection(db, 'workspaces', wsId, 'invoices'), inv);
        toast('✓ Invoice saved to history!', 'success');
        setTimeout(() => { if (window.renderDashboard) window.renderDashboard(); }, 300);
    } catch(e) {
        console.error('saveInvoiceToHistory error:', e.code, e.message);
        if (e.code === 'permission-denied') {
            toast('Permission denied — please deploy Firestore rules from Firebase Console.', 'error');
        } else {
            toast('Save failed: ' + e.message, 'error');
        }
    }
};

window.loadInvoiceHistory = async function() {
    const wsId = await getWorkspaceId();
    if (!wsId) return [];
    try {
        const q    = query(collection(db, 'workspaces', wsId, 'invoices'), orderBy('savedAt','desc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id:d.id, ...d.data() }));
    } catch(e) { console.warn('history load', e); return []; }
};

window.deleteInvoiceFromHistory = async function(invoiceId) {
    const wsId = await getWorkspaceId();
    if (!wsId) return;
    try {
        await deleteDoc(doc(db, 'workspaces', wsId, 'invoices', invoiceId));
        toast('Invoice deleted', 'info');
        window.openInvoiceHistory();
    } catch(e) { toast('Delete failed', 'error'); }
};

// ── Invoice History Modal ─────────────────────────────────────
window.openInvoiceHistory = async function() {
    let modal = document.getElementById('history-modal');
    if (!modal) { modal = document.createElement('div'); modal.id='history-modal'; document.body.appendChild(modal); }
    modal.innerHTML = `
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[900] flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <div class="flex items-center justify-between p-6 border-b border-gray-100">
          <div><h2 class="text-xl font-black text-gray-900">Invoice History</h2><p class="text-xs text-gray-400 mt-0.5">Your saved invoices</p></div>
          <button onclick="document.getElementById('history-modal').innerHTML=''" class="bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors">
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="p-6 overflow-y-auto flex-1" id="history-list">
          <div class="flex items-center justify-center py-16 text-gray-400 gap-3">
            <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
            Loading...
          </div>
        </div>
      </div>
    </div>`;

    const invoices = await window.loadInvoiceHistory();
    const list = document.getElementById('history-list');
    if (!list) return;

    if (!invoices.length) {
        list.innerHTML = `<div class="text-center py-16 text-gray-400">
            <svg class="w-14 h-14 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            <p class="font-semibold text-lg">No invoices saved yet</p>
            <p class="text-sm mt-1">Hit the green <b>Save</b> button in the editor</p>
        </div>`; return;
    }

    const styleBadge = s => ({trendy:'bg-purple-100 text-purple-700',modern:'bg-blue-100 text-blue-700',minimal:'bg-gray-100 text-gray-700'}[s] || 'bg-amber-100 text-amber-700');
    const fmt = (amt, cur) => { try { return new Intl.NumberFormat('en-BD',{style:'currency',currency:cur||'BDT',minimumFractionDigits:0}).format(amt); } catch(e){ return amt; } };

    list.innerHTML = `<div class="space-y-3">` + invoices.map(inv => {
        const dateStr = inv.savedAt?.toDate ? inv.savedAt.toDate().toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';
        const total = (inv.items||[]).reduce((s,i)=>s+(i.qty*i.price),0);
        return `
        <div class="bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all">
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1 flex-wrap">
                <span class="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${styleBadge(inv.style)}">${inv.style||'—'}</span>
                <span class="text-[10px] font-bold text-gray-400 uppercase">${inv.category||''}</span>
              </div>
              <h3 class="font-bold text-gray-900 truncate">${inv.orgName||'Unnamed'}</h3>
              <p class="text-xs text-gray-400 mt-0.5">Invoice #${inv.invoiceNo||'—'} · ${dateStr}</p>
              <p class="text-xs text-gray-400">Saved by ${inv.savedByName||'Unknown'}</p>
            </div>
            <div class="text-right shrink-0">
              <p class="text-lg font-black text-gray-900">${fmt(total, inv.currency)}</p>
              <p class="text-xs text-gray-400">${(inv.items||[]).length} item(s)</p>
            </div>
          </div>
          <div class="flex gap-2 mt-4 pt-3 border-t border-gray-100">
            <button onclick="loadInvoiceIntoEditor('${inv.id}')" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              Load &amp; Edit
            </button>
            <button onclick="deleteInvoiceFromHistory('${inv.id}')" class="bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 text-xs font-bold py-2 px-3 rounded-xl transition-all active:scale-95">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </div>`;
    }).join('') + `</div>`;
};

window.loadInvoiceIntoEditor = async function(invoiceId) {
    const wsId = await getWorkspaceId();
    if (!wsId) return;
    const snap = await getDoc(doc(db, 'workspaces', wsId, 'invoices', invoiceId));
    if (!snap.exists()) return toast('Invoice not found', 'error');
    const inv = snap.data();
    window.state.invoiceData = {
        orgName:inv.orgName||'', address:inv.address||'', phone:inv.phone||'', email:inv.email||'',
        logo:inv.logo||'', invoiceNo:inv.invoiceNo||'', currency:inv.currency||'BDT',
        date:inv.date||new Date().toISOString().split('T')[0], customerName:inv.customerName||'',
        items:inv.items||[], taxRate:inv.taxRate||0, discountRate:inv.discountRate||0, paid:inv.paid||0
    };
    window.state.templateId = inv.templateId;
    window.state.category   = inv.category;
    window.state.style      = inv.style;
    document.getElementById('history-modal').innerHTML = '';
    window.navigate('editor', { templateId: inv.templateId });
    toast('✓ Invoice loaded!', 'success');
};

// ── Team Workspace ────────────────────────────────────────────
window.loadWorkspace = async function() {
    const user = window._currentUser;
    if (!user) return null;
    const wsId   = await getWorkspaceId();
    const wsSnap = await getDoc(doc(db, 'workspaces', wsId));
    return wsSnap.exists() ? { id: wsSnap.id, ...wsSnap.data() } : null;
};

window.inviteTeamMember = async function(email) {
    email = (email||'').trim().toLowerCase();
    if (!email) return toast('Enter an email address', 'error');
    const q    = query(collection(db,'users'), where('email','==',email));
    const snap = await getDocs(q);
    if (snap.empty) return toast('No account found with that email', 'error');
    const invited = snap.docs[0].data();
    const wsId    = await getWorkspaceId();
    const wsRef   = doc(db,'workspaces',wsId);
    const wsSnap  = await getDoc(wsRef);
    const ws      = wsSnap.data();
    if (!ws.adminIds.includes(window._currentUser.uid)) return toast('Only admins can invite members','error');
    if (ws.memberIds.includes(invited.uid)) return toast('Already a member','error');
    await updateDoc(wsRef, {
        memberIds: arrayUnion(invited.uid),
        editorIds: arrayUnion(invited.uid),
        members:   arrayUnion({ uid:invited.uid, email:invited.email, name:invited.displayName||'', role:'editor' })
    });
    await updateDoc(doc(db,'users',invited.uid), { workspaceId: wsId });
    toast('✓ ' + email + ' added to team!', 'success');
    window.openTeamManager();
};

window.setMemberRole = async function(memberId, newRole) {
    const wsId   = await getWorkspaceId();
    const wsRef  = doc(db,'workspaces',wsId);
    const wsSnap = await getDoc(wsRef);
    const ws     = wsSnap.data();
    if (!ws.adminIds.includes(window._currentUser.uid)) return toast('Only admins can change roles','error');
    if (memberId === ws.ownerId) return toast('Cannot change owner role','error');
    const updates = { members: ws.members.map(m => m.uid===memberId ? {...m, role:newRole} : m) };
    if (newRole==='admin')  { updates.adminIds=arrayUnion(memberId);  updates.editorIds=arrayUnion(memberId); }
    if (newRole==='editor') { updates.adminIds=arrayRemove(memberId); updates.editorIds=arrayUnion(memberId); }
    if (newRole==='viewer') { updates.adminIds=arrayRemove(memberId); updates.editorIds=arrayRemove(memberId); }
    await updateDoc(wsRef, updates);
    toast('Role updated to ' + newRole, 'success');
    window.openTeamManager();
};

window.removeMember = async function(memberId) {
    const wsId   = await getWorkspaceId();
    const wsRef  = doc(db,'workspaces',wsId);
    const wsSnap = await getDoc(wsRef);
    const ws     = wsSnap.data();
    if (!ws.adminIds.includes(window._currentUser.uid)) return toast('Only admins can remove members','error');
    if (memberId === ws.ownerId) return toast('Cannot remove the owner','error');
    await updateDoc(wsRef, {
        memberIds: arrayRemove(memberId),
        editorIds: arrayRemove(memberId),
        adminIds:  arrayRemove(memberId),
        members:   ws.members.filter(m => m.uid !== memberId)
    });
    await updateDoc(doc(db,'users',memberId), { workspaceId: memberId });
    toast('Member removed', 'info');
    window.openTeamManager();
};

// ── Team Manager Modal ────────────────────────────────────────
window.openTeamManager = async function() {
    let modal = document.getElementById('team-modal');
    if (!modal) { modal = document.createElement('div'); modal.id='team-modal'; document.body.appendChild(modal); }
    modal.innerHTML = `<div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[900] flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        <div class="flex items-center justify-between p-6 border-b border-gray-100">
          <div><h2 class="text-xl font-black text-gray-900">Team Workspace</h2><p class="text-xs text-gray-400 mt-0.5" id="ws-subtitle">Loading…</p></div>
          <button onclick="document.getElementById('team-modal').innerHTML=''" class="bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors">
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="p-6 overflow-y-auto flex-1 space-y-5" id="team-body">
          <div class="flex items-center justify-center py-10 text-gray-400 gap-3">
            <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Loading…
          </div>
        </div>
      </div>
    </div>`;

    const ws  = await window.loadWorkspace();
    const uid = window._currentUser?.uid;
    const isAdmin = ws?.adminIds?.includes(uid);
    const sub = document.getElementById('ws-subtitle');
    const body = document.getElementById('team-body');
    if (sub) sub.textContent = `${ws?.name||'My Workspace'} · ${(ws?.members||[]).length} member(s)`;
    if (!body) return;

    const roleColor = { admin:'bg-purple-100 text-purple-700', editor:'bg-blue-100 text-blue-700', viewer:'bg-gray-100 text-gray-600' };

    body.innerHTML = `
    ${isAdmin ? `
    <div class="bg-blue-50 border border-blue-100 rounded-2xl p-4">
      <p class="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
        Invite Member
      </p>
      <div class="flex gap-2">
        <input id="invite-email" type="email" placeholder="colleague@example.com"
          class="flex-1 text-sm px-3 py-2 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white">
        <button onclick="inviteTeamMember(document.getElementById('invite-email').value)"
          class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all active:scale-95">Invite</button>
      </div>
      <p class="text-[10px] text-blue-500 mt-1.5">They need an existing Get-wayGenerator account</p>
    </div>` : ''}

    <div>
      <p class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Members</p>
      <div class="space-y-2">
        ${(ws?.members||[]).map(m => `
        <div class="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(m.name||m.email||'U')}&background=0D8ABC&color=fff&bold=true&size=32"
              class="w-8 h-8 rounded-full shrink-0">
            <div class="min-w-0">
              <p class="text-sm font-semibold text-gray-900 truncate">${m.name||'User'}</p>
              <p class="text-xs text-gray-400 truncate">${m.email}</p>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="text-[10px] font-black uppercase px-2 py-1 rounded-full ${roleColor[m.role]||roleColor.viewer}">${m.role||'viewer'}</span>
            ${isAdmin && m.uid !== ws.ownerId ? `
            <select onchange="setMemberRole('${m.uid}',this.value)" class="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none bg-white focus:ring-2 focus:ring-blue-500">
              <option value="admin"  ${m.role==='admin' ?'selected':''}>Admin</option>
              <option value="editor" ${m.role==='editor'?'selected':''}>Editor</option>
              <option value="viewer" ${m.role==='viewer'?'selected':''}>Viewer</option>
            </select>
            <button onclick="removeMember('${m.uid}')" class="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg p-1 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>` : `<span class="text-[10px] text-gray-400">${m.uid===ws?.ownerId?'Owner':'—'}</span>`}
          </div>
        </div>`).join('')}
      </div>
    </div>

    <div class="bg-gray-50 rounded-2xl p-4 text-xs text-gray-500 space-y-1">
      <p class="font-bold text-gray-700 mb-1.5">Role Permissions</p>
      <p><span class="font-bold text-purple-700">Admin</span> — Full access + manage team</p>
      <p><span class="font-bold text-blue-700">Editor</span> — View &amp; create/edit invoices</p>
      <p><span class="font-bold text-gray-700">Viewer</span> — View invoices only</p>
    </div>`;
};

// ── Auth UI functions ─────────────────────────────────────────
let captchaVerifier = null, otpResult = null;

window.authShowTab = function(tab) {
    ['login','register','phone'].forEach(t => {
        document.getElementById('auth-tab-'+t)?.classList.toggle('hidden', t!==tab);
        const btn = document.getElementById('auth-tab-btn-'+t);
        if (!btn) return;
        btn.classList.toggle('border-blue-600', t===tab);
        btn.classList.toggle('text-blue-600',   t===tab);
        btn.classList.toggle('border-transparent', t!==tab);
        btn.classList.toggle('text-gray-500',   t!==tab);
    });
};

window.authGoogleSignIn = async function() {
    try { await signInWithPopup(auth, new GoogleAuthProvider()); }
    catch(e) { if (e.code !== 'auth/popup-closed-by-user') toast(e.message,'error'); }
};

window.authEmailRegister = async function() {
    const name  = (document.getElementById('reg-name')?.value  || '').trim();
    const email = (document.getElementById('reg-email')?.value || '').trim();
    const pass  =  document.getElementById('reg-pass')?.value  || '';
    const pass2 =  document.getElementById('reg-pass2')?.value || '';

    if (!name)           return toast('Enter your full name', 'error');
    if (!email)          return toast('Enter your email address', 'error');
    if (!pass)           return toast('Enter a password', 'error');
    if (pass.length < 6) return toast('Password must be at least 6 characters', 'error');
    if (pass !== pass2)  return toast('Passwords do not match', 'error');

    setBtnLoading(true);
    try {
        // 1. Create the account
        const cred = await createUserWithEmailAndPassword(auth, email, pass);

        // 2. Set display name BEFORE onAuthStateChanged does ensureUserDoc
        //    We use a flag so the listener waits for profile to be set
        window._pendingDisplayName = name;
        await updateProfile(cred.user, { displayName: name });
        window._pendingDisplayName = null;

        // 3. Force-reload so auth state listener sees updated displayName
        await cred.user.reload();
        // onAuthStateChanged will fire automatically and handle the rest

    } catch (e) {
        const msg = e.message
            .replace('Firebase: ', '')
            .replace('(auth/email-already-in-use)', '— that email is already registered. Try signing in instead.')
            .replace('(auth/invalid-email)', '— invalid email format.')
            .replace('(auth/weak-password)', '— choose a stronger password.');
        toast(msg, 'error');
        setBtnLoading(false);  // only re-enable on error; success navigates away
    }
};

window.authEmailLogin = async function() {
    const email = document.getElementById('login-email')?.value.trim();
    const pass  = document.getElementById('login-pass')?.value;
    if (!email||!pass) return toast('Enter email and password','error');
    try {
        setBtnLoading(true);
        await signInWithEmailAndPassword(auth, email, pass);
    } catch(e) { toast('Invalid email or password','error'); }
    finally { setBtnLoading(false); }
};

window.authForgotPassword = async function() {
    const email = document.getElementById('login-email')?.value.trim();
    if (!email) return toast('Enter your email first','error');
    try { await sendPasswordResetEmail(auth, email); toast('✓ Reset email sent!','success'); }
    catch(e) { toast(e.message,'error'); }
};

window.authSendOTP = async function() {
    const phone = (document.getElementById('phone-input')?.value || '').trim();
    if (!phone) return toast('Enter a phone number with country code (e.g. +880 1700000000)', 'error');
    if (!phone.startsWith('+')) return toast('Include the country code — e.g. +880 for Bangladesh', 'error');

    setBtnLoading(true);
    try {
        // Clear any existing verifier so we always get a fresh one
        if (captchaVerifier) {
            captchaVerifier.clear();
            captchaVerifier = null;
        }
        // Render the reCAPTCHA widget visibly so it actually completes
        captchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'normal',
            callback: () => {
                // reCAPTCHA solved — auto-proceed
                _doSendOTP(phone);
            },
            'expired-callback': () => {
                toast('reCAPTCHA expired — please try again', 'error');
                captchaVerifier = null;
                setBtnLoading(false);
            }
        });
        captchaVerifier.render();

    } catch (e) {
        toast(e.message || 'Failed to set up phone auth', 'error');
        captchaVerifier = null;
        setBtnLoading(false);
    }
};

async function _doSendOTP(phone) {
    window._lastOTPPhone = phone;
    try {
        otpResult = await signInWithPhoneNumber(auth, phone, captchaVerifier);
        // Show OTP input screen
        document.getElementById('otp-step')?.classList.remove('hidden');
        document.getElementById('phone-step')?.classList.add('hidden');
        // Show number in OTP screen
        const display = document.getElementById('otp-phone-display');
        if (display) display.textContent = phone;
        toast('✓ OTP sent! Check your messages.', 'success');
    } catch (e) {
        let msg = e.message || 'Failed to send OTP';
        if (e.code === 'auth/invalid-phone-number')    msg = 'Invalid phone number — include country code, e.g. +880…';
        if (e.code === 'auth/too-many-requests')       msg = 'Too many attempts — wait a few minutes and try again';
        if (e.code === 'auth/captcha-check-failed')    msg = 'reCAPTCHA failed — please refresh and try again';
        toast(msg, 'error');
        // Reset so user can retry
        if (captchaVerifier) { captchaVerifier.clear(); captchaVerifier = null; }
        // Re-render an empty container for retry
        const container = document.getElementById('recaptcha-container');
        if (container) container.innerHTML = '';
    } finally {
        setBtnLoading(false);
    }
}

window.authVerifyOTP = async function() {
    const code = (document.getElementById('otp-input')?.value || '').trim().replace(/\s/g, '');
    if (!code)     return toast('Enter the 6-digit OTP', 'error');
    if (!otpResult) return toast('Session expired — please request a new OTP', 'error');
    if (code.length !== 6 || !/^\d+$/.test(code)) return toast('OTP must be exactly 6 digits', 'error');

    setBtnLoading(true);
    try {
        await otpResult.confirm(code);
        // onAuthStateChanged handles the rest
    } catch (e) {
        let msg = 'Invalid OTP — please try again';
        if (e.code === 'auth/code-expired')          msg = 'OTP expired — request a new one';
        if (e.code === 'auth/invalid-verification-code') msg = 'Wrong OTP — double-check and try again';
        toast(msg, 'error');
        setBtnLoading(false);
    }
};

window.authResendOTP = async function() {
    // Reset back to phone step and re-trigger
    authResetPhone();
    setTimeout(() => {
        // Restore the phone number and auto-click send
        const phone = window._lastOTPPhone || '';
        const input = document.getElementById('phone-input');
        if (input && phone) input.value = phone;
    }, 100);
};

window.authResetPhone = function() {
    document.getElementById('otp-step')?.classList.add('hidden');
    document.getElementById('phone-step')?.classList.remove('hidden');
    document.getElementById('otp-input') && (document.getElementById('otp-input').value = '');
    // Clear recaptcha so it re-renders fresh
    if (captchaVerifier) { try { captchaVerifier.clear(); } catch(e){} captchaVerifier = null; }
    const container = document.getElementById('recaptcha-container');
    if (container) container.innerHTML = '';
    otpResult = null;
    setBtnLoading(false);
};

window.authSignOut = async function() {
    await signOut(auth);
    document.getElementById('user-menu')?.classList.add('hidden');
    toast('Signed out', 'info');
};

window.toggleUserMenu = function() {
    document.getElementById('user-menu')?.classList.toggle('hidden');
};

function setBtnLoading(on) {
    // Only disable buttons in the currently visible auth tab
    const visibleTab = ['login','register','phone'].find(t => {
        const el = document.getElementById('auth-tab-' + t);
        return el && !el.classList.contains('hidden');
    });
    const scope = visibleTab
        ? document.getElementById('auth-tab-' + visibleTab)
        : document;
    if (!scope) return;
    scope.querySelectorAll('.auth-btn').forEach(b => {
        b.disabled = on;
        b.classList.toggle('opacity-60', on);
        b.classList.toggle('cursor-not-allowed', on);
    });
}

// ── Bridge assignments (firebase.js ES module runs AFTER app-bundle.js)
window._fb_saveInvoiceToHistory = window.saveInvoiceToHistory;
window._fb_openInvoiceHistory   = window.openInvoiceHistory;
window._fb_openTeamManager      = window.openTeamManager;
window._fb_openCustomerManager  = window.openCustomerManager;
window._fb_toggleUserMenu       = window.toggleUserMenu;
window._fb_authSignOut          = window.authSignOut;
window._fb_authShowTab          = window.authShowTab;
window._fb_authGoogleSignIn     = window.authGoogleSignIn;
window._fb_authEmailLogin       = window.authEmailLogin;
window._fb_authEmailRegister    = window.authEmailRegister;
window._fb_authForgotPassword   = window.authForgotPassword;
window._fb_authSendOTP          = window.authSendOTP;
window._fb_authVerifyOTP        = window.authVerifyOTP;
window._fb_renderDashboard      = window.renderDashboard;
window._fb_loadDashboardStats   = window.loadDashboardStats;
