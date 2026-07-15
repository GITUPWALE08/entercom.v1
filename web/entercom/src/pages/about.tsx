import { Link } from 'react-router-dom';
import { ShieldCheck, Globe, Users, Award } from 'lucide-react';

const About = () => {
  return (
    <div className="bg-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 to-ess-navy text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About Entercom</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Entercom Security is a security services company focused on helping homes and small
            businesses protect what matters most. We specialize in practical security system design,
            professional installation, and ongoing support, ensuring that every system we deploy works
            reliably in real-world conditions.
            We believe security should be simple, dependable, and properly set up, not confusing or
            over-engineered.

          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h2 className="text-3xl font-bold text-ess-navy mb-6">The Entercom Difference</h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                At Entercom Security, we don’t just install devices and walk away. We take time to understand
                each space and recommend solutions that fit the environment, budget, and level of risk.
              </p>
              <p>
                Our work emphasizes:
              </p>
              <ul className='ps-5'>
                <li>● Proper camera placement</li>
                <li>● Correct system configuration</li>
                <li>● Clear mobile access and alerts</li>
                <li>● Basic user training after installation</li>
              </ul>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-6 rounded-2xl text-center">
              <ShieldCheck className="mx-auto text-ess-purple mb-3" size={40} />
              <h3 className="font-bold text-ess-navy">Certified</h3>
              <p className="text-sm text-gray-500">Security Experts</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-2xl text-center">
              <Globe className="mx-auto text-blue-600 mb-3" size={40} />
              <h3 className="font-bold text-ess-navy">Global</h3>
              <p className="text-sm text-gray-500">Supply Chain</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-2xl text-center">
              <Users className="mx-auto text-green-600 mb-3" size={40} />
              <h3 className="font-bold text-ess-navy">Training</h3>
              <p className="text-sm text-gray-500">End-user Support</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-2xl text-center">
              <Award className="mx-auto text-orange-500 mb-3" size={40} />
              <h3 className="font-bold text-ess-navy">Quality</h3>
              <p className="text-sm text-gray-500">Industry Standards</p>
            </div>
          </div>
        </div>

        {/* Mission */}
        <div className="bg-slate-50 rounded-3xl p-8 md:p-12 text-center border border-slate-100 mb-3">
          <h2 className="text-2xl font-bold text-ess-navy mb-8">Our Core Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold text-ess-purple mb-2">Build</h3>
              <p className="text-gray-600 text-sm">We design security systems that are appropriate, durable, and fit for purpose</p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-ess-purple mb-2">Connect</h3>
              <p className="text-gray-600 text-sm">We help clients stay connected to their properties through simple, reliable monitoring tools.</p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-ess-purple mb-2">Protect</h3>
              <p className="text-gray-600 text-sm">We safeguard homes, businesses, and livelihoods by focusing on prevention, visibility, and response.</p>
            </div>
          </div>
        </div>

        {/* Vission */}
        <div className="bg-slate-50 rounded-3xl p-8 md:p-12 text-center border border-slate-100 mb-3">
            <h2 className="text-2xl font-bold text-ess-navy mb-8">Our Vission</h2>
            <p className="text-gray-600 text-sm">Our long-term vision is to grow Entercom Security into a trusted security partner across multiple communities, expanding into more advanced solutions responsibly as our capacity grows.</p>
            <p className="text-gray-600 text-sm">We are committed to building trust through consistent delivery, not promises.</p>
        </div>    
      </div>
      
      {/* Footer CTA */}
      <div className="container mx-auto px-6 pb-20 text-center">
         <p className="text-gray-500 mb-6">Ready to work with us?</p>
         <Link to="/contact" className="text-ess-purple font-bold text-lg hover:underline">Get in Touch &rarr;</Link>
      </div>
    </div>
  );
};

export default About;