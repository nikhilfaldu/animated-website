import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useOrbitSystem } from '@/context/OrbitSystem';
import { MOTION } from '@/styles/motion';

export function Contact() {
  const prefersReducedMotion = useReducedMotion();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const resetTimeoutRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  
  const { animateTo } = useOrbitSystem();

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (resetTimeoutRef.current !== null) {
        window.clearTimeout(resetTimeoutRef.current);
        resetTimeoutRef.current = null;
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !message) return;
    
    setIsSubmitting(true);
    // TODO: This global emblem state change is placeholder; reroute via ScrollController choreography when Contact scene is designed.
    animateTo('vortex', MOTION.d.long);

    await new Promise(resolve => setTimeout(resolve, 2000));
    if (!isMountedRef.current) return;

    setIsSubmitting(false);
    setIsSubmitted(true);
    setEmail('');
    setMessage('');

    if (resetTimeoutRef.current !== null) {
      window.clearTimeout(resetTimeoutRef.current);
    }
    resetTimeoutRef.current = window.setTimeout(() => {
      if (!isMountedRef.current) return;
      animateTo('idle', MOTION.d.medium);
    }, 3000);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section id="contact" className="section min-h-[120vh] flex items-center justify-center">
      <div className="w-full max-w-2xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: prefersReducedMotion ? 0 : MOTION.d.medium, ease: MOTION.ease.clarity }}
        >
          <h2 className="h1 display mb-6">
            Let's Build Something Different.
          </h2>
          <p className="p text-lg mb-12 opacity-70">
            Have a project in mind? Tell me about it. I'll get back to you with a clear path forward.
          </p>
        </motion.div>

        {!isSubmitted ? (
          <motion.form
            ref={formRef}
            onSubmit={handleSubmit}
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: MOTION.d.medium, delay: 0.2, ease: MOTION.ease.clarity }}
          >
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                required
                className="w-full px-6 py-4 bg-white/5 border border-white/20 rounded-lg 
                         focus:border-white/40 focus:bg-white/10 transition-all
                         placeholder:text-white/30 text-white outline-none"
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell me about your project"
                required
                rows={6}
                className="w-full px-6 py-4 bg-white/5 border border-white/20 rounded-lg 
                         focus:border-white/40 focus:bg-white/10 transition-all
                         placeholder:text-white/30 text-white outline-none resize-none"
                disabled={isSubmitting}
              />
            </div>

            <motion.button
              type="submit"
              className="btn-primary px-12 py-4 text-lg"
              disabled={isSubmitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-3">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: MOTION.d.medium * 2, repeat: Infinity, ease: "linear" }}
                  >
                    ⟳
                  </motion.span>
                  Building momentum...
                </span>
              ) : (
                'Let\'s Accelerate →'
              )}
            </motion.button>
          </motion.form>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: prefersReducedMotion ? 0 : MOTION.d.base, ease: MOTION.ease.clarity }}
            className="py-12"
          >
            <div className="h0 mb-4">✓</div>
            <h3 className="h2 mb-4">Message received!</h3>
            <p className="p opacity-70 mb-8">
              I'll review your project and get back to you within 24 hours.
            </p>
            <button onClick={() => setIsSubmitted(false)} className="btn">
              Send another message
            </button>
          </motion.div>
        )}

        <motion.div 
          className="mt-24"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <button
            onClick={scrollToTop}
            className="group flex flex-col items-center gap-4 mx-auto opacity-50 hover:opacity-100 transition-opacity"
          >
            <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: MOTION.d.long * 3, repeat: Infinity }}>
              ↑
            </motion.div>
            <span className="text-sm">Back to top</span>
          </button>
        </motion.div>
      </div>
    </section>
  );
}
