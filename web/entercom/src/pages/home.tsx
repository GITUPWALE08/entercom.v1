import { Link, Navigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { Eye, Lock, ChevronRight, Server, HomeIcon, HandHeart, MessageSquareMore, Puzzle, ChartColumnIncreasing } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import heroImage from '../assets/hero.jpg';

const HeroSection = () => {
  const containerRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let requestRef: number;
    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      mouseX = (e.clientX / innerWidth) * 2 - 1;
      mouseY = (e.clientY / innerHeight) * 2 - 1;
    };

    const animate = () => {
      currentX += (mouseX - currentX) * 0.05;
      currentY += (mouseY - currentY) * 0.05;

      if (imageRef.current) {
        imageRef.current.style.transform = `translate(${currentX * 8}px, ${currentY * 8}px) scale(1.02)`;
      }
      if (card1Ref.current) {
        card1Ref.current.style.transform = `translate(${currentX * 14}px, ${currentY * 14}px)`;
      }
      if (card2Ref.current) {
        card2Ref.current.style.transform = `translate(${currentX * 10}px, ${currentY * 12}px)`;
      }
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${currentX * -4}px, ${currentY * -4}px)`;
      }

      requestRef = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMouseMove);
    requestRef = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(requestRef);
    };
  }, []);

  return (
    <section ref={containerRef} className="relative bg-[#0A0F1C] overflow-hidden min-h-screen flex items-center pt-24 lg:pt-0">
      {/* LAYER 1: Background & Blueprint Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none"></div>
      
      {/* LAYER 2: Gradient Lights */}
      <div ref={glowRef} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px]"></div>
        <div className="absolute top-[40%] left-[40%] w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[140px]"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-indigo-900/20 rounded-full blur-[100px]"></div>
        <div className="absolute top-0 left-0 w-full md:w-[60%] lg:w-[45%] h-full bg-gradient-to-r from-ess-purple/10 to-transparent blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 relative z-30 py-12 lg:py-0">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-8">
          
          {/* LEFT SIDE: Text Content (Approx 45%) */}
          <div className="w-full lg:w-[45%] text-center lg:text-left">
            <div className="">
              <span className="inline-block bg-ess-purple/20 border border-ess-purple/30 text-ess-purple text-[10px] md:text-xs font-bold px-3 py-1 rounded-full mb-6 tracking-wider uppercase">
                Entercom Security Systems
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-white leading-[1.1] mb-6">
                Build. Connect. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Protect.</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-400 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Entercom Security helps homes and small businesses protect their properties with
                professionally installed camera systems, sensors, and smart security solutions—
                designed for real-world reliability, not complexity.

              </p>
              
              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/contact" className="w-full sm:w-auto text-center bg-ess-purple hover:bg-ess-darkPurple text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-purple-900/50 flex items-center justify-center gap-2 hover:scale-105">
                  Get a Free Quote <ChevronRight size={18} />
                </Link>
                <Link to="/services" className="w-full sm:w-auto text-center bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 text-white px-8 py-4 rounded-xl font-bold transition-all hover:scale-105">
                  Our Solutions
                </Link>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Hero Image (Approx 55%) */}
          <div className="w-full lg:w-[55%] relative flex justify-end">
            
            {/* Custom Container for Image */}
            <div 
              ref={imageRef} 
              className="relative w-full max-w-[800px] aspect-[4/3] rounded-tl-[120px] rounded-br-[120px] rounded-tr-[32px] rounded-bl-[32px] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] border border-white/10 will-change-transform"
              style={{ animation: 'floatImage 16s ease-in-out infinite' }}
            >
              <img 
                src={heroImage} 
                alt="Premium residential security installation by Entercom professionals"
                className="w-full h-full object-cover"
                loading="eager"
                fetchPriority="high"
              />
              
              {/* Cinemagraph Elements */}
              <div className="absolute top-[20%] left-[45%] w-1.5 h-1.5 bg-red-500 rounded-full animate-ping opacity-80 shadow-[0_0_10px_rgba(239,68,68,1)]"></div>
              <div className="absolute bottom-[30%] right-[30%] w-2 h-2 bg-blue-400 rounded-full animate-pulse opacity-60 blur-[1px]"></div>
              
              {/* Inner Edge Glow for Depth */}
              <div className="absolute inset-0 shadow-[inset_0_0_30px_rgba(255,255,255,0.05)] pointer-events-none rounded-tl-[120px] rounded-br-[120px] rounded-tr-[32px] rounded-bl-[32px]"></div>
            </div>

            {/* LAYER 4: Floating Glass Cards */}
            <div 
              ref={card1Ref}
              className="absolute top-10 -left-6 lg:left-0 z-40 bg-[#0f172a]/70 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] flex flex-col gap-1 will-change-transform group transition-colors hover:bg-[#0f172a]/90 hover:border-white/20"
              style={{ animation: 'floatCard 14s ease-in-out infinite alternate' }}
            >
          </div>
          </div>
        </div>
      </div>
      
      {/* Global Animation Styles */}
      <style>{`
        @keyframes floatImage {
          0%, 100% { transform: translateY(0) scale(1.02); }
          50% { transform: translateY(-15px) scale(1.02); }
        }
        @keyframes floatCard {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </section>
  );
};

