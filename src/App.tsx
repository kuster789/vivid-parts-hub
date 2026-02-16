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
import Index from "./pages/Index";
import Catalog from "./pages/Catalog";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Support from "./pages/Support";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Admin from "./pages/Admin";
import SobreNos from "./pages/SobreNos";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";
import TermosUso from "./pages/TermosUso";
import PoliticaDevolucao from "./pages/PoliticaDevolucao";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Wishlist from "./pages/Wishlist";
import Tracking from "./pages/Tracking";
import Visualizacao3D from "./pages/Visualizacao3D";
import QualidadeGarantida from "./pages/QualidadeGarantida";
import EnvioNacional from "./pages/EnvioNacional";
import SuporteTecnico from "./pages/SuporteTecnico";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Header />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/catalogo" element={<Catalog />} />
              <Route path="/produto/:id" element={<ProductDetail />} />
              <Route path="/carrinho" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
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
              <Route path="/favoritos" element={<Wishlist />} />
              <Route path="/rastreamento" element={<Tracking />} />
              <Route path="/visualizacao-3d" element={<Visualizacao3D />} />
              <Route path="/qualidade" element={<QualidadeGarantida />} />
              <Route path="/envio" element={<EnvioNacional />} />
              <Route path="/suporte-tecnico" element={<SuporteTecnico />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Footer />
            <ChatBot />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
