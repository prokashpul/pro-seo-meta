
import React, { useState } from 'react';
import { Calendar, ArrowLeft, UploadCloud, Tag, Globe, MapPin, Info } from 'lucide-react';

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
    focus: "New Year & Health",
    events: [
      { date: "Jan 01", name: "New Year's Day" },
      { date: "Jan 20", name: "Martin Luther King Jr. Day" },
      { date: "Jan 29", name: "Lunar New Year (Year of the Snake)" }
    ],
    submissionDeadlines: ["Easter Sunday", "Earth Day", "Mother's Day", "Spring Outdoors"],
    keywords: ["fitness", "resolutions", "detox", "healthy eating", "organization", "spring flowers", "gardening"],
    
    indianFocus: "Harvest & Unity",
    indianEvents: [
      { date: "Jan 13", name: "Lohri" },
      { date: "Jan 14", name: "Makar Sankranti / Pongal" },
      { date: "Jan 26", name: "Republic Day" },
      { date: "Jan 30", name: "Vasant Panchami" }
    ],
    indianDeadlines: ["Holi Festival", "Summer Travel", "Wedding Season Peak"],
    indianKeywords: ["tricolor", "patriotic", "kites", "harvest", "sesame sweets", "yellow clothes", "bonfire"]
  },
  {
    month: "February",
    focus: "Love & Inclusion",
    events: [
      { date: "Feb 01", name: "Black History Month Begins" },
      { date: "Feb 14", name: "Valentine's Day" },
      { date: "Feb 17", name: "Presidents' Day (USA)" }
    ],
    submissionDeadlines: ["Pride Month", "Father's Day", "Graduation Season", "Summer Vacation"],
    keywords: ["romance", "gift", "heart", "civil rights", "equality", "beach", "summer fashion", "travel"],

    indianFocus: "Spring & Devotion",
    indianEvents: [
      { date: "Feb 12", name: "Guru Ravidas Jayanti" },
      { date: "Feb 26", name: "Maha Shivaratri" },
      { date: "Feb --", name: "Spring Wedding Peak" }
    ],
    indianDeadlines: ["Baisakhi", "Akshaya Tritiya", "Eid-ul-Fitr (Early Bird)"],
    indianKeywords: ["shiva", "temple", "flowers", "marigold", "bridal jewelry", "ethnic wear", "spring fields"]
  },
  {
    month: "March",
    focus: "Renewal & Nature",
    events: [
      { date: "Mar 08", name: "Intl. Women's Day" },
      { date: "Mar 17", name: "St. Patrick's Day" },
      { date: "Mar 20", name: "Spring Equinox" },
      { date: "Mar 31", name: "Ramadan Begins (Approx)" }
    ],
    submissionDeadlines: ["4th of July", "Back to School (USA)", "Summer Festivals"],
    keywords: ["empowerment", "clover", "greenery", "fresh start", "outdoor activities", "hiking", "picnic"],

    indianFocus: "Color & Harvest",
    indianEvents: [
      { date: "Mar 14", name: "Holi" },
      { date: "Mar 20", name: "Chaitra Navratri Begins" },
      { date: "Mar 30", name: "Gudi Padwa / Ugadi" }
    ],
    indianDeadlines: ["Monsoon Season", "International Yoga Day"],
    indianKeywords: ["gulal", "colors", "pichkari", "thandai", "neem leaves", "traditional rituals", "village life"]
  },
  {
    month: "April",
    focus: "Environment & Faith",
    events: [
      { date: "Apr 15", name: "Tax Day (USA)" },
      { date: "Apr 20", name: "Easter Sunday" },
      { date: "Apr 22", name: "Earth Day" }
    ],
    submissionDeadlines: ["Autumn / Fall Foliage", "Halloween", "Winter Prep"],
    keywords: ["recycling", "sustainability", "bunny", "eggs", "finance", "accounting", "growth", "savings"],

    indianFocus: "Festive Harvest",
    indianEvents: [
      { date: "Apr 06", name: "Ram Navami" },
      { date: "Apr 13", name: "Baisakhi / Vishu / Puthandu" },
      { date: "Apr 14", name: "Ambedkar Jayanti" },
      { date: "Apr 20", name: "Akshaya Tritiya" }
    ],
    indianDeadlines: ["Independence Day", "Raksha Bandhan"],
    indianKeywords: ["gold jewelry", "new beginnings", "wheat fields", "bhangra", "turban", "temple visit", "puja thali"]
  },
  {
    month: "May",
    focus: "Family & Celebration",
    events: [
      { date: "May 05", name: "Cinco de Mayo" },
      { date: "May 11", name: "Mother's Day" },
      { date: "May 26", name: "Memorial Day" }
    ],
    submissionDeadlines: ["Black Friday", "Cyber Monday", "Thanksgiving", "Christmas Early Bird"],
    keywords: ["moms", "family brunch", "patriotism", "shopping", "holiday planning", "gift guide", "winter fashion"],

    indianFocus: "Summer Heat & Bliss",
    indianEvents: [
      { date: "May 12", name: "Buddha Purnima" },
      { date: "May --", name: "Summer Holidays Begin" },
      { date: "May --", name: "Mango Season Peak" }
    ],
    indianDeadlines: ["Ganesh Chaturthi", "Onam", "Teachers' Day"],
    indianKeywords: ["alphonso mango", "hill station", "swimming", "ice cream", "summer camp", "vacation", "train travel"]
  },
  {
    month: "June",
    focus: "Outdoors & Freedom",
    events: [
      { date: "Jun 08", name: "World Oceans Day" },
      { date: "Jun 15", name: "Father's Day" },
      { date: "Jun 19", name: "Juneteenth" },
      { date: "Jun 21", name: "Summer Solstice" }
    ],
    submissionDeadlines: ["Christmas Peak", "Hanukkah", "New Year's Eve 2026"],
    keywords: ["dads", "grilling", "beach cleanup", "diversity", "pride", "sunshine", "camping", "barbecue"],

    indianFocus: "Monsoon & Wellness",
    indianEvents: [
      { date: "Jun 07", name: "Eid-ul-Adha (Approx)" },
      { date: "Jun 21", name: "International Yoga Day" },
      { date: "Jun 27", name: "Rath Yatra" }
    ],
    indianDeadlines: ["Dussehra", "Navratri", "Diwali Early Bird"],
    indianKeywords: ["yoga asana", "meditation", "monsoon clouds", "rain", "umbrella", "chai", "jagannath", "chariot"]
  },
  {
    month: "July",
    focus: "Peak Summer",
    events: [
      { date: "Jul 01", name: "Canada Day" },
      { date: "Jul 04", name: "Independence Day (USA)" },
      { date: "Jul 17", name: "World Emoji Day" }
    ],
    submissionDeadlines: ["Valentine's Day 2026", "Super Bowl 2026", "Winter Sports"],
    keywords: ["fireworks", "picnic", "national pride", "digital communication", "travel", "vacation rental"],

    indianFocus: "Monsoon Magic",
    indianEvents: [
      { date: "Jul 10", name: "Guru Purnima" },
      { date: "Jul 17", name: "Muharram (Approx)" },
      { date: "Jul --", name: "Hariyali Teej" }
    ],
    indianDeadlines: ["Wedding Season Winter", "Diwali Peak"],
    indianKeywords: ["rainy day", "greenery", "swings", "mehndi", "teacher respect", "traditional sweets", "puddles"]
  },
  {
    month: "August",
    focus: "Education & Youth",
    events: [
      { date: "Aug 01", name: "Back to School Peak" },
      { date: "Aug 12", name: "International Youth Day" },
      { date: "Aug 19", name: "World Photography Day" }
    ],
    submissionDeadlines: ["Easter 2026", "Spring Break 2026", "Corporate Tax Season"],
    keywords: ["students", "learning", "classroom", "youth culture", "creativity", "spring prep", "office"],

    indianFocus: "Freedom & Bonds",
    indianEvents: [
      { date: "Aug 09", name: "Raksha Bandhan" },
      { date: "Aug 15", name: "Independence Day" },
      { date: "Aug 16", name: "Janmashtami" },
      { date: "Aug 27", name: "Ganesh Chaturthi" }
    ],
    indianDeadlines: ["Republic Day 2026", "Holi 2026"],
    indianKeywords: ["rakhi", "sister brother", "patriotic", "ganpati", "lord krishna", "indian flag", "festive decor"]
  },
  {
    month: "September",
    focus: "Professional Fall",
    events: [
      { date: "Sep 01", name: "Labor Day" },
      { date: "Sep 21", name: "International Day of Peace" },
      { date: "Sep 22", name: "Fall Equinox" }
    ],
    submissionDeadlines: ["Mother's Day 2026", "Summer 2026 Vacation"],
    keywords: ["autumn leaves", "cozy", "business strategy", "meeting", "peace", "harvest", "sweater weather"],

    indianFocus: "Devotion & Gratitude",
    indianEvents: [
      { date: "Sep 05", name: "Teachers' Day" },
      { date: "Sep 05", name: "Onam" },
      { date: "Sep 21", name: "Navratri Begins" }
    ],
    indianDeadlines: ["Summer Travel 2026", "IPL / Cricket Season"],
    indianKeywords: ["sadhya", "pookalam", "dandiya", "garba", "education", "respect", "ethnic fashion"]
  },
  {
    month: "October",
    focus: "Celebration & Color",
    events: [
      { date: "Oct 13", name: "Indigenous Peoples' Day" },
      { date: "Oct 24", name: "United Nations Day" },
      { date: "Oct 31", name: "Halloween" }
    ],
    submissionDeadlines: ["Graduation 2026", "Father's Day 2026"],
    keywords: ["pumpkin", "costume", "spooky", "fall harvest", "global unity", "thanksgiving prep"],

    indianFocus: "Festival of Lights",
    indianEvents: [
      { date: "Oct 02", name: "Gandhi Jayanti" },
      { date: "Oct 02", name: "Dussehra" },
      { date: "Oct 20", name: "Diwali" },
      { date: "Oct 22", name: "Bhai Dooj" }
    ],
    indianDeadlines: ["Independence Day 2026", "Monsoon 2026"],
    indianKeywords: ["diya", "crackers", "lights", "rangoli", "sweets", "ravan", "new clothes", "family gathering"]
  },
  {
    month: "November",
    focus: "Gratitude & Retail",
    events: [
      { date: "Nov 11", name: "Veterans Day" },
      { date: "Nov 27", name: "Thanksgiving (USA)" },
      { date: "Nov 28", name: "Black Friday" }
    ],
    submissionDeadlines: ["Back to School 2026", "Independence Day July"],
    keywords: ["ecommerce", "shopping", "discount", "family dinner", "gratitude", "turkey", "winter coats"],

    indianFocus: "Weddings & Devotion",
    indianEvents: [
      { date: "Nov 05", name: "Guru Nanak Jayanti" },
      { date: "Nov 14", name: "Children's Day" },
      { date: "Nov --", name: "Winter Wedding Season Starts" }
    ],
    indianDeadlines: ["Diwali 2026 Early Bird", "Spring Festivals"],
    indianKeywords: ["wedding mandap", "bride", "groom", "mehndi", "winter wear", "school kids", "gurudwara"]
  },
  {
    month: "December",
    focus: "Holiday Magic",
    events: [
      { date: "Dec 24", name: "Christmas Eve" },
      { date: "Dec 25", name: "Christmas Day" },
      { date: "Dec 31", name: "New Year's Eve" }
    ],
    submissionDeadlines: ["Easter 2026 Peak", "Spring Fashion 2026"],
    keywords: ["gifts", "snow", "celebration", "fireworks", "resolutions", "party", "winter solstice"],

    indianFocus: "Year-End Vibes",
    indianEvents: [
      { date: "Dec 04", name: "Navy Day" },
      { date: "Dec 25", name: "Christmas" },
      { date: "Dec --", name: "Major Music Festivals" }
    ],
    indianDeadlines: ["Republic Day 2026 Peak", "Holi 2026 Peak"],
    indianKeywords: ["winter sun", "fog", "party wear", "cake", "church", "bonfire", "picnic", "goat island"]
  }
];

