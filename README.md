# ⚡ Get-wayGenerator

A professional, browser-based invoice and receipt generator with 135 templates across 5 industries. Works instantly as a guest — no login required.

## ✨ Features

- **135 Templates** — Hospital, Grocery, Education, Restaurant, Transport
- **4 Design Styles** — Thermal/Old, Modern, Trendy, Minimal
- **Guest Mode** — generate, preview, and export with no account needed
- **PDF & PNG Export** — one-click download, watermark-free for registered users
- **Firebase Auth** — Google Sign-In, Email/Password, Phone OTP
- **Invoice History** — save, reload, and delete past invoices (cloud-synced)
- **Business Profile** — save your org details and auto-fill every invoice
- **Customer Manager** — save customer info and apply it in one click
- **Team Workspace** — invite members, assign roles (Admin / Editor / Viewer)
- **Dashboard** — total invoices, total revenue, this month's count
- **Fully Responsive** — works on desktop and mobile

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML, Tailwind CSS, Vanilla JS |
| Auth & Database | Firebase Authentication + Firestore |
| PDF Export | html2pdf.js |
| PNG Export | html2canvas |
| Icons | Lucide |
| Hosting | Netlify |

## 🚀 Getting Started

1. Clone the repo
2. Deploy all 5 files to Netlify (or any static host)
3. Add your Netlify domain to Firebase Console → Authentication → Authorized Domains
4. Enable Email, Google, and Phone sign-in methods in Firebase Console
5. Set Firestore security rules (see `/netlify.toml` for setup notes)

## 📁 Project Structure
```
index.html        # App shell, auth modal, all views
app-bundle.js     # State, templates, editor, export logic
firebase.js       # Auth, Firestore, dashboard, customer management
styles.css        # Base styles, thermal paper effect, animations
netlify.toml      # Netlify headers config
```

## 📄 License

MIT — free to use and modify.
