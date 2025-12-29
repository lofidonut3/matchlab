import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../../stores/auth.store'
import { Button, Input, Alert } from '../../components/common'

const loginSchema = z.object({
  email: z.string().email('올바른 이메일을 입력하세요'),
  password: z.string().min(1, '비밀번호를 입력하세요'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoading, error, clearError } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/recommend'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      clearError()
      await login(data.email, data.password)
      navigate(from, { replace: true })
    } catch (err) {
      // Error is handled in store
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">로그인</h1>
        <p className="text-gray-600 mt-2">
          MatchLab에 오신 것을 환영합니다
        </p>
      </div>

      {error && (
        <Alert type="error" className="mb-6" onClose={clearError}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            {...register('email')}
            type="email"
            placeholder="이메일"
            className="pl-10"
            error={errors.email?.message}
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            placeholder="비밀번호"
            className="pl-10 pr-10"
            error={errors.password?.message}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isLoading}
        >
          로그인
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-600">
        계정이 없으신가요?{' '}
        <Link to="/register" className="text-primary-600 font-medium hover:underline">
          회원가입
        </Link>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600 text-center">
          테스트 계정: <strong>test@matchlab.test</strong> / <strong>MatchLab2024!</strong>
        </p>
      </div>
    </div>
  )
}
