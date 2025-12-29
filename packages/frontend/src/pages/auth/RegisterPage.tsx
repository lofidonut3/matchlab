import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../../stores/auth.store'
import { Button, Input, Alert } from '../../components/common'

const registerSchema = z.object({
  nickname: z.string().min(2, '닉네임은 2자 이상이어야 합니다'),
  email: z.string().email('올바른 이메일을 입력하세요'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirmPassword'],
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { register: registerUser, isLoading, error, clearError } = useAuthStore()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterForm) => {
    try {
      clearError()
      await registerUser(data.email, data.password, data.nickname)
      navigate('/onboarding')
    } catch (err) {
      // Error is handled in store
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">회원가입</h1>
        <p className="text-gray-600 mt-2">
          MatchLab과 함께 최적의 팀원을 찾아보세요
        </p>
      </div>

      {error && (
        <Alert type="error" className="mb-6" onClose={clearError}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            {...register('nickname')}
            placeholder="닉네임"
            className="pl-10"
            error={errors.nickname?.message}
          />
        </div>

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
            placeholder="비밀번호 (8자 이상)"
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

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            {...register('confirmPassword')}
            type={showPassword ? 'text' : 'password'}
            placeholder="비밀번호 확인"
            className="pl-10"
            error={errors.confirmPassword?.message}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isLoading}
        >
          가입하기
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-600">
        이미 계정이 있으신가요?{' '}
        <Link to="/login" className="text-primary-600 font-medium hover:underline">
          로그인
        </Link>
      </div>
    </div>
  )
}
