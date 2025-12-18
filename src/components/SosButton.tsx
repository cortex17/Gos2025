import { useLayoutEffect, useRef } from "react";

import { Button } from "@mui/material";

import gsap from "gsap";

export default function SosButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  const ref = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;

    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.to(el, { scale: 1.04, yoyo: true, repeat: -1, duration: 0.9, ease: "sine.inOut" });
    }, el);

    return () => ctx.revert();
  }, []);

  const boom = () => {
    const el = ref.current;

    if (!el) return;

    gsap.timeline()
      .to(el, { scale: 1.12, duration: 0.08, ease: "power2.out" })
      .to(el, { x: -6, duration: 0.05 })
      .to(el, { x: 6, duration: 0.05 })
      .to(el, { x: 0, scale: 1.0, duration: 0.12, ease: "power2.inOut" });
  };

  return (
    <Button
      ref={ref}
      variant="contained"
      color="error"
      disabled={disabled}
      onClick={() => {
        boom();
        onClick();
      }}
      sx={{ borderRadius: 999, px: 3, position: "relative", overflow: "hidden" }}
    >
      SOS
    </Button>
  );
}

