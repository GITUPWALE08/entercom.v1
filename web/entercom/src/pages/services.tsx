import { Link } from 'react-router-dom';
import { Eye, Lock, HomeIcon, Flame, Cpu, Server, ChevronRight, ServerIcon, Check } from 'lucide-react';
import service from '../assets/service3.jpg';

const Services = () => {
  const services = [
    {
      id: "surveillance",
      icon: <Eye size={40} />,
      title: "Camera Installation & Surveillance",
      color: "text-blue-600",
      bg: "bg-blue-50",
      description: "We design and install camera systems that give you clear visibility of your property, indoors and outdoors.",
      features: ["Indoor & outdoor security cameras", "Front door & perimeter monitoring", "Mobile app setup & remote viewing", "Night vision optimization", "Local or cloud recording options"]
    },
    {
      id: "motion",
      icon: <Lock size={40} />,
      title: "Motion & Entry Sensors",
      color: "text-ess-purple",
      bg: "bg-purple-50",
      description: "Instant alerts when movement or entry is detected, so you’re informed even when you’re away.",
      features: ["Door & window sensors", "Motion detection sensors", "Alert notifications to your phone", "Basic alarm integration"]
    },
    {
      id: "home",
      icon: <HomeIcon size={40} />,
      title: "Smart Home Security (Basic)",
      color: "text-green-600",
      bg: "bg-green-50",
      description: "Simple smart security features that improve convenience and control, without unnecessary complexity.",
      features: ["Video doorbells", "Smart locks", "App-based access control", "Basic automation"]

    },
    {
      id: "fire",
      icon: <Flame size={40} />,
      title: "Fire & Life Safety",
      color: "text-red-600",
      bg: "bg-red-50",
      description: "Early warning systems to protect lives and property from hazards.",
      features: ["Smoke & Heat Detection", "Intrusion Alarms", "Emergency Notification", "Gas Leak Detection"]
    },
    {
      id: "smarthome",
      icon: <Cpu size={40} />,
      title: "System Setup, Upgrade & Maintenance",
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      description: "Already have a security system that isn’t working well? We help you fix, optimize, or upgrade it.",
      features: ["Camera repositioning", "App reconfiguration", "Firmware updates", "Storage troubleshooting", "System health checks"]
    },
    {
      id: "infrastructure",
      icon: <Server size={40} />,
      title: "Consultation & Site Assessment",
      color: "text-slate-600",
      bg: "bg-slate-100",
      description: "Not sure what you need? We offer on-site assessments to recommend the right setup for your space and budget.",
      features: ["Property walkthrough", "Coverage recommendations", "Device count guidance", "Clear, simple quote"]
    }
  ];

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Header */}
      <div className="bg-ess-navy text-white py-16 md:py-24">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Services</h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg">
            Entercom Security provides practical, reliable security solutions for homes and small businesses.
            We focus on professional installation, proper setup, and ongoing support, so your system works when it matters most.
          </p>
        </div>
      </div>

      {/* Services Grid */}
      <div className="container mx-auto px-6 -mt-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <div key={service.id} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
              <div className={`w-16 h-16 ${service.bg} ${service.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                {service.icon}
              </div>
              <h3 className="text-2xl font-bold text-ess-navy mb-3">{service.title}</h3>
              <p className="text-gray-600 mb-6">{service.description}</p>
              <ul className="space-y-2 mb-8">
                {service.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-500">
                    <span className={`w-1.5 h-1.5 rounded-full ${service.bg.replace('bg-', 'bg-slate-400 ')}`}></span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link to="/contact" className="inline-flex items-center gap-2 text-ess-purple font-bold hover:gap-3 transition-all">
                Get a Quote <ChevronRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      </div>

 

      <div className="grid md:grid-cols-2 gap-12 items-center m p-10 m-5 bg-white">
          <div>
            <div className="inline-block p-3 bg-blue-100 text-blue-600 rounded-xl mb-4">
              <ServerIcon size={32} />
            </div>
            <h2 className="text-3xl font-bold text-ess-navy mb-4">Services We Are Expanding Into...</h2>
            <p className="text-gray-600 mb-6">
              As Entercom Security grows, we plan to expand into additional solutions such as:
            </p>
            <ul className="space-y-3">
              {['Fire & safety alert systems', 'Farm and perimeter security', 'Advanced access control', 'Structured cabling and power backup'].map(item => (
                <li key={item} className="flex items-center gap-3">
                  <Check size={18} className="text-green-500" />
                  <span className="font-medium text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-2xl h-64 md:h-80 w-full flex items-center justify-center text-gray-400">
            {/* Placeholder for Cable Image */}
            {/* <CameraIcon size={64} opacity={0.5} /> */}
            <img 
                src={service} 
                alt="Rack visualization"
                // className="bg-gray-100 rounded-2xl h-64 md:h-80 w-full object-cover"
              />
          </div>
      </div>

      {/* CTA */}
      <div className="container mx-auto px-6 mt-20 text-center">
        <h2 className="text-2xl font-bold text-ess-navy mb-6">Need a custom solution?</h2>
        <Link to="/contact" className="bg-ess-purple text-white px-8 py-3 rounded-xl font-bold hover:bg-ess-darkPurple transition">
          Talk to an Engineer
        </Link>
      </div>
    </div>
  );
};

export default Services;