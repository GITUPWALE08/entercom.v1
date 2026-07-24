
import { Link } from 'react-router-dom';
import { Briefcase, Wrench, Users, ArrowRight } from 'lucide-react';

export default function Careers() {
  const opportunities = [
    {
      title: 'Technician & Installer',
      description: 'Join our network of skilled professionals to support security system installation, maintenance, and technical services.',
      icon: <Wrench className="w-8 h-8 text-ess-purple" />,
      link: '/portal/customer/apply-technician',
      tags: ['Freelance', 'Contract', 'Full-time'],
    },
    {
      title: 'Staff / Office Positions',
      description: 'Work with us in sales, customer support, or management roles.',
      icon: <Briefcase className="w-8 h-8 text-ess-navy" />,
      link: '/portal/customer/apply-staff',
      tags: ['Full-time', 'Hybrid'],
    },
    {
      title: 'Internship Programs',
      description: 'Kickstart your career in the security tech industry with hands-on training and mentorship.',
      icon: <Users className="w-8 h-8 text-green-600" />,
      link: '/portal/customer/apply-internship',
      tags: ['Internship', 'Training'],
    },
  ];

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Header Section */}
      <section className="bg-ess-navy text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Join the Entercom Team</h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            We are looking for passionate, skilled, and driven individuals to help us build a safer world through cutting-edge security systems.
          </p>
        </div>
      </section>

      {/* Opportunities Section */}
      <section className="max-w-6xl mx-auto px-6 py-16 -mt-10">
        <div className="grid md:grid-cols-3 gap-8">
          {opportunities.map((opp, idx) => (
            <div key={idx} className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
              <div className="bg-gray-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                {opp.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{opp.title}</h3>
              <p className="text-gray-600 mb-6 flex-grow">{opp.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-8">
                {opp.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
              
              <Link 
                to={opp.link} 
                className="inline-flex items-center justify-center w-full gap-2 bg-gray-50 hover:bg-ess-purple hover:text-white text-ess-navy font-bold py-3 px-6 rounded-xl transition-colors duration-200"
              >
                Apply Now <ArrowRight size={18} />
              </Link>
            </div>
          ))}
        </div>
      </section>
      
      {/* Why Join Us */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="bg-white rounded-3xl p-10 md:p-16 border border-gray-100 shadow-sm text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Why Work With Us?</h2>
          <p className="text-gray-600 max-w-3xl mx-auto mb-12">
            At Entercom, we value expertise and dedication. Whether you're a seasoned technician or just starting out, we provide the platform, projects, and support for you to grow your career and maximize your earning potential.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Steady Projects</h4>
              <p className="text-gray-600">Access to a continuous stream of installation and maintenance contracts.</p>
            </div>
            <div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Flexible Terms</h4>
              <p className="text-gray-600">Work freelance on your own schedule or join us full-time.</p>
            </div>
            <div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Growth & Training</h4>
              <p className="text-gray-600">Get upskilled with the latest security system technologies.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
