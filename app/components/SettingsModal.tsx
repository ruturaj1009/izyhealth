'use client';
import { useState } from 'react';
import Link from 'next/link';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    if (!isOpen) return null;

    const settingsOptions = [
        {
            title: 'Bill Print Settings',
            icon: '🖨️',
            href: '/settings/bill-print',
            description: 'Configure bill print layout'
        },
        {
            title: 'Report Letterhead & Signature',
            icon: '✍️',
            href: '/settings/report-print',
            description: 'Configure report print settings'
        },
        {
            title: 'Report App Shortcut Keys',
            icon: '⌨️',
            href: '#',
            description: 'Coming soon',
            disabled: true
        }
    ];

    return (
        <div 
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
            }}
            onClick={onClose}
        >
            <div 
                style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '30px',
                    maxWidth: '800px',
                    width: '90%',
                    maxHeight: '80vh',
                    overflowY: 'auto'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', margin: 0 }}>Settings</h2>
                    <button 
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '24px',
                            cursor: 'pointer',
                            color: '#64748b',
                            padding: '0',
                            width: '30px',
                            height: '30px'
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Settings Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '20px'
                }}>
                    {settingsOptions.map((option, index) => (
                        option.disabled ? (
                            <div
                                key={index}
                                style={{
                                    background: '#f8fafc',
                                    borderRadius: '8px',
                                    padding: '24px',
                                    textAlign: 'center',
                                    border: '2px solid #e2e8f0',
                                    opacity: 0.6,
                                    cursor: 'not-allowed'
                                }}
                            >
                                <div style={{ fontSize: '48px', marginBottom: '12px' }}>{option.icon}</div>
                                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                                    {option.title}
                                </h3>
                                <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                                    {option.description}
                                </p>
                            </div>
                        ) : (
                            <Link
                                key={index}
                                href={option.href}
                                onClick={onClose}
                                style={{
                                    background: 'white',
                                    borderRadius: '8px',
                                    padding: '24px',
                                    textAlign: 'center',
                                    border: '2px solid #e2e8f0',
                                    textDecoration: 'none',
                                    transition: 'all 0.2s',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#3b82f6';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div style={{ fontSize: '48px', marginBottom: '12px' }}>{option.icon}</div>
                                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>
                                    {option.title}
                                </h3>
                                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                                    {option.description}
                                </p>
                            </Link>
                        )
                    ))}
                </div>
            </div>
        </div>
    );
}