export const EventCalendar: React.FC<EventCalendarProps> = ({ onBack }) => {
  const [region, setRegion] = useState<'Global' | 'India'>('Global');

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {onBack && (
        <button 
          onClick={onBack}
          className="mb-8 inline-flex items-center gap-2 text-base text-slate-400 hover:text-indigo-500 transition-colors font-medium"
        >
          <ArrowLeft size={18} /> Back to Metadata
        </button>
      )}

      <div className="text-center mb-10">
        <h2 className="text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400">
          Contributor Content Calendar
        </h2>
        <p className="max-w-3xl mx-auto text-slate-600 dark:text-slate-400 text-xl mb-8">
          Plan your shoots 3-4 months ahead. Stock buyers search for seasonal content long before the event occurs.
        </p>

        {/* Region Toggle */}
        <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
           <button
              onClick={() => setRegion('Global')}
              className={`flex items-center gap-2 px-8 py-2.5 rounded-lg text-base font-bold transition-all ${
                 region === 'Global' 
                 ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-100 dark:border-slate-600' 
                 : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
           >
              <Globe size={18} /> Global
           </button>
           <button
              onClick={() => setRegion('India')}
              className={`flex items-center gap-2 px-8 py-2.5 rounded-lg text-base font-bold transition-all ${
                 region === 'India' 
                 ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm border border-slate-100 dark:border-slate-600' 
                 : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
           >
              <MapPin size={18} /> India
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {calendarData.map((data, index) => {
          const isIndia = region === 'India';
          const events = isIndia && data.indianEvents ? data.indianEvents : data.events;
          const focus = isIndia && data.indianFocus ? data.indianFocus : data.focus;
          const deadlines = isIndia && data.indianDeadlines ? data.indianDeadlines : data.submissionDeadlines;
          const keywords = isIndia && data.indianKeywords ? data.indianKeywords : data.keywords;
          
          // Theme color based on region
          const focusColor = isIndia 
             ? 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800/50' 
             : 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800/50';

          return (
            <div 
              key={index} 
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col group"
            >
              {/* Header */}
              <div className="bg-slate-50 dark:bg-slate-950 p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center group-hover:bg-white dark:group-hover:bg-slate-900 transition-colors">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{data.month}</h3>
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${focusColor}`}>
                  {focus}
                </span>
              </div>

              <div className="p-6 flex-1 flex flex-col gap-6">
                
                {/* Events Section */}
                <div>
                  <div className="flex items-center gap-2 mb-4 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest">
                    <Calendar size={14} className="text-indigo-500" />
                    Key Dates
                  </div>
                  <ul className="text-base text-slate-700 dark:text-slate-300 space-y-3">
                    {events.map((event, i) => (
                      <li key={i} className="flex items-center gap-3 group/item">
                        <span className={`shrink-0 font-mono text-[10px] font-black px-2 py-1 rounded border shadow-sm ${
                            isIndia 
                            ? 'text-orange-600 dark:text-orange-400 bg-white dark:bg-orange-900/30 border-orange-200 dark:border-orange-800'
                            : 'text-blue-600 dark:text-blue-400 bg-white dark:bg-blue-900/30 border-blue-200 dark:border-blue-800'
                        }`}>
                          {event.date}
                        </span>
                        <span className="text-sm font-semibold truncate group-hover/item:text-indigo-500 transition-colors" title={event.name}>{event.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Upload Deadline Section */}
                <div className={`p-5 rounded-2xl border ${
                    isIndia 
                    ? 'bg-orange-50/50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-800/30'
                    : 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800/30'
                }`}>
                  <div className={`flex items-center gap-2 mb-3 text-[10px] font-black uppercase tracking-widest ${
                      isIndia ? 'text-orange-600' : 'text-indigo-600'
                  }`}>
                    <UploadCloud size={14} />
                    Submit Now For:
                  </div>
                  <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-2">
                    {deadlines.map((deadline, i) => (
                      <li key={i} className="flex items-center gap-2.5 font-bold">
                        <div className={`w-1.5 h-1.5 rounded-full ${isIndia ? 'bg-orange-400' : 'bg-indigo-400'}`} />
                        {deadline}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Keywords Section */}
                <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-3 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest">
                    <Tag size={14} />
                    High-Volume Keywords
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {keywords.map((kw, i) => (
                      <span 
                        key={i} 
                        className="text-[10px] font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded transition-colors hover:bg-slate-200 dark:hover:bg-slate-700"
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
      
      <div className="mt-16 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-10 max-w-5xl mx-auto shadow-xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/20 transition-all" />
         <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-20 h-20 rounded-3xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
               <Info size={40} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
               <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">The Golden Rule of Stock Timing</h4>
               <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
                 Agencies like <strong>Adobe Stock</strong> and <strong>Shutterstock</strong> take 1-2 weeks to review content, and another 2 weeks for search engines to index your keywords. 
                 <br/><br/>
                 To catch the "Peak Buyer Cycle", aim to have your files online exactly <strong>100 days before</strong> the event. This gives your content time to gain popularity points before buyers start downloading.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};
