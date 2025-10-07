import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ethraLogo from '@/assets/ethra-logo.png';
import { z } from 'zod';

const emailSchema = z.object({
  email: z.string()
    .trim()
    .min(1, "Email é obrigatório")
    .email("Email inválido")
    .max(255, "Email muito longo"),
});

export default function RecuperarSenha() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
    // Validar email
    const validation = emailSchema.safeParse({ email });
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    setLoading(true);

    try {
      // Verificar se o email existe no banco
      const { data: userExists, error: checkError } = await supabase
        .from('usuarios')
        .select('email')
        .eq('email', email.trim())
        .maybeSingle();

      if (checkError) {
        console.error('Erro ao verificar email:', checkError);
        setError('Erro ao verificar email. Tente novamente.');
        setLoading(false);
        return;
      }

      if (!userExists) {
        // Por segurança, não informar que o email não existe
        // Mostrar mensagem genérica de sucesso
        setSuccess(true);
        setLoading(false);
        return;
      }

      // Enviar email de recuperação
      const redirectUrl = `${window.location.origin}/redefinir-senha`;
      
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: redirectUrl,
        }
      );

      if (resetError) {
        console.error('Erro ao enviar email:', resetError);
        setError('Erro ao enviar email de recuperação. Tente novamente.');
        setLoading(false);
        return;
      }

      setSuccess(true);
      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada e spam.",
      });
    } catch (err) {
      console.error('Erro inesperado:', err);
      setError('Erro inesperado. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md border-glass bg-glass/95 backdrop-blur-lg shadow-elegant">
          <CardHeader className="space-y-4 text-center">
            <div className="mb-4">
              <img src={ethraLogo} alt="Ethra Logo" className="h-48 w-auto" />
            </div>
            <CardTitle className="text-2xl font-bold">Recuperar Senha</CardTitle>
            <CardDescription className="text-base">
              Digite seu email para receber o link de recuperação
            </CardDescription>
          </CardHeader>

          <CardContent>
            {success ? (
              <div className="space-y-6">
                <Alert className="border-green-500/50 bg-green-500/10">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    <strong>Email enviado com sucesso!</strong>
                    <br />
                    Verifique sua caixa de entrada e também a pasta de spam.
                    O link é válido por 24 horas.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <Button
                    onClick={() => navigate('/auth')}
                    variant="outline"
                    className="w-full"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar para login
                  </Button>
                  
                  <Button
                    onClick={() => {
                      setSuccess(false);
                      setEmail('');
                    }}
                    variant="ghost"
                    className="w-full"
                  >
                    Reenviar email
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                      maxLength={255}
                      disabled={loading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Enviar link de recuperação
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate('/auth')}
                  className="w-full"
                  disabled={loading}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar para login
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
