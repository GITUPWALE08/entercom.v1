import { ArrowRight, ShieldCheck, Activity } from 'lucide-react';
import hero_image from '../assets/hero_image.png';
const HeroSection: React.FC = () => {
  return (
    <section className="
      relative lg:sticky
      flex
      w-full
      bg-slate-950
      overflow-hidden
      lg:top-20
      lg:max-h-[calc(100vh)]
      border-r border-slate-800/50
    ">

      
      {/* LAYOUT STRATEGY:
         - Mobile: standard flex-col with padding (py-12).
         - Desktop (lg): grid with 2 columns, height calculated to fill screen minus navbar (calc(100vh - 80px)).
      */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 h-full">

        {/* --- LEFT SIDE: TEXT CONTENT --- */}
        {/* Mobile: Standard block. Desktop: Span 7 cols, flex center. */}
        <div className="order-2 lg:order-1 lg:col-span-7 flex flex-col justify-center px-6 py-12 lg:py-0 lg:pl-20 lg:pr-10 relative z-10">
          
          {/* Background Grid Pattern (Subtle texture) */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

          <div className="relative max-w-2xl">
            {/* Status Badge */}
            <div className="inline-flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-full px-3 py-1 mb-8 backdrop-blur-md">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase">
                System Online
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1] mb-6">
              Entercom <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-500">
                Security System
              </span>
            </h1>

            <p className="text-lg text-slate-400 mb-8 leading-relaxed max-w-lg">
              Complete physical and digital protection. Powered by state-of-the-art security technology.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:shadow-[0_0_50px_rgba(37,99,235,0.6)] hover:-translate-y-1">
                Start Monitoring
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <button className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-slate-300 bg-slate-900 border border-slate-700 rounded-xl hover:bg-slate-800 transition-all">
                Live Demo
              </button>
            </div>

            {/* Trust Metrics */}
            <div className="pt-8 mt-8 border-t border-slate-800/50 flex gap-8 sm:gap-12">
               <div>
                  <div className="text-2xl font-bold text-white">100+</div>
                  <div className="text-sm text-slate-500">Enterprise Clients</div>
               </div>
               <div>
                  <div className="text-2xl font-bold text-white">0.01s</div>
                  <div className="text-sm text-slate-500">Latency</div>
               </div>
            </div>
          </div>
        </div>


        {/* --- RIGHT SIDE: 3D IMAGE --- */}
        {/* Mobile: Top of stack (order-1), fixed height. Desktop: Right side (Span 5), Full Height. */}
        <div className="order-1 lg:order-2 lg:col-span-5 relative min-h-[300px] lg:h-full bg-slate-900/50 flex items-center justify-center overflow-hidden border-l border-slate-800/50">
          
          {/* Background Glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] lg:w-[600px] h-[300px] lg:h-[600px] bg-blue-600/20 rounded-full blur-[80px] lg:blur-[120px]" />
          
          {/* THE 3D IMAGE */}
          {/* On Desktop, we translate it slightly right to make it look like it's bleeding off-screen */}
          <div className="relative z-10 w-full max-w-sm lg:max-w-none lg:w-[140%] lg:-right-16 transition-transform duration-700 hover:scale-105">
             <img 
                src={hero_image}
                alt="3D Technology Abstract" 
                className="w-full h-auto object-cover opacity-90 drop-shadow-2xl mix-blend-screen"
             />
             
             {/* Floating Card 1 (Hidden on small mobile, visible on larger screens) */}
             <div className="hidden sm:block absolute top-10 lg:top-1/4 left-0 lg:left-1 bg-slate-800/90 backdrop-blur-md p-3 lg:p-4 rounded-xl border border-slate-600 shadow-2xl animate-bounce" style={{ animationDuration: '3s' }}>
                 <ShieldCheck className="h-5 w-5 lg:h-6 lg:w-6 text-emerald-400 mb-2" />
                 <div className="text-[10px] lg:text-xs text-slate-400 font-mono">FIREWALL</div>
                 <div className="text-xs lg:text-sm font-bold text-white">ACTIVE</div>
             </div>

             {/* Floating Card 2 */}
             <div className="hidden sm:block absolute bottom-10 lg:bottom-1/4 right-0 lg:right-20 bg-slate-800/90 backdrop-blur-md p-3 lg:p-4 rounded-xl border border-slate-600 shadow-2xl animate-bounce" style={{ animationDuration: '4s' }}>
                 <Activity className="h-5 w-5 lg:h-6 lg:w-6 text-blue-400 mb-2" />
                 <div className="text-[10px] lg:text-xs text-slate-400 font-mono">NET TRAFFIC</div>
                 <div className="text-xs lg:text-sm font-bold text-white">12 GB/s</div>
             </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default HeroSection;