import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, registerSchema, type LoginCredentials, type RegisterCredentials } from "@shared/schema";
import { Store, Eye, EyeOff, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showVerificationNotice, setShowVerificationNotice] = useState(false);
  const { user, loginMutation, registerMutation, resendVerificationMutation } = useAuth();
  const { toast } = useToast();

  // Redirect if already logged in (after hook calls)
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const loginForm = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterCredentials>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "customer",
    },
  });

  const handleLogin = (data: LoginCredentials) => {
    loginMutation.mutate(data);
  };

  const handleRegister = (data: RegisterCredentials) => {
    registerMutation.mutate(data, {
      onSuccess: () => {
        setShowVerificationNotice(true);
        registerForm.reset();
      },
    });
  };

  const handleResendVerification = () => {
    const email = registerForm.getValues("email");
    if (email) {
      resendVerificationMutation.mutate({ email });
    } else {
      toast({
        title: "Email required",
        description: "Please enter your email address first",
        variant: "destructive",
      });
    }
  };

  if (user) return null; // Prevent flash while redirecting

  return (
    <div className="min-h-screen flex">
      {/* Left side - Forms */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and Brand */}
          <div className="text-center">
            <div className="bg-gradient-to-br from-primary to-accent text-white rounded-lg p-3 w-16 h-16 mx-auto flex items-center justify-center mb-4">
              <Store className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">HUL Distribution</h1>
            <p className="text-muted-foreground mt-2">Access your grocery agency account</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-muted rounded-lg p-1" role="tablist">
            <button 
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "login" 
                  ? "bg-card text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("login")}
              data-testid="button-tab-login"
            >
              Sign In
            </button>
            <button 
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "register" 
                  ? "bg-card text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("register")}
              data-testid="button-tab-register"
            >
              Sign Up
            </button>
          </div>

          {/* Login Form */}
          {activeTab === "login" && !showVerificationNotice && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-lg">
                <CardContent className="p-8">
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-6">
                    <div>
                      <Label htmlFor="login-email">Email Address</Label>
                      <Input 
                        id="login-email"
                        type="email"
                        placeholder="Enter your email"
                        {...loginForm.register("email")}
                        data-testid="input-login-email"
                      />
                      {loginForm.formState.errors.email && (
                        <p className="text-sm text-destructive mt-1">
                          {loginForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="login-password">Password</Label>
                      <div className="relative">
                        <Input 
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          {...loginForm.register("password")}
                          data-testid="input-login-password"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowPassword(!showPassword)}
                          data-testid="button-toggle-password"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-destructive mt-1">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="remember-me" />
                        <Label htmlFor="remember-me" className="text-sm">
                          Remember me
                        </Label>
                      </div>
                      <Button variant="link" className="text-sm p-0 h-auto" data-testid="button-forgot-password">
                        Forgot password?
                      </Button>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                      data-testid="button-login-submit"
                    >
                      {loginMutation.isPending ? "Signing In..." : "Sign In"}
                    </Button>

                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        Don't have an account?{" "}
                        <Button 
                          type="button" 
                          variant="link" 
                          className="p-0 h-auto font-medium" 
                          onClick={() => setActiveTab("register")}
                          data-testid="button-switch-to-register"
                        >
                          Sign up here
                        </Button>
                      </p>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Register Form */}
          {activeTab === "register" && !showVerificationNotice && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-lg">
                <CardContent className="p-8">
                  <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-6">
                    <div>
                      <Label htmlFor="register-name">Full Name</Label>
                      <Input 
                        id="register-name"
                        type="text"
                        placeholder="Enter your full name"
                        {...registerForm.register("name")}
                        data-testid="input-register-name"
                      />
                      {registerForm.formState.errors.name && (
                        <p className="text-sm text-destructive mt-1">
                          {registerForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="register-email">Email Address</Label>
                      <Input 
                        id="register-email"
                        type="email"
                        placeholder="Enter your email"
                        {...registerForm.register("email")}
                        data-testid="input-register-email"
                      />
                      {registerForm.formState.errors.email && (
                        <p className="text-sm text-destructive mt-1">
                          {registerForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="register-role">Account Type</Label>
                      <Select 
                        onValueChange={(value) => registerForm.setValue("role", value as any)}
                        defaultValue="customer"
                      >
                        <SelectTrigger data-testid="select-register-role">
                          <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="customer">Customer</SelectItem>
                         
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="register-password">Password</Label>
                      <div className="relative">
                        <Input 
                          id="register-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a password"
                          {...registerForm.register("password")}
                          data-testid="input-register-password"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {registerForm.formState.errors.password && (
                        <p className="text-sm text-destructive mt-1">
                          {registerForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="register-confirm-password">Confirm Password</Label>
                      <div className="relative">
                        <Input 
                          id="register-confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          {...registerForm.register("confirmPassword")}
                          data-testid="input-register-confirm-password"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {registerForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-destructive mt-1">
                          {registerForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>

                    <div className="flex items-start space-x-2">
                      <Checkbox id="terms" required />
                      <Label htmlFor="terms" className="text-sm leading-5">
                        I agree to the{" "}
                        <Button variant="link" className="p-0 h-auto text-sm">
                          Terms of Service
                        </Button>{" "}
                        and{" "}
                        <Button variant="link" className="p-0 h-auto text-sm">
                          Privacy Policy
                        </Button>
                      </Label>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                      data-testid="button-register-submit"
                    >
                      {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                    </Button>

                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Button 
                          type="button" 
                          variant="link" 
                          className="p-0 h-auto font-medium" 
                          onClick={() => setActiveTab("login")}
                          data-testid="button-switch-to-login"
                        >
                          Sign in here
                        </Button>
                      </p>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Email Verification Notice */}
          {showVerificationNotice && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-accent/20 bg-accent/10 shadow-lg">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="h-8 w-8 text-accent" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Check Your Email</h3>
                  <p className="text-muted-foreground mb-4">
                    We've sent a verification link to your email address. Please click the link to activate your account.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={handleResendVerification}
                    disabled={resendVerificationMutation.isPending}
                    data-testid="button-resend-verification"
                  >
                    {resendVerificationMutation.isPending ? "Sending..." : "Resend verification email"}
                  </Button>
                  <div className="mt-4">
                    <Button 
                      variant="link" 
                      onClick={() => setShowVerificationNotice(false)}
                      data-testid="button-back-to-auth"
                    >
                      Back to sign in
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      {/* Right side - Hero */}
      <div className="hidden lg:flex lg:flex-1 relative bg-gradient-to-br from-primary to-accent">
        <div className="absolute inset-0 bg-black/20"></div>
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=1080')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        ></div>
        <div className="relative p-12 flex flex-col justify-center text-white">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold mb-6">
              Welcome to HUL Distribution
            </h2>
            <p className="text-xl mb-8 text-white/90">
              India's premier grocery distribution platform connecting retailers with quality products from Hindustan Unilever.
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  ✓
                </div>
                <span>Premium quality products</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  ✓
                </div>
                <span>Automated inventory management</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  ✓
                </div>
                <span>Real-time expiry tracking</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  ✓
                </div>
                <span>Competitive pricing & discounts</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
