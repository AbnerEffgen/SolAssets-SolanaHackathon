import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Coins, ShieldCheck, TrendingUp, Wallet, Vote, LineChart } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-tokenization.jpg";

const Landing = () => {
  const features = [
    {
      icon: Coins,
      title: "Crie tokens sem código",
      description: "Emita seus próprios tokens em minutos, sem necessidade de conhecimento técnico"
    },
    {
      icon: ShieldCheck,
      title: "Conecte ativos reais (RWA)",
      description: "Valide e tokenize ativos físicos com segurança e transparência"
    },
    {
      icon: TrendingUp,
      title: "Negocie e acompanhe rendimentos",
      description: "Mercado secundário P2P e dashboard completo de análises"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              SolAssets
            </h1>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-foreground/80 hover:text-primary transition-colors">
              Recursos
            </a>
            <a href="#how-it-works" className="text-foreground/80 hover:text-primary transition-colors">
              Como funciona
            </a>
            <Link to="/auth">
              <Button variant="outline">Entrar</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Tokenize qualquer ativo em{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  minutos
                </span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Crie, gerencie e negocie tokens de ativos reais com segurança e transparência on-chain no ecossistema Solana
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/auth">
                  <Button variant="hero" size="lg" className="w-full sm:w-auto">
                    Começar agora
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Ver demonstração
                </Button>
              </div>
            </div>
            <div className="relative animate-slide-up">
              <img 
                src={heroImage} 
                alt="Tokenização de ativos" 
                className="rounded-2xl shadow-card"
              />
              <div className="absolute -bottom-6 -left-6 bg-card/80 backdrop-blur-sm p-4 rounded-xl border border-border">
                <div className="flex items-center gap-2 text-secondary">
                  <LineChart className="w-5 h-5" />
                  <span className="text-sm font-semibold">Powered by Solana</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold mb-4">
              Tokenização sem complexidade
            </h3>
            <p className="text-xl text-muted-foreground">
              Tudo que você precisa para emitir, gerenciar e negociar tokens
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className="p-8 bg-card/50 backdrop-blur-sm border-border hover:border-primary transition-all duration-300 hover:shadow-glow animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h4 className="text-xl font-semibold mb-3">{feature.title}</h4>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-4 bg-card/20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold mb-4">
              Como funciona
            </h3>
            <p className="text-xl text-muted-foreground">
              Três passos simples para começar
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { step: "01", title: "Conecte sua wallet", description: "Phantom, Solflare ou Backpack" },
              { step: "02", title: "Crie seu token", description: "Configure e emita em minutos" },
              { step: "03", title: "Gerencie e negocie", description: "Dashboard completo e mercado P2P" }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="text-6xl font-bold text-primary/20 mb-4">{item.step}</div>
                <h4 className="text-xl font-semibold mb-2">{item.title}</h4>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <Card className="p-12 bg-gradient-primary text-primary-foreground text-center border-0">
            <h3 className="text-4xl font-bold mb-4">
              Pronto para começar?
            </h3>
            <p className="text-xl mb-8 opacity-90">
              Junte-se aos pioneiros da tokenização de ativos reais
            </p>
            <Link to="/auth">
              <Button variant="gold" size="lg">
                Criar conta gratuita
              </Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Wallet className="w-6 h-6 text-primary" />
            <span className="font-semibold">SolAssets</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Powered by Solana
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              Twitter
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              Discord
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
