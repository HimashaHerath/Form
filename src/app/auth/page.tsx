'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Mail, ArrowRight } from 'lucide-react'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

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
      toast.error(error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="w-full max-w-md space-y-8 p-6">
      <div className="space-y-3">
        <h1 className="text-xl font-display tracking-tight text-[#F0F0F8]">
          FORM<span className="text-[#4F8EF7]">.</span>
        </h1>
        <h2 className="text-4xl lg:text-5xl font-display leading-tight">
          Know your body.<br />
          <span className="text-[#4F8EF7]">Feed it right.</span>
        </h2>
        <p className="text-[#8B8BA7] text-sm max-w-sm">
          Track your metabolic rate from real weight and calorie data. No guesswork — just science.
        </p>
      </div>

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
            onClick={() => setSent(false)}
          >
            Use a different email
          </Button>
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
            disabled={loading}
          >
            {loading ? 'Sending...' : (
              <>Send magic link <ArrowRight className="h-4 w-4" /></>
            )}
          </Button>
          <p className="text-xs text-[#4A4A62]">
            No password needed — we&apos;ll email you a secure sign-in link.
          </p>
        </form>
      )}
    </div>
  )
}
