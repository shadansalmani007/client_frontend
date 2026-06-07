import { AppFooter } from "../components/AppFooter.jsx";
import { AppHeader } from "../components/AppHeader.jsx";

export function RootLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AppHeader />
      <main>{children}</main>
      <AppFooter />
    </div>
  );
}
