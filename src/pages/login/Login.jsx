import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Phone, ShieldCheck } from "lucide-react";
import useAuth from "../../zustand/useAuth/index.js";

const OTP_STORAGE_KEY = "likili-login-otp";
const OTP_EXPIRY_MS = 5 * 60 * 1000;

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const getSavedOtp = () => {
  try {
    return JSON.parse(localStorage.getItem(OTP_STORAGE_KEY) || "null");
  } catch {
    localStorage.removeItem(OTP_STORAGE_KEY);
    return null;
  }
};

const Login = () => {
  const { setToken, setMobile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobile, setMobileInput] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSendOtp = () => {
    const cleanedMobile = mobile.trim();

    if (!cleanedMobile) {
      setError("Please enter your mobile number.");
      setMessage("");
      return;
    }

    if (!/^\+?[0-9\s-]{8,15}$/.test(cleanedMobile)) {
      setError("Please enter a valid phone number.");
      setMessage("");
      return;
    }

    const code = generateOtp();
    const otpPayload = {
      mobile: cleanedMobile,
      code,
      expiresAt: Date.now() + OTP_EXPIRY_MS,
    };

    localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(otpPayload));
    setOtpSent(true);
    setOtp("");
    setError("");
    setMessage("OTP sent successfully. It will expire in 5 minutes.");

    console.info(`Likili demo OTP for ${cleanedMobile}: ${code}`);
    window.alert(`Demo SMS OTP for ${cleanedMobile}: ${code}`);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const cleanedMobile = mobile.trim();
    const savedOtp = getSavedOtp();

    if (!otpSent || !savedOtp) {
      setError("Please send OTP first.");
      setMessage("");
      return;
    }

    if (savedOtp.mobile !== cleanedMobile) {
      setError("This OTP was sent to a different phone number.");
      setMessage("");
      return;
    }

    if (Date.now() > savedOtp.expiresAt) {
      localStorage.removeItem(OTP_STORAGE_KEY);
      setOtpSent(false);
      setError("OTP expired. Please send a new OTP.");
      setMessage("");
      return;
    }

    if (otp.trim() !== savedOtp.code) {
      setError("Wrong OTP. Please try again.");
      setMessage("");
      return;
    }

    localStorage.removeItem(OTP_STORAGE_KEY);
    setMobile(cleanedMobile);
    setToken("session-token-" + Date.now());
    navigate(location.state?.from || "/", { replace: true });
  };

  const handleOtpChange = (value) => {
    if (!/^[0-9]{0,6}$/.test(value)) return;
    setOtp(value);
    setError("");
  };

  return (
    <main class="mx-auto flex min-h-screen w-full max-w-[1320px] items-center px-4 py-6 sm:px-6 lg:px-8">
      <section class="w-full overflow-hidden rounded-[28px] border border-white/80 bg-white/80 shadow-soft backdrop-blur sm:rounded-[34px]">
        <div class="grid lg:grid-cols-[1.08fr_0.92fr]">
          <div class="relative h-[300px] sm:h-[380px] lg:h-auto">
            <img
              src="https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1400&q=80"
              alt="Luxury coach interior"
              class="h-full w-full object-cover"
            />
            <div class="absolute inset-0 bg-[linear-gradient(180deg,rgba(32,18,18,0.06),rgba(162,38,48,0.62))]"></div>
            <div class="absolute left-6 right-6 top-6 flex items-center justify-between sm:left-8 sm:right-8">
              <Link
                to="/"
                class="text-2xl font-extrabold tracking-tight text-white drop-shadow sm:text-[2rem]"
              >
                Likili Moterways
              </Link>
              <Link
                to="/"
                class="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </div>
            <div class="absolute inset-x-6 bottom-8 text-white sm:inset-x-8 sm:bottom-10 lg:inset-x-12 lg:bottom-12">
              <h1 class="max-w-md text-3xl font-light leading-[1.04] tracking-tight sm:text-4xl lg:text-5xl">
                Secure phone login for every trip.
              </h1>
              <p class="mt-4 max-w-md text-base leading-8 text-white/90 sm:mt-5 sm:text-[1.02rem] lg:mt-6 lg:text-[1.05rem] lg:leading-9">
                Enter your mobile number, receive a one-time code, and continue
                to your Likili Moterways journey.
              </p>
            </div>
          </div>

          <div class="flex bg-white px-5 py-7 sm:px-8 sm:py-8 lg:px-14">
            <div class="mx-auto w-full max-w-[450px]">
              <div>
                <p class="text-sm font-semibold uppercase tracking-[0.24em] text-brand-500">
                  Welcome back
                </p>
                <h2 class="mt-4 text-4xl font-light tracking-tight text-slate-900 sm:text-5xl">
                  Phone Login
                </h2>
                <p class="mt-3 max-w-md text-base leading-7 text-slate-600 sm:mt-4 sm:text-lg sm:leading-8">
                  We will send a temporary 6-digit OTP to your phone number.
                </p>
              </div>

              <form
                onSubmit={handleLogin}
                class="mt-8 space-y-6 sm:mt-10 sm:space-y-6"
              >
                <div>
                  <label
                    for="mobile"
                    class="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-sm"
                  >
                    Mobile Number
                  </label>
                  <div class="mt-2.5 flex items-center gap-4 rounded-2xl bg-[#f3f3f9] px-4 py-3.5 sm:px-5 sm:py-4">
                    <Phone className="h-5 w-5 text-slate-400" />
                    <input
                      id="mobile"
                      name="mobile"
                      type="tel"
                      value={mobile}
                      onChange={(e) => {
                        setMobileInput(e.target.value);
                        setError("");
                      }}
                      placeholder="e.g. +260 779988223"
                      class="w-full bg-transparent text-base text-slate-700 outline-none placeholder:text-slate-400 sm:text-lg"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    class="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-brand-200 bg-white px-6 py-3 text-base font-semibold text-brand-600 transition hover:bg-brand-50"
                  >
                    Send OTP
                  </button>
                </div>

                <div>
                  <div class="flex flex-wrap items-center justify-between gap-3">
                    <label
                      for="otp"
                      class="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-sm"
                    >
                      OTP
                    </label>
                    <span class="text-sm font-medium text-slate-500">
                      6-digit SMS code
                    </span>
                  </div>
                  <div class="mt-2.5 flex items-center gap-4 rounded-2xl bg-[#f3f3f9] px-4 py-3.5 sm:px-5 sm:py-4">
                    <ShieldCheck className="h-5 w-5 text-slate-400" />
                    <input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(event) => handleOtpChange(event.target.value)}
                      placeholder="Enter 6-digit OTP"
                      class="w-full bg-transparent text-base tracking-[0.35em] text-slate-700 outline-none placeholder:tracking-normal placeholder:text-slate-400 sm:text-lg"
                      aria-label="OTP"
                    />
                  </div>

                  {message && (
                    <p class="mt-3 text-sm font-medium text-emerald-600">
                      {message}
                    </p>
                  )}
                  {error && (
                    <p class="mt-3 text-sm font-medium text-red-600">{error}</p>
                  )}
                </div>

                <button
                  type="submit"
                  class="inline-flex w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#c53040,#d44954)] px-6 py-3.5 text-lg font-semibold text-white shadow-lg shadow-brand-500/20 transition hover:brightness-105 sm:py-4 sm:text-xl"
                >
                  Verify OTP & Login
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Login;
