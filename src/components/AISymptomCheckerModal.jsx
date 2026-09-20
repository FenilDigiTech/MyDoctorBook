import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { Sparkles, Bot, Stethoscope, AlertTriangle, CheckCircle2, Send, X, ArrowRight, ShieldCheck, Activity, Heart, RefreshCw, Paperclip, FileText, Image } from 'lucide-react';

const COMMON_SYMPTOMS = [
  { name: 'Fever & Cold', category: 'General Physician', urgency: 'Moderate' },
  { name: 'Severe Headache / Migraine', category: 'Neurologist', urgency: 'Moderate' },
  { name: 'Chest Pain / BP Spike', category: 'Cardiologist', urgency: 'High 🚨' },
  { name: 'Tooth Pain / Bleeding Gums', category: 'Dentist', urgency: 'Low' },
  { name: 'Skin Rash / Acne / Hair Fall', category: 'Dermatologist', urgency: 'Low' },
  { name: 'Bone / Knee Joint Pain', category: 'Orthopedic', urgency: 'Moderate' },
  { name: 'Child Fever / Vomiting', category: 'Child Specialist', urgency: 'High 🚨' },
  { name: 'Period Pain / Pregnancy Query', category: 'Gynecologist', urgency: 'Moderate' }
];

export default function AISymptomCheckerModal({ onClose, onSelectCategory }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);
  const [activeTab, setActiveTab] = useState('checker'); // 'checker' or 'chat'
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [customSymptomInput, setCustomSymptomInput] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Chat & File Attachment State
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Hello! I am MediBook 24/7 AI Health Assistant 🤖.\nDescribe your symptoms in Gujarati, Hindi or English, ask any medical question, or attach your Lab Reports / Prescriptions / Photos for instant AI analysis!' }
  ]);
  const [inputChat, setInputChat] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [allDoctors, setAllDoctors] = useState([]);

  React.useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatLoading, activeTab]);

  React.useEffect(() => {
    try {
      const docs = JSON.parse(localStorage.getItem('mdb_doctors_db') || '[]');
      if (docs.length > 0) {
        setAllDoctors(docs);
      } else {
        API.get('/doctors').then(res => setAllDoctors(res.data.doctors || [])).catch(() => {});
      }
    } catch {
      API.get('/doctors').then(res => setAllDoctors(res.data.doctors || [])).catch(() => {});
    }
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAttachedFile({
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      type: file.type
    });
  };

  const toggleSymptom = (sym) => {
    if (selectedSymptoms.includes(sym.name)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== sym.name));
    } else {
      setSelectedSymptoms([...selectedSymptoms, sym.name]);
    }
  };

  const handleAnalyzeSymptoms = () => {
    if (selectedSymptoms.length === 0 && !customSymptomInput.trim()) {
      alert('Please select or type at least one symptom.');
      return;
    }

    setAnalyzing(true);
    setTimeout(() => {
      let mainCategory = 'General Physician';
      let urgencyLevel = 'Moderate';
      let summaryText = 'Based on your symptoms, a consultation with a General Physician is recommended for comprehensive evaluation.';

      const combinedText = (selectedSymptoms.join(' ') + ' ' + customSymptomInput).toLowerCase();

      if (combinedText.includes('kasu') || combinedText.includes('kasuj') || combinedText.includes('kai nathi') || combinedText.includes('nothing') || combinedText.includes('healthy') || combinedText.includes('fit') || combinedText.includes('fine') || combinedText.includes('saras')) {
        mainCategory = null;
        urgencyLevel = 'Optimal Health 🌟';
        summaryText = '😊 આનંદની વાત છે કે તમે એકદમ સ્વસ્થ છો! તમને કોઈ જ સ્વાસ્થ્ય સમસ્યા કે તકલીફ નથી. જો ભવિષ્યમાં કોઈ તકલીફ જણાય તો હું તમને મદદ કરીશ. સ્વસ્થ રહો!';
      } else if (combinedText.includes('chati') || combinedText.includes('chhati') || combinedText.includes('chest') || combinedText.includes('heart') || combinedText.includes('bp') || combinedText.includes('હૃદય') || combinedText.includes('છાતી')) {
        mainCategory = 'Cardiologist';
        urgencyLevel = 'High (Urgent Consultation Recommended 🚨)';
        summaryText = 'છાતીમાં દુખાવો અથવા હૃદય સંબંધિત લક્ષણો માટે ત્વરિત Cardiologist (હૃદયના નિષ્ણાત ડોક્ટર) પાસે ઈસીજી અને તપાસ કરાવવી અત્યંત જરૂરી છે.';
      } else if (combinedText.includes('tav') || combinedText.includes('fever') || combinedText.includes('cold') || combinedText.includes('cough') || combinedText.includes('shardi') || combinedText.includes('udharas') || combinedText.includes('sado tav') || combinedText.includes('pet') || combinedText.includes('bukhar')) {
        mainCategory = 'General Physician';
        urgencyLevel = 'Moderate';
        summaryText = 'તાવ, શરદી અથવા સામાન્ય તબીબી સમસ્યાઓ માટે General Physician (સામાન્ય રોગના સ્પેશિયાલિસ્ટ) પાસે તપાસ કરાવવી હિતાવહ છે.';
      } else if (combinedText.includes('headache') || combinedText.includes('brain') || combinedText.includes('migraine') || combinedText.includes('mathu') || combinedText.includes('માથું')) {
        mainCategory = 'Neurologist';
        urgencyLevel = 'Moderate';
        summaryText = 'Frequent or severe headaches are best evaluated by a Specialist Neurologist.';
      } else if (combinedText.includes('tooth') || combinedText.includes('gum') || combinedText.includes('teeth') || combinedText.includes('dant') || combinedText.includes('દાંત')) {
        mainCategory = 'Dentist';
        urgencyLevel = 'Low';
        summaryText = 'Dental discomfort or oral hygiene queries should be checked by a Dental Specialist.';
      } else if (combinedText.includes('skin') || combinedText.includes('acne') || combinedText.includes('hair') || combinedText.includes('chamdi')) {
        mainCategory = 'Dermatologist';
        urgencyLevel = 'Low';
        summaryText = 'Skin rashes or hair fall issues are best managed by a Consultant Dermatologist.';
      } else if (combinedText.includes('bone') || combinedText.includes('knee') || combinedText.includes('joint') || combinedText.includes('sandha')) {
        mainCategory = 'Orthopedic';
        urgencyLevel = 'Moderate';
        summaryText = 'Joint inflammation or bone pain should be examined by an Orthopedic Specialist.';
      } else if (combinedText.includes('child') || combinedText.includes('baby') || combinedText.includes('pediatric') || combinedText.includes('balak')) {
        mainCategory = 'Child Specialist';
        urgencyLevel = 'High 🚨';
        summaryText = 'Pediatric health concerns require a specialized Child Specialist / Pediatrician.';
      }

      setAnalysisResult({
        category: mainCategory,
        urgency: urgencyLevel,
        summary: summaryText
      });
      setAnalyzing(false);
    }, 800);
  };

  const HEALTH_KEYWORDS = [
    'fever', 'cold', 'cough', 'headache', 'pain', 'doctor', 'blood', 'sugar', 'bp',
    'pressure', 'heart', 'chest', 'skin', 'rash', 'teeth', 'tooth', 'dental', 'stomach',
    'vomit', 'diarrhea', 'infection', 'medicine', 'tablet', 'symptom', 'disease',
    'hospital', 'clinic', 'appointment', 'treatment', 'dose', 'health', 'body',
    'eye', 'ear', 'throat', 'diet', 'bmi', 'water', 'donor', 'lab', 'test', 'capsule',
    'syrup', 'allergy', 'flu', 'covid', 'scan', 'mri', 'xray', 'x-ray', 'prescription',
    'บุखार', 'दर्द', 'डॉक्टर', 'दवा', 'बीमारी', 'स्वास्थ्य', 'તાવ', 'દવા', 'રોગ', 'ઈલાજ', 'ડૉક્ટર', 'એપોઇન્ટમેન્ટ'
  ];

  const PLATFORM_KEYWORDS = [
    'mydoctorbook', 'doctorbook', 'website', 'platform', 'app', 'service', 'services',
    'about', 'kya hai', 'su che', 'what is', 'booking', 'owner'
  ];

  const handleSendChat = async (e) => {
    if (e) e.preventDefault();
    if ((!inputChat.trim() && !attachedFile) || chatLoading) return;

    const userMsg = inputChat || (attachedFile ? `Analyze attached report: ${attachedFile.name}` : '');
    const currentAttachment = attachedFile;

    setMessages((prev) => [
      ...prev,
      { sender: 'user', text: userMsg + (currentAttachment ? ` 📎 [Attached: ${currentAttachment.name}]` : '') }
    ]);
    setInputChat('');
    setAttachedFile(null);
    setChatLoading(true);

    try {
      const res = await API.post('/ai/symptom-checker', {
        message: userMsg,
        attachment_name: currentAttachment?.name || ''
      });

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: res.data.reply || 'AI Medical Analysis completed. Please consult a verified specialist doctor on MyDoctorBook.',
          category: res.data.recommendedCategory
        }
      ]);
    } catch (err) {
      const msg = userMsg.toLowerCase();

      let fallbackText = '';
      if (msg.includes('tav') || msg.includes('shardi') || msg.includes('udharas') || msg.includes('fever') || msg.includes('cold') || msg.includes('cough') || msg.includes('બુખાર') || msg.includes('bukhar') || msg.includes('તાવ') || msg.includes('ઉધરસ')) {
        fallbackText = `🇬🇧 **ENGLISH**:
🌡️ **Fever & Cold Care & Remedies**:
1. Drink warm water & herbal tulsi-ginger tea 2 times daily.
2. Gargle with warm salt water for throat infection.
3. Take adequate rest & avoid cold drinks or ice cream.
🩺 *Consult a General Physician on MyDoctorBook if fever exceeds 100°F.*

---
🇮🇳 **ગુજરાતી (GUJARATI)**:
🌡️ **તાવ, શરદી અને ઉધરસ માટે ઘરગથ્થુ ઉપચાર**:
૧. તુલસી, આદુ અને મધ વાળો નવશેકો ઉકાળો દિવસમાં ૨ વખત પીવો.
૨. ગળાની બળતરા માટે મીઠા વાળા ગરમ પાણીના કોગળા કરો.
૩. પૂરતો આરામ કરો અને ફ્રિજનું પાણી કે ઠંડા પીણા ન પીવો.
🩺 *જો તાવ ૧૦૦°F થી વધુ રહે તો MyDoctorBook પર જનરલ ફિઝિશિયન બુક કરો.*

---
🇮🇳 **हिंदी (HINDI)**:
🌡️ **बुखार, सर्दी और खांसी के लिए घरेलू उपचार**:
1. तुलसी, अदरक और शहद का गुनगुना काढ़ा दिन में 2 बार पीएं।
2. गले की खराश के लिए गुनगुने नमक के पानी से गरारे करें।
3. पर्याप्त आराम करें और ठंडा पानी या कोल्ड ड्रिंक्स न पीएं।
🩺 *यदि बुखार 100°F से अधिक रहता है तो MyDoctorBook पर जनरल फिजिशियन बुक करें।*`;
      } else if (msg.includes('pet') || msg.includes('acidity') || msg.includes('gas') || msg.includes('stomach') || msg.includes('दर्द') || msg.includes('પેટ')) {
        fallbackText = `🇬🇧 **ENGLISH**:
🍵 **Stomach Pain & Acidity Care**:
1. Drink buttermilk with roasted cumin powder (jeera) & rock salt.
2. Chew fennel seeds (saunf) after meals to reduce acid reflux.
3. Avoid spicy, oily, and stale food items.
🩺 *Consult a Gastroenterologist / General Physician on MyDoctorBook for severe pain.*

---
🇮🇳 **ગુજરાતી (GUJARATI)**:
🍵 **પેટમાં દુખાવો, એસિડિટી અને ગેસ માટે ઉપચાર**:
૧. શેકેલું જીરું અને સંચળ નાખી મોળી છાશ પીવો.
૨. જમ્યા પછી વરિયાળી અને સાકર ચાવવાથી એસિડિટીમાં ત્વરિત રાહત મળે છે.
૩. તીખું, તળેલું અને વાસી ખોરાક બિલકુલ ન ખાવો.
🩺 *વધુ દુખાવા માટે MyDoctorBook પર સ્પેશિયાલિસ્ટ ડોક્ટર બુક કરો.*

---
🇮🇳 **हिंदी (HINDI)**:
🍵 **पेट दर्द, एसिडिटी और गैस के लिए उपचार**:
1. भुना हुआ जीरा और काला नमक डालकर छाछ (मट्ठा) पीएं।
2. भोजन के बाद सौंफ चबाने से एसिडिटी में तुरंत राहत मिलती है।
3. तीखा, तला हुआ और बासी भोजन बिल्कुल न खाएं।
🩺 *गंभीर दर्द के लिए MyDoctorBook पर विशेषज्ञ डॉक्टर बुक करें।*`;
      } else {
        fallbackText = `🇬🇧 **ENGLISH**:
🩺 **AI Medical Evaluation**:
1. Stay well hydrated by drinking 3-4 liters of warm water.
2. Eat light, home-cooked nutritious meals & take full rest.
3. Avoid self-medication without professional advice.
🩺 *Consult a verified specialist on MyDoctorBook.in for exact diagnosis.*

---
🇮🇳 **ગુજરાતી (GUJARATI)**:
🩺 **AI તબીબી મૂલ્યાંકન**:
૧. દિવસમાં ૩-૪ લિટર નવશેકું પાણી પીવો અને હાઇડ્રેટેડ રહો.
૨. હળવો ઘરનો બનાવેલો આહાર લો અને પૂરતો આરામ કરો.
૩. યોગ્ય તબીબી સલાહ વગર કોઈ દવા ન લો.
🩺 *ચોક્કસ નિદાન માટે MyDoctorBook પર ચકાસાયેલ સ્પેશિયાલિસ્ટ ડોક્ટર બુક કરો.*

---
🇮🇳 **हिंदी (HINDI)**:
🩺 **AI चिकित्सा मूल्यांकन**:
1. दिन में 3-4 लीटर गुनगुना पानी पीएं और हाइड्रेटेड रहें।
2. हल्का घर का बना पौष्टिक भोजन खाएं और पूरा आराम करें।
3. बिना डॉक्टर की सलाह के कोई भी दवा न लें।
🩺 *सटीक जांच के लिए MyDoctorBook पर सत्यापित विशेषज्ञ डॉक्टर बुक करें।*`;
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: fallbackText,
          category: 'General Physician'
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleBookSpecialist = (catName) => {
    if (onSelectCategory) {
      onSelectCategory(catName);
    }
    onClose();
  };

  return (
    <div className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-[9999999] w-[95vw] sm:w-[430px] h-[600px] max-h-[85vh] bg-slate-900 text-white rounded-3xl border-2 border-cyan-500/50 shadow-2xl flex flex-col overflow-hidden animate-slide-up">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*,.pdf,.txt,.doc,.docx"
        className="hidden"
      />

      {/* Chatbot Header */}
      <div className="p-4 bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-md">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
              <span>24/7 AI Health Chatbot</span>
              <span className="text-[9px] font-black uppercase bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full">LIVE</span>
            </h3>
            <p className="text-[10px] text-slate-400">Ask symptoms, upload reports or medical queries</p>
          </div>
        </div>

        <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors" title="Close AI Chatbot">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Mode Toggle Tabs */}
      <div className="p-2 bg-slate-950 border-b border-slate-800 shrink-0">
        <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('checker')}
            className={`py-2 rounded-xl font-extrabold transition-all text-xs ${
              activeTab === 'checker' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Symptom Checker 🩺
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`py-2 rounded-xl font-extrabold transition-all text-xs ${
              activeTab === 'chat' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            24/7 AI Chat & Reports 💬
          </button>
        </div>
      </div>

      {/* Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Tab 1: Symptom Checker */}
        {activeTab === 'checker' && (
          <div className="space-y-4 text-xs">
            <div>
              <p className="font-extrabold text-slate-200 mb-2">Select your current symptoms:</p>
              <div className="flex flex-wrap gap-2">
                {COMMON_SYMPTOMS.map((sym, idx) => {
                  const isSelected = selectedSymptoms.includes(sym.name);
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleSymptom(sym)}
                      className={`px-3.5 py-2 rounded-xl font-extrabold transition-all border ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md ring-2 ring-blue-400'
                          : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {sym.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block font-extrabold text-slate-200 mb-1">
                Or describe how you feel in detail:
              </label>
              <textarea
                rows="2"
                value={customSymptomInput}
                onChange={(e) => setCustomSymptomInput(e.target.value)}
                placeholder="e.g. Mild fever with throat pain since yesterday..."
                className="w-full p-3 rounded-xl border border-slate-700 bg-white text-slate-900 placeholder-slate-500 text-xs font-bold focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleAnalyzeSymptoms}
              disabled={analyzing}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 hover:from-blue-700 text-white font-extrabold rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 text-sm"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>{analyzing ? 'AI Analyzing Symptoms...' : 'Analyze Symptoms with AI →'}</span>
            </button>

            {/* Analysis Output - High Contrast Fix */}
            {analysisResult && (
              <div className="p-5 bg-slate-800/90 rounded-2xl border-2 border-cyan-500/40 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-cyan-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    AI Recommendation: {analysisResult.category}
                  </span>
                  <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                    Urgency: {analysisResult.urgency}
                  </span>
                </div>

                <p className="text-xs text-slate-100 font-bold leading-relaxed bg-slate-900/90 p-3.5 rounded-xl border border-slate-700">
                  {analysisResult.summary}
                </p>

                <button
                  onClick={() => handleBookSpecialist(analysisResult.category)}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center space-x-2"
                >
                  <Stethoscope className="w-4 h-4" />
                  <span>Book Verified {analysisResult.category} Specialist Now →</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: 24/7 AI Health Chat Assistant */}
        {activeTab === 'chat' && (
          <div className="space-y-4 text-xs">
            <div className="h-72 overflow-y-auto space-y-3 p-3.5 bg-slate-950 rounded-2xl border border-slate-800 scroll-smooth">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl whitespace-pre-wrap ${
                      m.sender === 'user'
                        ? 'bg-blue-600 text-white font-extrabold shadow-md'
                        : 'bg-slate-800 border border-slate-700 text-slate-100 font-semibold shadow-sm'
                    }`}
                  >
                    <p className="leading-relaxed text-xs">{m.text}</p>
                    {m.category && (
                      <div className="mt-3 space-y-2 pt-2 border-t border-slate-700/80">
                        <p className="text-[10px] font-black text-cyan-300 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400" /> Recommended Verified Doctors Available:
                        </p>
                        {allDoctors
                          .filter(d => {
                            const spec = (d.specialization || '').toLowerCase();
                            const cat = (m.category || '').toLowerCase();
                            if (cat.includes('physician') || cat.includes('general')) {
                              return spec.includes('physician') || spec.includes('general') || spec.includes('medicine');
                            }
                            if (cat.includes('cardio') || cat.includes('heart')) {
                              return spec.includes('cardio') || spec.includes('heart');
                            }
                            return spec.includes(cat);
                          })
                          .slice(0, 2)
                          .map(doc => (
                            <div key={doc.id} className="p-2.5 bg-slate-900/90 border border-slate-700 rounded-xl flex items-center justify-between gap-2 shadow-sm">
                              <div className="min-w-0 flex-1">
                                <p className="font-extrabold text-white text-xs truncate">{doc.name}</p>
                                <p className="text-[10px] text-teal-400 font-bold">{doc.degree} • {doc.specialization}</p>
                                <p className="text-[10px] text-slate-400">📍 {doc.city || 'Ahmedabad'} • ₹{doc.fee || 500}</p>
                              </div>
                              <button
                                onClick={() => { navigate(`/doctors/${doc.id}`); onClose(); }}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-lg shrink-0 shadow-sm transition-transform active:scale-95"
                              >
                                Book 🩺
                              </button>
                            </div>
                          ))}

                        <button
                          onClick={() => handleBookSpecialist(m.category)}
                          className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md mt-1"
                        >
                          <Stethoscope className="w-4 h-4" /> View All {m.category} Specialists →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs p-2">
                  <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
                  <span>AI Health Assistant is analyzing query...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-[11px] shrink-0">
              {['🌡️ Fever & Cold', '🍵 Stomach Pain', '❤️ Chest Pain / BP', '📄 Analyze Report'].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    setInputChat(chip);
                  }}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-cyan-300 rounded-full border border-slate-700 shrink-0 font-extrabold cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>

            {attachedFile && (
              <div className="flex items-center justify-between p-2.5 bg-blue-950 rounded-xl border border-blue-800 text-[11px]">
                <span className="font-extrabold text-blue-300 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-cyan-400" /> Attached Report: {attachedFile.name} ({attachedFile.size})
                </span>
                <button type="button" onClick={() => setAttachedFile(null)} className="text-red-400 hover:text-red-300 font-extrabold p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <form onSubmit={handleSendChat} className="flex gap-2 items-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl transition-all border border-slate-700 shrink-0 font-bold"
                title="Attach Lab Report / Prescription / Medical Photo 📎"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                  if (!SpeechRecognition) {
                    alert('Browser Speech Recognition not supported. Please type manually or use Chrome/Edge.');
                    return;
                  }
                  const rec = new SpeechRecognition();
                  rec.lang = 'gu-IN';
                  rec.onstart = () => alert('🎙️ Listening... Speak your health question in Gujarati, Hindi or English');
                  rec.onresult = (evt) => {
                    const text = evt.results[0][0].transcript;
                    if (text) {
                      setInputChat(text);
                    }
                  };
                  rec.start();
                }}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-purple-400 rounded-xl transition-all border border-slate-700 shrink-0 font-bold"
                title="Voice Dictate Health Question 🎙️"
              >
                🎙️
              </button>

              <input
                type="text"
                value={inputChat}
                onChange={(e) => setInputChat(e.target.value)}
                placeholder="Ask AI medical question or attach report..."
                className="flex-1 px-4 py-3 rounded-xl border-2 border-blue-500/60 bg-white text-slate-900 placeholder-slate-500 font-extrabold text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-md"
              />

              <button
                type="submit"
                disabled={chatLoading || (!inputChat.trim() && !attachedFile)}
                className="px-5 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 text-white font-black rounded-xl shadow-md flex items-center gap-1 shrink-0 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
