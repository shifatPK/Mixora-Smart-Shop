
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Product, CartItem } from '../types';
import ProductCard from '../components/ProductCard';
import { db } from '../firebase';
import { doc, getDoc, collection, setDoc, Timestamp, query, limit, getDocs, where, orderBy } from 'firebase/firestore';
import { 
  Minus, Plus, Loader2, ArrowRight, CheckCircle2, ShieldCheck, Truck, PackageCheck, 
  Banknote, ShoppingCart, Sparkles, Layers, Info, 
  Star, Heart, Home, ChevronRight, Gift, Flame, Video, PlayCircle,
  RotateCcw, BookOpen
} from 'lucide-react';

interface ProductDetailsProps {
  addToCart: (product: Product | CartItem) => void;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ addToCart }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Selection State
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [selectedVariantName, setSelectedVariantName] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: 'Dhaka City', // Default to Inside Dhaka
    paymentMethod: 'cod'
  });
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{id: string, total: number} | null>(null);
  const [isReturnPolicyVisible, setIsReturnPolicyVisible] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const prodData = { id: docSnap.id, ...docSnap.data() } as Product;
          setProduct(prodData);
          
          if (prodData.sizes && prodData.sizes.length > 0) {
              setSelectedSize(prodData.sizes[0]);
          }
          if (prodData.variants && prodData.variants.length > 0) {
              const firstVariant = prodData.variants[0];
              const options = firstVariant.options.split(',').map(s => s.trim());
              if (options.length > 0) {
                  setSelectedVariant(options[0]);
                  setSelectedVariantName(firstVariant.name);
              }
          }
          
          const relatedQ = query(
              collection(db, "products"), 
              where("category", "==", prodData.category), 
              limit(5)
          );
          const relatedSnap = await getDocs(relatedQ);
          const related = relatedSnap.docs
            .map(d => ({id: d.id, ...d.data()} as Product))
            .filter(p => p.id !== prodData.id);
          setRelatedProducts(related);
        }
      } catch (error) {
        console.error("Error getting product:", error);
      }
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  const renderManualDescription = (desc: string) => {
    if (!desc) return <p className="text-gray-600">No details available.</p>;

    const lines = desc.split('\n').filter(line => line.trim() !== '');

    return (
        <div className="space-y-4">
            {lines.map((line, index) => {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ') || /^\d+\.\s/.test(trimmedLine)) {
                    return (
                        <div key={index} className="flex items-start gap-3">
                            <div className="mt-1.5 shrink-0">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                            </div>
                            <p className="text-gray-700 leading-relaxed font-medium">
                                {trimmedLine.replace(/^(\* |- |\d+\.\s)/, '')}
                            </p>
                        </div>
                    );
                }
                return (
                    <p key={index} className="text-gray-700 leading-relaxed font-medium">
                        {trimmedLine}
                    </p>
                );
            })}
        </div>
    );
  };

  const getYoutubeEmbedUrl = (url: string) => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}?modestbranding=1&rel=0&showinfo=0` : null;
  };
  
  const getYoutubeThumbnail = (url: string) => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg` : null;
  };

  const NativeVideoPlayer = ({ url }: { url: string }) => {
      const [isPlaying, setIsPlaying] = useState(false);
      const embedUrl = getYoutubeEmbedUrl(url);
      const thumb = getYoutubeThumbnail(url);
      if (!embedUrl) return null;
      if (!isPlaying) {
          return (
              <div onClick={() => setIsPlaying(true)} className="w-full h-full relative cursor-pointer group bg-black">
                  <img src={thumb || ''} className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity" alt="Video thumbnail" />
                  <div className="absolute inset-0 flex items-center justify-center">
                       <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg border border-white/50">
                           <PlayCircle className="w-10 h-10 text-white fill-white" />
                       </div>
                  </div>
              </div>
          );
      }
      return (
         <iframe width="100%" height="100%" src={`${embedUrl}&autoplay=1`} title="Video" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full"></iframe>
      );
  };

  const generateOrderId = async () => {
    const now = new Date();
    const datePrefix = `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
    let newSequence = Math.floor(Math.random() * 90 + 10).toString();
    return `${datePrefix}${newSequence}`;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F1F2F4]"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  if (!product) return <div className="min-h-screen flex items-center justify-center">পণ্যটি পাওয়া যায়নি</div>;

  const discountPercentage = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0;
  
  const productImages = product.images && product.images.length > 0 ? product.images : [product.image];
  const shippingCost = formData.city === 'Dhaka City' ? 70 : 120;
  const subTotal = product.price * quantity;
  const total = subTotal + shippingCost;

  const handleDirectOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderLoading(true);

    try {
      const customOrderId = await generateOrderId();
      const orderItem = {
          ...product,
          quantity: quantity,
          selectedSize: selectedSize || undefined,
          selectedVariant: selectedVariant ? `${selectedVariantName}: ${selectedVariant}` : undefined
      };

      await setDoc(doc(db, 'orders', customOrderId), {
        id: customOrderId,
        customerName: formData.name,
        customerPhone: formData.phone,
        customerAddress: `${formData.address}, ${formData.city}`,
        items: [orderItem],
        totalAmount: total,
        shippingCost: shippingCost,
        status: 'Pending',
        paymentMethod: formData.paymentMethod,
        createdAt: Timestamp.now()
      });

      setOrderSuccess({ id: customOrderId, total: total });
      setFormData({ name: '', phone: '', address: '', city: 'Dhaka City', paymentMethod: 'cod' });
      setQuantity(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error("Order error:", error);
      alert('অর্ডার করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    }
    setOrderLoading(false);
  };

  const handleAddToCart = () => {
    const cartItem: CartItem = {
        ...product,
        quantity: 1,
        selectedSize: selectedSize || undefined,
        selectedVariant: selectedVariant ? `${selectedVariantName}: ${selectedVariant}` : undefined
    };
    
    for(let i=0; i<quantity; i++) {
        addToCart(cartItem);
    }
  };

  const scrollToOrder = () => {
      document.getElementById('order-form')?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const SizeVariantSelector = () => (
    <>
      {product.sizes && product.sizes.length > 0 && (
        <div className="space-y-3 mt-4">
          <label className="text-xs font-black text-gray-500 ml-1 uppercase tracking-wide">সাইজ সিলেক্ট করুন</label>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size, idx) => (
              <button 
                key={idx} 
                type="button"
                onClick={() => setSelectedSize(size)}
                className={`px-4 py-2 rounded-xl font-bold border-2 transition-all text-sm ${selectedSize === size ? 'border-purple-600 bg-purple-50 text-purple-600 shadow-sm' : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'}`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}
      {product.variants && product.variants.map((variant, idx) => (
        <div key={idx} className="space-y-3 mt-4">
          <label className="text-xs font-black text-gray-500 ml-1 uppercase tracking-wide">{variant.name} সিলেক্ট করুন</label>
          <div className="flex flex-wrap gap-2">
            {variant.options.split(',').map((opt, i) => {
              const val = opt.trim();
              return (
              <button 
                key={i} 
                type="button"
                onClick={() => { setSelectedVariant(val); setSelectedVariantName(variant.name); }}
                className={`px-4 py-2 rounded-xl font-bold border-2 transition-all text-sm ${selectedVariant === val ? 'border-purple-600 bg-purple-50 text-purple-600 shadow-sm' : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'}`}
              >
                {val}
              </button>
            )})}
          </div>
        </div>
      ))}
    </>
  );

  const serviceBadges = [
    {
        icon: Truck,
        title: "এক্সপ্রেস ডেলিভারি",
        desc: "আজ অর্ডার করুন, ১–২ দিনের মধ্যে ডেলিভারি পাবেন।",
        bg: "bg-gradient-to-br from-blue-400 to-cyan-500",
        shadow: "shadow-lg shadow-cyan-500/20"
    },
    {
        icon: PackageCheck,
        title: "ক্যাশ অন ডেলিভারি",
        desc: "পণ্য হাতে পেয়ে চেক করে পেমেন্ট করুন।",
        bg: "bg-gradient-to-br from-emerald-400 to-green-600",
        shadow: "shadow-lg shadow-green-500/20"
    },
    {
        icon: ShieldCheck,
        title: "সহজ রিটার্ন পলিসি",
        desc: "যেকোনো সমস্যায় ৭ দিনের সহজ রিটার্ন সুবিধা।",
        bg: "bg-gradient-to-br from-amber-400 to-orange-500",
        shadow: "shadow-lg shadow-orange-500/20"
    },
    {
        icon: Sparkles,
        title: "১০০% অথেন্টিক পণ্য",
        desc: "সরাসরি প্রস্তুতকারক থেকে আমদানিকৃত।",
        bg: "bg-gradient-to-br from-purple-500 to-fuchsia-600",
        shadow: "shadow-lg shadow-fuchsia-500/20"
    },
  ];

  if (orderSuccess) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 relative overflow-hidden">
              <div className="glass-card p-10 rounded-[2rem] shadow-2xl max-w-md w-full text-center relative z-10 animate-fade-in-up border border-white/50 ring-4 ring-white/30">
                  <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-300/50 animate-bounce-slow">
                      <CheckCircle2 className="h-12 w-12 text-white" />
                  </div>
                  <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-800 mb-2">অর্ডার কনফার্ম!</h2>
                  <p className="text-gray-500 font-bold mb-8">অভিনন্দন! আপনার অর্ডারটি সফলভাবে সম্পন্ন হয়েছে।</p>
                  <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl border border-dashed border-gray-300 mb-8 text-left space-y-3 shadow-inner">
                      <div className="flex justify-between"><span className="text-sm text-gray-500 font-bold">অর্ডার আইডি:</span><span className="text-sm font-mono font-black text-purple-600 tracking-widest bg-purple-50 px-2 py-0.5 rounded">#{orderSuccess.id}</span></div>
                      <div className="flex justify-between"><span className="text-sm text-gray-500 font-bold">সর্বমোট বিল:</span><span className="text-lg font-black text-green-600">৳ {orderSuccess.total}</span></div>
                  </div>
                  <button onClick={() => { setOrderSuccess(null); navigate('/'); }} className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold shadow-xl shadow-purple-300 hover:shadow-2xl hover:-translate-y-1 transition-all">আরো শপিং করুন</button>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FF] font-sans pb-24 md:pb-10 overflow-x-hidden relative">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30"></div>
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 z-10 relative">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 overflow-x-auto whitespace-nowrap pb-2 bg-white/60 backdrop-blur-md px-5 py-2.5 rounded-full w-fit border border-white shadow-sm">
            <Link to="/" className="hover:text-purple-600 flex items-center gap-1 transition-colors"><Home size={12}/> হোম</Link>
            <ChevronRight size={12} className="text-gray-300" />
            <Link to={`/category/${product.category}`} className="hover:text-purple-600 transition-colors">{product.category}</Link>
            <ChevronRight size={12} className="text-gray-300" />
            <span className="text-purple-600 font-extrabold truncate">{product.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-8 animate-slide-in-right">
                <div className="bg-white/70 backdrop-blur-xl rounded-[3rem] shadow-2xl border-4 border-white p-3 md:p-6 relative overflow-hidden group ring-1 ring-purple-100">
                    <div className="aspect-square bg-gradient-to-br from-white to-gray-50 rounded-[2.5rem] relative overflow-hidden flex items-center justify-center">
                        <div className="absolute w-[80%] h-[80%] bg-gradient-to-tr from-purple-200 to-pink-200 rounded-full blur-[80px] opacity-40 animate-pulse-slow"></div>
                        <img src={productImages[currentImageIndex]} alt={product.name} className="w-full h-full object-contain p-8 transition-transform duration-700 group-hover:scale-110 mix-blend-multiply relative z-10" />
                        {discountPercentage > 0 && (
                          <div className="absolute top-6 left-6 bg-gradient-to-r from-rose-500 to-orange-500 text-white text-sm font-black px-5 py-2 rounded-full shadow-lg shadow-rose-500/30 animate-pulse-slow z-20 flex items-center gap-1"><Flame size={16} fill="currentColor" className="animate-bounce" /> {discountPercentage}% OFF</div>
                        )}
                        <div className="absolute top-6 right-6 z-20">
                            <button className="bg-white/60 backdrop-blur-md p-3.5 rounded-full text-gray-500 hover:text-red-500 hover:bg-white transition-all shadow-lg hover:shadow-red-200 border border-white"><Heart size={24} /></button>
                        </div>
                    </div>
                    {productImages.length > 1 && (
                        <div className="flex gap-4 p-4 overflow-x-auto scrollbar-hide justify-center mt-2">
                            {productImages.map((img, idx) => (
                                <div key={idx} onClick={() => setCurrentImageIndex(idx)} className={`w-20 h-20 rounded-2xl cursor-pointer overflow-hidden flex-shrink-0 transition-all duration-300 border-2 bg-white ${currentImageIndex === idx ? 'border-purple-500 shadow-lg shadow-purple-200 scale-110' : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'}`}><img src={img} className="w-full h-full object-cover" /></div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="lg:hidden bg-white/80 backdrop-blur-md p-6 rounded-[2.5rem] shadow-xl border border-white ring-1 ring-purple-50">
                    <h1 className="text-2xl font-black mb-3 leading-tight bg-gradient-to-r from-purple-700 via-pink-600 to-orange-500 bg-clip-text text-transparent">{product.name}</h1>
                    <div className="flex items-center justify-between mt-4">
                        <div className="flex items-baseline gap-3">
                            <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-orange-600 drop-shadow-sm">৳ {product.price}</span>
                            {product.originalPrice && <span className="text-lg text-gray-400 line-through font-bold decoration-red-400/50">৳ {product.originalPrice}</span>}
                        </div>
                        <div className="flex gap-1 text-orange-400 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
                            {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                        </div>
                    </div>
                    <div className="border-t border-gray-100 my-4">
                        <SizeVariantSelector />
                    </div>
                    <button onClick={scrollToOrder} className="w-full mt-6 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-purple-300 flex items-center justify-center gap-2 animate-pulse-slow relative overflow-hidden group">
                        <span className="relative z-10 flex items-center gap-2">অর্ডার করুন <ArrowRight size={20} /></span>
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {serviceBadges.map((badge, i) => (
                        <div key={i} className={`p-5 rounded-3xl text-white text-center flex flex-col items-center justify-center gap-3 hover:-translate-y-2 transition-transform duration-300 relative overflow-hidden group ${badge.bg} ${badge.shadow}`}>
                            <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm border border-white/30 shadow-inner">
                                <badge.icon size={24} />
                            </div>
                            <div className="relative z-10">
                                <h4 className="text-sm font-black tracking-tight">{badge.title}</h4>
                                <p className="text-[10px] opacity-80 font-medium mt-1">{badge.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-xl border border-white p-6 md:p-10 relative overflow-hidden ring-1 ring-purple-50">
                    <h2 className="text-2xl font-black text-gray-900 mb-8 border-b border-gray-100 pb-4 flex items-center gap-3 relative z-10">
                        <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-purple-300"><PackageCheck size={24} /></div> পণ্যের বিস্তারিত
                    </h2>
                    {(product.videoUrl || (product.videoUrls && product.videoUrls.length > 0)) && (
                        <div className="mb-10 relative z-10 space-y-6">
                            <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2 text-lg"><span className="bg-red-600 p-2 rounded-lg text-white shadow-lg shadow-red-200"><Video className="h-5 w-5" /></span> ভিডিও রিভিউ</h3>
                            {product.videoUrl && <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-lg border border-gray-200 bg-black"><NativeVideoPlayer url={product.videoUrl} /></div>}
                            {product.videoUrls && product.videoUrls.map((url, idx) => ((url && url !== product.videoUrl) && <div key={idx} className="aspect-video w-full rounded-2xl overflow-hidden shadow-lg border border-gray-200 bg-black"><NativeVideoPlayer url={url} /></div>))}
                        </div>
                    )}
                    {renderManualDescription(product.description)}
                </div>

                <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-xl border border-white p-6 md:p-10 relative overflow-hidden ring-1 ring-purple-50">
                    <h2 className="text-2xl font-black text-gray-900 mb-6 border-b border-gray-100 pb-4 flex items-center gap-3">
                        <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-2.5 rounded-xl text-white shadow-lg shadow-orange-200"><RotateCcw size={24} /></div> সহজ রিটার্ন পলিসি
                    </h2>
                    <div className="space-y-4">
                        <p className="text-gray-600 font-medium">
                            আপনার সন্তুষ্টি আমাদের অগ্রাধিকার। আমাদের রিটার্ন পলিসি সম্পর্কে জানতে নিচের বাটনে ক্লিক করুন।
                        </p>
                        <button
                          onClick={() => setIsReturnPolicyVisible(!isReturnPolicyVisible)}
                          className="bg-gray-100 text-gray-800 font-bold px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2 border border-gray-200 shadow-sm"
                        >
                          <BookOpen size={16} />
                          {isReturnPolicyVisible ? 'পলিসি লুকান' : 'এখানে রিটার্ন পলিসি দেখুন'}
                        </button>
                        
                        {isReturnPolicyVisible && (
                          <div className="mt-4 p-6 bg-amber-50/50 border-l-4 border-amber-400 rounded-r-lg animate-fade-in">
                            <p className="text-gray-700 leading-relaxed font-medium">
                              ডেলিভারির সময় যদি পণ্যটি ক্ষতিগ্রস্ত, ত্রুটিপূর্ণ, ভুল অথবা অসম্পূর্ণ হয়, তাহলে ডেলিভারি তারিখের ৩ দিনের মধ্যে কাস্টমার কেয়ার সাপোর্ট নম্বরে কল করে রিটার্ন রিকোয়েস্ট করতে হবে।
                            </p>
                            <p className="mt-4 text-red-700 font-bold bg-red-50 p-3 rounded-md border border-red-100">
                              মত পরিবর্তনের কারণে এই পণ্য রিটার্ন প্রযোজ্য নয়।
                            </p>
                          </div>
                        )}
                    </div>
                </div>

            </div>

            <div className="lg:col-span-5 relative animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                <div className="sticky top-24 space-y-6">
                    <div className="hidden lg:block bg-white/90 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl border border-white relative overflow-hidden group hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)] transition-all duration-500 ring-1 ring-purple-100">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-purple-50 to-pink-50 rounded-bl-[100px] -z-0 group-hover:scale-110 transition-transform duration-700"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="bg-gray-900 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">{product.category}</span>
                                {product.stock ? (
                                    <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-md shadow-green-200"><div className="w-2 h-2 bg-white rounded-full animate-pulse"></div> ইন স্টক</span>
                                ) : (
                                    <span className="bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md">স্টক আউট</span>
                                )}
                            </div>
                            <h1 className="text-4xl font-black mb-4 leading-tight tracking-tight bg-gradient-to-r from-purple-700 via-fuchsia-600 to-orange-500 bg-clip-text text-transparent animate-gradient-x">{product.name}</h1>
                            <div className="flex items-baseline gap-4 mb-6">
                                <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-orange-600 drop-shadow-sm tracking-tighter">৳{product.price}</span>
                                {product.originalPrice && <span className="text-2xl text-gray-400 line-through font-bold decoration-red-400/50">৳{product.originalPrice}</span>}
                            </div>
                        </div>
                    </div>

                    <div id="order-form" className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white p-6 md:p-8 relative overflow-hidden ring-4 ring-purple-500/10">
                        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 -mx-6 md:-mx-8 -mt-6 md:-mt-8 p-6 mb-8 text-white text-center relative overflow-hidden shadow-lg">
                             <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                             <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 backdrop-blur-sm border-2 border-white/30 shadow-inner">
                                <Truck className="h-8 w-8 text-white drop-shadow-md" />
                             </div>
                             <h2 className="text-2xl font-black uppercase tracking-wider text-white">অর্ডার করুন</h2>
                             <p className="text-xs opacity-90 font-medium">নিচের ফর্মটি পূরণ করে অর্ডার কনফার্ম করুন</p>
                        </div>

                        <form onSubmit={handleDirectOrder} className="space-y-5 relative z-10">
                            <div className="hidden md:block">
                                <SizeVariantSelector />
                            </div>

                            <div className="space-y-1.5 group">
                                <label className="text-xs font-black text-gray-500 ml-1 uppercase tracking-wide">আপনার নাম</label>
                                <input required type="text" placeholder="সম্পূর্ণ নাম লিখুন" className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 focus:outline-none focus:border-purple-500 focus:bg-purple-50/30 font-bold text-gray-800" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div className="space-y-1.5 group">
                                <label className="text-xs font-black text-gray-500 ml-1 uppercase tracking-wide">মোবাইল নাম্বার</label>
                                <input required type="tel" placeholder="017xxxxxxxx" className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 focus:outline-none focus:border-purple-500 focus:bg-purple-50/30 font-bold text-gray-800" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                            </div>
                            <div className="space-y-1.5 group">
                                <label className="text-xs font-black text-gray-500 ml-1 uppercase tracking-wide">সম্পূর্ণ ঠিকানা</label>
                                <textarea required rows={2} placeholder="বাসা নং, রোড নং, থানা, জেলা" className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 focus:outline-none focus:border-purple-500 focus:bg-purple-50/30 font-bold text-gray-800 resize-none" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                     <label className="text-xs font-black text-gray-500 ml-1 uppercase tracking-wide">পরিমাণ</label>
                                     <div className="flex items-center border-2 border-gray-100 rounded-2xl bg-white overflow-hidden hover:border-purple-300 transition-colors">
                                        <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-4 text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition"><Minus size={18} /></button>
                                        <input type="text" readOnly value={quantity} className="w-full text-center font-black text-gray-900 bg-transparent outline-none" />
                                        <button type="button" onClick={() => setQuantity(quantity + 1)} className="p-4 text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition"><Plus size={18} /></button>
                                     </div>
                                </div>
                                <div className="space-y-1.5">
                                     <label className="text-xs font-black text-gray-500 ml-1 uppercase tracking-wide">ডেলিভারি এরিয়া</label>
                                     <div className="relative">
                                         <select className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 focus:outline-none focus:border-purple-500 appearance-none font-bold text-gray-700 text-sm" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})}>
                                            <option value="Dhaka City">ঢাকা সিটি</option>
                                            <option value="Outside Dhaka">ঢাকার বাইরে</option>
                                         </select>
                                         <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-purple-500"><Truck size={20} /></div>
                                     </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100 relative shadow-inner">
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between text-gray-600 font-medium"><span>পণ্যের দাম ({quantity} টি)</span><span className="font-bold text-gray-800">৳ {subTotal}</span></div>
                                    <div className="flex justify-between text-gray-600 font-medium"><span>ডেলিভারি চার্জ</span><span className="font-bold text-gray-800">৳ {shippingCost}</span></div>
                                    <div className="h-px bg-indigo-200 my-3"></div>
                                    <div className="flex justify-between items-center"><span className="text-base font-black text-indigo-900 uppercase tracking-tight">সর্বমোট</span><span className="text-3xl font-black text-indigo-600 drop-shadow-sm">৳ {total}</span></div>
                                </div>
                            </div>

                            <button type="submit" disabled={orderLoading} className="w-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 bg-[length:200%_200%] animate-gradient-x text-white text-lg font-black py-4 rounded-2xl shadow-xl shadow-orange-500/30 hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3 relative overflow-hidden group border-b-4 border-red-700 active:border-b-0 active:translate-y-1">
                                {orderLoading ? <Loader2 className="animate-spin h-6 w-6" /> : <>অর্ডার কনফার্ম করুন <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" strokeWidth={3} /></>}
                            </button>
                            
                            <button type="button" onClick={handleAddToCart} className="w-full bg-white border-2 border-gray-100 text-gray-600 font-bold py-4 rounded-2xl hover:border-purple-500 hover:text-purple-600 transition-all flex items-center justify-center gap-2 hover:shadow-lg">
                                <ShoppingCart size={20} /> কার্টে যোগ করুন
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>

        <div className="mt-20 mb-10">
            <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-2"><Sparkles className="text-purple-600" fill="currentColor" /> আপনার আরো পছন্দ হতে পারে</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {relatedProducts.length > 0 ? relatedProducts.map(prod => (<ProductCard key={prod.id} product={prod} addToCart={addToCart} />)) : (<div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-gray-200"><p className="text-gray-400 font-medium">অন্য কোনো পণ্য পাওয়া যায়নি</p></div>)}
            </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 p-3 px-4 z-[60] flex items-center gap-4 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
          <div className="flex-1"><p className="text-[10px] text-gray-500 font-black uppercase tracking-wide">সর্বমোট বিল</p><p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 leading-none">৳ {total}</p></div>
          <button onClick={scrollToOrder} className="flex-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold py-3.5 rounded-2xl shadow-lg flex items-center justify-center gap-2 animate-pulse-slow">অর্ডার করুন <ArrowRight size={18} /></button>
      </div>
    </div>
  );
};

export default ProductDetails;
