export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F0F8] flex">
      {/* Left: Hero + Form (full width on mobile, 60% on desktop) */}
      <div className="flex-1 lg:w-[60%] flex items-center justify-center p-6">
        {children}
      </div>

      {/* Right: Animated Grid Panel (hidden on mobile, 40% on desktop) */}
      <div className="hidden lg:flex lg:w-[40%] relative overflow-hidden bg-[#0D0D16] border-l border-[#2A2A38] items-center justify-center">
        {/* CSS Grid Background */}
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(rgba(79, 142, 247, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(79, 142, 247, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
              animation: 'gridPan 20s linear infinite',
            }}
          />
        </div>

        {/* Floating Demo Stat Cards */}
        <div className="relative z-10 space-y-4 p-8">
          <div className="bg-[#111118] border border-[#2A2A38] rounded-xl p-4 shadow-xl transform rotate-[-2deg] hover:rotate-0 transition-transform">
            <p className="text-xs uppercase tracking-wide text-[#8B8BA7]">CURRENT TDEE</p>
            <p className="text-3xl font-data tabular-nums text-[#4F8EF7] mt-1">2,847</p>
            <p className="text-xs text-[#4A4A62] mt-1">kcal/day</p>
          </div>
          <div className="bg-[#111118] border border-[#2A2A38] rounded-xl p-4 shadow-xl transform rotate-[1deg] hover:rotate-0 transition-transform ml-8">
            <p className="text-xs uppercase tracking-wide text-[#8B8BA7]">LOGGING STREAK</p>
            <p className="text-3xl font-data tabular-nums text-[#22C55E] mt-1">80%</p>
            <p className="text-xs text-[#4A4A62] mt-1">consistency this month</p>
          </div>
          <div className="bg-[#111118] border border-[#4F8EF7]/30 rounded-xl p-4 shadow-xl transform rotate-[-1deg] hover:rotate-0 transition-transform">
            <p className="text-xs uppercase tracking-wide text-[#8B8BA7]">EAT TODAY</p>
            <p className="text-3xl font-data tabular-nums text-[#F0F0F8] mt-1">2,347</p>
            <p className="text-xs text-[#4A4A62] mt-1">kcal recommended</p>
          </div>
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D16] via-transparent to-[#0D0D16]/50 pointer-events-none" />
      </div>

      <style>{`
        @keyframes gridPan {
          0% { transform: translate(0, 0); }
          100% { transform: translate(40px, 40px); }
        }
      `}</style>
    </div>
  )
}
