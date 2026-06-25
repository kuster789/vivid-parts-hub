import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import WhatsAppButton from "@/components/WhatsAppButton";
import LeadCapturePopup from "@/components/LeadCapturePopup";
import CookieConsent from "@/components/CookieConsent";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import { usePageTracking } from "@/hooks/usePageTracking";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const PageTracker = () => {
  usePageTracking();
  return null;
};

// Lazy-loaded routes
const Index = lazy(() => import("./pages/Index"));
const Catalog = lazy(() => import("./pages/Catalog"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Support = lazy(() => import("./pages/Support"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Admin = lazy(() => import("./pages/Admin"));
const SobreNos = lazy(() => import("./pages/SobreNos"));
const PoliticaPrivacidade = lazy(() => import("./pages/PoliticaPrivacidade"));
const TermosUso = lazy(() => import("./pages/TermosUso"));
const PoliticaDevolucao = lazy(() => import("./pages/PoliticaDevolucao"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Tracking = lazy(() => import("./pages/Tracking"));
const Forbidden = lazy(() => import("./pages/Forbidden"));
const QualidadeGarantida = lazy(() => import("./pages/QualidadeGarantida"));
const EnvioNacional = lazy(() => import("./pages/EnvioNacional"));
const SuporteTecnico = lazy(() => import("./pages/SuporteTecnico"));
const Manuais = lazy(() => import("./pages/Manuais"));
const BrandPage = lazy(() => import("./pages/BrandPage"));
const KitsRevisao = lazy(() => import("./pages/KitsRevisao"));
const MinhaConta = lazy(() => import("./pages/MinhaConta"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));

const PageLoader = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <PageTracker />
            <Header />
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/catalogo" element={<Catalog />} />
                  <Route path="/produto/:id" element={<ProductDetail />} />
                  <Route path="/carrinho" element={<Cart />} />
                  <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                  <Route path="/suporte" element={<Support />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/cadastro" element={<Register />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/sobre" element={<SobreNos />} />
                  <Route path="/privacidade" element={<PoliticaPrivacidade />} />
                  <Route path="/termos" element={<TermosUso />} />
                  <Route path="/devolucao" element={<PoliticaDevolucao />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:slug" element={<BlogPost />} />
                  <Route path="/favoritos" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
                  <Route path="/rastreamento" element={<ProtectedRoute><Tracking /></ProtectedRoute>} />
                  <Route path="/403" element={<Forbidden />} />
                  <Route path="/qualidade" element={<QualidadeGarantida />} />
                  <Route path="/envio" element={<EnvioNacional />} />
                  <Route path="/suporte-tecnico" element={<SuporteTecnico />} />
                  <Route path="/manuais" element={<Manuais />} />
                  <Route path="/marca/:slug" element={<BrandPage />} />
                  <Route path="/kits-revisao" element={<KitsRevisao />} />
                  <Route path="/minha-conta" element={<ProtectedRoute><MinhaConta /></ProtectedRoute>} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
            <Footer />
            <ChatBot />
            <WhatsAppButton />
            <LeadCapturePopup />
            <CookieConsent />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
