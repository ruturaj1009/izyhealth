import React from 'react';
import styles from './preloader.module.css';

interface PreloaderProps {
    text?: string;
    fullPage?: boolean;
    size?: 'small' | 'medium' | 'large';
    className?: string;
}

const Preloader: React.FC<PreloaderProps> = ({ 
    text = 'Loading...', 
    fullPage = false, 
    size = 'medium',
    className = ''
}) => {
    return (
        <div className={`${styles.wrapper} ${fullPage ? styles.fullPage : ''} ${styles[size]} ${className}`}>
            <div className={styles.loaderContainer}>
                <div className={styles.spinner}></div>
                <div className={styles.innerPulse}></div>
            </div>
            {text && <p className={styles.text}>{text}</p>}
        </div>
    );
};

export default Preloader;
