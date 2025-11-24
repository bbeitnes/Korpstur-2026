import React, { useState, useMemo, useEffect } from 'react';
import { Search, Music, Bus, MapPin, Phone, Shirt, Info, ChevronDown, ChevronUp, Calendar, AlertCircle, Plane } from 'lucide-react';

// --- KONFIGURASJON ---

// 1. Lag et Google Sheet (se oppskrift under).
// 2. Publiser det til nettet som CSV.
// 3. Lim inn lenken her mellom hermetegnene.
// Hvis denne er tom (''), brukes test-dataen lenger ned.
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTEiz6lnSo33ak5q90gZflUaxzef9_B_cF5dkXkqQoafpuy4Cyd6aaBaX8bfvKiuRVGY08usZeOV3II/pub?output=csv'; 

// --- RESERVE-DATA (Brukes hvis Google Sheet ikke er koblet til ennå) ---
const INITIAL_DATA = [
  {
    id: 1,
    category: 'Reise',
    question: 'Eksempel: Når går bussen? (Data fra kode)',
    answer: 'Dette er testdata. Koble til Google Sheets for å vise din egen info!',
    keywords: 'buss test'
  },
  {
    id: 2,
    category: 'Pakkeliste',
    question: 'Hvordan legger jeg inn min egen info?',
    answer: 'Se instruksjonene som fulgte med denne appen for å koble til et regneark.',
    keywords: 'hjelp info'
  }
];

// --- HJELPEFUNKSJON FOR Å LESE CSV (Komma-separert fil) ---
const parseCSV = (text) => {
  const rows = text.split('\n').map(row => row.trim()).filter(row => row.length > 0);
  const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
  
  return rows.slice(1).map((row, index) => {
    // Denne regex-en splitter på komma, men ignorerer komma inne i hermetegn (f.eks "Hei, her er jeg")
    const values = row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
    
    const entry = {};
    headers.forEach((header, i) => {
      // Fjern hermetegn rundt teksten hvis det finnes
      let value = values[i] ? values[i].trim() : '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      // Bytt ut doble hermetegn med enkle
      value = value.replace(/""/g, '"');
      entry[header] = value;
    });
    
    // Legg til ID og fallback hvis noe mangler
    return {
      id: index + 100, // Start ID høyt for å unngå krasj
      category: entry.category || 'Info',
      question: entry.question || 'Spørsmål mangler',
      answer: entry.answer || 'Svar mangler',
      keywords: entry.keywords || ''
    };
  });
};

// --- APP KOMPONENTER ---

const InfoCard = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getIcon = (cat) => {
    // Normaliser kategori til små bokstaver for sammenligning
    const c = cat?.toLowerCase() || '';
    if (c.includes('reise') || c.includes('buss')) return <Bus className="w-5 h-5 text-blue-500" />;
    if (c.includes('fly')) return <Plane className="w-5 h-5 text-sky-500" />;
    if (c.includes('overnatting') || c.includes('hotell')) return <MapPin className="w-5 h-5 text-red-500" />;
    if (c.includes('pakke') || c.includes('uniform')) return <Shirt className="w-5 h-5 text-purple-500" />;
    if (c.includes('kontakt') || c.includes('nød')) return <Phone className="w-5 h-5 text-green-500" />;
    if (c.includes('program') || c.includes('spille')) return <Calendar className="w-5 h-5 text-orange-500" />;
    return <Info className="w-5 h-5 text-gray-500" />;
  };

  return (
    <div 
      className="bg-white mb-3 rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer transition-all hover:shadow-md"
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gray-50 p-2 rounded-full">
            {getIcon(item.category)}
          </div>
          <h3 className="font-semibold text-gray-800 text-sm sm:text-base pr-2">{item.question}</h3>
        </div>
        {isOpen ? <ChevronUp className="text-gray-400 w-5 h-5 flex-shrink-0" /> : <ChevronDown className="text-gray-400 w-5 h-5 flex-shrink-0" />}
      </div>
      
      {isOpen && (
        <div className="bg-blue-50 px-4 py-4 border-t border-blue-100 text-gray-700 text-sm leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
          {item.answer}
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Alle');
  const [data, setData] = useState(INITIAL_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Last inn data fra Google Sheets når appen starter
  useEffect(() => {
    if (GOOGLE_SHEET_CSV_URL) {
      setLoading(true);
      fetch(GOOGLE_SHEET_CSV_URL)
        .then(response => response.text())
        .then(csvText => {
          const parsedData = parseCSV(csvText);
          if (parsedData.length > 0) {
            setData(parsedData);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error("Kunne ikke laste regneark:", err);
          setError("Kunne ikke hente oppdatert info. Viser lagret info.");
          setLoading(false);
        });
    }
  }, []);

  // Hent ut unike kategorier fra dataen
  const categories = ['Alle', ...new Set(data.map(item => item.category))];

  // Filtrer data basert på søk og kategori
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = 
        (item.question?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
        (item.answer?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.keywords?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'Alle' || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory, data]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-10">
      
      {/* Header */}
      <div className="bg-indigo-900 text-white pt-8 pb-12 px-6 rounded-b-[2.5rem] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 transform rotate-12">
          <Music size={120} />
        </div>
        
        <div className="max-w-md mx-auto relative z-10 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-full mb-4 backdrop-blur-sm border border-white/20">
            <Music className="text-yellow-400 w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Korpstur 2024</h1>
          <p className="text-indigo-200 text-sm">Alt du lurer på, samlet på ett sted.</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-6 relative z-20">
        
        {/* Statusmeldinger (Laster / Feil) */}
        {loading && (
          <div className="bg-yellow-50 text-yellow-800 p-3 rounded-xl mb-4 text-sm text-center shadow-sm border border-yellow-100">
            Henter oppdatert info fra styret...
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 text-red-800 p-3 rounded-xl mb-4 text-sm flex items-center gap-2 border border-red-100">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Søkefelt */}
        <div className="bg-white p-2 rounded-2xl shadow-lg border border-gray-100 flex items-center mb-6">
          <Search className="text-gray-400 ml-3 w-5 h-5" />
          <input 
            type="text"
            placeholder="Søk etter buss, uniform, mat..."
            className="w-full p-3 outline-none text-gray-700 placeholder-gray-400 bg-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Kategori-knapper */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-2">
          {categories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {cat || 'Annet'}
            </button>
          ))}
        </div>

        {/* Resultatliste */}
        <div className="space-y-1">
          {filteredData.length > 0 ? (
            filteredData.map(item => (
              <InfoCard key={item.id} item={item} />
            ))
          ) : (
            <div className="text-center py-10 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
              <p>Fant ingen svar på det...</p>
              <p className="text-xs mt-1">Prøv et annet søkeord eller velg 'Alle'.</p>
            </div>
          )}
        </div>
        
        {/* Footer info */}
        <div className="text-center mt-10 text-gray-400 text-xs">
          <p>© Skolekorpset</p>
          <p>Trenger du akutt hjelp? Se "Kontakt"-fanen.</p>
        </div>

      </div>
    </div>
  );
}