const Home = () => {
   const { user, isAuthenticated } = useAuthStore();
   
   if (isAuthenticated && user) {
     const rolePath = user.role.toLowerCase();
     return <Navigate to={`/portal/${rolePath === 'super_admin' ? 'admin' : rolePath}`} replace />;
   }

   const services = [
    {
      id: "camera",
      icon: <Eye size={28} />, 
      color: "text-blue-600",
      bg: "bg-blue-50",
      title: "Camera Installation & Surveillance",
      description: "Clear visibility of your property, indoors and outdoors.",
      feature : ["● Indoor & outdoor cameras", "● Night vision optimization", "● Mobile app setup & remote access"]
    },
    {
      id: "motion",
      icon: <Lock size={28} />,
      color: "text-ess-purple", 
      bg: "bg-purple-50",
      title: "Motion & Entry Sensors",
      description: "Know when something changes—instantly.",
      feature : ["● Door & window sensors", "● Motion detection alerts", "● App notifications"]
    },
    {
      id: "smart",
      icon: <HomeIcon size={28} />,
      color: "text-green-600", 
      bg: "bg-green-50",
      title: "Smart Home Security (Basic)",
      description: "Security-focused smart devices for modern living.",
      feature : ["● Video doorbells", "● Smart locks", "● App-based access"]
    },
    {
      id: "system",
      icon: <Server size={28} />,
      color: "text-indigo-600", 
      bg: "bg-indigo-50",
      title: "System Setup, Upgrade & Maintenance",
      description: "Already have cameras that don’t work properly?",
      feature : ["● System reconfiguration", "● Camera repositioning", "● Firmware updates & troubleshooting"]
    },
  ]
  return (
    <div className="bg-white">
      <HeroSection />

      {/* Stats Section - Floating Cards on Desktop */}
      {/* <section className="relative z-20 -mt-8 md:-mt-16 px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard value="$167B" label="Global Market" sub="Projected 2025" />
            <StatCard value="27%" label="Growth Rate" sub="City Surveillance" color="text-ess-purple" />
            <StatCard value="100+" label="Partners" sub="Integrated Tech" color="text-blue-600" />
          </div>
        </div>
      </section> */}

      {/* Services Grid */}
      <section className="py-10 lg:py-32 bg-gray-50/50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-3xl lg:text-4xl font-bold text-ess-navy mb-4">Complete Physical Security</h2>
              <p className="text-gray-600 text-lg">Integrated solutions covering every aspect of safety, from farm to firewall.</p>
            </div>
            <Link to="/services" className="hidden lg:flex items-center gap-2 text-ess-purple font-bold hover:translate-x-1 transition-transform">
              View all services <ChevronRight size={20} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
            {services.map((service) => (
              <ServiceCard 
                key={service.id} 
                icon={service.icon} 
                color={service.color}
                bg = {service.bg}
                title={service.title}
                desc= {service.description}
                feature = {service.feature}
              />
            ))}
          </div>
          
          {/* Mobile Only View All Button */}
          <div className="mt-8 text-center lg:hidden">
            <Link to="/services" className="inline-block text-ess-purple font-bold">View all services &rarr;</Link>
          </div>
        </div>
      </section>

      <section className="py-1 lg:pt-1 bg-gray-50/50">
        <div className="bg-slate-50 rounded-3xl p-8 md:p-12 text-center border border-slate-100 ">
          <h2 className="text-2xl font-bold text-ess-navy mb-8">How We Work</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold text-ess-purple mb-2">Site Assessment</h3>
              <p className="text-gray-600 text-sm">We evaluate your space, entry points, and coverage needs.</p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-ess-purple mb-2">Clear Recommendation</h3>
              <p className="text-gray-600 text-sm">You receive a simple, honest setup tailored to your budget.</p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-ess-purple mb-2">Professional Installation</h3>
              <p className="text-gray-600 text-sm">Devices are properly mounted, configured, and tested.</p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-ess-purple mb-2">Handover & Support</h3>
              <p className="text-gray-600 text-sm">We ensure you understand your system and remain available for support.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#F5F5FA]">
        <div className="container mx-auto px-6 md:px-10">
          <div className="text-center mb-16 flex flex-col items-center">
            <h2 className="text-4xl md:text-[48px] font-extrabold text-[#1A1A2E] leading-tight">
              Why Choose <span className="text-[#7B2FE0]">Entercom Security</span>?
            </h2>
            <div className="w-[100px] h-1 rounded-sm mt-4 bg-gradient-to-r from-[#7B2FE0] to-transparent"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 relative">
            {/* Card 1 */}
            <div className="flex flex-col items-start relative">
              <div className="w-[72px] h-[72px] rounded-full bg-[#7B2FE0] flex items-center justify-center mb-6 shadow-md shadow-purple-900/20">
                <HandHeart size={32} color="#FFFFFF" strokeWidth={2} />
              </div>
              <h3 className="text-[24px] font-bold text-[#7B2FE0] leading-[1.25] mb-2">Service-first approach</h3>
              <div className="w-12 h-1 bg-gradient-to-r from-[#7B2FE0] to-transparent mb-4 rounded-sm"></div>
              <p className="text-[#4A4A5A] text-[16px] leading-[1.6]">
                We put your needs first with a focus on honest advice, quality installation, and long-term support. Installation quality matters—because your security and peace of mind come first.
              </p>
            </div>

            {/* Card 2 */}
            <div className="flex flex-col items-start relative">
              <div className="w-[72px] h-[72px] rounded-full bg-[#7B2FE0] flex items-center justify-center mb-6 shadow-md shadow-purple-900/20">
                <MessageSquareMore size={32} color="#FFFFFF" strokeWidth={2} />
              </div>
              <h3 className="text-[24px] font-bold text-[#7B2FE0] leading-[1.25] mb-2">Clear communication</h3>
              <div className="w-12 h-1 bg-gradient-to-r from-[#7B2FE0] to-transparent mb-4 rounded-sm"></div>
              <p className="text-[#4A4A5A] text-[16px] leading-[1.6]">
                We believe in keeping things simple and straightforward. No confusing tech jargon—just clear explanations, transparent updates, and friendly support every step of the way.
              </p>
            </div>

            {/* Card 3 */}
            <div className="flex flex-col items-start relative">
              <div className="w-[72px] h-[72px] rounded-full bg-[#7B2FE0] flex items-center justify-center mb-6 shadow-md shadow-purple-900/20">
                <Puzzle size={32} color="#FFFFFF" strokeWidth={2} />
              </div>
              <h3 className="text-[24px] font-bold text-[#7B2FE0] leading-[1.25] mb-2">Right-sized solutions</h3>
              <div className="w-12 h-1 bg-gradient-to-r from-[#7B2FE0] to-transparent mb-4 rounded-sm"></div>
              <p className="text-[#4A4A5A] text-[16px] leading-[1.6]">
                We design solutions that fit your property, your needs, and your budget. No unnecessary extras—just the right technology to keep you secure and in control.
              </p>
            </div>

            {/* Card 4 */}
            <div className="flex flex-col items-start relative">
              <div className="w-[72px] h-[72px] rounded-full bg-[#7B2FE0] flex items-center justify-center mb-6 shadow-md shadow-purple-900/20">
                <ChartColumnIncreasing size={32} color="#FFFFFF" strokeWidth={2} />
              </div>
              <h3 className="text-[24px] font-bold text-[#7B2FE0] leading-[1.25] mb-2">Gradual, responsible growth</h3>
              <div className="w-12 h-1 bg-gradient-to-r from-[#7B2FE0] to-transparent mb-4 rounded-sm"></div>
              <p className="text-[#4A4A5A] text-[16px] leading-[1.6]">
                We build lasting relationships based on trust. Start with what you need today, and scale your system at a pace that's right for you. We're here for the long run.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-ess-navy py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072')] opacity-10 bg-cover bg-center"></div>
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-8">Ready to secure your assets?</h2>
          <Link to="/contact" className="inline-flex bg-ess-purple hover:bg-white hover:text-ess-purple text-white px-10 py-4 rounded-xl font-bold transition-all text-lg shadow-2xl shadow-purple-900/50">
            Request Free Site Check
          </Link>
        </div>
      </section>
    </div>
  );
};

