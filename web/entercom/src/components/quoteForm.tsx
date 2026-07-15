import React, { useState, useRef } from 'react';
import emailjs from '@emailjs/browser';
import { Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuoteForm = () => {
  const form = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [requestData, setRequestData] = useState<any>(null);
  const navigate = useNavigate();

  const sendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.current) return;

    setStatus("sending");

    // YOUR KEYS
    const serviceID = 'service_xuey6ic';
    const adminTemplateID = 'template_ackfkbb';      // <--- Template 1
    const clientTemplateID = 'template_ucyz78v';  // <--- Template 2
    const publicKey = 'IStWkpLTErGOLGur2';

    // 1. Send Admin Email (To You)
    emailjs.sendForm(serviceID, adminTemplateID, form.current, publicKey)
      .then(() => {
        // 2. Send Client Email (To Them)
        // We extract the data to send it again
        const formData = new FormData(form.current!);
        const data: Record<string, unknown> = {};
        formData.forEach((value, key) => (data[key] = value));
        
        setRequestData(data);
        return emailjs.send(serviceID, clientTemplateID, data, publicKey);
      })
      .then(() => {
        setStatus("success");
      })
      .catch((error) => {
        console.error("Failed...", error);
        setStatus("error");
      });
  };

  if (status === "success") {
    return (
      <div className="bg-white p-8 rounded-2xl text-center border border-gray-100 shadow-xl h-full flex flex-col items-center justify-center animate-fade-in-up">
        <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-sm border border-green-100">
          <CheckCircle size={40} />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Request Received!</h3>
        <p className="text-gray-600 mb-8 max-w-sm mx-auto">
          We have sent a confirmation to your email. Track your request and manage quotes by creating a free Entercom account.
        </p>
        
        <div className="w-full space-y-3">
          <button 
            onClick={() => navigate('/register', { state: { requestData } })}
            className="w-full py-4 px-4 bg-ess-purple text-white font-bold rounded-xl shadow-md hover:bg-ess-darkPurple transition-colors flex flex-col items-center justify-center relative overflow-hidden active:scale-[0.98]"
          >
            <span>Create Account & Track Request</span>
            <span className="text-[10px] uppercase tracking-wider font-semibold opacity-80 mt-0.5">Recommended</span>
          </button>
          
          <button 
            onClick={() => { setStatus("idle"); form.current?.reset(); }} 
            className="w-full py-3 px-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    );
  }

  return (
    <form ref={form} onSubmit={sendEmail} className="space-y-5 bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-gray-100">
      <div>
        <h3 className="text-2xl font-bold text-ess-navy mb-2">Get a Free Quote</h3>
        <p className="text-gray-500 text-sm">Fill out the form below. We usually reply within 24 hours.</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-5">
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Full Name</label>
          <input required type="text" name="user_name" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-ess-purple focus:border-transparent outline-none transition" placeholder="Enter your name" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email Address</label>
          <input required type="email" name="user_email" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-ess-purple focus:border-transparent outline-none transition" placeholder="name@company.com" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Phone Number</label>
          <input required type="tel" name="user_phone" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-ess-purple focus:border-transparent outline-none transition" placeholder="+234..." />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Service Required</label>
          <div className="relative">
            <select name="service_type" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-ess-purple focus:border-transparent outline-none transition appearance-none cursor-pointer">
              <option>Video Surveillance</option>
              <option>Access Control</option>
              <option>Farm Security</option>
              <option>Smart Home Setup</option>
              <option>Fire & Safety Systems</option>
              <option>General Inquiry</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Project Details</label>
        <textarea required name="message" rows={4} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-ess-purple focus:border-transparent outline-none transition resize-none" placeholder="Describe your project location and needs..."></textarea>
      </div>

      {status === "error" && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
          <AlertCircle size={16} />
          <span>Connection failed. Please call us directly.</span>
        </div>
      )}

      <button 
        disabled={status === "sending"} 
        type="submit" 
        className="w-full bg-ess-purple hover:bg-ess-darkPurple text-white py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {status === "sending" ? (
          <>Sending... <Loader2 className="animate-spin" size={20} /></>
        ) : (
          <>Submit Request <Send size={20} /></>
        )}
      </button>
    </form>
  );
};

export default QuoteForm;