'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Mail, ArrowRight, TrendingUp, Scale, Flame, Target } from 'lucide-react'

const COOLDOWN_SECONDS = 60

function isRateLimitError(message: string): boolean {
  const lower = message.toLowerCase()
  return lower.includes('rate limit') || lower.includes('too many requests')
}

const FEATURES = [
  {
    icon: Scale,
    title: 'Log weight & calories',
    desc: 'Quick daily logging that takes seconds, not minutes.',
  },
  {
    icon: Flame,
    title: 'Know your real calorie burn',
    desc: 'Calculated from your actual data — not a generic formula.',
  },
  {
    icon: TrendingUp,
    title: 'Track trends over time',
    desc: 'See weekly averages, weight trends, and progress charts.',
  },
  {
    icon: Target,
    title: 'Hit your goal weight',
    desc: 'Get a personalized daily calorie target to reach your goal.',
  },
]

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const startCooldown = useCallback(() => setCooldown(COOLDOWN_SECONDS), [])

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setLoading(false)
    if (error) {
      if (isRateLimitError(error.message)) {
        startCooldown()
        toast.error('Too many requests. Please wait a moment and try again.')
      } else {
        toast.error(error.message)
      }
    } else {
      startCooldown()
      setSent(true)
    }
  }

  return (
    <div className="w-full max-w-md space-y-10 p-6">
      {/* Hero */}
      <div className="space-y-3">
        <h1 className="text-xl font-display tracking-tight text-[#F0F0F8]">
          FORM<span className="text-[#4F8EF7]">.</span>
        </h1>
        <h2 className="text-4xl lg:text-5xl font-display leading-tight">
          Know your body.<br />
          <span className="text-[#4F8EF7]">Feed it right.</span>
        </h2>
        <p className="text-[#8B8BA7] text-sm max-w-sm">
          Find out how many calories your body actually burns each day — calculated from your real weight and intake data. No guesswork.
        </p>
      </div>

      {/* Sign-in form */}
      {sent ? (
        <div className="space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#4F8EF7]/10 flex items-center justify-center">
            <Mail className="h-6 w-6 text-[#4F8EF7]" />
          </div>
          <div>
            <p className="text-[#F0F0F8] font-medium">Check your email</p>
            <p className="text-[#8B8BA7] text-sm mt-1">
              We sent a magic link to <span className="text-[#F0F0F8]">{email}</span>
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#8B8BA7] hover:text-[#F0F0F8]"
            onClick={() => { setSent(false); setCooldown(0) }}
          >
            Use a different email
          </Button>
          {cooldown > 0 && (
            <p className="text-xs text-[#4A4A62]">
              Resend available in {cooldown}s
            </p>
          )}
        </div>
      ) : (
        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-[#8B8BA7]">
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-[#1A1A24] border-[#2A2A38] focus:border-[#4F8EF7] h-11"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-[#4F8EF7] text-white hover:bg-[#4F8EF7]/90 font-semibold h-11 gap-2"
            disabled={loading || cooldown > 0}
          >
            {loading ? 'Sending...' : cooldown > 0 ? (
              `Resend in ${cooldown}s`
            ) : (
              <>Start for free <ArrowRight className="h-4 w-4" /></>
            )}
          </Button>
          <p className="text-xs text-[#4A4A62]">
            Free forever. No password needed — we&apos;ll email you a secure sign-in link.
          </p>
        </form>
      )}

      {/* Features */}
      <div className="space-y-4">
        <h3 className="text-xs uppercase tracking-wide text-[#8B8BA7] font-medium">How it works</h3>
        <div className="grid grid-cols-1 gap-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-lg bg-[#4F8EF7]/10 flex items-center justify-center shrink-0 mt-0.5">
                <f.icon className="h-4 w-4 text-[#4F8EF7]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#F0F0F8]">{f.title}</p>
                <p className="text-xs text-[#8B8BA7] mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
