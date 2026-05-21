import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../css/landingpage.css';

const Navbar = () => {
    const { t, i18n } = useTranslation();

    const changeLanguage = (e) => {
        i18n.changeLanguage(e.target.value);
    };

    return (
        <nav className="navbar">
            <div className="nav-left">
                <Link to="/" className="logo-box">
                    <div className="logo-text">
                        <span>MITI</span>
                        <span>TRACK</span>
                    </div>
                </Link>
                <div className="nav-links">
                    <Link to="/map">{t('nav.map')}</Link>
                    <a href="#dashboard">{t('nav.dashboard')}</a>
                    <a href="#about">{t('nav.about')}</a>
                    <a href="#blog">{t('nav.blog')}</a>
                </div>
            </div>
            <div className="nav-right">
                <select className="lang-select" onChange={changeLanguage} defaultValue={i18n.language} style={{ border: 'none', background: 'transparent', color: 'var(--dark-text)', fontWeight: 'bold', cursor: 'pointer', outline: 'none' }}>
                    <option value="en">ENGLISH</option>
                    <option value="es">ESPAÑOL</option>
                    <option value="fr">FRANÇAIS</option>
                    <option value="sw">KISWAHILI</option>
                    <option value="de">DEUTSCH</option>
                </select>
                <div className="nav-icons">
                    <div className="icon-circle" title="Notifications">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                    </div>
                    <div className="icon-circle" title="My Account">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    </div>
                </div>
            </div>
        </nav>
    );
};

const Hero = () => {
    const { t } = useTranslation();
    return (
        <section className="hero">
            <div className="hero-content">
                <h1>{t('hero.title')}</h1>
                <p>{t('hero.description')}</p>
                <button className="btn-action">
                    {t('hero.subscribe')}
                </button>
            </div>
        </section>
    );
};

const Features = () => {
    const { t } = useTranslation();
    return (
        <section className="features-section">
            <div className="feature-grid">
                <div className="feature-card">
                    <h2>{t('features.dataTitle')}</h2>
                    <p>{t('features.dataDesc')}</p>
                    <button className="btn-outline">{t('features.dataBtn')}</button>
                </div>
                <div className="feature-card">
                    <h2>{t('features.survivalTitle')}</h2>
                    <p>{t('features.survivalDesc')}</p>
                    <button className="btn-outline">{t('features.survivalBtn')}</button>
                </div>
            </div>
        </section>
    );
};

const Footer = () => {
    const { t } = useTranslation();
    return (
        <footer className="footer">
            <div className="footer-nav">
                <div className="footer-links">
                    <Link to="/map">{t('nav.map')}</Link>
                    <a href="#dashboards">{t('footer.dashboards')}</a>
                    <a href="#topics">{t('footer.topics')}</a>
                    <a href="#about">{t('nav.about')}</a>
                    <a href="#help">{t('footer.help')}</a>
                </div>
                <button className="btn-action">{t('footer.subscribe')}</button>
            </div>
            <div className="footer-bottom">
                <div className="footer-logo">
                    <span>MITI</span>
                    <span>TRACK</span>
                </div>
                <div className="footer-info">
                    <p>{t('footer.status')}</p>
                </div>
            </div>
        </footer>
    );
};

const LandingPage = () => {
    return (
        <div className="landing-container">
            <Navbar />
            <Hero />
            <Features />
            <Footer />
        </div>
    );
};

export default LandingPage;