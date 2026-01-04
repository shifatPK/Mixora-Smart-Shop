
export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  buyingPrice?: number; // New
  category: string; // Primary category (for backward compatibility)
  categories?: string[]; // New: Multiple categories support
  description: string;
  shortDescription?: string; // New
  
  image: string; // Main thumbnail
  images?: string[]; // Multiple images support
  videoUrls?: string[]; // New: Supports multiple videos
  videoUrl?: string; // Legacy support
  
  stock: boolean;
  stockQuantity?: number; // New
  sku?: string; // New
  productSerial?: string; // New
  unit?: string; // New (kg, pcs)
  
  weight?: string; // New
  dimensions?: { // New
    length: string;
    width: string;
    height: string;
  };
  
  features?: string[];
  
  warranty?: string; // New
  initialSold?: number; // New
  source?: string; // New (Self, Vendor)
  
  deliveryCharge?: { // New
    isDefault: boolean;
    amount?: number;
  };
  
  sizes?: string[]; // New: Available sizes
  variants?: { // New
    name: string; // e.g. Color
    options: string; // e.g. Red, Blue (Comma separated)
  }[];
  
  status: 'Active' | 'Inactive'; // New
  createdAt?: any;
}

export interface Category {
  id: string;
  name: string;
  icon: string; 
}

export interface CartItem extends Product {
  quantity: number;
  selectedVariant?: string; // Selected variant details (e.g. "Color: Red")
  selectedSize?: string; // Selected size (e.g. "XL")
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: CartItem[];
  totalAmount: number;
  subTotal?: number; // New
  discount?: number; // New
  couponCode?: string; // New
  shippingCost: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Order Placed' | 'Order Confirmed' | 'Order Completed' | 'Order Returned' | 'Order Canceled';
  paymentMethod: string;
  createdAt: any; 
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'fixed' | 'percentage';
  discountAmount: number;
  minOrderAmount?: number;
  status: 'active' | 'inactive';
  usageCount: number;
}
