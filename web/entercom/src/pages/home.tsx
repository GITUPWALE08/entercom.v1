import { Link, Navigate } from 'react-router-dom';
import { Eye, Lock, ChevronRight, CheckCircle2, Server, HomeIcon } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import heroImage from '../assets/hero.jpg';

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
      {/* Hero Section - Split Layout */}
      <section className="relative bg-slate-900 overflow-hidden">
        {/* Subtle Decorative Background */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-ess-purple/30 via-slate-900 to-slate-900 pointer-events-none"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

        {/* Gradient positioned behind left content */}
        <div className="absolute top-0 left-0 w-full md:w-[60%] lg:w-[50%] h-full bg-gradient-to-r from-ess-purple/20 to-transparent blur-3xl pointer-events-none"></div>

        <div className="container mx-auto px-6 py-16 md:py-24 lg:py-32 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-24">
            
            {/* Left Content (Text) */}
            <div className="w-full md:w-1/2 text-center md:text-left relative z-20">
              <span className="inline-block bg-ess-purple/20 border border-ess-purple/30 text-ess-purple text-[10px] md:text-xs font-bold px-3 py-1 rounded-full mb-8 tracking-wider uppercase">
                Entercom Security Systems
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-white leading-[1.15] mb-8">
                Build. Connect. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Protect.</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto md:mx-0 leading-relaxed">
                Entercom Security helps homes and small businesses protect their properties with
                professionally installed camera systems, sensors, and smart security solutions—
                designed for real-world reliability, not complexity.
              </p>
              
              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-5 justify-center md:justify-start">
                <Link to="/contact" className="w-full sm:w-auto text-center bg-ess-purple hover:bg-ess-darkPurple text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-purple-900/50 flex items-center justify-center gap-2 hover:scale-105">
                  Get a Free Quote <ChevronRight size={18} />
                </Link>
                <Link to="/services" className="w-full sm:w-auto text-center bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 text-white px-8 py-4 rounded-xl font-bold transition-all hover:scale-105">
                  Our Solutions
                </Link>
              </div>
            </div>

            {/* Right Content (Hero Image) */}
            <div className="w-full md:w-1/2 relative group mt-8 md:mt-0">
              {/* High-quality hero image */}
              <div className="relative z-10 rounded-[24px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 transition-transform duration-700 ease-in-out lg:group-hover:scale-[1.02]">
                <img 
                  src={heroImage} 
                  alt="Professional technicians installing premium residential security"
                  className="w-full h-auto md:h-[500px] lg:h-[600px] object-cover object-center"
                  loading="eager"
                  fetchPriority="high"
                />
              </div>

              {/* Floating Card */}
              <div className="absolute -bottom-6 -right-2 sm:-right-6 md:bottom-8 md:-right-8 z-20 bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-2xl shadow-2xl flex items-center gap-5 transition-transform duration-500 lg:group-hover:-translate-y-2">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-green-500/30">
                  <CheckCircle2 className="text-white" size={24} />
                </div>
                <div>
                  <p className="text-white font-bold text-base md:text-lg whitespace-nowrap">24/7 Monitoring</p>
                  <p className="text-gray-300 text-sm">Response Time</p>
                  <p className="text-green-400 font-bold text-sm">&lt; 5 mins</p>
                </div>
              </div>
              
              {/* Decorative Glow Behind Image */}
              <div className="absolute inset-0 bg-ess-purple/20 blur-[100px] -z-10 rounded-full scale-75 opacity-50 transition-opacity duration-700 lg:group-hover:opacity-80"></div>
            </div>
          </div>
        </div>
      </section>

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

      <section className="py-10 lg:py-10 bg-gray-50/50">
        <div className="bg-slate-50 rounded-3xl p-8 md:p-12 text-center border border-slate-100 mb-1">
          <h2 className="text-2xl font-bold text-ess-navy mb-8">Why Choose Entercom Security?</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold text-ess-purple mb-2">● Service-first approach</h3>
              <p className="text-gray-600 text-m">installation quality matters</p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-ess-purple mb-2">● Clear communication</h3>
              <p className="text-gray-600 text-m">no confusing tech jargon</p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-ess-purple mb-2">● Right-sized solutions</h3>
              <p className="text-gray-600 text-m">only what you actually need</p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-ess-purple mb-2">● Gradual, responsible growth</h3>
              <p className="text-gray-600 text-m">trust before expansion</p>
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