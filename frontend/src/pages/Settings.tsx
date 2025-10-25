import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Mail, Shield, Bell, Wallet, LogOut, Camera } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Perfil atualizado com sucesso!");
    }, 1500);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Senha alterada com sucesso!");
    }, 1500);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logout realizado com sucesso!");
      navigate("/auth");
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer logout.");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h2 className="text-3xl font-bold mb-2">Configurações</h2>
          <p className="text-muted-foreground">Gerencie seu perfil e preferências da conta</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
            <TabsTrigger value="wallet">Wallet</TabsTrigger>
          </TabsList>

          {/* Perfil Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
              <div className="flex items-center gap-6 mb-6">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      JS
                    </AvatarFallback>
                  </Avatar>
                  <Button 
                    size="icon" 
                    variant="outline" 
                    className="absolute -bottom-2 -right-2 rounded-full"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-1">João Silva</h3>
                  <p className="text-muted-foreground">joao.silva@email.com</p>
                  <p className="text-sm text-gold mt-1">Membro desde Mar 2024</p>
                </div>
              </div>

              <Separator className="mb-6" />

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nome</Label>
                    <Input 
                      id="firstName" 
                      defaultValue="João"
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Sobrenome</Label>
                    <Input 
                      id="lastName" 
                      defaultValue="Silva"
                      className="bg-background/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    defaultValue="joao.silva@email.com"
                    className="bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input 
                    id="phone" 
                    type="tel"
                    placeholder="+55 (11) 98765-4321"
                    className="bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Input 
                    id="bio" 
                    placeholder="Conte um pouco sobre você"
                    className="bg-background/50"
                  />
                </div>

                <Button 
                  type="submit" 
                  variant="hero"
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                >
                  {isLoading ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </form>
            </Card>
          </TabsContent>

          {/* Segurança Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-6 h-6 text-primary" />
                <div>
                  <h3 className="text-xl font-semibold">Alterar Senha</h3>
                  <p className="text-sm text-muted-foreground">Mantenha sua conta segura</p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Senha Atual</Label>
                  <Input 
                    id="currentPassword" 
                    type="password"
                    className="bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input 
                    id="newPassword" 
                    type="password"
                    className="bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password"
                    className="bg-background/50"
                  />
                </div>

                <Button 
                  type="submit" 
                  variant="hero"
                  disabled={isLoading}
                >
                  {isLoading ? "Alterando..." : "Alterar Senha"}
                </Button>
              </form>
            </Card>

            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold mb-1">Autenticação de Dois Fatores (2FA)</h4>
                  <p className="text-sm text-muted-foreground">
                    Adicione uma camada extra de segurança
                  </p>
                </div>
                <Switch />
              </div>
              
              <Separator className="my-4" />

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold mb-1">Sessões Ativas</h4>
                  <p className="text-sm text-muted-foreground">
                    Gerencie dispositivos conectados
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Ver Sessões
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Notificações Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
              <div className="flex items-center gap-3 mb-6">
                <Bell className="w-6 h-6 text-primary" />
                <div>
                  <h3 className="text-xl font-semibold">Preferências de Notificações</h3>
                  <p className="text-sm text-muted-foreground">Configure como deseja ser notificado</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Novos investidores</p>
                    <p className="text-sm text-muted-foreground">
                      Quando alguém adquirir seus tokens
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Votações</p>
                    <p className="text-sm text-muted-foreground">
                      Novas propostas e resultados
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Movimentações de mercado</p>
                    <p className="text-sm text-muted-foreground">
                      Variações significativas nos preços
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Status de documentos</p>
                    <p className="text-sm text-muted-foreground">
                      Atualizações sobre validação de RWA
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Newsletter</p>
                    <p className="text-sm text-muted-foreground">
                      Novidades e atualizações da plataforma
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Wallet Tab */}
          <TabsContent value="wallet" className="space-y-6">
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
              <div className="flex items-center gap-3 mb-6">
                <Wallet className="w-6 h-6 text-primary" />
                <div>
                  <h3 className="text-xl font-semibold">Carteiras Conectadas</h3>
                  <p className="text-sm text-muted-foreground">Gerencie suas wallets Solana</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 border border-border rounded-lg bg-background/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Phantom Wallet</p>
                        <code className="text-xs text-muted-foreground">
                          9wqT...xYz3
                        </code>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded text-xs bg-secondary/20 text-secondary">
                      Principal
                    </span>
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  <Wallet className="mr-2" />
                  Conectar Nova Wallet
                </Button>
              </div>
            </Card>

            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
              <h4 className="font-semibold mb-4">Wallets Suportadas</h4>
              <div className="grid grid-cols-3 gap-3">
                {["Phantom", "Solflare", "Backpack"].map((wallet) => (
                  <div 
                    key={wallet}
                    className="p-4 border border-border rounded-lg text-center hover:border-primary transition-colors cursor-pointer"
                  >
                    <p className="text-sm font-medium">{wallet}</p>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Zona de Perigo */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-destructive/50">
          <h3 className="text-xl font-semibold mb-4 text-destructive">Zona de Perigo</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <p className="font-medium">Desconectar da conta</p>
                <p className="text-sm text-muted-foreground">
                  Você poderá fazer login novamente a qualquer momento
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <p className="font-medium">Excluir conta</p>
                <p className="text-sm text-muted-foreground">
                  Esta ação não pode ser desfeita
                </p>
              </div>
              <Button variant="destructive">
                Excluir Conta
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
