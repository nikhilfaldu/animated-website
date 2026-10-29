import { motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { MOTION } from '@/styles/motion';

function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  const [n, setN] = useState(0);
  const precision = useMemo(() => {
    if (Number.isInteger(to)) return 0;
    const fractional = String(to).split('.')[1];
    return fractional ? fractional.length : 0;
  }, [to]);

  useEffect(() => {
    if (!isInView) return;

    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (rm.matches) {
      setN(to);
      return;
    }

    const duration = 1400;
    const start = Date.now();
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      const next = eased * to;
      setN(precision > 0 ? Number(next.toFixed(precision)) : Math.round(next));
      
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isInView, to, precision]);

  return (
    <span ref={ref}>
      {n.toLocaleString()}{suffix}
    </span>
  );
}

export function Proof() {
  const prefersReducedMotion = useReducedMotion();
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const metrics = [
    { value: 150, suffix: "%", label: "Average increase in engagement" },
    { value: 3.2, suffix: "x", label: "Return on investment" },
    { value: 98, suffix: "%", label: "Client satisfaction rate" },
    { value: 47, suffix: "%", label: "Reduction in bounce rate" },
  ];

  const testimonials = [
    {
      quote: "They didn't just build us a website — they built us a digital experience that our customers love.",
      author: "Sarah Chen",
      role: "Founder, Studio Minimal"
    },
    {
      quote: "Our conversion rate tripled within two months. The ROI speaks for itself.",
      author: "Marcus Rodriguez",
      role: "CEO, TechForward"
    },
    {
      quote: "Finally, a website that matches our brand's ambition. Worth every penny.",
      author: "Emma Thompson",
      role: "Creative Director, Bloom Agency"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [testimonials.length]);

  return (
    <section 
      id="proof" 
      className="section min-h-[130vh] flex items-center justify-center"
      // State transitions now handled by ScrollController
    >
      <div className="w-full max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: prefersReducedMotion ? 0 : MOTION.d.medium, ease: MOTION.ease.clarity }}
          className="text-center mb-16"
        >
          <h2 className="h1 display">
            Numbers & notes.
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-24">
          {metrics.map((metric, index) => (
            <motion.div
              key={index}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: MOTION.d.medium, delay: index * 0.1, ease: MOTION.ease.clarity }}
            >
              <div className="h0 mb-2">
                <CountUp to={metric.value} suffix={metric.suffix} />
              </div>
              <p className="text-sm opacity-70">
                {metric.label}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="relative h-64 flex items-center justify-center">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              className="absolute inset-0 flex flex-col items-center justify-center text-center px-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: activeTestimonial === index ? 1 : 0,
                y: activeTestimonial === index ? 0 : 20,
              }}
              transition={{ duration: prefersReducedMotion ? 0 : MOTION.d.base }}
            >
              <blockquote className="h2 mb-6 max-w-3xl">
                "{testimonial.quote}"
              </blockquote>
              <div>
                <p className="font-bold">{testimonial.author}</p>
                <p className="text-sm opacity-70">{testimonial.role}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center gap-2 mt-8">
          {testimonials.map((_, index) => (
            <button
              key={index}
              type="button"
              className="flex h-10 w-10 items-center justify-center"
              onClick={() => setActiveTestimonial(index)}
              aria-label={`Go to testimonial ${index + 1}`}
            >
              <span
                className={`block h-2 rounded-full transition-all ${
                  activeTestimonial === index
                    ? 'w-8 bg-white'
                    : 'w-2 bg-white/30'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
