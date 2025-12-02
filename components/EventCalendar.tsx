
import React, { useState } from 'react';
import { Calendar, ArrowLeft, UploadCloud, Tag, Globe, MapPin } from 'lucide-react';

interface EventCalendarProps {
  onBack?: () => void;
}

interface EventItem {
  date: string;
  name: string;
}

interface MonthData {
  month: string;
  focus: string;
  events: EventItem[];
  submissionDeadlines: string[];
  keywords: string[];
  
  // Indian Context
  indianFocus?: string;
  indianEvents?: EventItem[];
  indianDeadlines?: string[];
  indianKeywords?: string[];
}

const calendarData: MonthData[] = [
  {
    month: "January",
    focus: "Spring Prep & Fitness",
    events: [
      { date: "Jan 01", name: "New Year's Day" },
      { date: "Jan 15", name: "Blue Monday" },
      { date: "Jan 29", name: "Tax Season Prep" }
    ],
    submissionDeadlines: ["Easter", "Spring Break", "Earth Day", "Mother's Day"],
    keywords: ["fitness", "gym", "healthy food", "taxes", "spring flowers", "gardening", "cleaning"],
    
    indianFocus: "Patriotism & Harvest",
    indianEvents: [
      { date: "Jan 13", name: "Lohri" },
      { date: "Jan 14", name: "Makar Sankranti / Pongal" },
      { date: "Jan 26", name: "Republic Day" }
    ],
    indianDeadlines: ["Holi", "Wedding Season", "Summer Vacation"],
    indianKeywords: ["tricolor", "india flag", "kite flying", "bonfire", "sugarcane", "harvest", "rangoli"]
  },
  {
    month: "February",
    focus: "Love & Spring",
    events: [
      { date: "Feb 09", name: "Super Bowl" },
      { date: "Feb 14", name: "Valentine's Day" },
      { date: "Feb 20", name: "Family Day (CA)" }
    ],
    submissionDeadlines: ["Father's Day", "Graduation", "Summer Vacation", "Wedding Season"],
    keywords: ["love", "romance", "couple", "graduation", "diploma", "beach", "summer travel"],

    indianFocus: "Spring & Weddings",
    indianEvents: [
      { date: "Feb 02", name: "Vasant Panchami" },
      { date: "Feb 26", name: "Maha Shivaratri" }
    ],
    indianDeadlines: ["Raksha Bandhan", "Independence Day"],
    indianKeywords: ["yellow dress", "mustard fields", "wedding couple", "mandap", "shiva", "temple", "flowers"]
  },
  {
    month: "March",
    focus: "Outdoors & Green",
    events: [
      { date: "Mar 08", name: "Intl. Women's Day" },
      { date: "Mar 17", name: "St. Patrick's Day" },
      { date: "Mar 20", name: "First Day of Spring" }
    ],
    submissionDeadlines: ["4th of July", "Back to School", "Pride Month"],
    keywords: ["green", "clover", "easter eggs", "spring cleaning", "bbq", "grilling", "rainbow flag"],

    indianFocus: "Colors of Spring",
    indianEvents: [
      { date: "Mar 14", name: "Holi" },
      { date: "Mar 30", name: "Chaitra Navratri" }
    ],
    indianDeadlines: ["Ganesh Chaturthi", "Onam"],
    indianKeywords: ["gulal", "colors", "pichkari", "water fight", "indian sweets", "thandai", "worship"]
  },
  {
    month: "April",
    focus: "Eco & Taxes",
    events: [
      { date: "Apr 15", name: "Tax Day (USA)" },
      { date: "Apr 20", name: "Easter Sunday" },
      { date: "Apr 22", name: "Earth Day" }
    ],
    submissionDeadlines: ["Back to School", "Autumn/Fall", "Halloween"],
    keywords: ["recycle", "planet", "planting", "education", "classroom", "autumn leaves", "pumpkin"],

    indianFocus: "Harvest & New Year",
    indianEvents: [
      { date: "Apr 06", name: "Rama Navami" },
      { date: "Apr 10", name: "Mahavir Jayanti" },
      { date: "Apr 13", name: "Baisakhi / Puthandu" }
    ],
    indianDeadlines: ["Diwali", "Dussehra"],
    indianKeywords: ["wheat harvest", "bhangra", "turban", "new year", "temple", "prayer", "golden temple"]
  },
  {
    month: "May",
    focus: "Graduation & Moms",
    events: [
      { date: "May 05", name: "Cinco de Mayo" },
      { date: "May 11", name: "Mother's Day" },
      { date: "May 26", name: "Memorial Day" }
    ],
    submissionDeadlines: ["Halloween", "Thanksgiving", "Black Friday"],
    keywords: ["mom", "family", "cap and gown", "halloween costume", "spooky", "turkey", "shopping"],

    indianFocus: "Summer Vacation",
    indianEvents: [
      { date: "May 12", name: "Buddha Purnima" },
      { date: "May --", name: "Summer Holidays" }
    ],
    indianDeadlines: ["Wedding Season (Winter)", "Diwali"],
    indianKeywords: ["mangoes", "hill station", "train travel", "ice cream", "heat wave", "summer camp", "meditation"]
  },
  {
    month: "June",
    focus: "Summer & Pride",
    events: [
      { date: "Jun 15", name: "Father's Day" },
      { date: "Jun 19", name: "Juneteenth" },
      { date: "Jun 21", name: "Summer Solstice" }
    ],
    submissionDeadlines: ["Christmas", "Hanukkah", "New Year's Eve", "Winter"],
    keywords: ["dad", "grill", "pride parade", "christmas tree", "santa", "winter wonderland", "snow"],

    indianFocus: "Wellness & Monsoon",
    indianEvents: [
      { date: "Jun 21", name: "Intl. Yoga Day" },
      { date: "Jun 27", name: "Rath Yatra" }
    ],
    indianDeadlines: ["New Year", "Christmas"],
    indianKeywords: ["yoga pose", "meditation", "monsoon clouds", "rain", "umbrella", "chariot", "jagannath"]
  },
  {
    month: "July",
    focus: "Patriotism & Vacation",
    events: [
      { date: "Jul 01", name: "Canada Day" },
      { date: "Jul 04", name: "Independence Day (USA)" },
      { date: "Jul 26", name: "Summer Peak" }
    ],
    submissionDeadlines: ["Valentine's Day", "Winter Sales"],
    keywords: ["fireworks", "picnic", "champagne", "party", "confetti", "skiing", "snowboard"],

    indianFocus: "Monsoon Festivals",
    indianEvents: [
      { date: "Jul 01", name: "Doctors' Day (India)" },
      { date: "Jul 10", name: "Guru Purnima" }
    ],
    indianDeadlines: ["Republic Day", "Holi"],
    indianKeywords: ["doctor", "stethoscope", "rainy street", "chai", "pakora", "teacher", "guru"]
  },
  {
    month: "August",
    focus: "Back to School",
    events: [
      { date: "Aug 01", name: "Back to School" },
      { date: "Aug 12", name: "Intl. Youth Day" },
      { date: "Aug 25", name: "End of Summer" }
    ],
    submissionDeadlines: ["Spring", "Easter", "Tax Season"],
    keywords: ["backpack", "school bus", "student", "learning", "finance", "accounting", "growth"],

    indianFocus: "Freedom & Sibling Love",
    indianEvents: [
      { date: "Aug 09", name: "Raksha Bandhan" },
      { date: "Aug 15", name: "Independence Day" },
      { date: "Aug 16", name: "Janmashtami" }
    ],
    indianDeadlines: ["Spring", "Wedding Season"],
    indianKeywords: ["rakhi", "brother sister", "indian flag", "parade", "dahi handi", "krishna", "sweets"]
  },
  {
    month: "September",
    focus: "Fall Business",
    events: [
      { date: "Sep 01", name: "Labor Day" },
      { date: "Sep 22", name: "First Day of Autumn" },
      { date: "Sep 27", name: "World Tourism Day" }
    ],
    submissionDeadlines: ["Summer", "Wedding Season"],
    keywords: ["falling leaves", "cozy", "sweater weather", "business meeting", "office", "strategy"],

    indianFocus: "Devotion & Harvest",
    indianEvents: [
      { date: "Sep 05", name: "Teachers' Day" },
      { date: "Sep 08", name: "Onam" },
      { date: "Aug/Sep", name: "Ganesh Chaturthi" }
    ],
    indianDeadlines: ["Summer Travel", "Back to School"],
    indianKeywords: ["ganpati", "idol immersion", "sadhya", "flower rangoli", "kerala boat race", "saree", "classroom"]
  },
  {
    month: "October",
    focus: "Spooky & Harvest",
    events: [
      { date: "Oct 13", name: "Thanksgiving (CA)" },
      { date: "Oct 24", name: "UN Day" },
      { date: "Oct 31", name: "Halloween" }
    ],
    submissionDeadlines: ["Back to School"],
    keywords: ["ghost", "trick or treat", "pink ribbon", "harvest", "corn", "thanksgiving dinner"],

    indianFocus: "Grand Festivals",
    indianEvents: [
      { date: "Oct 02", name: "Gandhi Jayanti" },
      { date: "Oct 02", name: "Dussehra" },
      { date: "Oct 20", name: "Diwali (Dates vary)" }
    ],
    indianDeadlines: ["Independence Day", "Raksha Bandhan"],
    indianKeywords: ["diwali lights", "diya", "rangoli", "crackers", "ravan effigy", "sweets", "family puja"]
  },
  {
    month: "November",
    focus: "Gratitude & Shopping",
    events: [
      { date: "Nov 11", name: "Veterans Day" },
      { date: "Nov 27", name: "Thanksgiving (USA)" },
      { date: "Nov 28", name: "Black Friday" }
    ],
    submissionDeadlines: ["Halloween"],
    keywords: ["sale", "discount", "ecommerce", "family dinner", "gratitude", "shopping cart"],

    indianFocus: "Post-Festive & Weddings",
    indianEvents: [
      { date: "Nov 05", name: "Guru Nanak Jayanti" },
      { date: "Nov 14", name: "Children's Day" },
      { date: "Nov --", name: "Chhath Puja" }
    ],
    indianDeadlines: ["Diwali", "Dussehra"],
    indianKeywords: ["wedding season", "bride groom", "jewelry", "mehndi", "sikh turban", "river puja", "sunset"]
  },
  {
    month: "December",
    focus: "Festive & Review",
    events: [
      { date: "Dec 24", name: "Christmas Eve" },
      { date: "Dec 25", name: "Christmas Day" },
      { date: "Dec 31", name: "New Year's Eve" }
    ],
    submissionDeadlines: ["Christmas"],
    keywords: ["presents", "gift", "celebration", "fireworks", "goals", "planning", "calendar"],

    indianFocus: "Winter & Year End",
    indianEvents: [
      { date: "Dec 04", name: "Navy Day" },
      { date: "Dec 25", name: "Christmas" },
      { date: "Dec --", name: "Peak Wedding Season" }
    ],
    indianDeadlines: ["Republic Day", "Holi"],
    indianKeywords: ["party", "cake", "church", "wedding reception", "winter wear", "bonfire", "fog"]
  }
];

