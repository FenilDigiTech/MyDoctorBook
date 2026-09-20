import React from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, Mail, Phone, MapPin, Twitter, Instagram, Facebook, Linkedin, HelpCircle, MessageSquare } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          {/* Column 1: Brand Info & Social Links */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center text-slate-950 shadow-md">
                <Stethoscope className="w-5 h-5 font-black" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                MyDoctorBook
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Your trusted partner for accessible, high-quality healthcare. Find the right doctor and book appointments with ease — anytime, anywhere.
            </p>

            {/* Social Icons */}
            <div className="flex items-center space-x-2 pt-1">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Follow MyDoctorBook on Twitter"
                className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
              >
                <Twitter className="w-3.5 h-3.5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Follow MyDoctorBook on Instagram"
                className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
              >
                <Instagram className="w-3.5 h-3.5" />
                <span className="sr-only">Instagram</span>
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Follow MyDoctorBook on Facebook"
                className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
              >
                <Facebook className="w-3.5 h-3.5" />
                <span className="sr-only">Facebook</span>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Follow MyDoctorBook on LinkedIn"
                className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
              >
                <Linkedin className="w-3.5 h-3.5" />
                <span className="sr-only">LinkedIn</span>
              </a>
            </div>
          </div>

          {/* Column 2: QUICK NAVIGATION */}
          <div className="space-y-3">
            <h3 className="text-white font-bold text-xs uppercase tracking-wider">
              QUICK NAVIGATION
            </h3>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link to="/" className="hover:text-white transition-colors">Home &amp; Search</Link>
              </li>
              <li>
                <Link to="/labs" className="hover:text-teal-300 transition-colors">Lab Marketplace</Link>
              </li>
              <li>
                <Link to="/pharmacy" className="hover:text-cyan-300 transition-colors">Pharmacy &amp; Medicines</Link>
              </li>
              <li>
                <Link to="/compare" className="hover:text-purple-300 transition-colors">Doctor Comparison</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">Contact Support</Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-white transition-colors">Help &amp; FAQs</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: HEALTHCARE PROVIDERS */}
          <div className="space-y-3">
            <h3 className="text-white font-bold text-xs uppercase tracking-wider">
              HEALTHCARE PARTNERS
            </h3>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link to="/signup?role=doctor" className="hover:text-white transition-colors">Register as Doctor</Link>
              </li>
              <li>
                <Link to="/signup?role=lab" className="hover:text-white transition-colors">Register Diagnostic Lab</Link>
              </li>
              <li>
                <Link to="/signup?role=pharmacy" className="hover:text-white transition-colors">Register Medical Store</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">Provider Login</Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-white transition-colors">Patient Registration</Link>
              </li>
            </ul>
          </div>

          {/* Column 4: CONTACT & HELP */}
          <div className="space-y-3">
            <h3 className="text-white font-bold text-xs uppercase tracking-wider">
              CONTACT & HELP
            </h3>
            <ul className="space-y-3 text-xs text-slate-400">
              <li className="flex items-center space-x-2.5">
                <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                <a href="mailto:digitalfenilpatel@gmail.com" className="hover:text-white truncate">
                  digitalfenilpatel@gmail.com
                </a>
              </li>

              <li className="flex items-start space-x-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <a href="tel:8485929882" className="hover:text-white block font-semibold text-slate-300">
                    +91 84859 29882
                  </a>
                  <span className="text-[10px] text-slate-500">Mon–Sat, 9 AM – 6 PM</span>
                </div>
              </li>

              <li className="flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span>42 MG Road, Indiranagar Bangalore – 560038</span>
              </li>
            </ul>

            <div className="flex items-center space-x-2 pt-2">
              <Link to="/faq" className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-800 text-[11px] font-semibold flex items-center gap-1.5 transition-colors">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                <span>FAQ</span>
              </Link>
              <Link to="/contact" className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-800 text-[11px] font-semibold flex items-center gap-1.5 transition-colors">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                <span>Contact</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 space-y-4 md:space-y-0">
          <p className="flex items-center gap-1.5 flex-wrap justify-center md:justify-start">
            <span>© {new Date().getFullYear()} MyDoctorBook. All rights reserved.</span>
            <span className="opacity-40">•</span>
            <span>Developed by <strong className="text-slate-300 font-extrabold hover:text-cyan-400 transition-colors">FeSan InfoTech</strong></span>
          </p>
          <div className="flex items-center space-x-4">
            <Link to="/faq" className="hover:text-slate-400">Privacy Policy</Link>
            <Link to="/faq" className="hover:text-slate-400">Terms of Service</Link>
            <Link to="/faq" className="hover:text-slate-400">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
