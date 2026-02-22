'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import styles from './page.module.css';

interface AnalyticsData {
    revenue: {
        current: number;
        previous: number;
        range: string;
    };
    volume: {
        current: number;
        previous: number;
    };
    trend: Array<{
        label: string;
        value: number;
    }>;
    distribution: Array<{
        name: string;
        value: number;
    }>;
    topDoctors: Array<{
        _id: string;
        name: string;
        revenue: number;
        count: number;
    }>;
    summary: {
        totalTests: number;
        totalDoctors: number;
        totalPatients: number;
        businessName: string;
    };
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState('month'); // day, month, year

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/api/v1/analytics?range=${range}`);
                if (response.success) {
                    setData(response.data);
                }
            } catch (error) {
                console.error('Failed to fetch analytics', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [range]);

    if (loading && !data) {
        return <div className={styles.container}>Loading Amazing Insights...</div>;
    }

    if (!data) {
        return <div className={styles.container}>Could not load analytics.</div>;
    }

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(val);
    };

    const getGrowth = (current: number, previous: number) => {
        if (previous === 0) return 100;
        return ((current - previous) / previous) * 100;
    };

    const growth = getGrowth(data.revenue.current, data.revenue.previous);

    // --- CHART COMPONENTS ---

    const LineChart = ({ data }: { data: any[] }) => {
        if (!data || data.length === 0) return <div className={styles.noData}>No trend data</div>;
        
        const width = 800;
        const height = 200;
        const padding = 20;
        const maxVal = Math.max(...data.map(d => d.value), 1000);
        
        const points = data.map((d, i) => ({
            x: (i / (data.length - 1 || 1)) * (width - padding * 2) + padding,
            y: height - ((d.value / maxVal) * (height - padding * 2) + padding)
        }));

        const pathD = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
        const areaD = `${pathD} L ${points[points.length-1].x},${height} L ${points[0].x},${height} Z`;

        return (
            <div className={styles.chartWrapper}>
                <svg viewBox={`0 0 ${width} ${height}`} className={styles.lineChartSvg}>
                    <defs>
                        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <path d={areaD} fill="url(#lineGrad)" />
                    <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    {points.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#fff" stroke="#3b82f6" strokeWidth="2" />
                    ))}
                </svg>
                <div className={styles.chartLabels}>
                    {data.map((d, i) => (
                        <span key={i} className={styles.chartLabel}>{d.label}</span>
                    ))}
                </div>
            </div>
        );
    };

    const PieChart = ({ data }: { data: any[] }) => {
        if (!data || data.length === 0) return <div className={styles.noData}>No distribution data</div>;
        
        const total = data.reduce((acc, curr) => acc + curr.value, 0);
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
        
        let cumulativePercent = 0;
        
        return (
            <div className={styles.pieWrapper}>
                <svg viewBox="0 0 100 100" className={styles.pieChartSvg}>
                    {data.map((d, i) => {
                        const percent = (d.value / total) * 100;
                        const startX = 50 + 40 * Math.cos(2 * Math.PI * cumulativePercent / 100 - Math.PI / 2);
                        const startY = 50 + 40 * Math.sin(2 * Math.PI * cumulativePercent / 100 - Math.PI / 2);
                        cumulativePercent += percent;
                        const endX = 50 + 40 * Math.cos(2 * Math.PI * cumulativePercent / 100 - Math.PI / 2);
                        const endY = 50 + 40 * Math.sin(2 * Math.PI * cumulativePercent / 100 - Math.PI / 2);
                        
                        const largeArcFlag = percent > 50 ? 1 : 0;
                        const pathData = `M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
                        