export const EventCalendar: React.FC<EventCalendarProps> = ({ onBack }) => {
  const [region, setRegion] = useState<'Global' | 'India'>('Global');

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {onBack && (
        <button 
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-indigo-500 transition-colors font-medium"
        >
          <ArrowLeft size={16} /> Back to Metadata
        </button>
      )}

      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400">
          Stock Photography Event Calendar
        </h2>
        <p className="max-w-2xl mx-auto text-slate-600 dark:text-slate-400 text-lg mb-6">
          Plan your shoots and uploads ahead of time. Stock agencies typically recommend uploading content 2-3 months before the actual event.
        </p>

        {/* Region Toggle */}
        <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
           <button
              onClick={() => setRegion('Global')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                 region === 'Global' 
                 ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                 : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
           >
              <Globe size={16} /> Global / US
           </button>
           <button
              onClick={() => setRegion('India')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                 region === 'India' 
                 ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm' 
                 : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
           >
              <MapPin size={16} /> India
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {calendarData.map((data, index) => {
          const isIndia = region === 'India';
          const events = isIndia && data.indianEvents ? data.indianEvents : data.events;
          const focus = isIndia && data.indianFocus ? data.indianFocus : data.focus;
          const deadlines = isIndia && data.indianDeadlines ? data.indianDeadlines : data.submissionDeadlines;
          const keywords = isIndia && data.indianKeywords ? data.indianKeywords : data.keywords;
          
          // Theme color based on region
          const focusColor = isIndia 
             ? 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' 
             : 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20';

          return (
            <div 
              key={index} 
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col"
            >
              {/* Header */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">{data.month}</h3>
                <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded ${focusColor}`}>
                  {focus}
                </span>
              </div>

              <div className="p-5 flex-1 flex flex-col gap-4">
                
                {/* Events Section */}
                <div>
                  <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <Calendar size={12} />
                    {region} Events
                  </div>
                  <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-2">
                    {events.map((event, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className={`shrink-0 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            isIndia 
                            ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 border-orange-100 dark:border-orange-800'
                            : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800'
                        }`}>
                          {event.date}
                        </span>
                        <span className="truncate" title={event.name}>{event.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Upload Deadline Section */}
                <div className={`p-3 rounded-lg border ${
                    isIndia 
                    ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30'
                    : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30'
                }`}>
                  <div className={`flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider ${
                      isIndia ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    <UploadCloud size={12} />
                    Shoot & Upload For:
                  </div>
                  <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
                    {deadlines.map((deadline, i) => (
                      <li key={i} className="flex items-start gap-2 font-medium">
                        <span className={`block mt-1.5 w-1 h-1 rounded-full flex-shrink-0 ${
                            isIndia ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}></span>
                        {deadline}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Keywords Section */}
                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-2 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <Tag size={12} />
                    {region} Keywords
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {keywords.map((kw, i) => (
                      <span 
                        key={i} 
                        className="text-[10px] px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-12 text-center text-sm text-slate-500 dark:text-slate-400 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
         <p>
           <strong>Pro Tip:</strong> {region === 'India' 
             ? "For Indian festivals like Diwali and Holi, content starts selling 1-2 months in advance locally, but upload 3 months early for global buyers." 
             : "Stock agencies typically require 2-3 months for review and indexing. To maximize sales, upload content related to holidays at least 3 months in advance."}
         </p>
      </div>
    </div>
  );
};