// Helper Components
// const StatCard = ({ value, label, sub, color = "text-ess-navy" }: any) => (
//   <div className="bg-white p-8 rounded-2xl shadow-lg border-b-4 border-b-transparent hover:border-b-ess-purple transition-all transform hover:-translate-y-1">
//     <h3 className={`text-4xl lg:text-5xl font-black ${color} mb-2`}>{value}</h3>
//     <p className="text-sm font-bold text-gray-800 uppercase tracking-wide">{label}</p>
//     <p className="text-xs text-gray-500 mt-1">{sub}</p>
//   </div>
// );

const ServiceCard = ({ icon, title, desc, color, bg, feature }: any) => (
  <Link to="/services" className="group p-8 rounded-3xl border border-gray-100 bg-white shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-start gap-4 hover:-translate-y-2">
    <div className={`w-14 h-14 ${bg} ${color} rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300`}>
      {icon}
    </div>
    <div>
      <h3 className="text-xl font-bold text-ess-navy mb-2 group-hover:text-ess-purple transition-colors">{title}</h3>
      <p className="text-gray-500 leading-relaxed">{desc}</p>
      <ul>
        <li>{feature[0]}</li>
        <li>{feature[1]}</li>
        <li>{feature[2]}</li>
      </ul>
    </div>
  </Link>
);

export default Home;