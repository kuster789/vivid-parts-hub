import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: "https://motopecasagrale.com.br/" },
      ...items.map((item, idx) => ({
        "@type": "ListItem",
        position: idx + 2,
        name: item.label,
        ...(item.href ? { item: `https://motopecasagrale.com.br${item.href}` } : {}),
      })),
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link to="/" className="flex items-center gap-1 transition-colors hover:text-foreground">
          <Home className="h-3 w-3" /> Início
        </Link>
        {items.map((item, idx) => (
          <span key={idx} className="flex items-center gap-1.5">
            <ChevronRight className="h-3 w-3" />
            {item.href ? (
              <Link to={item.href} className="transition-colors hover:text-foreground">{item.label}</Link>
            ) : (
              <span className="font-medium text-foreground truncate max-w-[200px]">{item.label}</span>
            )}
          </span>
        ))}
      </nav>
    </>
  );
};

export default Breadcrumbs;
