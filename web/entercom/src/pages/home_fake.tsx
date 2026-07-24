import { Link } from 'react-router-dom';
import { Eye, Lock, ChevronRight, CheckCircle2, Server, HomeIcon } from 'lucide-react';

const Home = () => {
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
      {/* Hero Section - Split Layout on Desktop */}
      <section className="relative bg-slate-900 overflow-hidden">
        {/* Background Gradients (Subtle Tech Vibe) */}
        <div className="absolute top-0 right-0 w-[50%] h-full bg-gradient-to-l from-ess-purple/20 to-transparent pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[50%] h-full bg-gradient-to-t from-ess-navy/50 to-transparent pointer-events-none"></div>

        <div className="container mx-auto px-6 py-16 md:py-24 lg:py-32 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            
            {/* Left Content (Text) */}
            <div className="lg:w-1/2 text-center lg:text-left">
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

            {/* Right Content (Desktop Image) */}
            <div className="hidden lg:block lg:w-1/2 relative">
              {/* Abstract Tech Graphic */}
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border border-white/10 shadow-purple-900/20 group">

                {/* Floating Badge */}
                <div className="absolute bottom-8 left-8 z-20 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                    <CheckCircle2 className="text-white" size={20} />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">System Status</p>
                    <p className="text-green-400 text-xs font-mono">ONLINE • SECURE</p>
                  </div>
                </div>
              </div>
              {/* Decorative Dots */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-ess-purple/20 rounded-full blur-3xl"></div>
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