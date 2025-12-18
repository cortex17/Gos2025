import { useLayoutEffect, useRef, cloneElement, isValidElement } from "react";

import gsap from "gsap";

export default function FlashCard({ children, triggerKey }: { children: React.ReactNode; triggerKey: string }) {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;

    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(el, { y: -12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.28, ease: "power2.out" });

      gsap.fromTo(el, { boxShadow: "0 0 0 rgba(0,0,0,0)" }, { boxShadow: "0 12px 30px rgba(0,0,0,0.18)", duration: 0.35 });
    }, el);

    return () => ctx.revert();
  }, [triggerKey]);

  // Если children - это React элемент, передаем ему ref напрямую
  if (isValidElement(children)) {
    return cloneElement(children, { ref } as any);
  }

  // Иначе оборачиваем в div
  return <div ref={ref as any}>{children}</div>;
}

