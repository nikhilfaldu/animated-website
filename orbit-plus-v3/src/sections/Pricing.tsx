import { motion, useScroll, useTransform, LayoutGroup, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { MOTION } from '@/styles/motion';
import { useIsMobile } from '@/hooks/useResponsive';

interface PricingTier {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  highlight?: boolean;
}

const pricingTiers: PricingTier[] = [
  { 
    id: 'starter', 
    name: 'Starter', 
    price: '$5K', 
    description: 'Perfect for small businesses ready to level up', 
    features: [
      '5-page responsive website',
      'CMS integration',
      'Basic SEO setup',
      '1 month support'
    ]
  },
  { 
    id: 'growth', 
    name: 'Growth', 
    price: '$15K', 
    description: 'For brands ready to scale and compete', 
    features: [
      'Custom web application',
      'Design system',
      'Advanced animations',
      'Performance optimization',
      '3 months support'
    ], 
    highlight: true
  },
  { 
    id: 'pro', 
    name: 'Pro', 
    price: '$35K', 
    description: 'Enterprise-grade digital experiences', 
    features: [
      'Full-stack application',
      'Custom backend',
      'API integrations',
      'Analytics dashboard',
      '6 months support'
    ]
  },
  { 
    id: 'custom', 
    name: 'Custom', 
    price: 'Let\'s talk', 
    description: 'Tailored solutions for unique challenges', 
    features: [
      'Bespoke everything',
      'Dedicated team',
      'Strategic consulting',
      'Ongoing partnership'
    ]
  },
];

export function Pricing() {
  const prefersReducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  // Subtle scroll-based scale and opacity effects
  const scale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.95, 1, 1, 0.95]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.5, 1, 1, 0.5]);

  useEffect(() => {
    if (isMobile && expandedCard !== null) {
      setExpandedCard(null);
    }
  }, [isMobile, expandedCard]);

  const handleCardExpand = (cardId: string | null) => {
    if (isMobile) return;
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  return (
    <section ref={sectionRef} id="pricing" className="section min-h-[140vh] flex items-center justify-center">
      <motion.div 
        className="w-full max-w-7xl mx-auto px-6"
        style={{ scale, opacity }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: prefersReducedMotion ? 0 : MOTION.d.medium, ease: MOTION.ease.clarity }}
          className="text-center mb-16"
        >
          <h2 className="h1 display mb-4">
            Investment levels.
          </h2>
          <p className="p text-lg opacity-70 max-w-2xl mx-auto">
            Transparent pricing for ambitious projects. Every package includes strategy, design, and development.
          </p>
        </motion.div>

        <LayoutGroup>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricingTiers.map((tier, index) => (
              <motion.div
                key={tier.id}
                layoutId={tier.id}
                className={`relative p-6 rounded-lg border transition-all ${isMobile ? 'cursor-default' : 'cursor-pointer'} ${
                  tier.highlight 
                    ? 'border-white/40 bg-white/5' 
                    : 'border-white/20 hover:border-white/30'
                } ${
                  !isMobile && expandedCard === tier.id 
                    ? 'md:col-span-2 lg:col-span-2 row-span-2' 
                    : ''
                }`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: prefersReducedMotion ? 0 : MOTION.d.medium,
                  delay: prefersReducedMotion ? 0 : index * 0.1,
                  ease: MOTION.ease.clarity,
                  layout: { duration: prefersReducedMotion ? 0 : MOTION.d.base }
                }}
                onClick={isMobile ? undefined : () => handleCardExpand(tier.id)}
              >
                {tier.highlight && (
                  <motion.div
                    className="absolute -top-3 left-6 px-3 py-1 bg-white text-black text-xs font-bold rounded"
                    layoutId={`${tier.id}-badge`}
                  >
                    POPULAR
                  </motion.div>
                )}

                <motion.div layout="position">
                  <h3 className="h2 mb-2">{tier.name}</h3>
                  <div className="h0 mb-4">{tier.price}</div>
                  <p className="p text-sm opacity-70 mb-6">
                    {tier.description}
                  </p>
                </motion.div>

                <motion.ul className="space-y-3" layout>
                  {tier.features.map((feature, i) => (
                    <motion.li
                      key={i}
                      className="flex items-start gap-3 text-sm"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ 
                        opacity: expandedCard === tier.id ? 1 : 0.7,
                        x: 0
                      }}
                      transition={{ delay: expandedCard === tier.id ? i * 0.05 : 0 }}
                    >
                      <span className="text-white/50 mt-1">→</span>
                      <span>{feature}</span>
                    </motion.li>
                  ))}
                </motion.ul>

                {(isMobile || expandedCard === tier.id) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-8"
                  >
                    <button className="btn w-full">
                      {tier.id === 'custom' ? 'Schedule Call' : 'Get Started'}
                    </button>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </LayoutGroup>

        <motion.p
          className="text-center text-sm opacity-50 mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.5 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
        >
          All prices are starting points. Final quotes based on project scope.
        </motion.p>
      </motion.div>
    </section>
  );
}
