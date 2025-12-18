import React, { useState, useContext, useEffect } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

// Feature bullet groups for second-phase rotation
const BULLET_GROUPS = [
  [
    'Real-time updates for lights, AC/Heater and fans in every room.',
    'Separate access for Family Head (Admin) and Family Members.',
    'Activity history so you always know who controlled which device.',
  ],
  [
    'Centralized control for all smart devices from a single dashboard.',
    'Instant alerts for unusual activity or unauthorized access.',
    'Secure authentication with role-based permissions for each user.',
  ],
  [
    'Automated routines for day, night, and custom schedules.',
    'Remote device control from anywhere using the internet.',
    'Smart energy management to reduce unnecessary power usage.',
  ],
  [
    'Real-time synchronization across all connected devices.',
    'User-friendly interface designed for quick and easy control.',
    'Scalable system that grows as you add more smart devices.',
  ],
];

export default function LoginPage() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [houseName, setHouseName] = useState('');
  const [role, setRole] = useState('admin');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHeading, setShowHeading] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [showBullet1, setShowBullet1] = useState(false);
  const [showBullet2, setShowBullet2] = useState(false);
  const [showBullet3, setShowBullet3] = useState(false);
  const [rotationStarted, setRotationStarted] = useState(false);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [groupVisible, setGroupVisible] = useState(false);
  const [rotationTick, setRotationTick] = useState(0); // used to reset interval
  const [showIndicators, setShowIndicators] = useState(false);

  // Run staggered animations once on mount
  useEffect(() => {
    const timeouts = [];

    timeouts.push(setTimeout(() => setShowHeading(true), 100));
    timeouts.push(setTimeout(() => setShowDescription(true), 700));
    timeouts.push(setTimeout(() => setShowBullet1(true), 1200));
    timeouts.push(setTimeout(() => setShowBullet2(true), 1800));
    timeouts.push(setTimeout(() => setShowBullet3(true), 2400));
    // Start rotating bullet groups slightly after initial animation completes
    timeouts.push(
      setTimeout(() => {
        setRotationStarted(true);
        setGroupVisible(true);
        // Show indicators slightly after rotation starts
        setTimeout(() => setShowIndicators(true), 2500);
      }, 500)
    );

    return () => {
      timeouts.forEach((id) => clearTimeout(id));
    };
  }, []);

  // Rotate bullet groups once rotation has started
  useEffect(() => {
    if (!rotationStarted) return;

    const interval = setInterval(() => {
      setCurrentGroupIndex((prev) => (prev + 1) % BULLET_GROUPS.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [rotationStarted, rotationTick]);

  // Trigger enter animation whenever group changes
  useEffect(() => {
    if (!rotationStarted) return;
    setGroupVisible(false);
    const t = setTimeout(() => setGroupVisible(true), 50);
    return () => clearTimeout(t);
  }, [currentGroupIndex, rotationStarted]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!houseName.trim()) {
      setError('House name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/auth/login', {
        email,
        password,
        houseName: houseName.trim(),
        role,
      });
      login(res.data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-5xl bg-slate-900/70 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/60 flex flex-col lg:flex-row">
        {/* Left side - About section with background image */}
        <div
          className="relative w-full lg:w-1/2 text-white p-8 lg:p-10 flex flex-col justify-between"
          style={{
            backgroundImage: "url('/smart-home-bg.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* dark overlay so text stays readable */}
          <div className="absolute inset-0 bg-slate-950/50" />

          {/* top logo / title + bullets */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 mb-8">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                <img
                  src="/smarthome-logo.png"
                  alt="SmartHome360 logo"
                  className="w-16 h-16 object-contain"
                />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-blue-100/80">
                  SmartHome360
                </p>
                <p className="text-sm text-blue-100/90">
                  Smart IoT Home Dashboard
                </p>
              </div>
            </div>

            <h1
              className={`text-3xl md:text-4xl font-semibold leading-tight mb-4 transform transition-all duration-700 ease-out ${
                showHeading ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
              }`}
            >
              Designed for <span className="font-bold">smart home control</span>
            </h1>
            <p
              className={`text-sm md:text-base text-blue-50/90 max-w-md transform transition-all duration-700 ease-out ${
                showDescription ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
              }`}
            >
              View live device status, manage every room in your house and keep
              your family secure from anywhere in the world.
            </p>

            {/* Bullet groups container (fixed-height via min-h to avoid layout jump) */}
            <div className="mt-8">
              <div
                className={`space-y-3 text-sm min-h-[6.5rem] transform transition-all duration-700 ease-out ${
                  groupVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3'
                }`}
              >
                {(() => {
                  const bullets = BULLET_GROUPS[currentGroupIndex];
                  return (
                    <>
                      <div
                        className={`flex items-start gap-3 transform transition-all duration-700 ease-out ${
                          showBullet1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
                        }`}
                      >
                        <span className="mt-0.5 text-blue-50/90">•</span>
                        <p>{bullets[0]}</p>
                      </div>
                      <div
                        className={`flex items-start gap-3 transform transition-all duration-700 ease-out ${
                          showBullet2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
                        }`}
                      >
                        <span className="mt-0.5 text-blue-50/90">•</span>
                        <p>{bullets[1]}</p>
                      </div>
                      <div
                        className={`flex items-start gap-3 transform transition-all duration-700 ease-out ${
                          showBullet3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
                        }`}
                      >
                        <span className="mt-0.5 text-blue-50/90">•</span>
                        <p>{bullets[2]}</p>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Indicator dots */}
              <div
                className={`mt-4 flex justify-center gap-2 transition-all duration-700 ease-out ${
                  showIndicators
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-2'
                }`}
              >
                {BULLET_GROUPS.map((_, idx) => {
                  const isActive = idx === currentGroupIndex;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setCurrentGroupIndex(idx);
                        setRotationStarted(true);
                        setRotationTick((t) => t + 1);
                      }}
                      className={`h-1.5 w-1.5 rounded-full transition-all duration-300 focus:outline-none ${
                        isActive
                          ? 'bg-blue-400 scale-110 shadow-[0_0_0_3px_rgba(59,130,246,0.35)]'
                          : 'bg-slate-500/40 hover:bg-slate-300/70'
                      }`}
                      aria-label={`Show feature group ${idx + 1}`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-10 hidden md:flex justify-between items-center text-xs text-blue-50/80">
            <p>Secure, role‑based access for your whole family.</p>
            <p className="text-blue-100 font-medium">Control • Monitor • Relax</p>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="w-full lg:w-1/2 bg-slate-950 px-6 py-8 sm:px-10 sm:py-10 flex items-center justify-center">
          <div className="w-full max-w-md">
            <h2 className="text-3xl font-semibold text-white mb-2">
              Log in
            </h2>
            <p className="text-sm text-slate-400 mb-8">
              Enter your house details to access your SmartHome360 dashboard.
            </p>

            {error && (
              <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              {/* Role dropdown */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1.5">
                  Login as
                </label>
                <div className="relative">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="block w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 transition"
                  >
                    <option value="admin">Admin (Family Head)</option>
                    <option value="user">User (Family Member)</option>
                  </select>
                </div>
              </div>

              {/* House name */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1.5">
                  House name
                </label>
                <input
                  value={houseName}
                  onChange={(e) => setHouseName(e.target.value)}
                  placeholder="e.g. GreenVilla, MySweetHome"
                  className="block w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 transition"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1.5">
                  Email address
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  type="email"
                  className="block w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 transition"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1.5">
                  Password
                </label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  type="password"
                  className="block w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 transition"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-600/40 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-400">
              Don&apos;t have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-blue-400 hover:text-blue-300"
              >
                Sign up as Admin
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

