import { Dialog, DialogContent } from './dialog';
import { Button } from './button';
import { Sparkles, MessageCircle, PartyPopper } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MatchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  matchedUserName: string;
  matchId: string;
}

export const MatchDialog = ({ isOpen, onClose, matchedUserName, matchId }: MatchDialogProps) => {
  const navigate = useNavigate();

  const handleStartChat = () => {
    navigate(`/chat/${matchId}`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center p-8 rounded-3xl border-none gradient-secondary">
        {/* Confetti effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: ['#f0abfc', '#fcd34d', '#c084fc', '#fb7185'][i % 4],
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>

        <div className="relative z-10">
          {/* Party icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full gradient-primary flex items-center justify-center shadow-glow animate-bounce-subtle">
            <PartyPopper className="w-10 h-10 text-primary-foreground" />
          </div>

          {/* Title */}
          <h2 className="text-3xl font-serif font-bold text-gradient mb-2">
            It's a Match!
          </h2>
          
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-accent animate-sparkle" />
            <p className="text-muted-foreground">
              You and <span className="font-semibold text-foreground">{matchedUserName}</span> are going to prom!
            </p>
            <Sparkles className="w-5 h-5 text-accent animate-sparkle" />
          </div>

          <p className="text-sm text-muted-foreground mb-8">
            Start chatting now and plan your perfect prom night together!
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              onClick={handleStartChat}
              className="w-full rounded-xl gradient-primary hover:opacity-90 shadow-glow"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Start Chatting
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full rounded-xl text-muted-foreground hover:text-foreground"
            >
              Keep Discovering
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
