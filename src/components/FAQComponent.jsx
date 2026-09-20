import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, ShieldCheck, Clock, CreditCard, Gift } from 'lucide-react';

const FAQS = [
  {
    q: 'How do I book a doctor appointment on MyDoctorBook?',
    a: 'Simply search for your symptom (e.g. headache, fever, tooth pain), body part, or doctor specialization on the homepage. Select your preferred doctor, choose a clinic branch and date/time slot, fill out the required patient details, and click Confirm Appointment.'
  },
  {
    q: 'Must I log in before booking an appointment?',
    a: 'Yes, patients must create an account or log in before confirming an appointment so that doctors can review your details and send real-time appointment status updates.'
  },
  {
    q: 'How does the Doctor Appointment Approval Workflow work?',
    a: 'When you book an appointment, its status starts as Pending. The doctor receives an instant notification and can Accept, Reject, or Reschedule. You will see updated statuses directly in your Patient Dashboard.'
  },
  {
    q: 'How do Online UPI QR Code payments work?',
    a: 'When you choose "Pay Online", the doctor\'s uploaded UPI QR code will be displayed on the screen. Scan it using Google Pay, PhonePe, Paytm, or BHIM UPI app, and upload your payment reference/screenshot for instant verification.'
  },
  {
    q: 'How can doctors register and start appearing live?',
    a: 'Click on "Sign Up" $\\rightarrow$ "Doctor Registration". Fill out your degree, specialization, fee, profile photo, and UPI QR code. As soon as you complete registration, your profile automatically appears live on the homepage for patients.'
  },
  {
    q: 'How does the Patient ₹200 Cashback reward work?',
    a: 'Every patient who completes 10 confirmed/completed appointments automatically unlocks ₹200 Cashback. You can track your real-time visit progress directly on your Patient Dashboard.'
  },
  {
    q: 'How does the Doctor ₹1000 Bonus reward work?',
    a: 'Doctors who complete treatment for 100 confirmed appointments receive a ₹1000 bonus (up to 3 milestones / max ₹3000). Platform verification of completed records applies.'
  }
];

export default function FAQComponent() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto font-bold border border-blue-100">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">Frequently Asked Questions (FAQ)</h2>
        <p className="text-xs text-slate-500">Everything you need to know about booking, payments, and rewards</p>
      </div>

      <div className="space-y-3 max-w-3xl mx-auto">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isOpen ? 'border-blue-500 bg-blue-50/30 shadow-sm' : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
              }`}
            >
              <button
                onClick={() => toggleFAQ(idx)}
                className="w-full p-4 text-left flex items-center justify-between text-sm font-bold text-slate-900 space-x-3 focus:outline-none"
              >
                <span>{faq.q}</span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-blue-600 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>
              {isOpen && (
                <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-blue-100/60 pt-3 animate-fade-in">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
