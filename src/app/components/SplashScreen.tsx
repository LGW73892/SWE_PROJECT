import { useEffect, useRef } from "react";

interface Props { onComplete: () => void; }

export default function SplashScreen({ onComplete }: Props) {
    const topRef = useRef<HTMLDivElement>(null);
    const botRef = useRef<HTMLDivElement>(null);
    const text1Ref = useRef<HTMLSpanElement>(null);
    const text2Ref = useRef<HTMLSpanElement>(null);
    const counterRef = useRef<HTMLSpanElement>(null);
    const btnWrapRef = useRef<HTMLDivElement>(null);
    const btnRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const top = topRef.current;
        const bot = botRef.current;
        const t1 = text1Ref.current;
        const t2 = text2Ref.current;
        const counter = counterRef.current;
        const btnWrap = btnWrapRef.current;
        const btn = btnRef.current;
        if (!top || !bot || !t1 || !t2 || !counter || !btnWrap || !btn) return;

        const timers: ReturnType<typeof setTimeout>[] = [];
        const after = (fn: () => void, ms: number) =>
            timers.push(setTimeout(fn, ms));

        after(() => t1.classList.add("in"), 120);
        after(() => t2.classList.add("in"), 240);

        after(() => {
            counter.classList.add("in");
            let n = 0;
            const tick = setInterval(() => {
                n += Math.floor(Math.random() * 8) + 2;
                if (n >= 100) {
                    n = 100;
                    clearInterval(tick);
                    counter.textContent = "100%";
                    after(() => counter.classList.add("out"), 300);
                    after(() => btn.classList.add("in"), 500);
                } else {
                    counter.textContent = String(n).padStart(3, "0") + "%";
                }
            }, 60);
        }, 400);

        const handleEnter = () => {
            top.style.transition = "transform 0.9s cubic-bezier(0.76,0,0.24,1)";
            bot.style.transition = "transform 0.9s cubic-bezier(0.76,0,0.24,1)";
            top.classList.add("gone");
            bot.classList.add("gone");
            after(onComplete, 950);
        };

        btn.addEventListener("click", handleEnter);
        return () => {
            timers.forEach(clearTimeout);
            btn.removeEventListener("click", handleEnter);
        };
    }, [onComplete]);

    return (
        <>
            <style>{`
        .sd-top, .sd-bot {
          position: fixed; left: 0; right: 0; background: #0f1a14;
          z-index: 9999; transition: none;
        }
        .sd-top { top: 0; height: 50vh; display: flex; flex-direction: column;
          align-items: center; justify-content: flex-end; padding-bottom: 22px; gap: 8px; }
        .sd-bot { bottom: 0; height: 50vh; display: flex; flex-direction: column;
          align-items: center; justify-content: flex-start; padding-top: 22px; }
        .sd-top.gone { transform: translateY(-100%); }
        .sd-bot.gone { transform: translateY(100%); }
        .sd-clip { overflow: hidden; }
        .sd-welcome { display: block; color: #f5f0e8; font-size: clamp(36px,6vw,64px);
          font-weight: 700; font-family: Georgia, serif; letter-spacing: -0.01em;
          transform: translateY(110%); transition: transform 0.7s cubic-bezier(0.76,0,0.24,1); }
        .sd-welcome.in { transform: translateY(0); }
        .sd-brand { display: block; font-size: 11px; letter-spacing: 0.35em;
          text-transform: uppercase; color: #4a9e74; font-family: sans-serif;
          transform: translateY(110%); transition: transform 0.6s cubic-bezier(0.76,0,0.24,1) 0.1s; }
        .sd-brand.in { transform: translateY(0); }

        .sd-swap {
          position: relative; display: flex; align-items: center;
          justify-content: center; height: 44px; width: 200px;
        }
        .sd-counter { position: absolute; font-size: 13px; letter-spacing: 0.2em;
          color: rgba(255,255,255,0.25); font-family: sans-serif;
          transform: translateY(-110%); opacity: 1;
          transition: transform 0.6s cubic-bezier(0.76,0,0.24,1), opacity 0.4s ease; }
        .sd-counter.in { transform: translateY(0); }
        .sd-counter.out { opacity: 0; transform: translateY(-110%); }

        .sd-btn-clip { position: absolute; overflow: hidden; }
        .sd-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 24px; border: 1px solid rgba(245,240,232,0.3);
          border-radius: 999px; background: transparent; color: #f5f0e8;
          font-family: sans-serif; font-size: 12px; letter-spacing: 0.2em;
          text-transform: uppercase; cursor: pointer; position: relative; overflow: hidden;
          transform: translateY(110%); transition: transform 0.6s cubic-bezier(0.76,0,0.24,1);
          white-space: nowrap;
        }
        .sd-btn.in { transform: translateY(0); }
        .sd-btn-fill { position: absolute; inset: 0; background: #f5f0e8;
          border-radius: 999px; transform: translateX(-101%);
          transition: transform 0.4s cubic-bezier(0.76,0,0.24,1); }
        .sd-btn:hover .sd-btn-fill { transform: translateX(0); }
        .sd-btn-label { position: relative; z-index: 1; transition: color 0.4s ease; }
        .sd-btn:hover .sd-btn-label { color: #0f1a14; }
        .sd-btn-piece { position: relative; z-index: 1; font-size: 14px;
          opacity: 0; transform: translateX(-8px);
          transition: opacity 0.3s ease 0.1s, transform 0.3s ease 0.1s, color 0.4s ease; }
        .sd-btn:hover .sd-btn-piece { opacity: 1; transform: translateX(0); color: #0f1a14; }
        .sd-line { position: fixed; left: 0; right: 0; top: 50vh; height: 1px;
          background: rgba(255,255,255,0.04); z-index: 10000; pointer-events: none; }
      `}</style>

            <div ref={topRef} className="sd-top">
                <div className="sd-clip">
                    <span ref={text1Ref} className="sd-welcome">Welcome.</span>
                </div>
                <div className="sd-clip">
                    <span ref={text2Ref} className="sd-brand">Silicon Defense</span>
                </div>
            </div>

            <div ref={botRef} className="sd-bot">
                <div className="sd-swap">
                    <span ref={counterRef} className="sd-counter">000%</span>
                    <div ref={btnWrapRef} className="sd-btn-clip">
                        <button ref={btnRef} className="sd-btn">
                            <div className="sd-btn-fill" />
                            <span className="sd-btn-label">Enter the Board</span>
                            <span className="sd-btn-piece">♚</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="sd-line" />
        </>
    );
}