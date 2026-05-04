import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';

interface AuthPageProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ isDarkMode, toggleTheme }) => {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');

  const resetMessages = () => { setError(''); setSuccess(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      if (tab === 'signup') {
        if (password !== confirmPassword) { setError('Passwords do not match'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
        const { error } = await signUp(email, password);
        if (error) {
          setError(error.message);
        } else {
          setSuccess('Account created! Please check your email to verify your account.');
          setEmail(''); setPassword(''); setConfirmPassword('');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) { setError(error.message); } else { navigate('/app/budget'); }
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const bgGradient = isDarkMode
    ? 'linear-gradient(135deg, #0a1929 0%, #1a2332 100%)'
    : 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)';

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{ background: bgGradient }}
    >
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 rounded-full text-[#14959c] hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        aria-label="Toggle theme"
      >
        {isDarkMode ? <Sun className="size-5" /> : <Moon className="size-5" />}
      </button>
      <Card className="relative w-full max-w-md shadow-2xl">
        <CardContent className="p-8">
          <h1
            className="text-center text-3xl font-bold mb-6"
            style={{ color: '#14959c', fontFamily: '"Righteous", sans-serif' }}
          >
            budge-it
          </h1>

          <Tabs
            value={tab}
            onValueChange={(v) => { setTab(v as 'signin' | 'signup'); resetMessages(); }}
          >
            <TabsList className="w-full mb-6">
              <TabsTrigger value="signin" className="flex-1">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="flex-1">Sign Up</TabsTrigger>
            </TabsList>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="mb-4 border-green-500 text-green-700 dark:text-green-400">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <TabsContent value="signin">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input id="signin-email" type="email" value={email}
                    onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input id="signin-password" type="password" value={password}
                    onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
                </div>
                <Button type="submit" className="w-full mt-2" size="lg" disabled={loading}
                  style={{ backgroundColor: '#14959c' }}>
                  {loading ? 'Signing in…' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" value={email}
                    onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" type="password" value={password}
                    onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-confirm">Confirm Password</Label>
                  <Input id="signup-confirm" type="password" value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)} required disabled={loading} />
                </div>
                <Button type="submit" className="w-full mt-2" size="lg" disabled={loading}
                  style={{ backgroundColor: '#14959c' }}>
                  {loading ? 'Creating account…' : 'Sign Up'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
