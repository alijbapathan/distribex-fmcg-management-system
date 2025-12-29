import { Link } from "wouter";
import { Store } from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border mt-12 sm:mt-16 lg:mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-gradient-to-br from-primary to-accent text-white rounded-lg p-2">
                <Store className="h-5 w-5" />
              </div>
              <span className="font-bold text-sm sm:text-base text-foreground">HUL Distribution</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4">
              Your trusted partner for quality grocery distribution across India.
            </p>
            <div className="flex space-x-3">
              <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-facebook">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12a10 10 0 10-11.5 9.9v-7H8v-3h2.5V9.5c0-2.5 1.5-3.9 3.7-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12H20l-1.5 2.9h-2.5v7A10 10 0 0022 12z"/></svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-twitter">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 5.9c-.6.3-1.2.5-1.9.6.7-.4 1.2-1 1.5-1.7-.6.4-1.3.7-2 .9C18.3 4.9 17.4 4.5 16.4 4.5c-1.6 0-2.9 1.3-2.9 2.9 0 .2 0 .5.1.7-2.4-.1-4.5-1.3-5.9-3.1-.3.6-.5 1.3-.5 2 0 1.4.7 2.6 1.8 3.3-.6 0-1.2-.2-1.7-.5v.1c0 1.9 1.3 3.6 3 4-.3.1-.7.2-1 .2-.2 0-.4 0-.6-.1.4 1.3 1.5 2.3 2.8 2.3C7 19.1 5.5 19.6 4 19.6c-.4 0-.9 0-1.3-.1 1.3.8 2.9 1.3 4.5 1.3 5.4 0 8.3-4.5 8.3-8.3v-.4c.6-.4 1.1-1 1.5-1.7z"/></svg>
              </a>
              <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-linkedin">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 3A2 2 0 0121 5v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14zM8.5 18V10H6v8h2.5zM7.3 8.8a1.3 1.3 0 110-2.6 1.3 1.3 0 010 2.6zM18 18V13.2c0-2.4-1.3-3.5-3-3.5-1.4 0-2 .8-2.4 1.4V10H10v8h2.5v-4.4c0-1.1.2-2 1.5-2 1.3 0 1.3 1.2 1.3 2.1V18H18z"/></svg>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-sm sm:text-base text-foreground mb-3 sm:mb-4">Products</h3>
            <ul className="space-y-1 sm:space-y-2 text-muted-foreground text-xs sm:text-sm">
              <li><Link href="/products?category=personal-care" className="hover:text-primary transition-colors" data-testid="link-personal-care">Personal Care</Link></li>
              <li><Link href="/products?category=home-care" className="hover:text-primary transition-colors" data-testid="link-home-care">Home Care</Link></li>
              <li><Link href="/products?category=foods-beverages" className="hover:text-primary transition-colors" data-testid="link-foods-beverages">Foods & Beverages</Link></li>
              <li><Link href="/products?category=ice-cream" className="hover:text-primary transition-colors" data-testid="link-ice-cream">Ice Cream</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-sm sm:text-base text-foreground mb-3 sm:mb-4">Support</h3>
            <ul className="space-y-1 sm:space-y-2 text-muted-foreground text-xs sm:text-sm">
              <li><Link href="/help" className="hover:text-primary transition-colors">Help Center</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link href="/orders" className="hover:text-primary transition-colors">Order Tracking</Link></li>
              <li><Link href="/returns" className="hover:text-primary transition-colors">Returns</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-sm sm:text-base text-foreground mb-3 sm:mb-4">Company</h3>
            <ul className="space-y-1 sm:space-y-2 text-muted-foreground text-xs sm:text-sm">
              <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/careers" className="hover:text-primary transition-colors">Careers</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        
        <hr className="border-border my-6 sm:my-8" />
        
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 text-center sm:text-left">
          <p className="text-xs sm:text-sm text-muted-foreground">
            © {year} Hindustan Unilever Distribution. All rights reserved.
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Powered by modern web technologies
          </p>
        </div>
      </div>
    </footer>
  );
}