                        return <path key={i} d={pathData} fill={colors[i % colors.length]} className={styles.pieSlice} />;
                    })}
                </svg>
                <div className={styles.pieLegend}>
                    {data.slice(0, 5).map((d, i) => (
                        <div key={i} className={styles.legendItem}>
                            <span className={styles.legendDot} style={{ background: colors[i % colors.length] }}></span>
                            <span className={styles.legendName}>{d.name}</span>
                            <span className={styles.legendValue}>{((d.value/total)*100).toFixed(0)}%</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleSection}>
                    <h1>Business Analytics</h1>
                    <p>Performance Overview for {data.summary.businessName}</p>
                </div>
                <div className={styles.filterGroup}>
                    {['day', 'month', 'year'].map(r => (
                        <button 
                            key={r}
                            className={`${styles.filterBtn} ${range === r ? styles.filterBtnActive : ''}`}
                            onClick={() => setRange(r)}
                        >
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                        </button>
                    ))}
                </div>
            </header>

            {/* Key Metrics */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon}`} style={{ background: '#eef2ff', color: '#6366f1' }}>💰</div>
                    <span className={styles.statLabel}>Revenue ({range})</span>
                    <h2 className={styles.statValue}>{formatCurrency(data.revenue.current)}</h2>
                    <div className={`${styles.statTrend} ${growth >= 0 ? styles.trendUp : styles.trendDown}`}>
                        {growth >= 0 ? '↑' : '↓'} {Math.abs(growth).toFixed(1)}% vs prev
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={`${styles.statIcon}`} style={{ background: '#ecfdf5', color: '#10b981' }}>🧾</div>
                    <span className={styles.statLabel}>Total Bills</span>
                    <h2 className={styles.statValue}>{data.volume.current}</h2>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                        Prev: {data.volume.previous}
                    </p>
                </div>

                <div className={styles.statCard}>
                    <div className={`${styles.statIcon}`} style={{ background: '#fef2f2', color: '#ef4444' }}>👥</div>
                    <span className={styles.statLabel}>Active Patients</span>
                    <h2 className={styles.statValue}>{data.summary.totalPatients}</h2>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                        Total in system
                    </p>
                </div>
            </div>

            {/* Charts Section */}
            <div className={styles.mainGrid}>
                <div className={`${styles.card} ${styles.trendCard}`}>
                    <h3 className={styles.cardTitle}>Revenue Trends</h3>
                    <LineChart data={data.trend} />
                </div>
                <div className={`${styles.card} ${styles.distCard}`}>
                    <h3 className={styles.cardTitle}>Department Share</h3>
                    <PieChart data={data.distribution} />
                </div>
            </div>

            {/* Top Performers Grid */}
            <div className={styles.mainGrid} style={{ marginTop: '32px' }}>
                {/* Top Doctors */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Top Generating Doctors</h3>
                    </div>
                    <div className={styles.rankingList}>
                        {data.topDoctors.map((doc, index) => (
                            <div key={doc._id} className={styles.rankingItem}>
                                <div className={styles.rankNumber}>{index + 1}</div>
                                <div className={styles.rankInfo}>
                                    <span className={styles.rankName}>{doc.name}</span>
                                    <span className={styles.rankMeta}>{doc.count} referrals</span>
                                </div>
                                <div className={styles.rankValue}>{formatCurrency(doc.revenue)}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Patient Stats Summary Card */}
                <div className={styles.card} style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: '#fff' }}>
                    <h3 className={styles.cardTitle} style={{ color: '#fff' }}>Quick Insights</h3>
                    <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <span style={{ fontSize: '0.875rem', color: '#bfdbfe' }}>AVG BILL VALUE</span>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                                {formatCurrency(data.volume.current ? data.revenue.current / data.volume.current : 0)}
                            </div>
                        </div>
                        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5' }}>
                                Your revenue is concentrated in top performing departments. Consider diversifying test offerings.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Business Scale Summary */}
            <section className={styles.summarySection} style={{ marginTop: '32px' }}>
                <div className={styles.summaryContent}>
                    <h2>Business Scale Summary</h2>
                    <p>
                        Your diagnostic center, <b>{data.summary.businessName}</b>, continues to grow. 
                        Currently, you are managing a comprehensive catalog of <b>{data.summary.totalTests} different tests</b> 
                        supported by a network of <b>{data.summary.totalDoctors} consulting doctors</b>.
                        The efficiency in handling <b>{data.volume.current} cases</b> demonstrates strong operational stability.
                    </p>
                </div>
                <div className={styles.summaryStats}>
                    <div className={styles.summaryStatItem}>
                        <span className={styles.summaryStatLabel}>Tests Managed</span>
                        <div className={styles.summaryStatValue}>{data.summary.totalTests}</div>
                    </div>
                    <div className={styles.summaryStatItem}>
                        <span className={styles.summaryStatLabel}>Active Doctors</span>
                        <div className={styles.summaryStatValue}>{data.summary.totalDoctors}</div>
                    </div>
                    <div className={styles.summaryStatItem}>
                        <span className={styles.summaryStatLabel}>Total Patients</span>
                        <div className={styles.summaryStatValue}>{data.summary.totalPatients}</div>
                    </div>
                </div>
            </section>
        </div>
    );
}
