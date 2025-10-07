import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ethraLogo from '@/assets/ethra-logo.png';
import { z } from 'zod';

const passwordSchema = z.object({
  password: z.string()
    .min(6, "Senha deve ter no mínimo 6 caracteres")
    .max(100, "Senha muito longa"),
});

export default function RedefinirSenha() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<string[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    validateRecoveryToken();
  }, []);

  const validateRecoveryToken = async () => {
    setValidatingToken(true);
    
    try {
      // Verificar se há tokens na URL (hash ou query params)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = searchParams.get('access_token') || hashParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token') || hashParams.get('refresh_token');
      const type = searchParams.get('type') || hashParams.get('type');

      if (type !== 'recovery') {
        setError('Link de recuperação inválido ou ausente.');
        setTokenValid(false);
        setValidatingToken(false);
        return;
      }

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          console.error('Erro ao validar token:', sessionError);
          setError('Link de recuperação expirado ou inválido.');
          setTokenValid(false);
        } else {
          setTokenValid(true);
        }
      } else {
        // Verificar se já há sessão ativa de recuperação
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setTokenValid(true);
        } else {
          setError('Link de recuperação inválido ou expirado.');
          setTokenValid(false);
        }
      }
    } catch (err) {
      console.error('Erro ao validar token:', err);
      setError('Erro ao validar link de recuperação.');
      setTokenValid(false);
    } finally {
      setValidatingToken(false);
    }
  };

  const validatePasswordStrength = (pwd: string) => {
    const checks: string[] = [];
    
    if (pwd.length >= 6) checks.push('6+ caracteres');
    
    setPasswordStrength(checks);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    validatePasswordStrength(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validar senha
    const validation = passwordSchema.safeParse({ password });
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    // Validar confirmação
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        console.error('Erro ao atualizar senha:', updateError);
        setError('Erro ao redefinir senha. Tente novamente.');
        setLoading(false);
        return;
      }

      // Fazer logout para não logar automaticamente
      await supabase.auth.signOut();

      toast({
        title: "Senha redefinida com sucesso!",
        description: "Faça login com sua nova senha.",
      });

      // Redirecionar para login
      setTimeout(() => {
        navigate('/auth');
      }, 1500);
      
    } catch (err) {
      console.error('Erro inesperado:', err);
      setError('Erro inesperado. Tente novamente mais tarde.');
      setLoading(false);
    }
  };

  if (validatingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ethra mx-auto mb-4"></div>
          <p className="text-muted-foreground">Validando link de recuperação...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
        <Card className="w-full max-w-md border-glass bg-glass/95 backdrop-blur-lg shadow-elegant">
            <CardHeader className="text-center">
              <div className="flex flex-col items-center justify-center">
                <div className="mb-4">
                  <img src={ethraLogo} alt="Ethra Logo" className="h-48 w-auto" />
                </div>
                <CardTitle className="text-2xl font-bold text-destructive">Link Inválido</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Button
                  onClick={() => navigate('/recuperar-senha')}
                  className="w-full"
                >
                  Solicitar novo link
                </Button>
                <Button
                  onClick={() => navigate('/auth')}
                  variant="outline"
                  className="w-full"
                >
                  Voltar para login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md border-glass bg-glass/95 backdrop-blur-lg shadow-elegant">
          <CardHeader className="space-y-4 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="mb-4">
                <img src={ethraLogo} alt="Ethra Logo" className="h-48 w-auto" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Redefinir Senha</CardTitle>
            <CardDescription className="text-base">
              Crie uma nova senha segura para sua conta
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Digite sua nova senha"
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    maxLength={100}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                {password && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground">
                      {password.length >= 6 ? (
                        <span className="text-green-600">✓ Mínimo 6 caracteres</span>
                      ) : (
                        <span>Mínimo 6 caracteres ({password.length}/6)</span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Digite novamente a senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    maxLength={100}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-ethra hover:bg-ethra/90"
                disabled={loading || password.length < 6}
              >
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Enviando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Enviar Nova Senha
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }
