
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

  useEffect(() => {
    setMounted(true);
    setSupabase(createClient());
  }, []);

  const logoUrl = theme === 'dark' 
    ? "https://i.ibb.co/7xpjJbKh/logoy2go-white.png" 
    : "https://i.ibb.co/VpQvKQ2X/logoy2go.png";

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    if (!supabase) return;

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message,
      });
    } else {
      toast({
        title: "Login Successful",
        description: "Redirecting to your dashboard...",
      });
      // Use router.push for client-side navigation and then refresh to ensure server session is picked up.
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="relative flex items-center justify-center py-12">
        <div className="absolute left-6 top-6">
            {mounted && <Image src={logoUrl} alt="Yes To Go Logo" width={120} height={32} />}
        </div>
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-4 text-center">
            
            <h1 className="text-2xl font-bold">Welcome Back!</h1>
            <p className="text-muted-foreground">
              Enter your email below to login to your account
            </p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="admin@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...field} />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={!supabase}>
                Login
              </Button>
            </form>
          </Form>
           <div className="mt-4 text-center text-sm">
            By continuing, you agree to our{" "}
            <Dialog>
              <DialogTrigger asChild>
                <button className="underline">Terms of Service</button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Yes To Go Terms of Service</DialogTitle>
                  <DialogDescription>
                    These terms and conditions outline the rules and regulations for the use of Yes To Go's Admin Dashboard.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 text-sm text-muted-foreground max-h-[60vh] overflow-y-auto pr-4">
                    <p>Welcome to Yes To Go! By accessing this dashboard, we assume you accept these terms and conditions. Do not continue to use Yes To Go if you do not agree to all of the terms and conditions stated on this page.</p>
                    <h3 className="font-semibold text-foreground">1. License to Use Dashboard</h3>
                    <p>Unless otherwise stated, Yes To Go and/or its licensors own the intellectual property rights for all material on Yes To Go. You may access this from Yes To Go for your own personal and business use subjected to restrictions set in these terms and conditions.</p>
                    <p>You must not: Republish material from Yes To Go, sell, rent or sub-license material from Yes To Go, or reproduce, duplicate or copy material from Yes To Go.</p>
                    <h3 className="font-semibold text-foreground">2. User Accounts</h3>
                    <p>You are responsible for maintaining the security of your account, and you are fully responsible for all activities that occur under the account and any other actions taken in connection with it. You must immediately notify us of any unauthorized uses of your account or any other breaches of security.</p>
                    <h3 className="font-semibold text-foreground">3. Disclaimer</h3>
                    <p>The materials on Yes To Go's dashboard are provided on an 'as is' basis. Yes To Go makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
                </div>
              </DialogContent>
            </Dialog>
            {" "}and{" "}
            <Dialog>
              <DialogTrigger asChild>
                <button className="underline">Privacy Policy</button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Yes To Go Privacy Policy</DialogTitle>
                  <DialogDescription>
                    This Privacy Policy describes how your personal information is collected, used, and shared when you use the Yes To Go Admin Dashboard.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 text-sm text-muted-foreground max-h-[60vh] overflow-y-auto pr-4">
                    <h3 className="font-semibold text-foreground">1. Personal Information We Collect</h3>
                    <p>When you register for an account, we collect certain information from you, including your name, email address, and password. We refer to this information as “Account Information”.</p>
                    <h3 className="font-semibold text-foreground">2. How Do We Use Your Personal Information?</h3>
                    <p>We use the Account Information that we collect generally to fulfill our services to you. Additionally, we use this Account Information to: communicate with you, screen for potential risk or fraud, and when in line with the preferences you have shared with us, provide you with information or advertising relating to our products or services.</p>
                    <h3 className="font-semibold text-foreground">3. Sharing Your Personal Information</h3>
                    <p>We do not sell, trade, or otherwise transfer to outside parties your personally identifiable information. This does not include trusted third parties who assist us in operating our website, conducting our business, or servicing you, so long as those parties agree to keep this information confidential.</p>
                    <h3 className="font-semibold text-foreground">4. Data Retention</h3>
                    <p>When you create an account through the Site, we will maintain your Account Information for our records unless and until you ask us to delete this information.</p>
                     <h3 className="font-semibold text-foreground">5. Changes</h3>
                    <p>We may update this privacy policy from time to time in order to reflect, for example, changes to our practices or for other operational, legal or regulatory reasons.</p>
                </div>
              </DialogContent>
            </Dialog>
            .
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        <Image
          src="https://i.ibb.co/Y6b5J0Z/Gemini-Generated-Image-e79d8je79d8je79d-2.png"
          alt="Image"
          width="1920"
          height="1080"
          className="h-screen w-full object-cover"
        />
      </div>
    </div>
  );
}
