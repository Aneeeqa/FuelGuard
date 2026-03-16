import { ArrowRight } from "lucide-react"
import { useState, Suspense, lazy, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "./GooeyText.css"

const blueGradient = {
  background: 'linear-gradient(135deg, #2563EB 0%, #60A5FA 50%, #93C5FD 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}

const orangeGradient = {
  background: 'linear-gradient(135deg, #EC4E02 0%, #F97316 50%, #FB923C 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}

const Dithering = lazy(() => 
  import("@paper-design/shaders-react").then((mod) => ({ default: mod.Dithering }))
)

function GooeyText() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % 2)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="gooey-text-container">
      <div
        className="gooey-blob w-44 h-44 gooey-blob-active"
        style={{ background: '#EC4E02' }}
      />

      {/* "Protect your fuel, / optimize every drop." */}
      <h2
        className={`tracking-tight leading-[1.15] gooey-text-item ${
          currentIndex === 0 ? 'gooey-text-active' : 'gooey-text-inactive'
        }`}
        style={{ fontFamily: 'Playfair Display, Georgia, serif', fontWeight: 700 }}
      >
        <span
          className="gooey-line-1 text-2xl sm:text-4xl md:text-6xl lg:text-7xl md:whitespace-nowrap"
          style={orangeGradient}
        >
          Protect your fuel,
        </span>
        <span
          className="gooey-line-2 text-2xl sm:text-4xl md:text-6xl lg:text-7xl md:whitespace-nowrap"
          style={{ color: '#9CA3AF' }}
        >
          optimize every drop.
        </span>
      </h2>

      {/* "Fuel Guard" */}
      <h2
        className={`tracking-tight leading-[1.15] gooey-text-item whitespace-nowrap text-[1.8rem] sm:text-4xl md:text-6xl lg:text-7xl ${
          currentIndex === 1 ? 'gooey-text-active' : 'gooey-text-inactive'
        }`}
        style={{ ...orangeGradient, fontFamily: 'Playfair Display, Georgia, serif', fontWeight: 700 }}
      >
        Fuel Guard
      </h2>
    </div>
  )
}

export function CTASection() {
  const [isHovered, setIsHovered] = useState(false)
  const navigate = useNavigate()

  return (
    <section
      className="relative z-10 w-full min-h-screen flex items-center justify-center px-4 md:px-6 -mt-12 pt-0 pb-12"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="w-full max-w-7xl">
        <div
          className="relative overflow-hidden rounded-[48px] min-h-[85vh] flex flex-col items-center justify-center"
          style={{
            border: '1px solid rgba(236, 78, 2, 0.25)',
            background: 'rgba(20, 8, 2, 0.7)',
            boxShadow: '0 0 80px rgba(236, 78, 2, 0.12), inset 0 1px 0 rgba(249, 115, 22, 0.1)',
          }}
        >
          {/* Dithering shader background */}
          <Suspense fallback={<div className="absolute inset-0" />}>
            <div className="absolute inset-0 z-0 pointer-events-none opacity-70 mix-blend-screen">
              <Dithering
                colorBack="#00000000"
                colorFront="#7a2100"
                shape="warp"
                type="4x4"
                speed={isHovered ? 0.6 : 0.2}
                className="size-full"
                minPixelRatio={1}
              />
            </div>
          </Suspense>

          <div className="relative z-10 px-6 max-w-4xl mx-auto text-center flex flex-col items-center">
            {/* Badge */}
            <div
              className="mb-8 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold"
              style={{
                background: 'linear-gradient(135deg, rgba(236,78,2,0.2) 0%, rgba(249,115,22,0.2) 100%)',
                border: '1px solid rgba(236, 78, 2, 0.35)',
                color: '#FB923C',
              }}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ background: '#FB923C' }}
                />
                <span
                  className="relative inline-flex rounded-full h-2 w-2"
                  style={{ background: '#FB923C' }}
                />
              </span>
              Smart Fuel Management
            </div>

            {/* Animated headline */}
            <GooeyText />

            {/* Description */}
            <p
              className="text-lg md:text-xl max-w-2xl mb-12 leading-relaxed font-['Plus_Jakarta_Sans']"
              style={{ color: '#9CA3AF' }}
            >
              Join vehicle owners using smart monitoring to prevent fuel theft and track efficiency.
              Secure, precise, and tailored to your fleet.
            </p>

            {/* CTA button */}
            <button
              onClick={() => navigate('/login')}
              className="group relative inline-flex h-14 items-center justify-center gap-3 overflow-hidden rounded-full px-12 text-base font-semibold text-white transition-all duration-300 hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #EC4E02 0%, #F97316 100%)',
                boxShadow: '0 4px 24px rgba(236, 78, 2, 0.45)',
              }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 8px 36px rgba(236,78,2,0.65)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 4px 24px rgba(236,78,2,0.45)')}
            >
              <span>Start Monitoring</span>
              <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────
