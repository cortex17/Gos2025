import { useLayoutEffect, useRef } from "react";

import { useLocation } from "react-router-dom";

import gsap from "gsap";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  const loc = useLocation();

  useLayoutEffect(() => {
    const el = ref.current;

    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { autoAlpha: 0, y: 10, filter: "blur(6px)" },
        { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.35, ease: "power2.out" }
      );
    }, el);

    return () => ctx.revert();
  }, [loc.pathname]);

  return <div ref={ref}>{children}</div>;
}

