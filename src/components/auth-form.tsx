import { Link } from '@tanstack/react-router'
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { Spinner } from '@/components/ui/spinner';
import { useRouter } from '@tanstack/react-router';
import { LogoMark } from '@/components/kreasi-logo';


type AuthType = "login" | "register"

interface AuthFormProps {
    type: AuthType
}

export function AuthForm({ type }: AuthFormProps) {
    const [loading, setLoading] = useState(false)
    const isLogin = type === "login"

    const router = useRouter()
    const { data: session, isPending } = authClient.useSession()

    const handleGoogleLogin = async () => {
        setLoading(true)
        try {
            await authClient.signIn.social({
                provider: 'google',
                callbackURL: '/auth/callback',
            })
        } catch (error) {
            console.error('Login failed:', error)
            setLoading(false)
        }
    }

    if (isPending) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Spinner className="h-5 w-5 text-muted-foreground" />
            </div>
        )
    }

    // If user is already logged in, redirect to admin dashboard
    if (session?.user) {
        router.navigate({ to: '/admin' })
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Spinner className="h-5 w-5 text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col">


            {/* Main Content  */}
            <main className="flex-1 text-center flex items-center justify-center px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-xs space-y-8">


                    {/* Logo */}
                    <div className="flex justify-center"><LogoMark className="h-12 w-12" /></div>
                    {/* Title */}
                    <div>
                        <h1 className="text-xl sm:text-2xl font-sans">
                            {isLogin ? "Login" : "Sign Up"} to
                            {" "} kreasi.top
                        </h1>
                    </div>

                    {/* Auth Section */}
                    <div className="space-y-4">
                        <Button
                            variant={"default"}
                            disabled={loading}
                            onClick={() => handleGoogleLogin()}
                            className="w-full py-6"
                        >
                            <div className="flex items-center gap-2">
                                {loading ? (
                                    <Spinner />
                                ) : (
                                    <svg
                                        viewBox="0 0 128 128"
                                        className="w-4 h-4"
                                        fill="currentColor"
                                    >
                                        <path
                                            fill="#fff"
                                            d="M44.59 4.21a63.28 63.28 0 004.33 120.9 67.6 67.6 0 0032.36.35 57.13 57.13 0 0025.9-13.46 57.44 57.44 0 0016-26.26 74.33 74.33 0 001.61-33.58H65.27v24.69h34.47a29.72 29.72 0 01-12.66 19.52 36.16 36.16 0 01-13.93 5.5 41.29 41.29 0 01-15.1 0A37.16 37.16 0 0144 95.74a39.3 39.3 0 01-14.5-19.42 38.31 38.31 0 010-24.63 39.25 39.25 0 019.18-14.91A37.17 37.17 0 0176.13 27a34.28 34.28 0 0113.64 8q5.83-5.8 11.64-11.63c2-2.09 4.18-4.08 6.15-6.22A61.22 61.22 0 0087.2 4.59a64 64 0 00-42.61-.38z"
                                        ></path>
                                        <path
                                            fill="#e33629"
                                            d="M44.59 4.21a64 64 0 0142.61.37 61.22 61.22 0 0120.35 12.62c-2 2.14-4.11 4.14-6.15 6.22Q95.58 29.23 89.77 35a34.28 34.28 0 00-13.64-8 37.17 37.17 0 00-37.46 9.74 39.25 39.25 0 00-9.18 14.91L8.76 35.6A63.53 63.53 0 0144.59 4.21z"
                                        ></path>
                                        <path
                                            fill="#f8bd00"
                                            d="M3.26 51.5a62.93 62.93 0 015.5-15.9l20.73 16.09a38.31 38.31 0 000 24.63q-10.36 8-20.73 16.08a63.33 63.33 0 01-5.5-40.9z"
                                        ></path>
                                        <path
                                            fill="#587dbd"
                                            d="M65.27 52.15h59.52a74.33 74.33 0 01-1.61 33.58 57.44 57.44 0 01-16 26.26c-6.69-5.22-13.41-10.4-20.1-15.62a29.72 29.72 0 0012.66-19.54H65.27c-.01-8.22 0-16.45 0-24.68z"
                                        ></path>
                                        <path
                                            fill="#319f43"
                                            d="M8.75 92.4q10.37-8 20.73-16.08A39.3 39.3 0 0044 95.74a37.16 37.16 0 0014.08 6.08 41.29 41.29 0 0015.1 0 36.16 36.16 0 0013.93-5.5c6.69 5.22 13.41 10.4 20.1 15.62a57.13 57.13 0 01-25.9 13.47 67.6 67.6 0 01-32.36-.35 63 63 0 01-23-11.59A63.73 63.73 0 018.75 92.4z"
                                        ></path>
                                    </svg>
                                )}
                                Continue with Google
                            </div>
                        </Button>

                    </div>
                    {!isLogin && (
                        <p className='  text-sm text-muted-foreground text-center'>
                            By signing up, you agree to our <Link to="/" className="text-foreground hover:underline">
                                Terms of service
                            </Link>
                            {" "}and{" "}
                            <Link to="/" className="text-foreground hover:underline">
                                Privacy policy
                            </Link>
                        </p>
                    )}
                    <p className='text-sm text-muted-foreground text-center'>
                        {isLogin ? "Don't" : "Already"}
                        {" "}have an account?{" "}
                        <Link to={isLogin ? "/register" : "/login"} className='text-foreground hover:underline' >
                            {isLogin ? "Sign Up" : "Log In"}
                        </Link>
                        {" "} {isLogin && (
                            <>
                                or{" "}
                                <Link to="/" className="text-foreground hover:underline">
                                    learn more
                                </Link>
                            </>
                        )}
                    </p>
                </div >
            </main >
        </div >
    );
}
