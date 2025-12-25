
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { Landing } from "./pages/Landing";
import { HowItWorks } from "./pages/HowItWorks";
import { Documentation } from "./pages/Documentation";
import { Login } from "./pages/Login";
import { Privacy } from "./pages/Privacy";
import { Terms } from "./pages/Terms";
import { Waitlist } from "./pages/Waitlist";
import { Contact } from "./pages/Contact";
import { AuthProvider } from "./context/AuthContext";

import { DashboardLayout } from "./layouts/DashboardLayout";
import { Overview } from "./pages/dashboard/Overview";
import { Admin } from "./pages/dashboard/Admin";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Wrapper to inject navigation props into pages that expect them
const PageWrapper = ({ Component }: { Component: React.ComponentType<any> }) => {
    const navigate = useNavigate();
    return (
        <Component
            onBack={() => navigate("/")}
            onNavigate={(page: string) => navigate(`/${page}`)}
        />
    );
};

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Landing />} />
                    <Route path="/how-it-works" element={<PageWrapper Component={HowItWorks} />} />
                    <Route path="/documentation" element={<PageWrapper Component={Documentation} />} />
                    <Route path="/login" element={<PageWrapper Component={Login} />} />
                    <Route path="/privacy" element={<PageWrapper Component={Privacy} />} />
                    <Route path="/terms" element={<PageWrapper Component={Terms} />} />
                    <Route path="/waitlist" element={<PageWrapper Component={Waitlist} />} />
                    <Route path="/contact" element={<PageWrapper Component={Contact} />} />

                    {/* Protected Dashboard Routes */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <DashboardLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Overview />} />
                        <Route path="admin" element={<Admin />} />
                        {/* Add placeholders for other sidebar links if needed */}
                        <Route path="*" element={<Overview />} />
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}
