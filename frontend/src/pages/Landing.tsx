import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Coins, ShieldCheck, TrendingUp, Wallet, LineChart } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-tokenization.jpg";
import logo from "@/assets/logo.svg";
import { WavyBackground } from "@/components/ui/background";

const Landing = () => {
  const features = [
    {
      icon: Coins,
      title: "No-Code Token Creation",
      description: "Issue your own tokens in minutes, no technical knowledge required"
    },
    {
      icon: ShieldCheck,
      title: "Connect Real-World Assets (RWA)",
      description: "Validate and tokenize physical assets with security and transparency"
    },
    {
      icon: TrendingUp,
      title: "Trade and Track Performance",
      description: "P2P secondary market and a complete analytics dashboard"
    }
  ];

  return (
    <div className="min-h-screen">
      <WavyBackground
        backgroundFill="hsl(var(--background))"
        colors={["#38bdf8", "#818cf8", "#c084fc", "#e879f9", "#22d3ee"]}
        waveWidth={10}
        blur={5}
      />
      {/* Header */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-md bg-black border-b border-neutral-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <img src={logo} alt="SolAssets Logo" className="h-10" />
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-foreground/80 hover:text-primary transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-foreground/80 hover:text-primary transition-colors">
              How it works
            </a>
            <Link to="/auth">
              <Button variant="hero">Sign In</Button>
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
                Tokenize any asset in{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  minutes
                </span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Create, manage, and trade real-world asset tokens with on-chain security and transparency in the Solana ecosystem.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/auth">
                  <Button variant="hero" size="lg" className="w-full sm:w-auto">
                    Connect Wallet
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  View Demo
                </Button>
              </div>
            </div>
            <div className="relative animate-slide-up">
              <img
                src={heroImage}
                alt="Asset tokenization"
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
              Tokenization Made Simple
            </h3>
            <p className="text-xl text-muted-foreground">
              Everything you need to issue, manage, and trade tokens
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
              How It Works
            </h3>
            <p className="text-xl text-muted-foreground">
              Three simple steps to get started
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { step: "#1", title: "Connect your wallet", description: "Phantom, Solflare, or Backpack" },
              { step: "#2", title: "Create your token", description: "Configure and issue in minutes" },
              { step: "#3", title: "Manage and trade", description: "Full dashboard and P2P marketplace" }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">{item.step}</div>
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
              Ready to get started?
            </h3>
            <p className="text-xl mb-8 opacity-90">
              Join the pioneers of real-world asset tokenization
            </p>
            <Link to="/auth">
              <Button variant="gold" size="lg">
                Connect Wallet
              </Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <img src={logo} alt="SolAssets Logo" className="h-8" />
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