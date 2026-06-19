import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function RegisterPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        organization: '',
        orgType: '',
        country: '',
        password: '',
        confirmPassword: '',
    });
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (!agreeTerms) {
            setError('You must agree to the Terms of Service and Privacy Policy.');
            return;
        }

        setLoading(true);
        const AUTH_API = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:5000';

        try {
            const response = await fetch(`${AUTH_API}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    password: formData.password,
                    organization: formData.organization,
                    orgType: formData.orgType,
                    country: formData.country
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Registration failed.');
                setLoading(false);
                return;
            }

            alert('Registration successful! Redirecting to login...');
            navigate('/login');
        } catch (err) {
            console.error(err);
            setError('Unable to connect to the authentication backend. Please ensure the server is running on port 5000.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-background text-gray-900 min-h-screen flex flex-col">
            {}
            <nav className="bg-white border-b border-outline-variant sticky top-0 z-50 shadow-sm">
                <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link to="/" className="flex items-center gap-2 no-underline">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-xl">eco</span>
                            </div>
                            <span className="text-xl font-bold text-primary hidden sm:block">MITI TRACK</span>
                        </Link>
                        <div className="flex items-center gap-4">
                            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-primary transition no-underline">Sign In</Link>
                            <Link to="/register" className="text-sm font-medium text-white bg-primary px-4 py-2 rounded-lg hover:bg-primary-container transition no-underline">Register</Link>
                        </div>
                    </div>
                </div>
            </nav>

            {}
            <main className="flex-grow bg-gradient-to-b from-background to-white py-12 sm:py-16">
                <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        
                        {}
                        <div className="hidden lg:block space-y-8 p-12 rounded-3xl text-white shadow-xl relative overflow-hidden" 
                             style={{
                                 background: 'linear-gradient(135deg, rgba(1, 45, 29, 0.9) 0%, rgba(44, 105, 78, 0.9) 100%), url("https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80")',
                                 backgroundSize: 'cover',
                                 backgroundPosition: 'center'
                             }}>
                            <div>
                                <h1 className="text-4xl sm:text-5xl font-extrabold mb-6 leading-tight">
                                    Join the Global Reforestation Revolution
                                </h1>
                                <p className="text-lg text-emerald-50 mb-8">
                                    Monitor, measure, and scale your ecological impact with AI-powered satellite technology. Trusted by organizations worldwide.
                                </p>
                            </div>

                            {}
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 bg-secondary-fixed/20 rounded-lg flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-white text-2xl">verified</span>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white">Scientific Precision</h3>
                                        <p className="text-sm text-emerald-100">Sub-meter resolution satellite data with AI-derived insights</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 bg-secondary-fixed/20 rounded-lg flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-white text-2xl">shield_with_heart</span>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white">Transparent Verification</h3>
                                        <p className="text-sm text-emerald-100">Immutable audit trails for complete accountability</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 bg-secondary-fixed/20 rounded-lg flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-white text-2xl">trending_up</span>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white">Scale Impact</h3>
                                        <p className="text-sm text-emerald-100">Monitor thousands of hectares in real-time</p>
                                    </div>
                                </div>
                            </div>

                            {}
                            <div className="grid grid-cols-2 gap-4 pt-8 border-t border-emerald-800">
                                <div>
                                    <div className="text-3xl font-bold text-white">12.5M+</div>
                                    <p className="text-sm text-emerald-100">Hectares Monitored</p>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-white">500+</div>
                                    <p className="text-sm text-emerald-100">Active Organizations</p>
                                </div>
                            </div>
                        </div>

                        {}
                        <div>
                            <div className="bg-white/85 backdrop-blur-md p-8 sm:p-10 rounded-2xl shadow-lg border border-outline-variant/30">
                                <h2 className="text-3xl font-bold text-primary mb-2">Create Your Account</h2>
                                <p className="text-gray-600 mb-8">Join the precision reforestation network</p>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                                            <input 
                                                type="text" 
                                                name="firstName" 
                                                required 
                                                value={formData.firstName}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 border border-outline-variant rounded-lg focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition" 
                                                placeholder="John"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                                            <input 
                                                type="text" 
                                                name="lastName" 
                                                required 
                                                value={formData.lastName}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 border border-outline-variant rounded-lg focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition" 
                                                placeholder="Doe"
                                            />
                                        </div>
                                    </div>

                                    {}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                        <input 
                                            type="email" 
                                            name="email" 
                                            required 
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 border border-outline-variant rounded-lg focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition" 
                                            placeholder="john@organization.com"
                                        />
                                    </div>

                                    {}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Organization Name</label>
                                        <input 
                                            type="text" 
                                            name="organization" 
                                            required 
                                            value={formData.organization}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 border border-outline-variant rounded-lg focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition" 
                                            placeholder="Your Organization"
                                        />
                                    </div>

                                    {}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Organization Type</label>
                                        <select 
                                            name="orgType" 
                                            required 
                                            value={formData.orgType}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 border border-outline-variant rounded-lg focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 bg-white transition"
                                        >
                                            <option value="">Select type...</option>
                                            <option value="ngo">Non-Profit / NGO</option>
                                            <option value="government">Government</option>
                                            <option value="corporate">Corporate</option>
                                            <option value="research">Research Institution</option>
                                            <option value="individual">Individual Researcher</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    {}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                                        <input 
                                            type="text" 
                                            name="country" 
                                            required 
                                            value={formData.country}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 border border-outline-variant rounded-lg focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition" 
                                            placeholder="e.g., Brazil"
                                        />
                                    </div>

                                    {}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                                        <input 
                                            type="password" 
                                            name="password" 
                                            required 
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 border border-outline-variant rounded-lg focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition" 
                                            placeholder="••••••••" 
                                            minLength="8"
                                        />
                                        <p className="text-xs text-gray-500 mt-2">Minimum 8 characters</p>
                                    </div>

                                    {}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                                        <input 
                                            type="password" 
                                            name="confirmPassword" 
                                            required 
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 border border-outline-variant rounded-lg focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition" 
                                            placeholder="••••••••"
                                        />
                                    </div>

                                    {}
                                    <div className="flex items-start gap-3">
                                        <input 
                                            type="checkbox" 
                                            name="terms" 
                                            id="terms" 
                                            checked={agreeTerms}
                                            onChange={(e) => setAgreeTerms(e.target.checked)}
                                            className="mt-1 w-4 h-4 rounded border-outline-variant text-primary focus:ring-secondary cursor-pointer"
                                        />
                                        <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer select-none">
                                            I agree to the <a href="#" className="text-secondary font-medium hover:underline">Terms of Service</a> and <a href="#" className="text-secondary font-medium hover:underline">Privacy Policy</a>
                                        </label>
                                    </div>

                                    {}
                                    {error && (
                                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                                            {error}
                                        </div>
                                    )}

                                    {}
                                    <button 
                                        type="submit" 
                                        disabled={loading}
                                        className="w-full bg-primary hover:bg-primary-container text-white font-semibold py-3 rounded-lg hover:shadow-lg active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:scale-100"
                                    >
                                        {loading ? 'Creating Account...' : 'Create Account'}
                                    </button>

                                    {}
                                    <p className="text-center text-gray-600 text-sm">
                                        Already have an account? <Link to="/login" className="text-secondary font-semibold hover:underline">Sign In</Link>
                                    </p>
                                </form>
                            </div>
                        </div>

                    </div>
                </div>
            </main>

            {}
            <footer className="border-t border-outline-variant bg-white mt-16 sm:mt-20">
                <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
                            <ul className="space-y-2 text-sm text-gray-600 p-0 list-none">
                                <li><a href="#" className="hover:text-primary transition no-underline">Features</a></li>
                                <li><a href="#" className="hover:text-primary transition no-underline">Pricing</a></li>
                                <li><a href="#" className="hover:text-primary transition no-underline">API</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
                            <ul className="space-y-2 text-sm text-gray-600 p-0 list-none">
                                <li><a href="#" className="hover:text-primary transition no-underline">About</a></li>
                                <li><a href="#" className="hover:text-primary transition no-underline">Blog</a></li>
                                <li><a href="#" className="hover:text-primary transition no-underline">Careers</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-4">Resources</h4>
                            <ul className="space-y-2 text-sm text-gray-600 p-0 list-none">
                                <li><a href="#" className="hover:text-primary transition no-underline">Docs</a></li>
                                <li><a href="#" className="hover:text-primary transition no-underline">Support</a></li>
                                <li><a href="#" className="hover:text-primary transition no-underline">Status</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm text-gray-600 p-0 list-none">
                                <li><a href="#" className="hover:text-primary transition no-underline">Privacy</a></li>
                                <li><a href="#" className="hover:text-primary transition no-underline">Terms</a></li>
                                <li><a href="#" className="hover:text-primary transition no-underline">Contact</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-outline-variant pt-8 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600">
                        <p>&copy; 2026 MITI TRACK. All rights reserved.</p>
                        <div className="flex gap-6 mt-4 sm:mt-0">
                            <a href="#" className="hover:text-primary transition no-underline">Twitter</a>
                            <a href="#" className="hover:text-primary transition no-underline">GitHub</a>
                            <a href="#" className="hover:text-primary transition no-underline">LinkedIn</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