// Blue-theme hero card for the About / default homepage
// ─────────────────────────────────────────────

function BlueGooeyText() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % 2)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="gooey-text-container">
      <div
        className="gooey-blob w-44 h-44 gooey-blob-active"
        style={{ background: '#2563EB' }}
      />

      {/* "Protect your fuel, / optimize every drop." */}
      <h2
        className={`tracking-tight leading-[1.15] gooey-text-item ${
          currentIndex === 0 ? 'gooey-text-active' : 'gooey-text-inactive'
        }`}
        style={{ fontFamily: 'Playfair Display, Georgia, serif', fontWeight: 700 }}
      >
        <span
          className="gooey-line-1 text-2xl sm:text-4xl md:text-6xl lg:text-7xl md:whitespace-nowrap"
          style={blueGradient}
        >
          Protect your fuel,
        </span>
        <span
          className="gooey-line-2 text-2xl sm:text-4xl md:text-6xl lg:text-7xl md:whitespace-nowrap"
          style={{ color: '#9CA3AF' }}
        >
          optimize every drop.
        </span>
      </h2>

      {/* "Fuel Guard" */}
      <h2
        className={`tracking-tight leading-[1.15] gooey-text-item whitespace-nowrap text-[1.8rem] sm:text-4xl md:text-6xl lg:text-7xl ${
          currentIndex === 1 ? 'gooey-text-active' : 'gooey-text-inactive'
        }`}
        style={{
          ...blueGradient,
          fontFamily: 'Playfair Display, Georgia, serif',
          fontWeight: 700,
        }}
      >
        Fuel Guard
      </h2>
    </div>
  )
}

export function BlueCTASection() {
  const [isHovered, setIsHovered] = useState(false)
  const navigate = useNavigate()

  return (
    <section
      className="relative z-10 w-full min-h-screen flex items-center justify-center px-4 md:px-6 -mt-12 pt-0 pb-12"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="w-full max-w-7xl">
        <div
          className="relative overflow-hidden rounded-[48px] min-h-[85vh] flex flex-col items-center justify-center"
          style={{
            border: '1px solid rgba(37, 99, 235, 0.25)',
            background: 'rgba(3, 11, 28, 0.7)',
            boxShadow: '0 0 80px rgba(37, 99, 235, 0.12), inset 0 1px 0 rgba(96, 165, 250, 0.1)',
          }}
        >
          {/* Dithering shader card and background */}
          <Suspense fallback={<div className="absolute inset-0" />}>
            <div className="absolute inset-0 z-0 pointer-events-none opacity-70 mix-blend-screen">
              <Dithering
                colorBack="#00000000"
                colorFront="#00367d"
                shape="warp"
                type="4x4"
                speed={isHovered ? 0.6 : 0.2}
                className="size-full"
                minPixelRatio={1}
              />
            </div>
          </Suspense>

          <div className="relative z-10 px-6 max-w-4xl mx-auto text-center flex flex-col items-center">
            {/* Badge */}
            <div
              className="mb-8 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold"
              style={{
                background: 'linear-gradient(135deg, rgba(37,99,235,0.2) 0%, rgba(96,165,250,0.2) 100%)',
                border: '1px solid rgba(37, 99, 235, 0.35)',
                color: '#60A5FA',
              }}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ background: '#60A5FA' }}
                />
                <span
                  className="relative inline-flex rounded-full h-2 w-2"
                  style={{ background: '#60A5FA' }}
                />
              </span>
              Smart Fuel Management
            </div>

            {/* Animated headline */}
            <BlueGooeyText />

            {/* Description */}
            <p
              className="text-lg md:text-xl max-w-2xl mb-12 leading-relaxed font-['Plus_Jakarta_Sans']"
              style={{ color: '#9CA3AF' }}
            >
              Join vehicle owners using smart monitoring to prevent fuel theft and track efficiency.
              Secure, precise, and tailored to your fleet.
            </p>

            {/* CTA button */}
            <button
              onClick={() => navigate('/login')}
              className="group relative inline-flex h-14 items-center justify-center gap-3 overflow-hidden rounded-full px-12 text-base font-semibold text-white transition-all duration-300 hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
                boxShadow: '0 4px 24px rgba(37, 99, 235, 0.45)',
              }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 8px 36px rgba(37,99,235,0.65)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 4px 24px rgba(37,99,235,0.45)')}
            >
              <span>Start Monitoring</span>
              <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
