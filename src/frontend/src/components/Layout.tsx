import { Outlet } from "@tanstack/react-router";
import EmailSetupModal from "./EmailSetupModal";
import Footer from "./Footer";
import Header from "./Header";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <EmailSetupModal />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
