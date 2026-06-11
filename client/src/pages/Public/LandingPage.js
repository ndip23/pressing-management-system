import React from 'react';
import { Link } from 'react-router-dom';
import { 
    Zap, BarChart3, Users, Smartphone, 
    ArrowRight, Receipt, Bot, Share2, 
 CreditCard, Wallet, Star, Globe
} from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description, delay }) => (
    <div
        data-aos="fade-up"
        data-aos-delay={delay}
        className="group p-8 rounded-[2.5rem] bg-white dark:bg-apple-gray-900 border border-apple-gray-100 dark:border-apple-gray-800 transition-all duration-500 hover:-translate-y-2 hover:shadow-apple-xl hover:border-apple-blue/20"
    >
        <div className="w-14 h-14 rounded-2xl bg-apple-blue/10 text-apple-blue flex items-center justify-center mb-6 group-hover:bg-apple-blue group-hover:text-white transition-colors duration-500">
            <Icon size={28} />
        </div>
        <h3 className="text-xl font-bold text-apple-gray-900 dark:text-white mb-3 tracking-tight">{title}</h3>
        <p className="text-sm leading-relaxed text-apple-gray-500 dark:text-apple-gray-400">{description}</p>
    </div>
);

const LandingPage = () => {
    
    return (
        <div className="overflow-x-hidden font-inter">
            {/* HERO SECTION */}
            <section className="relative pt-10 pb-20 lg:pt-16 lg:pb-40 bg-white dark:bg-apple-gray-950 overflow-hidden text-center px-6">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none opacity-20">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-apple-blue rounded-full blur-[150px]" />
                </div>

                <div className="container mx-auto relative z-10">
                    <div data-aos="fade-down" className="inline-flex items-center gap-2 px-4 py-2 bg-apple-blue/10 text-apple-blue rounded-full text-xs font-black uppercase tracking-widest mb-8">
                        <Zap size={14} fill="currentColor" /> All-In-One Pressing OS
                    </div>
                    
                    <h1 data-aos="zoom-out-up" className="text-5xl md:text-7xl lg:text-9xl font-black text-apple-gray-900 dark:text-white mb-8 tracking-tighter leading-[1.05]">
                        Get More <br/>
                        <span className="text-apple-blue">Laundry Clients.</span>
                    </h1>

                    <p data-aos="fade-up" data-aos-delay="200" className="text-lg md:text-2xl text-apple-gray-500 dark:text-apple-gray-400 mb-12 max-w-3xl mx-auto font-medium">
                        Helping laundry businesses, dry cleaners, and fabric care professionals attract customers, manage operations, and grow faster from one powerful platform.
                    </p>

                    <div data-aos="fade-up" data-aos-delay="400" className="flex flex-col sm:flex-row justify-center gap-6">
                        <Link to="/signup" className="group flex items-center justify-center gap-3 bg-apple-blue text-white px-12 py-6 rounded-[2.5rem] font-black text-xl shadow-apple-lg hover:shadow-apple-xl hover:-translate-y-1 transition-all duration-300">
                            Create Your Account <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* THE "HOW IT WORKS" FLOW */}
            <section className="py-24 bg-apple-gray-50 dark:bg-apple-gray-900/50 px-6">
                <div className="container mx-auto">
                    <div className="text-center mb-20" data-aos="fade-up">
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">How it works</h2>
                        <p className="text-apple-gray-500 font-medium">From setup to receiving your first order in minutes.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {[
                            { step: "01", t: "Sign Up", d: "Create your laundry business account in minutes." },
                            { step: "02", t: "Activate", d: "Load wallet with $0.05 per inquiry to start receiving requests." },
                            { step: "03", t: "Build Profile", d: "Add photos, location, and working hours." },
                            { step: "04", t: "List Services", d: "Set prices for Wash, Fold, Dry Clean, & more." },
                            { step: "05", t: "Receive Leads", d: "Get contacted by clients searching near you." }
                        ].map((item, i) => (
                            <div key={i} data-aos="fade-right" data-aos-delay={i * 100} className="p-6 rounded-3xl bg-white dark:bg-apple-gray-900 shadow-sm border border-apple-gray-100 dark:border-apple-gray-800">
                                <p className="text-3xl font-black text-apple-blue/20 mb-4">{item.step}</p>
                                <h4 className="font-bold text-lg mb-2">{item.t}</h4>
                                <p className="text-sm text-apple-gray-500 leading-relaxed">{item.d}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CORE PRO FEATURES */}
            <section className="py-32 px-6">
                <div className="container mx-auto">
                    <div className="flex flex-col lg:flex-row items-end justify-between mb-20 gap-8">
                        <div className="max-w-2xl" data-aos="fade-right">
                            <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                                Everything included. <br/>
                                <span className="text-apple-blue">No extra costs.</span>
                            </h2>
                        </div>
                        <p className="text-xl text-apple-gray-500 font-medium lg:w-1/3" data-aos="fade-left">
                            We are more than just a directory. We are a full-scale Operating System for your business.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard 
                            icon={Bot} 
                            title="AI Business Assistant" 
                            description="Generate marketing ideas, improve customer chats, and get pricing suggestions instantly." 
                        />
                        <FeatureCard 
                            icon={Receipt} 
                            title="Professional Receipts" 
                            description="Create printable or digital receipts with transaction tracking and billing history." 
                        />
                        <FeatureCard 
                            icon={BarChart3} 
                            title="Management Dashboard" 
                            description="Track orders, pickup/delivery status, and business performance reports in real-time." 
                        />
                        <FeatureCard 
                            icon={Users} 
                            title="Worker Management" 
                            description="Assign roles, track staff work, and monitor performance across all your employees." 
                        />
                        <FeatureCard 
                            icon={Smartphone} 
                            title="Customer CRM" 
                            description="Keep all your customers organized with order history, service notes, and repeat tracking." 
                        />
                        <FeatureCard 
                            icon={Share2} 
                            title="Bulk Marketing" 
                            description="Send promotions via Bulk SMS, Email, or WhatsApp to keep your customers coming back." 
                        />
                    </div>
                </div>
            </section>

            {/* PAYMENT & AFRICA FOCUS */}
            <section className="py-24 bg-apple-gray-900 text-white rounded-[4rem] mx-4 md:mx-10 mb-20 overflow-hidden relative">
                <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-1/4 translate-y-1/4">
                    <CreditCard size={600} />
                </div>
                
                <div className="container mx-auto px-10 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest mb-8">
                                <Globe size={14} /> Supported Across Africa
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight">Pay locally with <br/> Mobile Money.</h2>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <p className="font-bold text-apple-blue uppercase tracking-tighter">Mobile Money</p>
                                    <ul className="text-apple-gray-400 space-y-2 text-sm">
                                        <li>MTN & Orange Money</li>
                                        <li>Airtel Money & M-Pesa</li>
                                        <li>Tigo Pesa</li>
                                    </ul>
                                </div>
                                <div className="space-y-3">
                                    <p className="font-bold text-apple-blue uppercase tracking-tighter">Cards & Banking</p>
                                    <ul className="text-apple-gray-400 space-y-2 text-sm">
                                        <li>Visa & Mastercard</li>
                                        <li>Debit/Credit Cards</li>
                                        <li>Direct Bank Transfer</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-xl p-10 rounded-[3rem] border border-white/10 shadow-2xl">
                            <Wallet className="text-apple-blue mb-6" size={48} />
                            <h3 className="text-3xl font-black mb-4">Pay Only For Results.</h3>
                            <p className="text-apple-gray-400 leading-relaxed mb-8">
                                We believe in your growth. That's why you only pay a small service fee of <span className="text-white font-bold">$0.05 per inquiry</span> when a customer reaches out to your business. 
                            </p>
                            <div className="p-6 bg-apple-blue rounded-3xl text-center">
                                <p className="text-xs font-bold uppercase tracking-widest opacity-80">Minimum Activation</p>
                                <p className="text-4xl font-black">$5.00</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* TESTIMONIALS */}
            <section className="py-24 px-6 text-center">
                <div className="container mx-auto">
                    <h2 className="text-3xl font-black mb-16">Trusted by Laundry Pros</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="p-8 rounded-[2rem] bg-apple-gray-50 dark:bg-apple-gray-900 border border-apple-gray-100 dark:border-apple-gray-800">
                                <div className="flex justify-center gap-1 text-amber-500 mb-6">
                                    {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                                </div>
                                <p className="italic text-apple-gray-600 dark:text-apple-gray-400 mb-6">
                                    "{i === 1 ? "The AI assistant and customer tools have made running our business much easier." : i === 2 ? "We can now track orders and manage staff without confusion. Everything is centralized." : "PressFlow helped us get more customers and organize our laundry operations in one system."}"
                                </p>
                                <p className="font-bold text-apple-gray-900 dark:text-white">Business Owner {i}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="py-40 bg-apple-blue text-white text-center px-6">
                <div className="container mx-auto" data-aos="zoom-in">
                    <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-10">Ready to grow?</h2>
                    <Link to="/signup" className="inline-flex items-center gap-4 bg-white text-apple-blue px-16 py-7 rounded-[3rem] font-black text-2xl shadow-2xl hover:shadow-3xl hover:-translate-y-2 transition-all duration-300">
                        Create Your Account Now <ArrowRight size={28} />
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;