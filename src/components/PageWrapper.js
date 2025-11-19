import React, { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { useLocation } from "react-router-dom";

function PageWrapper({ children }) {
  const containerRef = useRef(null);
  const location = useLocation();

  useLayoutEffect(() => {
    const animation = gsap.context(() => {
      const path = location.pathname;
      const fromPath = location.state?.from || "/";

      const isHome = path === "/";
      const isSummary = path === "/summary";
      const isCompare = path === "/compare";

      let fromVars = {};
      let toVars = {};
      let exitVars = {};

      if ((isSummary || isCompare) && fromPath === "/") {
        fromVars = { opacity: 0, scale: 0.92 };
        toVars = { opacity: 1, scale: 1, duration: 0.45, ease: "power2.out" };
        exitVars = { opacity: 0, scale: 0.96, duration: 0.25 };
      }

      if (isSummary && fromPath === "/compare") {
        fromVars = { x: "-100%", opacity: 0.9 };
        toVars = { x: "0%", opacity: 1, duration: 0.45 };
        exitVars = { x: "30%", opacity: 0.9, duration: 0.25 };
      }

      if (isCompare && fromPath === "/summary") {
        fromVars = { x: "100%", opacity: 0.9 };
        toVars = { x: "0%", opacity: 1, duration: 0.45 };
        exitVars = { x: "-30%", opacity: 0.9, duration: 0.25 };
      }

      if (isHome && (fromPath === "/summary" || fromPath === "/compare")) {
        fromVars = { y: "50%", opacity: 0 };
        toVars = { y: "0%", opacity: 1, duration: 0.45 };
        exitVars = { y: "-50%", opacity: 0, duration: 0.25 };
      }

      if (Object.keys(fromVars).length === 0) {
        fromVars = { opacity: 0 };
        toVars = { opacity: 1, duration: 0.3 };
      }

      gsap.fromTo(containerRef.current, fromVars, toVars);

      return () => gsap.to(containerRef.current, exitVars);
    }, containerRef);

    return () => animation.revert();
  }, [location.pathname]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

export default PageWrapper;
