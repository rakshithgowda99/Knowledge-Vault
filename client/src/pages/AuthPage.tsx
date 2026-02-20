import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, loginSchema, type RegisterInput, type LoginInput } from "@shared/schema";
import { useLogin, useRegister, useUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { BookOpen, Loader2, ArrowLeft } from "lucide-react";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [, setLocation] = useLocation();
  const { data: user, isLoading: authLoading } = useUser();

  // Redirect home if already logged in
  if (!authLoading && user) {
    setLocation("/");
    return null;
  }
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const { toast } = useToast();

  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", password: "" },
  });

  const handleLogin = async (data: LoginInput) => {
    try {
      await loginMutation.mutateAsync(data);
      toast({ title: "Welcome back!" });
      setLocation("/");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Login failed", description: err.message });
    }
  };

  const handleRegister = async (data: RegisterInput) => {
    try {
      await registerMutation.mutateAsync(data);
      toast({ title: "Account created!", description: "You're now logged in." });
      setLocation("/");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Registration failed", description: err.message });
    }
  };

  const isPending = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="min-h-screen flex">
      {/* Left panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo & Home link */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
                <BookOpen className="w-6 h-6" />
              </div>
              <h1 className="font-display font-bold text-2xl tracking-tight text-primary">WikiBase</h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-primary"
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="w-4 h-4" />
              Home
            </Button>
          </div>

          <div>
            <h2 className="text-3xl font-display font-bold text-foreground">
              {mode === "login" ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-muted-foreground mt-2">
              {mode === "login"
                ? "Sign in to create, edit, and manage your articles."
                : "Join to start building your personal knowledge base."}
            </p>
          </div>

          {mode === "login" ? (
            <Form key="login" {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4" autoComplete="off">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field: { ref, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" autoComplete="email" placeholder="you@example.com" ref={ref} {...fieldProps} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field: { ref, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="current-password" placeholder="••••••" ref={ref} {...fieldProps} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Sign In
                </Button>
              </form>
            </Form>
          ) : (
            <Form key="register" {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4" autoComplete="off">
                <FormField
                  control={registerForm.control}
                  name="username"
                  render={({ field: { ref, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input autoComplete="username" placeholder="johndoe" ref={ref} {...fieldProps} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field: { ref, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" autoComplete="email" placeholder="you@example.com" ref={ref} {...fieldProps} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field: { ref, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="new-password" placeholder="••••••" ref={ref} {...fieldProps} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create Account
                </Button>
              </form>
            </Form>
          )}

          <p className="text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className="text-primary font-medium hover:underline"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-primary font-medium hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Right panel - Decorative */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/10 via-primary/5 to-background items-center justify-center p-12">
        <div className="max-w-lg text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-2xl font-display font-bold text-foreground">Your Personal Knowledge Hub</h3>
          <p className="text-muted-foreground leading-relaxed">
            Anyone can browse and read articles. Sign in to create, edit, favorite, and
            track changes — building your knowledge base your way.
          </p>
        </div>
      </div>
    </div>
  );
}
