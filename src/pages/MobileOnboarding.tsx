import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, GraduationCap, Target, Check } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import onbWelcome from '@/assets/onb-welcome.jpg';
import onbPractice from '@/assets/onb-practice.jpg';
import onbServices from '@/assets/onb-services.jpg';

type Slide = {
  eyebrow: string;
  title: string;
  description: string;
  image?: string;
};

const sharedSlides: Slide[] = [
  {
    eyebrow: 'Welcome to Edura',
    title: 'Your next step starts here',
    description:
      'Choose where you are in your education and Edura will set up the right workspace for you.',
    image: onbWelcome,
  },
  {
    eyebrow: 'Your journey',
    title: 'Where are you right now?',
    description: 'We will set up the right workspace for you.',
  },
];

const journeySlides: Record<'candidate' | 'campus', Slide[]> = {
  candidate: [
    {
      eyebrow: 'Practice',
      title: 'Prepare with real exam conditions',
      description: 'Practise JAMB, WAEC, NECO and Post-UTME with instant scoring, review and progress tracking.',
      image: onbPractice,
    },
    {
      eyebrow: 'Services',
      title: 'Applications, results and payments in one place',
      description: 'Use verified education services and manage every payment from your Edura wallet.',
      image: onbServices,
    },
  ],
  campus: [
    {
      eyebrow: 'Campus workspace',
      title: 'Organise courses, materials and deadlines',
      description: 'Keep your academic work together and get explanations that match your course and level.',
      image: onbPractice,
    },
    {
      eyebrow: 'Career readiness',
      title: 'Build projects, your CV and your next move',
      description: 'Get support for projects, SIWES, NYSC, opportunities and graduate career planning.',
      image: onbServices,
    },
  ],
};

const haptic = async (style: ImpactStyle = ImpactStyle.Light) => {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.impact({ style });
    } catch {
      /* ignore */
    }
  }
};

const MobileOnboarding = () => {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [journey, setJourney] = useState<'candidate' | 'campus' | null>(null);
  const startX = useRef<number | null>(null);
  const slides = journey ? [...sharedSlides, ...journeySlides[journey]] : sharedSlides;

  const isLast = index === slides.length - 1;
  const isJourneyStep = index === 1;
  const slide = slides[index];

  const finish = async (choice?: 'candidate' | 'campus') => {
    await haptic(ImpactStyle.Medium);
    localStorage.setItem('hasSeenMobileOnboarding', 'true');
    if (choice) localStorage.setItem('preferredJourney', choice);
    navigate('/auth', { replace: true });
  };

  const goTo = (next: number) => {
    if (next < 0 || next > slides.length - 1) return;
    if (index === 1 && next > index && !journey) return;
    haptic();
    setIndex(next);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current === null) return;
    const delta = e.changedTouches[0].clientX - startX.current;
    startX.current = null;
    if (Math.abs(delta) < 48) return;
    goTo(delta < 0 ? index + 1 : index - 1);
  };

  return (
    <div
      className="flex min-h-screen flex-col bg-background pt-safe pb-safe"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Top bar: segmented progress + skip */}
      <header className="flex items-center gap-3 px-6 pt-5">
        <div className="flex flex-1 gap-1.5">
          {slides.map((_, i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                i <= index ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
        {!isLast && (
          <button
            onClick={() => finish()}
            className="text-sm font-semibold text-muted-foreground"
          >
            Skip
          </button>
        )}
      </header>

      {/* Slide body */}
      <main key={index} className="flex flex-1 flex-col justify-center px-6 animate-fade-in">
        {slide.image && (
          <div className="mx-auto mb-8 w-full max-w-sm overflow-hidden rounded-3xl border bg-card">
            <img
              src={slide.image}
              alt=""
              loading={index === 0 ? 'eager' : 'lazy'}
              width={1024}
              height={1024}
              className="aspect-square w-full object-cover"
            />
          </div>
        )}

        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
          {slide.eyebrow}
        </p>
        <h1 className="mt-2 font-display text-[28px] font-extrabold leading-tight tracking-tight text-foreground">
          {slide.title}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          {slide.description}
        </p>

        {isJourneyStep && (
          <div className="mt-7 space-y-3">
            {[
              {
                id: 'candidate' as const,
                icon: Target,
                title: 'Preparing for an exam',
                sub: 'SS3, JAMB, WAEC, NECO or Post-UTME',
              },
              {
                id: 'campus' as const,
                icon: GraduationCap,
                title: 'Already in higher institution',
                sub: 'Undergraduate or graduate student',
              },
            ].map((option) => {
              const active = journey === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => {
                    haptic();
                    setJourney(option.id);
                  }}
                  className={`press flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors ${
                    active ? 'border-primary bg-primary/5' : 'bg-card'
                  }`}
                >
                  <span
                    className={`rounded-xl border p-2.5 ${
                      active ? 'border-primary/30 bg-primary/10' : 'bg-muted'
                    }`}
                  >
                    <option.icon className="h-5 w-5 text-primary" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-foreground">
                      {option.title}
                    </span>
                    <span className="block text-xs text-muted-foreground">{option.sub}</span>
                  </span>
                  {active && <Check className="h-4 w-4 shrink-0 text-primary" />}
                </button>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer action */}
      <footer className="px-6 pb-8 pt-4">
        <Button
          onClick={() => (isLast ? finish(journey ?? 'candidate') : goTo(index + 1))}
          disabled={isJourneyStep && !journey}
          className="press h-14 w-full rounded-2xl text-base font-bold"
        >
          {isLast ? 'Create my account' : isJourneyStep ? 'Set up my workspace' : 'Continue'}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
        {(isLast || isJourneyStep) && (
          <button
            onClick={() => finish(journey ?? undefined)}
            className="mt-3 w-full text-center text-sm font-medium text-muted-foreground"
          >
            I already have an account
          </button>
        )}
      </footer>
    </div>
  );
};

export default MobileOnboarding;
