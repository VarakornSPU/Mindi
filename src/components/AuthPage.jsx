import { useState } from 'react'
import mindiLogo from '../assets/MindiLogo.png'

function AuthPage({ onLogin, onRegister }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')

  const isLogin = mode === 'login'

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const result = await (
      isLogin
        ? onLogin({ email: form.email, password: form.password })
        : onRegister({
            email: form.email,
            password: form.password,
            confirmPassword: form.confirmPassword,
          })
    )

    if (!result.ok) setError(result.error)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F8F9FC] p-4 md:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,182,193,0.25),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(167,199,231,0.28),transparent_42%),radial-gradient(circle_at_50%_100%,rgba(255,255,255,0.65),transparent_45%)]" />

      <div className="relative grid w-full max-w-[1380px] grid-cols-1 overflow-hidden rounded-[34px] border border-white/70 bg-white/80 shadow-[0_30px_70px_rgba(120,130,160,0.18)] backdrop-blur-xl md:grid-cols-2">
        <div className="flex min-h-[340px] items-center justify-center border-b border-white/70 bg-white/70 p-10 md:min-h-[640px] md:border-b-0 md:border-r">
          <img
            src={mindiLogo}
            alt="Mindi Logo"
            className="h-[260px] w-[260px] object-contain md:h-[360px] md:w-[360px]"
          />
        </div>

        <div className="flex items-center p-6 md:p-12">
          <div className="mx-auto w-full max-w-[720px]">
            <div className="mb-8">
              <div className="relative grid grid-cols-2 rounded-full bg-[#EFF1F6] p-2">
                <div
                  className={`absolute bottom-2 left-2 top-2 w-[calc(50%-0.5rem)] rounded-full shadow-sm transition-all duration-300 ease-out ${
                    isLogin ? 'translate-x-0 bg-[#F3A9C6]' : 'translate-x-full bg-[#A7C7E7]'
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`relative z-10 rounded-full px-5 py-3.5 text-base font-semibold leading-none transition-colors duration-300 md:text-xl ${
                    isLogin ? 'text-white' : 'text-[#8d8d99]'
                  }`}
                >
                  เข้าสู่ระบบ
                </button>

                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className={`relative z-10 rounded-full px-5 py-3.5 text-base font-semibold leading-none transition-colors duration-300 md:text-xl ${
                    isLogin ? 'text-[#8d8d99]' : 'text-white'
                  }`}
                >
                  สมัครสมาชิก
                </button>
              </div>

              <div className="mt-2 h-1 rounded-full bg-[#e8e8f0]">
                <div
                  className={`h-full rounded-full bg-[#e4a7bc] transition-all duration-500 ease-out ${
                    isLogin ? 'w-1/2' : 'ml-auto w-1/2'
                  }`}
                />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-lg font-medium leading-none text-[#333] md:text-[22px]">
                  อีเมล
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  className="w-full rounded-[28px] border-2 border-[#D8DCE8] bg-white px-6 py-4 text-base leading-none text-[#555] outline-none transition focus:border-[#BFC9DD] md:text-[22px]"
                  placeholder="you@gmail.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-lg font-medium leading-none text-[#333] md:text-[22px]">
                  รหัสผ่าน
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => updateField('password', event.target.value)}
                  className="w-full rounded-[28px] border-2 border-[#D8DCE8] bg-white px-6 py-4 text-base leading-none text-[#555] outline-none transition focus:border-[#BFC9DD] md:text-[22px]"
                  placeholder="********"
                />
              </div>

              <div
                className={`grid transition-all duration-300 ease-out ${
                  isLogin
                    ? 'grid-rows-[0fr] opacity-0 -translate-y-1'
                    : 'grid-rows-[1fr] opacity-100 translate-y-0'
                }`}
              >
                <div className="overflow-hidden">
                  <label className="mb-2 block text-lg font-medium leading-none text-[#333] md:text-[22px]">
                    ยืนยันรหัสผ่าน
                  </label>
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(event) => updateField('confirmPassword', event.target.value)}
                    className="w-full rounded-[28px] border-2 border-[#D8DCE8] bg-white px-6 py-4 text-base leading-none text-[#555] outline-none transition focus:border-[#BFC9DD] md:text-[22px]"
                    placeholder="********"
                    disabled={isLogin}
                  />
                </div>
              </div>

              {error && <p className="text-sm text-[#d16f8d]">{error}</p>}

              <button
                type="submit"
                className="w-full rounded-[28px] border border-white/70 bg-[#D98EB0] bg-gradient-to-r from-[#E57FA1] via-[#B18DC9] to-[#7DA9D8] py-4 text-base font-semibold leading-none text-white shadow-[0_10px_22px_rgba(120,140,180,0.35)] transition hover:brightness-95 md:text-2xl"
              >
                {isLogin ? 'เข้าสู่ระบบ' : 'สร้างบัญชี'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthPage
