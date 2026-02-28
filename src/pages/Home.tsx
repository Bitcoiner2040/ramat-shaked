import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Car, Star, Calendar, ShieldCheck, MapPin, Clock, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [stamps, setStamps] = useState(0);
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchUserLoyalty(parsedUser.id);
      fetchUserAppointments(parsedUser.id);
    }
  }, []);

  const fetchUserLoyalty = async (id: number) => {
    try {
      const res = await fetch(`/api/users/${id}`);
      const data = await res.json();
      setStamps(data.loyalty_stamps);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserAppointments = async (id: number) => {
    try {
      const res = await fetch(`/api/appointments?user_id=${id}`);
      const data = await res.json();
      // Filter for upcoming or active appointments if needed, but API returns all.
      // Let's show all but highlight upcoming.
      setAppointments(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelAppointment = async (id: number) => {
    if (!confirm('האם אתה בטוח שברצונך לבטל את התור?')) return;
    try {
      const res = await fetch(`/api/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      if (res.ok) {
        fetchUserAppointments(user.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const renderLoyaltyCard = () => {
    const currentStamps = stamps % 5;
    const freeWashes = Math.floor(stamps / 5);

    return (
      <div className="bg-gradient-to-br from-cyan-900 to-blue-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-cyan-400 opacity-10 rounded-full blur-xl"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-2xl font-bold mb-1">כרטיס מועדון</h3>
              <p className="text-cyan-200 text-sm">שטיפת רכב רמת שקד</p>
            </div>
            <Car className="h-8 w-8 text-cyan-300 opacity-80" />
          </div>

          <div className="flex justify-between items-center gap-2 mb-6">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i} 
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                  i < currentStamps 
                    ? 'bg-cyan-400 border-cyan-400 text-cyan-900 shadow-[0_0_15px_rgba(34,211,238,0.5)]' 
                    : 'border-white/20 text-white/20 bg-white/5'
                }`}
              >
                <Star className={`h-6 w-6 ${i < currentStamps ? 'fill-current' : ''}`} />
              </div>
            ))}
          </div>

          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm text-cyan-200 mb-1">התקדמות להטבה הבאה</p>
              <div className="text-3xl font-bold font-mono">{currentStamps}/5</div>
            </div>
            {freeWashes > 0 && (
              <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold shadow-lg animate-pulse">
                {freeWashes} שטיפות חינם!
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative bg-cyan-700 text-white py-20 px-4 rounded-3xl overflow-hidden shadow-2xl mx-4 mt-4">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1601362840469-51e4d8d58785?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/90 to-blue-900/80"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
            הניקיון שרכבך ראוי לו
          </h1>
          <p className="text-xl md:text-2xl text-cyan-100 font-light max-w-2xl mx-auto leading-relaxed">
            שטיפה ידנית מקצועית, חומרים איכותיים ושירות ללא פשרות.
            הזמן תור עכשיו ותהנה מרכב מבריק.
          </p>
          <div className="pt-8">
            <Link 
              to={user ? "/booking" : "/login"}
              className="inline-flex items-center gap-2 bg-white text-cyan-900 hover:bg-cyan-50 font-bold py-4 px-8 rounded-full text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <Calendar className="h-5 w-5" />
              הזמן תור עכשיו
            </Link>
          </div>
        </div>
      </section>

      {/* Loyalty Section (if logged in) */}
      {user && (
        <section className="max-w-md mx-auto px-4 space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-center mb-6 text-slate-800">הסטטוס שלך</h2>
            {renderLoyaltyCard()}
          </div>

          {/* My Appointments */}
          <div>
            <h2 className="text-xl font-bold text-center mb-4 text-slate-800">התורים שלי</h2>
            {appointments.length === 0 ? (
              <p className="text-center text-slate-500">אין תורים עתידיים</p>
            ) : (
              <div className="space-y-3">
                {appointments.filter(app => app.status !== 'cancelled' && app.status !== 'completed').map(app => (
                  <div key={app.id} className="bg-white p-4 rounded-xl shadow border border-slate-100 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-cyan-800">
                        {format(parseISO(app.date), 'dd/MM/yyyy')} בשעה {app.time}
                      </div>
                      <div className="text-sm text-slate-600">
                        {app.service_type === 'full' ? 'שטיפה מלאה' : app.service_type === 'external' ? 'שטיפה חיצונית' : 'ניקוי פנימי'}
                      </div>
                    </div>
                    <button
                      onClick={() => handleCancelAppointment(app.id)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                      title="בטל תור"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ))}
                {appointments.filter(app => app.status !== 'cancelled' && app.status !== 'completed').length === 0 && (
                   <p className="text-center text-slate-500 text-sm">אין תורים פעילים</p>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Info Grid */}
      <section className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 hover:border-cyan-200 transition-colors">
          <div className="bg-cyan-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6 text-cyan-700">
            <Clock className="h-7 w-7" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-slate-800">שעות פעילות</h3>
          <ul className="space-y-2 text-slate-600">
            <li className="flex justify-between">
              <span>א' - ה':</span>
              <span className="font-semibold">18:00 - 21:00</span>
            </li>
            <li className="flex justify-between">
              <span>יום ו':</span>
              <span className="font-semibold">12:30 - 16:00</span>
            </li>
          </ul>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 hover:border-cyan-200 transition-colors">
          <div className="bg-cyan-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6 text-cyan-700">
            <MapPin className="h-7 w-7" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-slate-800">מיקום</h3>
          <p className="text-slate-600 mb-4">
            רמת שקד, ירושלים.
            <br />
            חפשו אותנו ב-Waze: "שטיפת רכב רמת שקד"
          </p>
          <a href="#" className="text-cyan-600 font-medium hover:underline">נווט עכשיו &larr;</a>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 hover:border-cyan-200 transition-colors">
          <div className="bg-cyan-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6 text-cyan-700">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-slate-800">איכות מובטחת</h3>
          <p className="text-slate-600">
            אנו משתמשים רק בחומרים איכותיים ובמטליות מיקרופייבר למניעת שריטות.
            הצוות שלנו מיומן ומקצועי.
          </p>
        </div>
      </section>
    </div>
  );
}
