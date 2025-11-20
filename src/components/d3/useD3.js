import { useRef, useEffect } from "react";

export default function useD3(renderFn, deps) {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    renderFn(element);

    return () => {
      if (element && element instanceof HTMLElement) {
        element.innerHTML = "";
      }
    };
  }, deps);

  return ref;
}
