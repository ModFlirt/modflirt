import React, { useState, useRef } from "react";

export default function ModFlirtPortal() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    countryCode: "+44",
    phoneNumber: "",
    experience: "",
    motivation: "",
    hasComputer: "",
    stableInternet: "",
    legalAgeConfirm: false,
  });
  const [file, setFile] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const isFormValid =
    formData.firstName.trim() !== "" &&
    formData.lastName.trim() !== "" &&
    formData.email.trim() !== "" &&
    formData.phoneNumber.trim() !== "" &&
    formData.experience.trim() !== "" &&
    formData.motivation.trim() !== "" &&
    formData.hasComputer !== "" &&
    formData.stableInternet !== "" &&
    file !== null &&
    formData.legalAgeConfirm === true;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setStatusMessage("Transmitting application details securely...");

    const submissionData = new FormData();
    Object.keys(formData).forEach((key) => {
      submissionData.append(key, formData[key]);
    });
    submissionData.append("resume", file);

    try {
      // FIX: Use the Vite proxy path (/api/apply) instead of a hardcoded localhost URL.
      // The vite.config.js proxy forwards this to http://localhost:5000/api/apply.
      // This also means the app will work in production without changing URLs.
      const response = await fetch("/api/apply", {
        method: "POST",
        body: submissionData,
      });

      const result = await response.json();

      if (response.ok) {
        setStatusMessage("✅ " + result.message);
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          countryCode: "+44",
          phoneNumber: "",
          experience: "",
          motivation: "",
          hasComputer: "",
          stableInternet: "",
          legalAgeConfirm: false,
        });
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        // FIX: server returns "message" field on errors — was incorrectly reading result.error
        setStatusMessage("❌ " + (result.message || "An error occurred. Please try again."));
      }
    } catch (error) {
      setStatusMessage("❌ Could not reach the server. Make sure the backend is running (node server.js) in a separate terminal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 bg-pink-600 rounded-xl flex items-center justify-center text-white font-black text-xl tracking-tighter">MF</div>
          <span className="font-black text-2xl tracking-tight text-slate-900">Mod<span className="text-pink-600">Flirt</span></span>
        </div>
        <a
          href="https://maps.google.com/?q=London,UK"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full flex items-center space-x-1 transition border border-slate-200"
        >
          <span>📍 Operations Base: London, UK</span>
          <span className="text-pink-600 font-extrabold text-[10px] ml-1 bg-white px-1.5 py-0.5 rounded border border-slate-200 uppercase tracking-tight">View Map</span>
        </a>
      </nav>

      {/* Announcement Bar */}
      <div className="bg-slate-950 text-center py-2 px-4 tracking-wide uppercase shadow-inner border-b border-pink-500/20">
        <span className="block text-amber-400 font-black text-base md:text-lg animate-pulse">
          🔥 WE PAY WEEKLY! 🔥
        </span>
      </div>

      {/* Hero */}
      <header className="bg-slate-900 text-white py-10 px-6 text-center border-b-4 border-pink-600">
        <h1 className="text-3xl md:text-4xl font-black mb-3 tracking-tight">Flexible Remote Chat Moderator Roles</h1>
        <p className="text-base md:text-lg text-slate-200 max-w-3xl mx-auto font-normal leading-relaxed mb-4">
          Partner with ModFlirt to manage text-based interactions for massive global networks. Work from the comfort of your home, choose your own hours, and enjoy stable compensation streams.
        </p>
        <p className="text-pink-400 font-black text-lg md:text-xl uppercase tracking-wider mb-4">
          Get paid chatting with lonely strangers
        </p>
        <p className="text-emerald-400 font-black text-xs md:text-sm tracking-wide bg-slate-950/60 inline-block px-4 py-1 rounded-full border border-emerald-500/20">
          💰 We pay from $0.1 - $0.18 per message
        </p>
      </header>

      {/* Info Grid */}
      <main className="max-w-5xl mx-auto py-12 px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-lg text-slate-900 mb-2">Complete Liberty</h3>
          <p className="text-sm text-slate-600 leading-relaxed">Log on whenever you choose. No fixed shift structures, no manager over your shoulder. You manage your workload entirely.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-lg text-slate-900 mb-2">Steady Weekly Payouts</h3>
          <p className="text-sm text-slate-600 leading-relaxed">Earnings are settled on a dependable weekly routine direct to your account. Meet your processing metrics to maintain continuous cashflow.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-lg text-slate-900 mb-2">Total Privacy Safeguards</h3>
          <p className="text-sm text-slate-600 leading-relaxed">Your professional space is insulated. Customers only interact with text characters—your real identity and face are completely hidden.</p>
        </div>
      </main>

      {/* Application Form */}
      <section className="py-12 px-6 bg-slate-100/80">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto bg-white rounded-2xl shadow-md border border-slate-200 p-8 md:p-10 space-y-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Onboarding Registration Form</h2>
            <p className="text-sm text-slate-500 mt-1">Provide your verified details below to initialize your moderator account setup.</p>
          </div>

          {/* Identity */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-1">1. Contact Identity Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Given First Name *</label>
                <input type="text" name="firstName" required value={formData.firstName} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-pink-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Family Last Name *</label>
                <input type="text" name="lastName" required value={formData.lastName} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-pink-500 outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Email Address *</label>
                <input type="email" name="email" required value={formData.email} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-pink-500 outline-none" placeholder="name@domain.com" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Mobile Contact Number *</label>
                <div className="flex space-x-2">
                  <select name="countryCode" value={formData.countryCode} onChange={handleInputChange} className="px-3 py-2.5 border border-slate-300 bg-white rounded-xl text-sm focus:ring-2 focus:ring-pink-500 outline-none w-32">
                    <option value="+1">🇺🇸 USA (+1)</option>
                    <option value="+44">🇬🇧 UK (+44)</option>
                    <option value="+1-CA">🇨🇦 CAN (+1)</option>
                    <option value="+254">🇰🇪 KEN (+254)</option>
                    <option value="+234">🇳🇬 NGA (+234)</option>
                    <option value="+256">🇺🇬 UGA (+256)</option>
                    <option value="+255">🇹🇿 TZA (+255)</option>
                    <option value="+61">🇦🇺 AUS (+61)</option>
                  </select>
                  <input type="tel" name="phoneNumber" required value={formData.phoneNumber} onChange={handleInputChange} className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-pink-500 outline-none" placeholder="7123 456789" />
                </div>
              </div>
            </div>
          </div>

          {/* Experience */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-1">2. Experience & Background</h3>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Do you have previous online message or content moderation experience? *</label>
              <textarea name="experience" required value={formData.experience} onChange={handleInputChange} rows="3" className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-pink-500 outline-none" placeholder="Detail any customer care, writing, chat room, or related remote history..."></textarea>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Why do you want to join ModFlirt and what makes you a good fit? *</label>
              <textarea name="motivation" required value={formData.motivation} onChange={handleInputChange} rows="3" className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-pink-500 outline-none" placeholder="Tell us about your schedule availability and goals..."></textarea>
            </div>
          </div>

          {/* Tech */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-1">3. Tech Infrastructure Requirements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Do you possess a personal PC or Laptop? *</label>
                <select name="hasComputer" required value={formData.hasComputer} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-pink-500 outline-none">
                  <option value="">-- Choose Option --</option>
                  <option value="yes">Yes, I own a dependable computer</option>
                  <option value="no">No, I only use a mobile phone/tablet</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Do you have an unshared, high-speed internet link? *</label>
                <select name="stableInternet" required value={formData.stableInternet} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-pink-500 outline-none">
                  <option value="">-- Choose Option --</option>
                  <option value="yes">Yes, highly stable connection</option>
                  <option value="no">No, unstable or public networks only</option>
                </select>
              </div>
            </div>
          </div>

          {/* CV Upload */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-1">4. Document Attachment</h3>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Upload CV / Resume (PDF or Word) *</label>
              <p className="text-xs text-slate-500 mb-2">Please provide an updated copy of your resume for our validation team to assess background compatibility.</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                required
                onChange={handleFileChange}
                className="w-full text-sm text-slate-500 border border-dashed border-slate-300 bg-slate-50 p-4 rounded-xl cursor-pointer"
              />
              {file && <p className="text-xs text-emerald-600 mt-1 font-semibold">✓ {file.name} selected</p>}
            </div>
          </div>

          {/* Legal */}
          <div className="flex items-start space-x-3 pt-2">
            <input type="checkbox" id="legalAgeConfirm" name="legalAgeConfirm" required checked={formData.legalAgeConfirm} onChange={handleInputChange} className="mt-1 w-4 h-4 text-pink-600 focus:ring-pink-500 border-slate-300 rounded" />
            <label htmlFor="legalAgeConfirm" className="text-xs text-slate-600 leading-relaxed select-none">
              I officially declare that I am of legal age (18 years or older) to perform online content moderation jobs, and I accept the terms of service and private file transmission guidelines. *
            </label>
          </div>

          {/* Status */}
          {statusMessage && (
            <div className={`p-4 text-sm font-bold rounded-xl text-center border shadow-inner ${
              statusMessage.startsWith("✅")
                ? "bg-emerald-950 text-emerald-400 border-emerald-500/20"
                : statusMessage.startsWith("❌")
                ? "bg-red-950 text-red-400 border-red-500/20"
                : "bg-slate-900 text-pink-400 border-pink-500/20"
            }`}>
              {statusMessage}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className={`w-full font-extrabold text-lg py-4 px-4 rounded-xl shadow-lg transition duration-150 uppercase tracking-wide
              ${isFormValid && !isSubmitting
                ? "bg-pink-600 text-white hover:bg-pink-700 cursor-pointer opacity-100"
                : "bg-slate-200 text-slate-400 cursor-not-allowed opacity-60 shadow-none"
              }`}
          >
            {isSubmitting ? "Submitting..." : "Register"}
          </button>
        </form>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-500 text-xs py-10 px-6 text-center border-t border-slate-900 space-y-4">
        <p className="text-red-500 font-black tracking-wider uppercase text-xs md:text-sm whitespace-nowrap overflow-x-auto block">
          ⚠️ MINIMUM OF 500 MESSAGES PER WEEK REQUIRED FOR PAYOUT ELIGIBILITY ⚠️
        </p>
        <p>
          © {new Date().getFullYear()} ModFlirt Operations (
          <a
            href="https://maps.google.com/?q=London,UK"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-slate-300 transition"
          >
            London
          </a>
          , UK Division). All structural privacy rights maintained.
        </p>
      </footer>
    </div>
  );
}
