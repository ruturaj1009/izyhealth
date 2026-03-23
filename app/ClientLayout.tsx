'use client';
import { useState } from "react";
import { usePathname } from 'next/navigation';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Sidebar from "./components/Sidebar";
import TopHeader from "./components/TopHeader";
import OfflinePage from "./components/OfflinePage";
import FloatingSupport from "./components/FloatingSupport";
import { Toaster } from 'react-hot-toast';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Open sidebar
  const handleOpen = () => setSidebarOpen(true);
  
  // Close sidebar (only if not pinned? For now, standard hover behavior: leave -> close)
  const handleClose = () => setSidebarOpen(false);

  // Toggle (for click)
  const handleToggle = () => setSidebarOpen(prev => !prev);
  
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  if (isAuthPage) {
      return (
          <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
            <OfflinePage />
            {children}
          </GoogleOAuthProvider>
      );
  }

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
    <div style={{display:'flex', height:'100vh', overflow:'hidden'}}>
      <Toaster position="top-center" />
      <OfflinePage />
      
      {/* Sidebar with integrated backdrop */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
        onClose={handleClose}
      />

      {/* Main Content */}
      <div style={{flexGrow:1, display:'flex', flexDirection:'column', height:'100vh', overflowY:'auto', width:'100%'}}>
         <TopHeader 
            onMenuClick={handleToggle} 
            onMenuHover={handleOpen}
         />
         
         <main style={{flexGrow:1, position:'relative'}}>
           {children}
         </main>
      </div>

      <FloatingSupport />
    </div>
    </GoogleOAuthProvider>
  );
}
