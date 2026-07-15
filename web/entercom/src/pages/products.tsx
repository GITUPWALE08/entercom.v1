import { Link } from 'react-router-dom';
import { BatteryCharging, Lock, Check, CameraIcon, ChevronRight, AlertCircle } from 'lucide-react';
import camera from '../assets/camera4.jpg';
import alert from '../assets/alert.jpg';
import smart from '../assets/smart.jpg';
import select from '../assets/selection.jpg';
import power from '../assets/power.jpeg';
import expand from '../assets/product_expand.png';

const Products = () => {
  return (
    <div className="bg-white min-h-screen">
      <div className="bg-slate-100 py-16 md:py-24">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold text-ess-navy mb-4">Hardware & Products</h1>
          <p className="text-gray-600 max-w-2xl text-lg">
            At Entercom Security, we provide reliable, field-tested security hardware as part of our
            installation and support services.
            Our focus is on compatibility, durability, and proper setup, not just selling devices.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-16 space-y-20">
        
        {/* Category 1: Security Camera */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block p-3 bg-orange-100 text-orange-600 rounded-xl mb-4">
              <CameraIcon size={32} />
            </div>
            <h2 className="text-3xl font-bold text-ess-navy mb-4">Security Cameras</h2>
            <p className="text-gray-600 mb-6">
              We work with a range of indoor and outdoor cameras suitable for homes and small businesses.
            </p>
            <p className="text-gray-600 mb-6">
              Available options:
            </p>
            <ul className="space-y-3">
              {['Indoor cameras', 'Outdoor weather-resistant cameras', 'Night vision cameras', 'Wired (PoE) and Wi-Fi cameras', 'Camera recorders (NVR/DVR)'].map(item => (
                <li key={item} className="flex items-center gap-3">
                  <Check size={18} className="text-green-500" />
                  <span className="font-medium text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-gray-100 rounded-2xl h-64 md:h-80 w-full flex items-center justify-center text-gray-400">
            {/* Placeholder for Cable Image */}
            {/* <CameraIcon size={64} opacity={0.5} /> */}
            <img 
                src={camera} 
                alt="Rack visualization"
                className="bg-gray-100 rounded-2xl h-64 md:h-80 w-full object-cover"
              />
          </div>
        </div>

        {/* Category 2: Sensors & Alerts */}
        <div className="grid md:grid-cols-2 gap-12 items-center md:flex-row-reverse">
          <div className="order-first md:order-last">
            <div className="inline-block p-3 bg-yellow-100 text-yellow-600 rounded-xl mb-4">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-3xl font-bold text-ess-navy mb-4">Sensors & Alerts</h2>
            <p className="text-gray-600 mb-6">
              Simple devices that provide instant notification when something changes.
            </p>
            <ul className="space-y-3">
              {['Door and window sensors', 'Motion detection sensors', 'Basic alarm units', 'Environmental alerts (where applicable)'].map(item => (
                <li key={item} className="flex items-center gap-3">
                  <Check size={18} className="text-green-500" />
                  <span className="font-medium text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-gray-100 rounded-2xl h-64 md:h-80 w-full flex items-center justify-center text-gray-400">
             {/* Placeholder for UPS Image */}
             {/* <AlertCircle size={64} opacity={0.2} /> */}
             <img 
                src={alert} 
                alt="Rack visualization"
                className="bg-gray-100 rounded-2xl h-64 md:h-80 w-full object-cover"
              />
          </div>
        </div>

        {/* Category 3: Smart Security Devices */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block p-3 bg-blue-100 text-blue-600 rounded-xl mb-4">
              <Lock size={32} />
            </div>
            <h2 className="text-3xl font-bold text-ess-navy mb-4">Smart Security Devices</h2>
            <p className="text-gray-600 mb-6">
              Security-focused smart devices that enhance access control and visibility.
            </p>
            <ul className="space-y-3">
              {[' Video doorbells', 'Smart locks', 'App-enabled access devices', 'Mobile notification systems'].map(item => (
                <li key={item} className="flex items-center gap-3">
                  <Check size={18} className="text-green-500" />
                  <span className="font-medium text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-gray-100 rounded-2xl h-64 md:h-80 w-full flex items-center justify-center text-gray-400">
             {/* Placeholder for Rack Image */}
             {/* <Lock size={64} opacity={0.2} /> */}
             <img 
                src={smart}
                alt = "smart security"
                className="bg-gray-100 rounded-2xl h-64 md:h-80 w-full object-cover"
              />
          </div>
        </div>

        {/* Category 4: Power & Connectivity (Basic) */}
        <div className="grid md:grid-cols-2 gap-12 items-center md:flex-row-reverse">
          <div className="order-first md:order-last">
            <div className="inline-block p-3 bg-yellow-100 text-yellow-600 rounded-xl mb-4">
              <BatteryCharging size={32} />
            </div>
            <h2 className="text-3xl font-bold text-ess-navy mb-4">Power & Connectivity (Basic)</h2>
            <p className="text-gray-600 mb-6">
              Protect your equipment from surges and outages with our enterprise-grade power attachments.
            </p>
            <ul className="space-y-3">
              {['Power Distribution Units (PDU)', 'Power Adapters and Surge Protectors', 'Solar Power Integrations', ' Backup power options for cameras', 'Network accessories required for for installation'].map(item => (
                <li key={item} className="flex items-center gap-3">
                  <Check size={18} className="text-green-500" />
                  <span className="font-medium text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-gray-100 rounded-2xl h-64 md:h-80 w-full flex items-center justify-center text-gray-400">
             {/* Placeholder for UPS Image */}
             {/* <BatteryCharging size={64} opacity={0.2} /> */}
             <img 
                src={power}
                alt = "smart security"
                className="bg-gray-100 rounded-2xl h-64 md:h-80 w-full object-cover"
              />
          </div>
        </div>

        {/* Category 5: Product Selection & Compatibility */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            {/* <div className="inline-block p-3 bg-blue-100 text-blue-600 rounded-xl mb-4">
              <Wifi size={32} />
            </div> */}
            <h2 className="text-3xl font-bold text-ess-navy mb-4">Product Selection & Compatibility</h2>
            <p className="text-gray-600 mb-6">
              We do not promote a fixed product catalog.
            </p>
            <p className="text-gray-600 mb-6">
              Instead, we:
            </p>
            <ul className="space-y-3">
              {['Recommend devices based on your space and budget', 'Ensure compatibility with mobile apps', 'Prioritize ease of use and long-term support', 'Avoid unnecessary or over-complex equipment'].map(item => (
                <li key={item} className="flex items-center gap-3">
                  <Check size={18} className="text-green-500" />
                  <span className="font-medium text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-gray-100 rounded-2xl h-64 md:h-80 w-full flex items-center justify-center text-gray-400">
             {/* Placeholder for Rack Image */}
             {/* <Box size={64} opacity={0.2} /> */}
             <img 
                src={select}
                alt = "smart security"
                className="bg-gray-100 rounded-2xl h-64 md:h-80 w-full object-cover"
              />
          </div>
        </div>

        {/* custom quote */}
        <div className="bg-slate-50 rounded-3xl p-8 md:p-12 text-center border border-slate-100 mb-3">
          <h2 className="text-3xl font-bold text-ess-navy mb-8">Looking for a Specific Device?</h2>
          <p className="text-gray-600 text-sm mb-5">If you already have equipment or are looking for a particular solution, we can:</p>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold text-ess-purple mb-2">● Assess compatibility</h3>
            </div>
            <div>
              <h3 className="text-xl font-bold text-ess-purple mb-2">● Recommend suitable alternatives</h3>
            </div>
            <div>
              <h3 className="text-xl font-bold text-ess-purple mb-2">● Supply and install approved devices</h3>
            </div>
          </div>
          <Link to="/contact" className="inline-flex items-center gap-2 text-ess-purple font-bold hover:gap-3 transition-all pt-5">
                Request a Product Consultation <ChevronRight size={16} />
              </Link>
        </div>

        {/* product expansion */}
        <div className="grid md:grid-cols-2 gap-12 items-center m-2 bg-gray-50/50 border border-slate-100 rounded-3xl">
          <div className='p-10'>
            {/* <div className="inline-block p-3 bg-blue-100 text-blue-600 rounded-xl mb-4">
              <ServerIcon size={32} />
            </div> */}
            <h2 className="text-3xl font-bold text-ess-navy mb-4">Future Product Expansion</h2>
            <p className="text-gray-600 mb-6">
              As Entercom Security grows, we plan to gradually expand into:
            </p>
            <ul className="space-y-3">
              {['Advanced power backup systems', 'Structured cabling for larger facilities', 'Access control systems', 'Specialized security infrastructure'].map(item => (
                <li key={item} className="flex items-center gap-3">
                  <Check size={18} className="text-green-500" />
                  <span className="font-medium text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-gray-100 rounded-2xl h-64 md:h-80 w-full flex items-center justify-center text-gray-400">
              {/* Placeholder for Rack Image */}
              {/* <Box size={64} opacity={0.2} /> */}
              <img 
                src={expand}
                alt="Advanced Security and Power Infrastructure"
                className="bg-gray-100 rounded-2xl h-64 md:h-80 w-full object-cover"
              />
          </div>
        </div>

      </div>
      
      <div className="bg-ess-navy py-16 text-center">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-white mb-6">Looking for specific parts?</h2>
          <Link to="/contact" className="inline-block bg-ess-purple hover:bg-ess-darkPurple text-white px-8 py-3 rounded-xl font-bold transition">
            Request Product Catalog
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Products;