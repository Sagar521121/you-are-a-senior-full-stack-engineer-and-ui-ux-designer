import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Sparkles, Heart, Users, ArrowRight, Crown, Shield, MessageCircle } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate(profile ? '/match' : '/profile');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-40 h-40 rounded-full gradient-primary opacity-20 blur-3xl animate-float" />
          <div className="absolute top-40 right-10 w-32 h-32 rounded-full bg-accent opacity-20 blur-3xl animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-40 left-1/4 w-48 h-48 rounded-full gradient-secondary opacity-15 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-20 right-1/4 w-36 h-36 rounded-full bg-primary opacity-10 blur-3xl animate-float" style={{ animationDelay: '0.5s' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-2xl mx-auto">
          {/* Logo */}
          <div className="mb-8 animate-slide-up">
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl gradient-primary flex items-center justify-center shadow-glow">
              <Sparkles className="w-12 h-12 text-primary-foreground" />
            </div>
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-gradient mb-4">
              PromMatch
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-light">
              Discover someone special for prom night
            </p>
          </div>


          {/* CTA */}
          <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="h-14 px-8 rounded-2xl gradient-primary hover:opacity-90 text-lg font-semibold shadow-glow"
            >
              {user ? 'Continue to App' : 'Get Started'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-sm text-muted-foreground">
              ✨ Try your luck — connect with students across universities
            </p>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
            <div className="w-1.5 h-3 rounded-full bg-muted-foreground/50" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-card/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Browse profiles, send invites, and find your match — it's that simple
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: 'Create Profile',
                description: 'Sign up with your university email and share your interests'
              },
              {
                icon: Heart,
                title: 'Explore Profiles',
                description: 'Browse students from all universities and send invites to those you vibe with'
              },
              {
                icon: MessageCircle,
                title: 'Connect & Chat',
                description: 'When you both like each other, start chatting and plan your prom night!'
              }
            ].map((feature, index) => (
              <div
                key={feature.title}
                className="text-center p-6 rounded-3xl bg-card border border-border/50 shadow-card animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center">
                  <feature.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
              Why PromMatch?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: Shield,
                title: 'Student Only',
                description: 'Sign up with your university email to join. A safe, exclusive community for students only.'
              },
              {
                icon: Heart,
                title: 'Mutual Matching',
                description: 'Both people need to show interest before a match happens. No awkward one-sided situations.'
              },
              {
                icon: Crown,
                title: 'Premium Features',
                description: 'Upgrade for unlimited daily invites, priority matching, and see who\'s interested in you.'
              }
            ].map((benefit, index) => (
              <div
                key={benefit.title}
                className="flex gap-4 p-6 rounded-2xl bg-card border border-border/50 shadow-card animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 shrink-0 rounded-xl gradient-secondary flex items-center justify-center">
                  <benefit.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-card/50">
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full gradient-gold flex items-center justify-center shadow-glow animate-heart-beat">
            <Heart className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-4">
            Ready to Find Your Match?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join students across universities and find someone special for prom night
          </p>
          <Button
            onClick={handleGetStarted}
            size="lg"
            className="h-14 px-8 rounded-2xl gradient-primary hover:opacity-90 text-lg font-semibold shadow-glow"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Start Matching
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-serif font-semibold text-gradient">PromMatch</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2026 PromMatch. Made with 💜 for university students.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
