import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const demoAdmin = {
    username: process.env.DEMO_ADMIN_USERNAME || "admin",
    password: process.env.DEMO_ADMIN_PASSWORD || "admin123",
  };

  const demoStaff = {
    username: process.env.DEMO_STAFF_USERNAME || "staff",
    password: process.env.DEMO_STAFF_PASSWORD || "staff123",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-2xl shadow-xl shadow-blue-500/25 mb-3">
            LAB
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Lab Inventory System
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Sistem Manajemen Inventaris & Peminjaman Laboratorium
          </p>
        </div>

        {/* Client Form */}
        <LoginForm demoAdmin={demoAdmin} demoStaff={demoStaff} />

        <p className="text-center text-xs text-slate-500 mt-6">
          Coding Talent Challenge • Public Deployment
        </p>
      </div>
    </div>
  );
}
