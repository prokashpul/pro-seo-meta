
import React from 'react';
import { Calendar, ArrowLeft, Camera, UploadCloud, Tag } from 'lucide-react';

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
}

const calendarData: MonthData[] = [
  {
    month: "January",
    focus: "Spring Prep & Fitness",
    events: [
      { date: "Jan 01", name: "New Year's Day" },
      { date: "Jan 15", name: "Blue Monday (Winter Moods)" },
      { date: "Jan 29", name: "Tax Season Prep Starts" }
    ],
    submissionDeadlines: ["Easter", "Spring Break", "Earth Day", "Mother's Day"],
    keywords: ["fitness", "gym", "healthy food", "taxes", "spring flowers", "gardening", "cleaning"]
  },
  {
    month: "February",
    focus: "Love & Spring",
    events: [
      { date: "Feb 09", name: "Super Bowl (approx)" },
      { date: "Feb 14", name: "Valentine's Day" },
      { date: "Feb 20", name: "Family Day (Canada)" }
    ],
    submissionDeadlines: ["Father's Day", "Graduation", "Summer Vacation", "Wedding Season"],
    keywords: ["love", "romance", "couple", "graduation", "diploma", "beach", "summer travel"]
  },
  {
    month: "March",
    focus: "Outdoors & Green",
    events: [
      { date: "Mar 08", name: "Intl. Women's Day" },
      { date: "Mar 17", name: "St. Patrick's Day" },
      { date: "Mar 20", name: "First Day of Spring" }
    ],
    submissionDeadlines: ["4th of July", "Back to School (Early)", "Pride Month"],
    keywords: ["green", "clover", "easter eggs", "spring cleaning", "bbq", "grilling", "rainbow flag"]
  },
  {
    month: "April",
    focus: "Eco & Taxes",
    events: [
      { date: "Apr 15", name: "Tax Day (USA)" },
      { date: "Apr 20", name: "Easter Sunday" },
      { date: "Apr 22", name: "Earth Day" }
    ],
    submissionDeadlines: ["Back to School", "Autumn/Fall", "Halloween (Early Concept)"],
    keywords: ["recycle", "planet", "planting", "education", "classroom", "autumn leaves", "pumpkin"]
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
    keywords: ["mom", "family", "cap and gown", "halloween costume", "spooky", "turkey", "shopping"]
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
    keywords: ["dad", "grill", "pride parade", "christmas tree", "santa", "winter wonderland", "snow"]
  },
  {
    month: "July",
    focus: "Patriotism & Vacation",
    events: [
      { date: "Jul 01", name: "Canada Day" },
      { date: "Jul 04", name: "Independence Day (USA)" },
      { date: "Jul 26", name: "Summer Peak Travel" }
    ],
    submissionDeadlines: ["Valentine's Day (Next Year)", "Winter Sales"],
    keywords: ["fireworks", "picnic", "champagne", "party", "confetti", "skiing", "snowboard"]
  },
  {
    month: "August",
    focus: "Back to School",
    events: [
      { date: "Aug 01", name: "Back to School Rush" },
      { date: "Aug 12", name: "Intl. Youth Day" },
      { date: "Aug 25", name: "End of Summer" }
    ],
    submissionDeadlines: ["Spring (Next Year)", "Easter (Next Year)", "Tax Season (Next Year)"],
    keywords: ["backpack", "school bus", "student", "learning", "finance", "accounting", "growth"]
  },
  {
    month: "September",
    focus: "Fall Business",
    events: [
      { date: "Sep 01", name: "Labor Day" },
      { date: "Sep 22", name: "First Day of Autumn" },
      { date: "Sep 27", name: "World Tourism Day" }
    ],
    submissionDeadlines: ["Summer (Next Year)", "Wedding Season (Next Year)"],
    keywords: ["falling leaves", "cozy", "sweater weather", "business meeting", "office", "strategy"]
  },
  {
    month: "October",
    focus: "Spooky & Harvest",
    events: [
      { date: "Oct 13", name: "Thanksgiving (Canada)" },
      { date: "Oct 24", name: "United Nations Day" },
      { date: "Oct 31", name: "Halloween" }
    ],
    submissionDeadlines: ["Back to School (Next Year)"],
    keywords: ["ghost", "trick or treat", "pink ribbon", "harvest", "corn", "thanksgiving dinner"]
  },
  {
    month: "November",
    focus: "Gratitude & Shopping",
    events: [
      { date: "Nov 11", name: "Veterans Day" },
      { date: "Nov 27", name: "Thanksgiving (USA)" },
      { date: "Nov 28", name: "Black Friday" }
    ],
    submissionDeadlines: ["Halloween (Next Year)"],
    keywords: ["sale", "discount", "ecommerce", "family dinner", "gratitude", "shopping cart"]
  },
  {
    month: "December",
    focus: "Festive & Review",
    events: [
      { date: "Dec 24", name: "Christmas Eve" },
      { date: "Dec 25", name: "Christmas Day" },
      { date: "Dec 31", name: "New Year's Eve" }
    ],
    submissionDeadlines: ["Christmas (Next Year)"],
    keywords: ["presents", "gift", "celebration", "fireworks", "goals", "planning", "calendar"]
  }
];

export const EventCalendar: React.FC<EventCalendarProps> = ({ onBack }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {onBack && (
        <button 
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-indigo-500 transition-colors font-medium"
        >
          <ArrowLeft size={16} /> Back to Home
        </button>
      )}

      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400">
          Stock Photography Event Calendar
        </h2>
        <p className="max-w-2xl mx-auto text-slate-600 dark:text-slate-400 text-lg mb-6">
          Plan your shoots and uploads ahead of time. Stock agencies typically recommend uploading content 2-3 months before the actual event.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {calendarData.map((data, index) => (
          <div 
            key={index} 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col"
          >
            {/* Header */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">{data.month}</h3>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded">
                {data.focus}
              </span>
            </div>

            <div className="p-5 flex-1 flex flex-col gap-4">
              
              {/* Events Section */}
              <div>
                <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <Calendar size={12} />
                  Current Events
                </div>
                <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-2">
                  {data.events.map((event, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="shrink-0 font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800">
                        {event.date}
                      </span>
                      <span className="truncate" title={event.name}>{event.name}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Upload Deadline Section (Crucial for Stock) */}
              <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-lg border border-amber-100 dark:border-amber-900/30">
                <div className="flex items-center gap-2 mb-2 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <UploadCloud size={12} />
                  Shoot & Upload Now For:
                </div>
                <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
                  {data.submissionDeadlines.map((deadline, i) => (
                    <li key={i} className="flex items-start gap-2 font-medium">
                      <span className="block mt-1.5 w-1 h-1 rounded-full bg-amber-500 flex-shrink-0"></span>
                      {deadline}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Keywords Section */}
              <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-2 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <Tag size={12} />
                  Trending Tags
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {data.keywords.map((kw, i) => (
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
        ))}
      </div>
      
      <div className="mt-12 text-center text-sm text-slate-500 dark:text-slate-400 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
         <p>
           <strong>Pro Tip:</strong> Stock agencies typically require 2-3 months for review and indexing. 
           To maximize sales, upload content related to holidays at least 3 months in advance.
         </p>
      </div>
    </div>
  );
};
