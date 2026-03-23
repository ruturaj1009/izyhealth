'use client';
import { useState, useCallback } from 'react';
import styles from './FloatingSupport.module.css';

export default function FloatingSupport() {
    const [open, setOpen] = useState(false);
    const [tawkLoaded, setTawkLoaded] = useState(false);

    // Load Tawk.to script lazily on first AI click
    const loadTawk = useCallback(() => {
        if (tawkLoaded) return;
        const TawkAPI = ((window as any).Tawk_API = (window as any).Tawk_API || {});
        (window as any).Tawk_LoadStart = new Date();

        // Hide widget on load & re-hide when user closes chat
        TawkAPI.onLoad = () => { TawkAPI.hideWidget(); };
        TawkAPI.onChatMinimized = () => { TawkAPI.hideWidget(); };

        const s1 = document.createElement('script');
        s1.async = true;
        s1.src = 'https://embed.tawk.to/69c1834c5d04e31c35b0243a/1jkduhp3k';
        s1.charset = 'UTF-8';
        s1.setAttribute('crossorigin', '*');
        document.head.appendChild(s1);
        setTawkLoaded(true);
    }, [tawkLoaded]);

    const handleAskAI = () => {
        loadTawk();
        // Open Tawk.to chat widget
        const tryOpen = () => {
            const TawkAPI = (window as any).Tawk_API;
            if (TawkAPI && typeof TawkAPI.maximize === 'function') {
                TawkAPI.maximize();
            } else {
                setTimeout(tryOpen, 500);
            }
        };
        setTimeout(tryOpen, 800);
        setOpen(false);
    };

    return (
        <div className={styles.wrapper}>
            {/* Expanded menu */}
            <div className={`${styles.menu} ${open ? styles.menuOpen : ''}`}>
                <button onClick={handleAskAI} className={`${styles.menuItem} ${styles.aiItem}`} title="Ask AI">
                    <i className="fa fa-robot"></i>
                    <span>Ask AI</span>
                </button>
                <a href="https://wa.me/918596856901" target="_blank" rel="noopener noreferrer" className={styles.menuItem} title="WhatsApp">
                    <i className="fa fa-brands fa-whatsapp"></i>
                    <span>WhatsApp</span>
                </a>
                <a href="mailto:support@izyhealth.com" className={styles.menuItem} title="Email">
                    <i className="fa fa-envelope"></i>
                    <span>Email Us</span>
                </a>
                <a href="tel:+918596856901" className={styles.menuItem} title="Call">
                    <i className="fa fa-phone"></i>
                    <span>Call Us</span>
                </a>
            </div>

            {/* Floating button */}
            <button 
                className={`${styles.fab} ${open ? styles.fabOpen : ''}`}
                onClick={() => setOpen(!open)}
                aria-label="Support"
            >
                <span className={styles.fabIcon}>
                    <i className={`fa ${open ? 'fa-xmark' : 'fa-headset'}`}></i>
                </span>
                <span className={styles.pulse}></span>
            </button>
        </div>
    );
}

