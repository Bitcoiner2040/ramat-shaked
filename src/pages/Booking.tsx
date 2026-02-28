import React, { useState, useEffect } from 'react';
import { format, addDays, isSameDay, getDay, setHours, setMinutes, isBefore, startOfToday } from 'date-fns';
import { he } from 'date-fns/locale';
import { Calendar, Clock, Check, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const SERVICES = [
  { id: 'external', name: 'שטיפה חיצונית', price: 45, duration: 20, description: 'שטיפה ידנית, חומרים איכותיים, מיקרופייבר' },
  { id: 'internal', name: 'ניקוי פנימי', price: 45, duration: 20, description: 'שאיבה, פלסטיקה, חלונות, שטיחים, דשבורד' },
  { id: 'full', name: 'שטיפה מלאה (פנימי + חיצוני)', price: 70, duration: 45, description: 'החבילה המשתלמת ביותר' },
];

export default function Booking() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, userData } = useAuth();

  useEffect(() => {
    if (!user) navigate('/login');
    fetchAppointmentsAndBlocked();
  }, [user]);

  const fetchAppointmentsAndBlocked = async () => {
    try {
      // Fetch appointments
      const qApps = query(collection(db, 'appointments'), where('status', '!=', 'cancelled'));
      const appsSnap = await getDocs(qApps);
      setAppointments(appsSnap.docs.map(d => d.data()));

      // Fetch blocked slots
      const qBlocked = query(collection(db, 'blocked_slots'));
      const blockedSnap = await getDocs(qBlocked);
      setBlockedSlots(blockedSnap.docs.map(d => d.data()));
    } catch (err) {
      console.error(err);
    }
  };

  const generateDates = () => {
    const dates = [];
    const today = startOfToday();
    for (let i = 0; i < 14; i++) {
      const date = addDays(today, i);
      const dayOfWeek = getDay(date);
      if (dayOfWeek !== 6) { // Skip Saturday
        dates.push(date);
      }
    }
    return dates;
  };

  const generateTimeSlots = (date: Date) => {
    const dayOfWeek = getDay(date);
    const slots = [];
    let startHour, endHour, startMinute = 0;

    if (dayOfWeek === 5) { // Friday: 12:30 - 16:00
      startHour = 12;
      startMinute = 30;
      endHour = 16;
    } else { // Sun-Thu: 18:00 - 21:00
      startHour = 18;
      endHour = 21;
    }

    let current = setMinutes(setHours(date, startHour), startMinute);
    const end = setHours(date, endHour);

    while (isBefore(current, end)) {
      const timeString = format(current, 'HH:mm');
      slots.push(timeString);
      current = setMinutes(current, current.getMinutes() + 30); // 30 min intervals
    }
    return slots;
  };

  const isSlotAvailable = (date: Date, time: string) => {
    const dateString = format(date, 'yyyy-MM-dd');
    
    // Check blocked slots
    const isBlocked = blockedSlots.some(slot => 
      slot.date === dateString && (!slot.time || slot.time === time)
    );
    if (isBlocked) return false;

    // Check existing appointments
    const isTaken = appointments.some(app => 
      app.date === dateString && app.time === time
    );
    
    return !isTaken;
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime || !selectedService || !user) return;
    setLoading(true);
    setError('');

    const service = SERVICES.find(s => s.id === selectedService);
    
    try {
      // Double check availability (race condition check would be better with transaction)
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      if (!isSlotAvailable(selectedDate, selectedTime)) {
        throw new Error('Slot already taken');
      }

      await addDoc(collection(db, 'appointments'), {
        userId: user.uid,
        userName: userData?.name || user.displayName,
        userPhone: user.phoneNumber || 'N/A', // Google Auth might not have phone
        serviceType: selectedService,
        date: dateString,
        time: selectedTime,
        price: service?.price,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-cyan-800 mb-8 text-center">הזמנת תור חדש</h1>
      
      {/* Step 1: Select Service */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span className="bg-cyan-100 text-cyan-800 w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
          בחר שירות
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SERVICES.map(service => (
            <div 
              key={service.id}
              onClick={() => setSelectedService(service.id)}
              className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                selectedService === service.id 
                  ? 'border-cyan-600 bg-cyan-50 shadow-md' 
                  : 'border-slate-200 hover:border-cyan-300'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg">{service.name}</h3>
                {selectedService === service.id && <Check className="text-cyan-600 h-5 w-5" />}
              </div>
              <p className="text-slate-500 text-sm mb-3">{service.description}</p>
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-cyan-700">{service.price} ₪</span>
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {service.duration} דק'
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step 2: Select Date */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span className="bg-cyan-100 text-cyan-800 w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
          בחר תאריך
        </h2>
        <div className="flex overflow-x-auto pb-4 gap-3 scrollbar-hide">
          {generateDates().map(date => (
            <div
              key={date.toString()}
              onClick={() => { setSelectedDate(date); setSelectedTime(null); }}
              className={`flex-shrink-0 w-24 p-3 rounded-xl border-2 text-center cursor-pointer transition-all ${
                selectedDate && isSameDay(selectedDate, date)
                  ? 'border-cyan-600 bg-cyan-600 text-white shadow-md'
                  : 'border-slate-200 hover:border-cyan-300 bg-white'
              }`}
            >
              <div className="text-sm font-medium mb-1">{format(date, 'EEEE', { locale: he })}</div>
              <div className="text-2xl font-bold">{format(date, 'd')}</div>
              <div className="text-xs opacity-80">{format(date, 'MMM', { locale: he })}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Step 3: Select Time */}
      {selectedDate && (
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="bg-cyan-100 text-cyan-800 w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
            בחר שעה
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {generateTimeSlots(selectedDate).map(time => {
              const available = isSlotAvailable(selectedDate, time);
              return (
                <button
                  key={time}
                  disabled={!available}
                  onClick={() => setSelectedTime(time)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                    !available 
                      ? 'bg-slate-100 text-slate-400 border-slate-100 cursor-not-allowed decoration-slice'
                      : selectedTime === time
                        ? 'bg-cyan-600 text-white border-cyan-600 shadow-md'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-cyan-400 hover:text-cyan-700'
                  }`}
                >
                  {time}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2 mb-6">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleBooking}
        disabled={!selectedDate || !selectedTime || !selectedService || loading}
        className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
          !selectedDate || !selectedTime || !selectedService || loading
            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
            : 'bg-cyan-600 text-white hover:bg-cyan-700 hover:shadow-xl transform hover:-translate-y-0.5'
        }`}
      >
        {loading ? 'מבצע הזמנה...' : 'אשר הזמנה'}
      </button>
    </div>
  );
}
