import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { useAuth } from '@/contexts/useAuth'
export default function SignUpForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<'div'>) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [repeatPassword, setRepeatPassword] = useState('')
    const [success, setSuccess] = useState(false)
    const { error, isLoading, signUp, setError } = useAuth()
    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email || !password || !repeatPassword) {
            setError('All fields are required')
            return
        }
        if (password !== repeatPassword) {
            setError('Passwords do not match')
            return
        }
        signUp({ email, password })
    }

    return (
        <div className='h-screen flex items-center justify-center'>
            <div
                className={cn(
                    'flex flex-col gap-6 max-w-screen-sm w-full',
                    className
                )}
                {...props}
            >
                {success ? (
                    <Card>
                        <CardHeader>
                            <CardTitle className='text-2xl'>
                                Thank you for signing up!
                            </CardTitle>
                            <CardDescription>
                                Check your email to confirm
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className='text-sm text-muted-foreground'>
                                You've successfully signed up. Please check your
                                email to confirm your account before signing in.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle className='text-2xl'>Sign up</CardTitle>
                            <CardDescription>
                                Create a new account
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSignUp}>
                                <div className='flex flex-col gap-6'>
                                    <div className='grid gap-2'>
                                        <Label htmlFor='email'>Email</Label>
                                        <Input
                                            id='email'
                                            type='email'
                                            placeholder='m@example.com'
                                            required
                                            value={email}
                                            onChange={(e) =>
                                                setEmail(e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className='grid gap-2'>
                                        <div className='flex items-center'>
                                            <Label htmlFor='password'>
                                                Password
                                            </Label>
                                        </div>
                                        <Input
                                            id='password'
                                            type='password'
                                            required
                                            value={password}
                                            onChange={(e) =>
                                                setPassword(e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className='grid gap-2'>
                                        <div className='flex items-center'>
                                            <Label htmlFor='repeat-password'>
                                                Repeat Password
                                            </Label>
                                        </div>
                                        <Input
                                            id='repeat-password'
                                            type='password'
                                            required
                                            value={repeatPassword}
                                            onChange={(e) =>
                                                setRepeatPassword(
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>
                                    {error && (
                                        <p className='text-sm text-red-500'>
                                            {error}
                                        </p>
                                    )}
                                    <Button
                                        type='submit'
                                        className='w-full'
                                        disabled={isLoading}
                                    >
                                        {isLoading
                                            ? 'Creating an account...'
                                            : 'Sign up'}
                                    </Button>
                                </div>
                                <div className='mt-4 text-center text-sm'>
                                    Already have an account?{' '}
                                    <a
                                        href='/login'
                                        className='underline underline-offset-4'
                                    >
                                        Login
                                    </a>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
