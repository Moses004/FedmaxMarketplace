import React, { useState } from 'react';
import { Listing, User } from '../types';
import { X, Calendar, Clock, Video, MapPin, User as UserIcon, CheckCircle2, Download, Send, Sparkles, MessageSquare, ShieldCheck, Mail, Phone } from 'lucide-react';
import { formatCurrencyAmount, getListingPrices } from '../utils/currency';
import { motion } from 'motion/react';

interface ScheduleTourModalProps {
  listing: Listing;
  currentUser: User | null;
  onClose: () => void;
  onSuccess?: (tourData: any) => void;
  displayCurrency?: string;
}

export default function ScheduleTourModal({
  listing,
  currentUser,
  onClose,
  onSuccess,
  displayCurrency = 'regional'
}: ScheduleTourModalProps) {
  const [tourType, setTourType] = useState<'in_person' | 'video_tour'>('in_person');
  
  // Tomorrow's date default
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [tourDate, setTourDate] = useState<string>(defaultDateStr);
  const [timeSlot, setTimeSlot] = useState<string>('11:00 AM');
  const [guestCount, setGuestCount] = useState<number>(1);
  const [fullName, setFullName] = useState<string>(currentUser?.name || '');
  const [email, setEmail] = useState<string>(currentUser?.email || '');
  const [phone, setPhone] = useState<string>(currentUser?.phone || '');
  const [specialNote, setSpecialNote] = useState<string>('');
  
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [downloadedIcal, setDownloadedIcal] = useState<boolean>(false);

  const availableTimeSlots = [
    '09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:30 PM', '04:00 PM', '05:30 PM'
  ];

  // Helper to generate downloadable .ics calendar file
  const generateICSFile = () => {
    const [year, month, day] = tourDate.split('-').map(Number);
    // Parse time
    let hour = 11;
    let minute = 0;
    if (timeSlot) {
      const match = timeSlot.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (match) {
        hour = parseInt(match[1], 10);
        minute = parseInt(match[2], 10);
        if (match[3].toUpperCase() === 'PM' && hour < 12) hour += 12;
        if (match[3].toUpperCase() === 'AM' && hour === 12) hour = 0;
      }
    }

    const startDate = new Date(Date.UTC(year, month - 1, day, hour, minute));
    const endDate = new Date(startDate.getTime() + 45 * 60 * 1000); // 45 min tour

    const formatDateToICS = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const startICS = formatDateToICS(startDate);
    const endICS = formatDateToICS(endDate);

    const title = `[Rentora Tour] ${tourType === 'in_person' ? 'In-Person Viewing' : 'HD Video Tour'} - ${listing.title}`;
    const description = `Tour type: ${tourType === 'in_person' ? 'In-Person Property Walkthrough' : 'Interactive HD Video Live Tour'}\\nLocation: ${listing.location}\\nLister: ${listing.landlordName || 'Verified Rentora Lister'}\\nAttendee: ${fullName} (${email})\\nNote: ${specialNote || 'No special requests'}`;
    const locationStr = listing.location || 'Online Video Link';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Rentora Property Tours//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:tour-${Date.now()}@rentora.com`,
      `DTSTAMP:${formatDateToICS(new Date())}`,
      `DTSTART:${startICS}`,
      `DTEND:${endICS}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${locationStr}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT30M',
      'ACTION:DISPLAY',
      `DESCRIPTION:Reminder: Rentora Property Tour in 30 minutes`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `rentora-tour-${listing.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadedIcal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    
    // Auto trigger calendar download
    generateICSFile();

    if (onSuccess) {
      onSuccess({
        tourType,
        tourDate,
        timeSlot,
        guestCount,
        fullName,
        email,
        phone,
        specialNote,
        listingId: listing.id,
        listingTitle: listing.title
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.35, bounce: 0.05 }}
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto my-6 text-slate-900 dark:text-slate-100"
      >
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-5 sm:p-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-emerald-500/10 blur-2xl pointer-events-none" />
          
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
                <Calendar className="w-3.5 h-3.5" />
                <span>Instant Tour Booking</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Schedule a Property Tour
              </h3>
              <p className="text-xs text-slate-300">
                Book a private walkthrough for <span className="text-emerald-300 font-bold">{listing.title}</span>.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {isSubmitted ? (
          /* Confirmation Step */
          <div className="p-6 sm:p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800 shadow-sm animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h4 className="text-xl font-black text-slate-900 dark:text-white">
                Tour Reservation Confirmed!
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
                Your <span className="font-bold text-emerald-600 dark:text-emerald-400">{tourType === 'in_person' ? 'In-Person Viewing' : 'HD Video Tour'}</span> request for <span className="font-bold">{tourDate} at {timeSlot}</span> has been dispatched to the lister (<span className="font-bold">{listing.landlordName || 'Verified Lister'}</span>).
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3 text-left max-w-md mx-auto">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Calendar Invite & Reminder</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                An iCal calendar invite file was automatically generated. You can also re-download it below to add this appointment to Google Calendar, Apple Calendar, or Outlook.
              </p>

              <button
                type="button"
                onClick={generateICSFile}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{downloadedIcal ? 'iCal Calendar File Downloaded' : 'Download iCal Calendar Event (.ics)'}</span>
              </button>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-2xl transition-all cursor-pointer"
              >
                Return to Listing
              </button>
            </div>
          </div>
        ) : (
          /* Form Step */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">

            {/* Tour Format Selection */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Select Tour Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTourType('in_person')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left flex items-start gap-3 ${
                    tourType === 'in_person'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs">In-Person Viewing</h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                      Meet the lister at the property site for a guided walk.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTourType('video_tour')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left flex items-start gap-3 ${
                    tourType === 'video_tour'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 shrink-0">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs">HD Live Video Tour</h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                      Interactive live video walkthrough via WhatsApp / Google Meet.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Date and Time Slot Picker */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Preferred Date</span>
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={tourDate}
                  onChange={(e) => setTourDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Time Slot</span>
                </label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold text-xs"
                >
                  {availableTimeSlots.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Attendee Contact Information
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. sarah@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Phone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+234 803 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Guests Attending
                  </label>
                  <select
                    value={guestCount}
                    onChange={(e) => setGuestCount(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium text-xs"
                  >
                    <option value={1}>1 Person (Just me)</option>
                    <option value={2}>2 People</option>
                    <option value={3}>3 People</option>
                    <option value={4}>4+ People</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Note / Special Requests for Lister (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Interested in move-in next month, would like to see parking area as well."
                  value={specialNote}
                  onChange={(e) => setSpecialNote(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium text-xs resize-none"
                />
              </div>
            </div>

            {/* Action button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-extrabold text-xs rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Confirm Tour Booking & Download Calendar Invite (.ics)</span>
              </button>
            </div>
          </form>
        )}

      </motion.div>
    </div>
  );
}
