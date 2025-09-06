import { Link } from "wouter";
import { Store } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-gradient-to-br from-primary to-accent text-white rounded-lg p-2">
                <Store className="h-5 w-5" />
              </div>
              <span className="font-bold text-foreground">HUL Distribution</span>
            </div>
            <p className="text-muted-foreground mb-4">
              Your trusted partner for quality grocery distribution across India.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary" data-testid="link-facebook">
                <i className="fab fa-facebook"></i>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary" data-testid="link-twitter">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary" data-testid="link-linkedin">
                <i className="fab fa-linkedin"></i>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground mb-4">Products</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link href="/products?category=personal-care" className="hover:text-primary" data-testid="link-personal-care">Personal Care</Link></li>
              <li><Link href="/products?category=home-care" className="hover:text-primary" data-testid="link-home-care">Home Care</Link></li>
              <li><Link href="/products?category=foods-beverages" className="hover:text-primary" data-testid="link-foods-beverages">Foods & Beverages</Link></li>
              <li><Link href="/products?category=ice-cream" className="hover:text-primary" data-testid="link-ice-cream">Ice Cream</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground mb-4">Support</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-primary">Help Center</a></li>
              <li><a href="#" className="hover:text-primary">Contact Us</a></li>
              <li><a href="#" className="hover:text-primary">Order Tracking</a></li>
              <li><a href="#" className="hover:text-primary">Returns</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground mb-4">Company</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-primary">About Us</a></li>
              <li><a href="#" className="hover:text-primary">Careers</a></li>
              <li><a href="#" className="hover:text-primary">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <hr className="border-border my-8" />
        
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-muted-foreground">
            © 2024 Hindustan Unilever Distribution. All rights reserved.
          </p>
          <p className="text-muted-foreground">
            Powered by modern web technologies
          </p>
        </div>
      </div>
    </footer>
  );
}
