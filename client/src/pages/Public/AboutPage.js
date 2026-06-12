// client/src/pages/Public/AboutPage.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
    ShieldCheck, Zap, 
    Globe, Heart, Award, ArrowRight, Sparkles 
} from 'lucide-react';

const ValueCard = ({ icon: Icon, title, description, delay }) => (
    <div data-aos="fade-up" data-aos-delay={delay} className="p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] bg-apple-gray-50 dark:bg-apple-gray-900 border border-apple-gray-100 dark:border-apple-gray-800 transition-all duration-300 hover:shadow-apple-lg hover:border-apple-blue/20 group">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-apple-blue/10 text-apple-blue flex items-center justify-center mb-4 md:mb-6 group-hover:bg-apple-blue group-hover:text-white transition-colors duration-500">
            <Icon size={20} className="md:w-6 md:h-6" />
        </div>
        <h3 className="text-lg md:text-xl font-bold text-apple-gray-900 dark:text-white mb-2 md:mb-3">{title}</h3>
        <p className="text-xs md:text-sm text-apple-gray-600 dark:text-apple-gray-400 leading-relaxed">
            {description}
        </p>
    </div>
);

const AboutPage = () => {
    const { t } = useTranslation();

    return (
        <div className="overflow-x-hidden">
            {/* HERO SECTION */}
            <section className="relative bg-white dark:bg-apple-gray-950">
                <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
                    <div className="max-w-4xl mx-auto">
                        <div data-aos="fade-down" className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-apple-green/10 text-apple-green rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest mb-6 md:mb-8">
                            <Sparkles size={14} /> {t('public.about.badge') || "Our Story"}
                        </div>
                        <h1 data-aos="fade-up" className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-apple-gray-900 dark:text-white mb-6 md:mb-8 tracking-tighter leading-[1.1]">
                            The Future of <br/>
                            <span className="text-apple-blue block sm:inline">Pressing Businesses.</span>
                        </h1>
                        <p data-aos="fade-up" data-aos-delay="200" className="text-base md:text-xl lg:text-2xl text-apple-gray-500 dark:text-apple-gray-400 font-medium leading-relaxed max-w-2xl mx-auto">
                            lsmbooker bridges the gap between traditional craftsmanship and modern digital efficiency. We empower laundry owners to thrive in the digital age.
                        </p>
                    </div>
                </div>
            </section>

            {/* THE STORY SECTION */}
            <section className="py-16 md:py-24 bg-apple-gray-50 dark:bg-apple-gray-900/50 px-4 md:px-0">
                <div className="container mx-auto md:px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        <div data-aos="fade-right" className="space-y-6 md:space-y-8">
                            <h2 className="text-3xl md:text-5xl font-black text-apple-gray-900 dark:text-white leading-tight tracking-tight">
                                Built by Owners, <br className="hidden sm:block"/>
                                <span className="text-apple-blue">For Owners.</span>
                            </h2>
                            <div className="space-y-4 text-apple-gray-600 dark:text-apple-gray-400 text-sm md:text-lg leading-relaxed">
                                <p>We watched businesses struggle with paper ledgers and lost tickets for years. We saw the exhaustion that came with manual management.</p>
                                <p>lsmbooker was born to bring Absolute Precision to local communities. Today, we help hundreds of businesses scale without the stress.</p>
                            </div>
                            <div className="flex gap-8 md:gap-10 pt-4">
                                <div>
                                    <p className="text-2xl md:text-3xl font-black text-apple-blue">2022</p>
                                    <p className="text-[10px] md:text-sm font-bold text-apple-gray-500 uppercase tracking-widest">Founded</p>
                                </div>
                                <div>
                                    <p className="text-2xl md:text-3xl font-black text-apple-blue">15+</p>
                                    <p className="text-[10px] md:text-sm font-bold text-apple-gray-500 uppercase tracking-widest">Countries</p>
                                </div>
                            </div>
                        </div>
                        <div data-aos="fade-left" className="relative px-2 md:px-0">
                            <div className="rounded-[1.5rem] md:rounded-[3rem] overflow-hidden shadow-2xl border-4 md:border-8 border-white dark:border-apple-gray-800">
                                <img src="https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&q=80&w=1000" alt="Facility" className="w-full h-64 sm:h-96 lg:h-[500px] object-cover" />
                            </div>
                            <div className="absolute -bottom-4 -right-2 md:-bottom-8 md:-right-8 p-4 md:p-8 bg-white dark:bg-apple-gray-800 rounded-xl md:rounded-[2rem] shadow-xl border border-apple-gray-100 dark:border-apple-gray-700">
                                <Award className="text-apple-blue mb-1 md:mb-2 w-6 h-6 md:w-10 md:h-10" />
                                <p className="font-black text-apple-gray-900 dark:text-white text-xs md:text-xl leading-tight">Digital <br/>Innovator</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CORE VALUES */}
            <section className="py-16 md:py-24 bg-white dark:bg-apple-gray-950">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="text-center mb-12 md:mb-16" data-aos="fade-up">
                        <h2 className="text-3xl md:text-5xl font-black text-apple-gray-900 dark:text-white mb-4 tracking-tight">Our Core Values</h2>
                        <p className="text-base md:text-xl text-apple-gray-500 dark:text-apple-gray-400 font-medium max-w-2xl mx-auto">The principles guiding every feature we build.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                        <ValueCard delay="100" icon={Zap} title="Simplicity" description="We build tools that require zero training and deliver instant results." />
                        <ValueCard delay="200" icon={ShieldCheck} title="Transparency" description="Clear data leads to better, more trusting business relationships." />
                        <ValueCard delay="300" icon={Heart} title="Owner Obsessed" description="We build specifically for the owners who keep our world running." />
                        <ValueCard delay="400" icon={Globe} title="Global Impact" description="Scalable from a family shop to a nationwide enterprise chain." />
                    </div>
                </div>
            </section>

            {/* CTA SECTION */}
            <section className="py-16 md:py-32 bg-white dark:bg-apple-gray-950 text-center px-4">
                <div className="container mx-auto relative z-10" data-aos="zoom-in">
                    <div className="max-w-5xl mx-auto bg-apple-blue p-8 md:p-24 rounded-[2rem] md:rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-white/5 rounded-full blur-[40px] md:blur-[80px] pointer-events-none" />
                        <h2 className="text-2xl sm:text-4xl md:text-6xl font-black mb-6 md:mb-8 tracking-tighter leading-tight relative z-10">Ready to join the revolution?</h2>
                        <div className="flex flex-col sm:flex-row justify-center gap-4 md:gap-6 relative z-10">
                            <Link to="/signup" className="inline-flex items-center justify-center gap-2 md:gap-3 bg-white text-apple-blue px-6 py-4 md:px-10 md:py-5 rounded-full font-black text-base md:text-xl hover:shadow-xl transition-all duration-300">
                                Start Free Trial <ArrowRight size={20} />
                            </Link>
                            <Link to="/contact" className="inline-flex items-center justify-center bg-apple-blue border-2 border-white/30 text-white px-6 py-4 md:px-10 md:py-5 rounded-full font-bold text-base md:text-xl hover:bg-white/10 transition-all duration-300">
                                Contact Support
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutPage;