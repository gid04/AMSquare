
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, ChevronDown, X, Check, Mail, Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { UserData } from '../../types';

interface OnboardingFlowProps {
    onLogin: (email: string) => void;
    onSignup: (data: UserData) => void;
    inviteToken?: string | null;
}

const features = [
    {
        title: "Dedicated Financial Agent",
        description: "The era of manual management is over. Let your personal agent fund your lifestyle by splitting your balance through smart allocations."
    },
    {
        title: "Automated Compliance",
        description: "Stay ahead of regulations with real-time monitoring of GDPR, SOX, and local tax codes, ensuring your business never misses a beat."
    },
    {
        title: "Smart Treasury",
        description: "Optimize your cash flow with predictive analytics and automated reserve allocation, maximizing your capital efficiency automatically."
    }
];

// Content for Legal Structures
const legalStructureContent: Record<string, { title: string, short: string, elaborated: string }> = {
    'Sole Proprietorship': {
        title: "Sole Proprietorship",
        short: "Simplest form. You are the business. Full liability.",
        elaborated: "A Sole Proprietorship is the easiest structure to form but offers no separation between personal and business assets. You are personally liable for all debts and lawsuits. Ideal for low-risk freelancers."
    },
    'Limited Liability Company (LLC)': {
        title: "Limited Liability Company (LLC)",
        short: "Protects personal assets. Flexible taxation.",
        elaborated: "An LLC hybridizes a corporation's liability protection with a partnership's tax flexibility. Your personal assets are generally shielded from business debts. Profits can pass through to your personal tax return without corporate tax."
    },
    'C Corporation': {
        title: "C Corporation",
        short: "Independent entity. Can issue shares. Double taxation potential.",
        elaborated: "A C Corp is a distinct legal entity separate from its owners. It can issue stocks and raise capital easily. However, profits are taxed at the corporate level and again when distributed as dividends (double taxation)."
    },
    'S Corporation': {
        title: "S Corporation",
        short: "Avoids double taxation. Strict ownership rules.",
        elaborated: "An S Corp is a tax designation that allows profits, and some losses, to pass through directly to owners' personal income tax without being subject to corporate tax rates. It has strict limits on the number and type of shareholders."
    },
    'Partnership': {
        title: "General Partnership",
        short: "Two or more owners. Shared liability and profits.",
        elaborated: "In a General Partnership, partners share equal responsibility for management and unlimited liability for business debts. It's simple to establish but risky if conflicts arise or debts accumulate."
    },
    'Default': {
        title: "Choosing a Structure",
        short: "Select a legal structure to see how it impacts your liability and taxes.",
        elaborated: "The legal structure you choose impacts your registration requirements, how much you pay in taxes, and your personal liability. AMSquare adapts its compliance engine based on this choice."
    }
};

// Data Sets
const NICHES = [
    'Advertising', 'Aerospace', 'Agritech', 'Agriculture', 'Artificial Intelligence', 'Automotive',
    'Banking', 'Biotechnology', 'Biotech', 'Chemicals', 'Clean Energy', 'Construction', 'Consulting', 'Consumer Goods',
    'Cybersecurity', 'Defense', 'Design', 'E-commerce', 'Education', 'Electronics', 'Energy',
    'Entertainment', 'Environmental Services', 'Fashion', 'Finance', 'Fintech',
    'Food & Beverage', 'Gaming', 'Government', 'Green Tech', 'Healthcare', 'Hospitality', 'Import/Export',
    'Insurance', 'Legal', 'Logistics', 'Luxury Goods', 'Manufacturing', 'Maritime',
    'Marketing', 'Media', 'Mining', 'Non-Profit', 'Oil & Gas', 'Pharmaceuticals',
    'Real Estate', 'Retail', 'Robotics', 'SaaS', 'Space Tech', 'Sports', 'Technology', 'Telecommunications',
    'Textiles', 'Transportation', 'Travel', 'Utilities', 'Venture Capital'
].sort();

const LOCATIONS = [
    "Afghanistan, Kabul", "Albania, Tirana", "Algeria, Algiers", "Andorra, Andorra la Vella", "Angola, Luanda", "Antigua and Barbuda, Saint John's",
    "Argentina, Buenos Aires", "Armenia, Yerevan", "Australia, Canberra", "Australia, Melbourne", "Australia, Sydney", "Austria, Vienna", "Azerbaijan, Baku",
    "Bahamas, Nassau", "Bahrain, Manama", "Bangladesh, Dhaka", "Barbados, Bridgetown", "Belarus, Minsk", "Belgium, Brussels", "Belize, Belmopan",
    "Benin, Porto-Novo", "Bhutan, Thimphu", "Bolivia, Sucre", "Bosnia and Herzegovina, Sarajevo", "Botswana, Gaborone", "Brazil, Brasilia",
    "Brazil, Rio de Janeiro", "Brazil, Sao Paulo", "Brunei, Bandar Seri Begawan", "Bulgaria, Sofia", "Burkina Faso, Ouagadougou", "Burundi, Gitega",
    "Cabo Verde, Praia", "Cambodia, Phnom Penh", "Cameroon, Yaounde", "Canada, Montreal", "Canada, Ottawa", "Canada, Toronto", "Canada, Vancouver",
    "Central African Republic, Bangui", "Chad, N'Djamena", "Chile, Santiago", "China, Beijing", "China, Shanghai", "Colombia, Bogota", "Comoros, Moroni",
    "Congo (DRC), Kinshasa", "Congo (Republic), Brazzaville", "Costa Rica, San Jose", "Cote d'Ivoire, Yamoussoukro", "Croatia, Zagreb", "Cuba, Havana",
    "Cyprus, Nicosia", "Czech Republic, Prague", "Denmark, Copenhagen", "Djibouti, Djibouti", "Dominica, Roseau", "Dominican Republic, Santo Domingo",
    "East Timor, Dili", "Ecuador, Quito", "Egypt, Cairo", "El Salvador, San Salvador", "Equatorial Guinea, Malabo", "Eritrea, Asmara", "Estonia, Tallinn",
    "Eswatini, Mbabane", "Ethiopia, Addis Ababa", "Fiji, Suva", "Finland, Helsinki", "France, Paris", "Gabon, Libreville", "Gambia, Banjul",
    "Georgia, Tbilisi", "Germany, Berlin", "Germany, Frankfurt", "Germany, Munich", "Ghana, Accra", "Greece, Athens", "Grenada, St. George's",
    "Guatemala, Guatemala City", "Guinea, Conakry", "Guinea-Bissau, Bissau", "Guyana, Georgetown", "Haiti, Port-au-Prince", "Honduras, Tegucigalpa",
    "Hong Kong, Hong Kong", "Hungary, Budapest", "Iceland, Reykjavik", "India, Bangalore", "India, Mumbai", "India, New Delhi", "Indonesia, Jakarta",
    "Iran, Tehran", "Iraq, Baghdad", "Ireland, Dublin", "Israel, Jerusalem", "Israel, Tel Aviv", "Italy, Milan", "Italy, Rome", "Jamaica, Kingston",
    "Japan, Tokyo", "Jordan, Amman", "Kazakhstan, Astana", "Kenya, Nairobi", "Kiribati, Tarawa", "Korea (North), Pyongyang", "Korea (South), Seoul",
    "Kosovo, Pristina", "Kuwait, Kuwait City", "Kyrgyzstan, Bishkek", "Laos, Vientiane", "Latvia, Riga", "Lebanon, Beirut", "Lesotho, Maseru",
    "Liberia, Monrovia", "Libya, Tripoli", "Liechtenstein, Vaduz", "Lithuania, Vilnius", "Luxembourg, Luxembourg", "Madagascar, Antananarivo",
    "Malawi, Lilongwe", "Malaysia, Kuala Lumpur", "Maldives, Male", "Mali, Bamako", "Malta, Valletta", "Marshall Islands, Majuro", "Mauritania, Nouakchott",
    "Mauritius, Port Louis", "Mexico, Mexico City", "Micronesia, Palikir", "Moldova, Chisinau", "Monaco, Monaco", "Mongolia, Ulaanbaatar",
    "Montenegro, Podgorica", "Morocco, Rabat", "Mozambique, Maputo", "Myanmar, Naypyidaw", "Namibia, Windhoek", "Nauru, Yaren", "Nepal, Kathmandu",
    "Netherlands, Amsterdam", "New Zealand, Auckland", "New Zealand, Wellington", "Nicaragua, Managua", "Niger, Niamey", "Nigeria, Abuja", "Nigeria, Lagos",
    "North Macedonia, Skopje", "Norway, Oslo", "Oman, Muscat", "Pakistan, Islamabad", "Palau, Ngerulmud", "Palestine, Ramallah", "Panama, Panama City",
    "Papua New Guinea, Port Moresby", "Paraguay, Asuncion", "Peru, Lima", "Philippines, Manila", "Poland, Warsaw", "Portugal, Lisbon", "Qatar, Doha",
    "Romania, Bucharest", "Russia, Moscow", "Rwanda, Kigali", "Saint Kitts and Nevis, Basseterre", "Saint Lucia, Castries",
    "Saint Vincent and the Grenadines, Kingstown", "Samoa, Apia", "San Marino, San Marino", "Sao Tome and Principe, Sao Tome", "Saudi Arabia, Riyadh",
    "Senegal, Dakar", "Serbia, Belgrade", "Seychelles, Victoria", "Sierra Leone, Freetown", "Singapore, Singapore", "Slovakia, Bratislava",
    "Slovenia, Ljubljana", "Solomon Islands, Honiara", "Somalia, Mogadishu", "South Africa, Cape Town", "South Africa, Johannesburg", "South Africa, Pretoria",
    "South Sudan, Juba", "Spain, Barcelona", "Spain, Madrid", "Sri Lanka, Colombo", "Sudan, Khartoum", "Suriname, Paramaribo", "Sweden, Stockholm",
    "Switzerland, Bern", "Switzerland, Zurich", "Syria, Damascus", "Taiwan, Taipei", "Tajikistan, Dushanbe", "Tanzania, Dodoma", "Thailand, Bangkok",
    "Togo, Lome", "Tonga, Nuku'alofa", "Trinidad and Tobago, Port of Spain", "Tunisia, Tunis", "Turkey, Ankara", "Turkey, Istanbul", "Turkmenistan, Ashgabat",
    "Tuvalu, Funafuti", "Uganda, Kampala", "Ukraine, Kyiv", "United Arab Emirates, Abu Dhabi", "United Arab Emirates, Dubai", "United Kingdom, London",
    "United States, Austin", "United States, Chicago", "United States, Los Angeles", "United States, New York", "United States, San Francisco",
    "United States, Seattle", "United States, Washington D.C.", "Uruguay, Montevideo", "Uzbekistan, Tashkent", "Vanuatu, Port Vila",
    "Vatican City, Vatican City", "Venezuela, Caracas", "Vietnam, Hanoi", "Vietnam, Ho Chi Minh City", "Yemen, Sana'a", "Zambia, Lusaka", "Zimbabwe, Harare"
].sort();

const CONTINENTS_AND_COUNTRIES = [
    '--- Continents ---', 'Africa', 'Antarctica', 'Asia', 'Europe', 'North America', 'Oceania', 'South America',
    '--- Countries ---',
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
    'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi',
    'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo (DRC)', 'Congo (Republic)', 'Costa Rica', 'Cote d\'Ivoire', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic',
    'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'East Timor', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia',
    'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
    'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan',
    'Kazakhstan', 'Kenya', 'Kiribati', 'Korea (North)', 'Korea (South)', 'Kosovo', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
    'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
    'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
    'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
    'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan',
    'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
];

const SIZES = ['0-1', '0-10', '0-100', '100-500', '100-1000', '1000+'];

// Enhanced Legal Structures with Native Language Terms
const LEGAL_STRUCTURES: Record<string, string[]> = {
    'United States': ['Sole Proprietorship', 'General Partnership', 'Limited Partnership (LP)', 'Limited Liability Company (LLC)', 'C Corporation', 'S Corporation', 'Nonprofit'],
    'United Kingdom': ['Sole Trader', 'Partnership', 'Limited Liability Partnership (LLP)', 'Private Limited Company (LTD)', 'Public Limited Company (PLC)'],
    'Canada': ['Sole Proprietorship', 'General Partnership', 'Limited Partnership', 'Corporation (Federal/Provincial)', 'Co-operative'],
    'France': ['Micro-entreprise (Auto-entrepreneur)', 'Entreprise Unipersonnelle à Responsabilité Limitée (EURL)', 'Société à Responsabilité Limitée (SARL)', 'Société par Actions Simplifiée (SAS)', 'Société par Actions Simplifiée Unipersonnelle (SASU)', 'Société Anonyme (SA)', 'Société Civile Immobilière (SCI)'],
    'Germany': ['Einzelunternehmen (Sole Proprietorship)', 'Gesellschaft bürgerlichen Rechts (GbR)', 'Offene Handelsgesellschaft (OHG)', 'Kommanditgesellschaft (KG)', 'Gesellschaft mit beschränkter Haftung (GmbH)', 'Unternehmergesellschaft (UG)', 'Aktiengesellschaft (AG)'],
    'Spain': ['Autónomo (Freelancer)', 'Sociedad Limitada (S.L.)', 'Sociedad Anónima (S.A.)', 'Sociedad Civil (S.C.)', 'Sociedad Cooperativa'],
    'Italy': ['Ditta Individuale', 'Società a Responsabilità Limitata (S.r.l.)', 'Società per Azioni (S.p.A.)', 'Società in Accomandita Semplice (S.a.s.)', 'Società in Nome Collettivo (S.n.c.)'],
    'Netherlands': ['Eenmanszaak (Sole Trader)', 'Vennootschap onder firma (VOF)', 'Besloten vennootschap (BV)', 'Naamloze vennootschap (NV)', 'Stichting (Foundation)'],
    'Sweden': ['Enskild firma (Sole Trader)', 'Handelsbolag (HB)', 'Kommanditbolag (KB)', 'Aktiebolag (AB)'],
    'Poland': ['Jednoosobowa działalność gospodarcza', 'Spółka z ograniczoną odpowiedzialnością (Sp. z o.o.)', 'Spółka Akcyjna (S.A.)', 'Spółka jawna', 'Spółka komandytowa'],
    'Brazil': ['Microempreendedor Individual (MEI)', 'Empresário Individual (EI)', 'Sociedade Limitada (Ltda)', 'Sociedade Anônima (S/A)', 'EIRELI (Extinct/Transitioning)'],
    'China': ['Wholly Foreign-Owned Enterprise (WFOE)', 'Joint Venture (JV)', 'Representative Office (RO)', 'Domestic Company'],
    'India': ['Sole Proprietorship', 'Partnership Firm', 'Limited Liability Partnership (LLP)', 'Private Limited Company (Pvt Ltd)', 'Public Limited Company'],
    'Australia': ['Sole Trader', 'Partnership', 'Proprietary Limited Company (Pty Ltd)', 'Public Company', 'Trust'],
    'Japan': ['Kojin Jigyo (Sole Proprietorship)', 'Kabushiki Kaisha (KK)', 'Godo Kaisha (GK)', 'Gomei Kaisha', 'Goshi Kaisha'],
    'Mexico': ['Persona Física con Actividad Empresarial', 'Sociedad Anónima (S.A.)', 'Sociedad de Responsabilidad Limitada (S. de R.L.)', 'Sociedad por Acciones Simplificada (S.A.S.)'],
    'United Arab Emirates': ['Sole Establishment', 'Civil Company', 'Limited Liability Company (LLC)', 'Free Zone Company', 'Branch of Foreign Company'],
    'Default': ['Sole Proprietorship', 'Partnership', 'Limited Liability Company', 'Corporation', 'Cooperative', 'Non-Governmental Organization (NGO)']
};

// Seconds a person must wait before asking for another login code.
const RESEND_COOLDOWN_SECONDS = 30;

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onLogin, onSignup, inviteToken: initialInviteToken }) => {
    // If there's an invite token, default to step 1 of signup immediately
    // Note: step 0 is the welcome screen.
    const [step, setStep] = useState(initialInviteToken ? 1 : 0);
    const [inviteToken, setInviteToken] = useState(initialInviteToken);
    // Flow type: 'signup' follows steps 1-3, 'login' follows steps 1-2
    const [flowType, setFlowType] = useState<'signup' | 'login'>('signup');
    const [currentFeature, setCurrentFeature] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [legalCarouselIndex, setLegalCarouselIndex] = useState(0);

    // Form State
    const [formData, setFormData] = useState<UserData>({
        firstName: '', lastName: '', email: '',
        businessName: '', niche: '', location: '',
        legalStructure: '', operationRange: [], size: '',
        isFreshSignup: true
    });

    const [loginEmail, setLoginEmail] = useState('');
    const [loginCode, setLoginCode] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [resendCooldown, setResendCooldown] = useState(0);
    const [isResending, setIsResending] = useState(false);
    const [resendNotice, setResendNotice] = useState('');

    // Convex mutations & queries
    const requestOTP = useMutation(api.auth.requestOTP);
    const verifyOTP = useMutation(api.auth.verifyOTP);
    const completeSignup = useMutation(api.auth.completeSignup);
    // Staff Invite Actions
    const validateInvitation = useQuery(api.staff.validateInvitation, inviteToken ? { token: inviteToken } : "skip");
    const completeStaffSignup = useMutation(api.staff.completeStaffSignup);

    // Debounced Email Check
    const [debouncedLoginEmail, setDebouncedLoginEmail] = useState('');
    const [debouncedSignupEmail, setDebouncedSignupEmail] = useState('');

    // Pre-fill email from invitation
    useEffect(() => {
        if (validateInvitation?.valid && validateInvitation.email) {
            setFlowType('signup'); // Force signup mode
            updateField('email', validateInvitation.email);
        }
    }, [validateInvitation]);

    // Arriving on the code screen means a code was just sent, so start the cooldown.
    useEffect(() => {
        if (flowType === 'login' && step === 2) {
            setResendCooldown(RESEND_COOLDOWN_SECONDS);
            setResendNotice('');
        }
    }, [flowType, step]);

    // Tick the cooldown down to zero.
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    // Effects for debouncing
    useEffect(() => {
        const timer = setTimeout(() => {
            if (loginEmail.includes('@')) setDebouncedLoginEmail(loginEmail);
        }, 500);
        return () => clearTimeout(timer);
    }, [loginEmail]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (formData.email.includes('@')) setDebouncedSignupEmail(formData.email);
        }, 500);
        return () => clearTimeout(timer);
    }, [formData.email]);

    // Queries for email existence
    const loginEmailCheck = useQuery(api.auth.checkEmail, debouncedLoginEmail ? { email: debouncedLoginEmail } : "skip");
    const signupEmailCheck = useQuery(api.auth.checkEmail, debouncedSignupEmail ? { email: debouncedSignupEmail } : "skip");

    // Feature Carousel (Steps 0-2)
    useEffect(() => {
        if (step === 3 && flowType === 'signup') return; // Stop generic features on step 3

        const interval = setInterval(() => {
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentFeature((prev) => (prev + 1) % features.length);
                setIsAnimating(false);
            }, 500);
        }, 5000);
        return () => clearInterval(interval);
    }, [step, flowType]);

    // Legal Structure Carousel (Step 3 only)
    useEffect(() => {
        if (step !== 3 || flowType !== 'signup' || formData.legalStructure) return; // Stop if structure selected or not on step 3

        const interval = setInterval(() => {
            setIsAnimating(true);
            setTimeout(() => {
                setLegalCarouselIndex(prev => (prev + 1) % 4); // Cycle through first 4 generic examples
                setIsAnimating(false);
            }, 500);
        }, 4000);
        return () => clearInterval(interval);
    }, [step, flowType, formData.legalStructure]);

    const validateStep = () => {
        const errors: Record<string, string> = {};
        if (flowType === 'signup') {
            if (step === 1) {
                if (!formData.firstName.trim()) errors.firstName = "First name is required.";
                if (!formData.lastName.trim()) errors.lastName = "Last name is required.";
                if (!formData.email.trim()) {
                    errors.email = "Email is required.";
                } else if (!formData.email.includes('@')) {
                    errors.email = "Please enter a valid email.";
                }
                if (!termsAccepted) errors.terms = "Terms must be accepted.";
            } else if (step === 2) {
                if (!formData.businessName.trim()) errors.businessName = "Business name is required.";
                if (!formData.niche) errors.niche = "Industry niche is required.";
                if (!formData.location) errors.location = "Primary location is required.";
                // Simple validation for "Country, City" format
                if (formData.location && !formData.location.includes(',')) {
                    errors.location = "Please enter in 'Country, City' format.";
                }
            } else if (step === 3) {
                if (!formData.legalStructure) errors.legalStructure = "Legal structure is required.";
                if (!formData.operationRange.length) errors.operationRange = "Select at least one region.";
                if (!formData.size) errors.size = "Company size is required.";
            }
        } else {
            if (step === 1) {
                if (!loginEmail.trim()) {
                    errors.loginEmail = "Email is required.";
                } else if (!loginEmail.includes('@')) {
                    errors.loginEmail = "Please enter a valid email.";
                }
            } else if (step === 2) {
                if (loginCode.length !== 6) errors.loginCode = "Enter 6-digit code.";
            }
        }
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleContinue = async () => {
        setError('');
        if (!validateStep()) return;

        setIsLoading(true);

        try {
            if (flowType === 'signup') {
                if (inviteToken) {
                    // Staff Invitation Flow
                    await completeStaffSignup({
                        token: inviteToken,
                        firstName: formData.firstName,
                        lastName: formData.lastName
                    });
                    // Show success success and redirect to login or auto-login?
                    // Request says: "the new staff account is created and he/she can sign out and sign in using the normal login OTP flow"
                    // But effectively they ARE signed out currently. So we just show success and maybe switch to login mode.
                    alert("Account created successfully! Please log in.");
                    setInviteToken(null); // Clear token to exit invite mode
                    startFlow('login');
                    setLoginEmail(formData.email); // Pre-fill login
                } else {
                    // Normal Owner Signup Flow
                    if (step === 1) {
                        // Atomic Signup: Don't create user yet, just check existence locally
                        if (signupEmailCheck?.isExistingUser) {
                            throw new Error("An account already exists with this email. Please log in or use a different email.");
                        }
                        setStep(step + 1);
                    } else if (step === 2) {
                        setStep(step + 1);
                    } else if (step === 3) {
                        await completeSignup({
                            email: formData.email,
                            firstName: formData.firstName,
                            lastName: formData.lastName,
                            businessName: formData.businessName,
                            niche: formData.niche,
                            location: formData.location,
                            legalStructure: formData.legalStructure,
                            operationRange: formData.operationRange,
                            size: formData.size,
                        });
                        onSignup(formData);
                    }
                }
            } else {
                if (step === 1) {
                    const result = await requestOTP({ email: loginEmail });
                    if (!result.isExistingUser) {
                        throw new Error("No account found with this email. Please create a new account to get started.");
                    }
                    setStep(2);
                } else if (step === 2) {
                    const result = await verifyOTP({ email: loginEmail, code: loginCode });
                    if (result) {
                        // Use the email returned by backend to ensure casing matches DB
                        onLogin(result.email);
                    } else {
                        throw new Error("Invalid or expired verification code.");
                    }
                }
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (resendCooldown > 0 || isResending) return;

        setError('');
        setResendNotice('');
        setIsResending(true);

        try {
            const result = await requestOTP({ email: loginEmail });
            if (!result.isExistingUser) {
                throw new Error("No account found with this email. Please create a new account to get started.");
            }
            // The previous code is now dead, so clear what was typed against it.
            setLoginCode('');
            setValidationErrors({});
            setResendNotice('A new code is on its way.');
            setResendCooldown(RESEND_COOLDOWN_SECONDS);
        } catch (err: any) {
            setError(err.message || "Could not resend the code. Please try again.");
        } finally {
            setIsResending(false);
        }
    };

    const handleBack = () => {
        if (step > 0) {
            setStep(step - 1);
        }
    };

    const updateField = (field: keyof UserData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Start specific flow
    const startFlow = (type: 'signup' | 'login') => {
        setFlowType(type);
        setStep(1);
    };

    // Derive legal structures based on location input
    const currentLegalStructures = useMemo(() => {
        if (!formData.location) return LEGAL_STRUCTURES['Default'];
        // Extract country from "Country, City" format
        const country = formData.location.split(',')[0].trim();
        return LEGAL_STRUCTURES[country] || LEGAL_STRUCTURES['Default'];
    }, [formData.location]);

    // Content for the right panel based on state
    const rightPanelContent = useMemo(() => {
        if (step === 3 && flowType === 'signup') {
            // If a structure is selected, show its elaboration
            if (formData.legalStructure) {
                // Try to find exact match in our dictionary
                const key = Object.keys(legalStructureContent).find(k => formData.legalStructure.includes(k)) || 'Default';
                const content = legalStructureContent[key] || legalStructureContent['Default'];

                return {
                    title: content.title,
                    description: content.elaborated,
                    progress: null // Stop progress bar
                };
            }

            // Otherwise cycle through examples
            const keys = Object.keys(legalStructureContent).filter(k => k !== 'Default');
            const currentKey = keys[legalCarouselIndex % keys.length];
            const content = legalStructureContent[currentKey];

            return {
                title: content.title,
                description: content.short,
                progress: legalCarouselIndex
            };
        } else {
            // Default Feature Carousel
            return {
                title: features[currentFeature].title,
                description: features[currentFeature].description,
                progress: currentFeature
            };
        }
    }, [step, flowType, currentFeature, legalCarouselIndex, formData.legalStructure]);

    return (
        <div className="h-screen w-full bg-black p-5 font-sans">
            <div className="flex h-full w-full gap-[15px]">
                {/* Left Column - Content */}
                <div className="w-full lg:w-1/2 h-full bg-white rounded-[20px] flex flex-col p-8 lg:p-12 relative overflow-y-auto shadow-2xl">
                    {step > 0 && (
                        <div className="absolute top-8 left-8 lg:left-12 flex items-center gap-4">
                            <button
                                onClick={handleBack}
                                className="w-10 h-10 bg-[#f5f5f5] hover:bg-slate-200 rounded-xl flex items-center justify-center transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-black" />
                            </button>
                            <div>
                                <span className="text-xs font-bold text-slate-500 block leading-tight">
                                    {flowType === 'signup' ? `${step}/3` : `${step}/2`}
                                </span>
                                <span className="text-sm font-bold text-[#50C913]">
                                    {flowType === 'signup' && step === 1 && 'Owner'}
                                    {flowType === 'signup' && step === 2 && 'Business'}
                                    {flowType === 'signup' && step === 3 && 'Regulations'}
                                    {flowType === 'login' && step === 1 && 'Email'}
                                    {flowType === 'login' && step === 2 && 'Verification'}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className={`flex-1 flex flex-col ${step === 0 ? 'justify-center' : 'justify-start pt-[60px] lg:pt-[44px]'} max-w-lg mx-auto w-full transition-all duration-300`}>

                        {/* Step 0: Welcome Screen */}
                        {step === 0 && (
                            <div className="space-y-12 animate-fade-in">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 border-[3px] border-[#50C913] rounded-xl flex items-center justify-center rotate-45">
                                        <div className="w-6 h-6 bg-[#50C913] rounded-sm"></div>
                                    </div>
                                    <div className="flex flex-col ml-3">
                                        <span className="font-bold text-slate-900 text-lg tracking-widest leading-none">AM</span>
                                        <span className="font-bold text-slate-900 text-lg tracking-widest leading-none">SQUARE</span>
                                        <span className="text-[8px] font-bold text-slate-400 tracking-[0.2em] mt-1">ADVANCED AGENTIC MONEY MANAGEMENT</span>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h1 className="text-5xl font-bold text-slate-900 leading-[1.15] max-w-[20ch]">
                                        Enjoy the simplicity of <span className="text-[#50C913]">advanced</span> asset <span className="text-[#50C913]">management</span>!
                                    </h1>
                                    <p className="text-slate-500 text-sm leading-relaxed max-w-md">
                                        A corporate AI-powered finance system enabling SMEs and enterprises to automate treasury management, payroll, and vendor payments.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    {!inviteToken && (
                                        <>
                                            <button
                                                onClick={() => startFlow('login')}
                                                className="w-full py-4 rounded-xl border-2 border-slate-900 text-slate-900 font-bold hover:bg-slate-50 transition-colors"
                                            >
                                                Login
                                            </button>
                                            <button
                                                onClick={() => startFlow('signup')}
                                                className="w-full py-4 rounded-xl bg-black text-white font-bold hover:bg-slate-900 transition-colors shadow-lg shadow-black/20"
                                            >
                                                Sign Up
                                            </button>
                                        </>
                                    )}
                                    {inviteToken && (
                                        <div className="bg-[#50C913]/10 border border-[#50C913]/20 p-4 rounded-xl text-center">
                                            <p className="font-bold text-slate-900 mb-2">You've been invited!</p>
                                            <button
                                                onClick={() => startFlow('signup')}
                                                className="w-full py-4 rounded-xl bg-black text-white font-bold hover:bg-slate-900 transition-colors shadow-lg shadow-black/20"
                                            >
                                                Accept Invitation
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* LOGIN FLOW - Step 1: Email */}
                        {flowType === 'login' && step === 1 && (
                            <div className="space-y-8 animate-fade-in">
                                <h1 className="text-4xl font-bold text-slate-900">Welcome back.</h1>
                                <p className="text-slate-500">Enter your email to receive a login code.</p>

                                <div className="space-y-6">
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <FloatingLabelInput
                                            label="Email address" placeholder="john@company.com" type="email"
                                            value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                                            error={validationErrors.loginEmail}
                                            className="pl-12"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium animate-shake">
                                        {error}
                                    </div>
                                )}

                                <button
                                    onClick={handleContinue}
                                    disabled={!loginEmail.includes('@') || isLoading}
                                    className="w-full py-4 rounded-xl bg-black text-white font-bold hover:bg-slate-900 transition-colors shadow-lg shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Code'}
                                </button>
                            </div>
                        )}

                        {/* LOGIN FLOW - Step 2: Code */}
                        {flowType === 'login' && step === 2 && (
                            <div className="space-y-8 animate-fade-in">
                                <h1 className="text-4xl font-bold text-slate-900">Check your inbox.</h1>
                                <p className="text-slate-500">We sent a verification code to <span className="font-bold text-slate-900">{loginEmail}</span>.</p>

                                <div className="space-y-6">
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <FloatingLabelInput
                                            label="Verification Code (6 digits)" placeholder="000000" type="text" maxLength={6}
                                            value={loginCode} onChange={(e) => setLoginCode(e.target.value)}
                                            error={validationErrors.loginCode}
                                            className="pl-12 font-mono tracking-[0.5em] text-lg"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between gap-3 text-sm">
                                        <span className={resendNotice ? "font-medium text-[#50C913]" : "text-slate-500"}>
                                            {resendNotice || "Didn't get the code?"}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleResendCode}
                                            disabled={resendCooldown > 0 || isResending}
                                            className="font-bold text-black underline underline-offset-4 hover:text-slate-600 transition-colors disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed"
                                        >
                                            {isResending
                                                ? 'Sending...'
                                                : resendCooldown > 0
                                                    ? `Resend in ${resendCooldown}s`
                                                    : 'Resend code'}
                                        </button>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium animate-shake">
                                        {error}
                                    </div>
                                )}

                                <button
                                    onClick={handleContinue}
                                    disabled={loginCode.length !== 6 || isLoading}
                                    className="w-full py-4 rounded-xl bg-black text-white font-bold hover:bg-slate-900 transition-colors shadow-lg shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Login'}
                                </button>
                            </div>
                        )}


                        {/* SIGNUP FLOW - Step 1: Owner */}
                        {flowType === 'signup' && step === 1 && (
                            <div className="space-y-8 animate-fade-in">
                                <h1 className="text-4xl font-bold text-slate-900">Let's get started!</h1>

                                <div className="space-y-6">
                                    <FloatingLabelInput
                                        label="First name" placeholder="John"
                                        value={formData.firstName} onChange={(e) => updateField('firstName', e.target.value)}
                                        error={validationErrors.firstName}
                                    />
                                    <FloatingLabelInput
                                        label="Last name" placeholder="Doe"
                                        value={formData.lastName} onChange={(e) => updateField('lastName', e.target.value)}
                                        error={validationErrors.lastName}
                                    />
                                    <FloatingLabelInput
                                        label="Email" placeholder="johndoe@gmail.com" type="email"
                                        value={formData.email} onChange={(e) => updateField('email', e.target.value)}
                                        error={validationErrors.email}
                                    />
                                    {/* Signup Error Message for Existing Account */}
                                    {signupEmailCheck?.isExistingUser && formData.email.includes('@') && (
                                        <div className="text-xs text-red-600 font-bold flex items-center gap-1.5 -mt-4 mb-2 animate-fade-in pl-1">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            Account exists, please login instead.
                                        </div>
                                    )}

                                    <div className="flex items-start gap-3 pt-2">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={termsAccepted}
                                                onChange={(e) => { setTermsAccepted(e.target.checked); if (e.target.checked) setValidationErrors(prev => ({ ...prev, terms: '' })); }}
                                                className={`peer h-5 w-5 cursor-pointer appearance-none rounded-md border transition-all checked:border-[#50C913] checked:bg-[#50C913] ${validationErrors.terms ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                                            />
                                            <div className="pointer-events-none absolute top-2/4 left-2/4 -translate-y-2/4 -translate-x-2/4 text-white opacity-0 transition-opacity peer-checked:opacity-100">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                            </div>
                                        </div>
                                        <label className={`text-xs font-medium leading-relaxed cursor-pointer ${validationErrors.terms ? 'text-red-500' : 'text-slate-600'}`} onClick={() => setTermsAccepted(!termsAccepted)}>
                                            I've read and I agree to the <span className={`${validationErrors.terms ? 'text-red-600' : 'text-[#50C913]'}`}>terms</span> and <span className={`${validationErrors.terms ? 'text-red-600' : 'text-[#50C913]'}`}>policies</span> related to AMSquare Entreprise
                                        </label>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium animate-shake">
                                        {error}
                                    </div>
                                )}

                                <button
                                    onClick={handleContinue}
                                    disabled={isLoading}
                                    className="w-full py-4 rounded-xl bg-black text-white font-bold hover:bg-slate-900 transition-colors shadow-lg shadow-black/20 flex items-center justify-center gap-2"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue'}
                                </button>

                                <SocialButtons />
                            </div>
                        )}

                        {/* SIGNUP FLOW - Step 2: Business */}
                        {flowType === 'signup' && step === 2 && (
                            <div className="space-y-8 animate-fade-in">
                                <h1 className="text-4xl font-bold text-slate-900">Set up your <span className="text-[#50C913]">business</span>.</h1>

                                <div className="space-y-6">
                                    <FloatingLabelInput
                                        label="Business legal name" placeholder="Vantar"
                                        value={formData.businessName} onChange={(e) => updateField('businessName', e.target.value)}
                                        error={validationErrors.businessName}
                                    />
                                    <FloatingLabelSelect
                                        label="Niche (Industry)" placeholder="Select a niche"
                                        value={formData.niche} onChange={(e) => updateField('niche', e.target.value)}
                                        options={NICHES}
                                        error={validationErrors.niche}
                                    />
                                    <FloatingLabelDataList
                                        label="Primary location" placeholder="Country, City"
                                        listId="locations-list"
                                        options={LOCATIONS}
                                        value={formData.location}
                                        onChange={(e) => updateField('location', e.target.value)}
                                        error={validationErrors.location}
                                    />
                                </div>

                                {error && (
                                    <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium animate-shake">
                                        {error}
                                    </div>
                                )}

                                <button
                                    onClick={handleContinue}
                                    disabled={isLoading}
                                    className="w-full py-4 rounded-xl bg-black text-white font-bold hover:bg-slate-900 transition-colors shadow-lg shadow-black/20 mt-4 flex items-center justify-center gap-2"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue'}
                                </button>

                                <SocialButtons />
                            </div>
                        )}

                        {/* SIGNUP FLOW - Step 3: Agent / Structure */}
                        {flowType === 'signup' && step === 3 && (
                            <div className="space-y-8 animate-fade-in">
                                <h1 className="text-4xl font-bold text-slate-900">Prepare your <span className="text-[#50C913]">agent</span>.</h1>

                                <div className="space-y-6">
                                    <FloatingLabelSelect
                                        label="Legal structure" placeholder="Select the appropriate structure"
                                        value={formData.legalStructure} onChange={(e) => updateField('legalStructure', e.target.value)}
                                        options={currentLegalStructures}
                                        error={validationErrors.legalStructure}
                                    />
                                    <FloatingLabelMultiSelect
                                        label="Operation range" placeholder="Select regions/countries"
                                        value={formData.operationRange}
                                        onChange={(val) => updateField('operationRange', val)}
                                        options={CONTINENTS_AND_COUNTRIES}
                                        error={validationErrors.operationRange}
                                    />
                                    <FloatingLabelSelect
                                        label="Size" placeholder="Select employee count"
                                        value={formData.size} onChange={(e) => updateField('size', e.target.value)}
                                        options={SIZES}
                                        error={validationErrors.size}
                                    />
                                </div>

                                {error && (
                                    <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium animate-shake">
                                        {error}
                                    </div>
                                )}

                                <button
                                    onClick={handleContinue}
                                    disabled={isLoading}
                                    className="w-full py-4 rounded-xl bg-black text-white font-bold hover:bg-slate-900 transition-colors shadow-lg shadow-black/20 mt-4 flex items-center justify-center gap-2"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue'}
                                </button>

                                <SocialButtons />
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column - Visuals */}
                <div className="hidden lg:flex w-1/2 bg-black rounded-[20px] relative items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center opacity-30">
                        <div className="w-[600px] h-[600px] border-[40px] border-[#50C913]/20 rounded-[100px] rotate-45 absolute"></div>
                        <div className="w-[300px] h-[300px] bg-[#50C913]/10 rounded-[60px] rotate-45 absolute backdrop-blur-sm"></div>
                        <div className="w-[150px] h-[150px] bg-[#50C913]/5 rounded-[30px] rotate-45 absolute"></div>
                    </div>
                    <div className="absolute -top-40 -right-40 w-[500px] h-[500px] border-[60px] border-[#50C913]/10 rounded-[80px] rotate-45 opacity-30"></div>

                    <div className={`relative z-10 max-w-md mt-[400px] pl-0 transition-all duration-500 ease-in-out ${isAnimating ? (step === 3 && flowType === 'signup' ? 'translate-y-[-20px] opacity-0' : 'opacity-0') : (step === 3 && flowType === 'signup' ? 'translate-y-0 opacity-100' : 'opacity-100')}`}>
                        <p className="text-white text-lg font-medium leading-relaxed mb-8 h-24">
                            {rightPanelContent.description}
                        </p>
                        <div className="flex items-center gap-3">
                            {rightPanelContent.progress !== null && (
                                <div className="flex gap-1">
                                    {(step === 3 && flowType === 'signup' ? [0, 1, 2, 3] : features).map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`h-1 rounded-full transition-all duration-300 ${idx === rightPanelContent.progress ? 'w-8 bg-[#50C913]' : 'w-2 bg-white/20'}`}
                                        />
                                    ))}
                                </div>
                            )}
                            {/* If progress is null (selected a structure), hide dots, just show title */}
                            <h3 className="text-white text-xl font-bold ml-auto">{rightPanelContent.title}</h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Sub-components
const FloatingLabelInput = ({ label, placeholder, type = "text", value, onChange, className = "", maxLength, error }: any) => (
    <div className="relative group">
        <input type={type} placeholder={placeholder} value={value} onChange={onChange} maxLength={maxLength} className={`w-full px-4 py-4 rounded-xl border text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all bg-transparent pt-4 pb-4 ${error ? 'border-red-500 bg-red-50/30' : 'border-slate-300'} ${className}`} />
        <label className={`absolute -top-2.5 left-4 bg-white px-1 text-xs font-bold pointer-events-none ${error ? 'text-red-500' : 'text-black'}`}>{label}</label>
        {error && <span className="absolute -bottom-5 left-1 text-[10px] font-bold text-red-500 animate-slide-up">{error}</span>}
    </div>
);
const FloatingLabelSelect = ({ label, placeholder, options, value, onChange, error }: any) => (
    <div className="relative group">
        <div className="relative">
            <select className={`w-full px-4 py-4 rounded-xl border text-slate-500 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all bg-transparent appearance-none cursor-pointer ${error ? 'border-red-500 bg-red-50/30' : 'border-slate-300'}`} value={value || ""} onChange={onChange}>
                <option value="" disabled>{placeholder}</option>
                {options.map((opt: string, i: number) => <option key={i} value={opt} disabled={opt.startsWith('---')}>{opt}</option>)}
            </select>
            <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none ${error ? 'text-red-500' : 'text-black'}`} />
        </div>
        <label className={`absolute -top-2.5 left-4 bg-white px-1 text-xs font-bold pointer-events-none ${error ? 'text-red-500' : 'text-black'}`}>{label}</label>
        {error && <span className="absolute -bottom-5 left-1 text-[10px] font-bold text-red-500 animate-slide-up">{error}</span>}
    </div>
);
const FloatingLabelMultiSelect = ({ label, placeholder, options, value, onChange, error }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (option: string) => {
        if (value.includes(option)) {
            onChange(value.filter((v: any) => v !== option));
        } else {
            onChange([...value, option]);
        }
        setSearchTerm('');
        inputRef.current?.focus();
    };

    const removeOption = (e: React.MouseEvent, option: string) => {
        e.stopPropagation();
        onChange(value.filter((v: any) => v !== option));
    };

    const filteredOptions = options.filter((opt: string) => {
        if (searchTerm === '') return true;
        if (opt.startsWith('---')) return false; // Hide headers during search
        return opt.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="relative group" ref={containerRef}>
            <div
                className={`relative w-full px-4 py-4 rounded-xl border text-slate-900 focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all bg-transparent min-h-[58px] cursor-text ${error ? 'border-red-500 bg-red-50/30' : 'border-slate-300'}`}
                onClick={() => { setIsOpen(true); inputRef.current?.focus(); }}
            >
                <div className="flex flex-wrap gap-2 pt-1">
                    {value.map((v: string) => (
                        <span key={v} className="bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 px-2 py-1 rounded-md flex items-center gap-1 z-10">
                            {v}
                            <button onClick={(e) => removeOption(e, v)} className="hover:text-black"><X className="w-3 h-3" /></button>
                        </span>
                    ))}
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={() => setIsOpen(true)}
                        className="flex-1 bg-transparent outline-none min-w-[60px] text-sm py-1"
                        placeholder={value.length === 0 ? placeholder : ""}
                    />
                </div>
                <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none transition-transform ${error ? 'text-red-500' : 'text-black'} ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                    {filteredOptions.length > 0 ? filteredOptions.map((opt: string, i: number) => {
                        const isHeader = opt.startsWith('---');
                        const isSelected = value.includes(opt);
                        if (isHeader) return <div key={i} className="px-4 py-2 text-xs font-bold text-slate-400 bg-slate-50 sticky top-0">{opt.replace(/---/g, '').trim()}</div>;
                        return (
                            <div key={i} onClick={() => toggleOption(opt)} className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-slate-50 flex items-center justify-between ${isSelected ? 'bg-slate-50 text-[#50C913] font-medium' : 'text-slate-700'}`}>
                                {opt}
                                {isSelected && <Check className="w-4 h-4" />}
                            </div>
                        );
                    }) : (
                        <div className="px-4 py-3 text-sm text-slate-500">No matching locations found.</div>
                    )}
                </div>
            )}
            <label className={`absolute -top-2.5 left-4 bg-white px-1 text-xs font-bold pointer-events-none ${error ? 'text-red-500' : 'text-black'}`}>{label}</label>
            {error && <span className="absolute -bottom-5 left-1 text-[10px] font-bold text-red-500 animate-slide-up">{error}</span>}
        </div>
    );
};
const FloatingLabelDataList = ({ label, placeholder, listId, options, value, onChange, error }: any) => (
    <div className="relative group">
        <input list={listId} placeholder={placeholder} value={value} onChange={onChange} className={`w-full px-4 py-4 rounded-xl border text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all bg-transparent pt-4 pb-4 ${error ? 'border-red-500 bg-red-50/30' : 'border-slate-300'}`} />
        <datalist id={listId}>{options.map((opt: string, i: number) => <option key={i} value={opt} />)}</datalist>
        <label className={`absolute -top-2.5 left-4 bg-white px-1 text-xs font-bold pointer-events-none ${error ? 'text-red-500' : 'text-black'}`}>{label}</label>
        {error && <span className="absolute -bottom-5 left-1 text-[10px] font-bold text-red-500 animate-slide-up">{error}</span>}
    </div>
);
const SocialButtons = () => (
    <div className="space-y-3 pt-4">
        <button className="w-full py-3.5 rounded-full border border-slate-300 flex items-center justify-center gap-3 font-bold text-slate-700 hover:bg-slate-50 transition-colors text-sm"><GoogleIcon /> Continue with Google</button>
        <button className="w-full py-3.5 rounded-full border border-slate-300 flex items-center justify-center gap-3 font-bold text-slate-700 hover:bg-slate-50 transition-colors text-sm"><AppleIcon /> Continue with Apple</button>
    </div>
);
const GoogleIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M23.52 12.29C23.52 11.43 23.44 10.61 23.3 9.82H12V14.45H18.47C18.18 15.93 17.32 17.18 16.03 18.04V21.03H19.9C22.16 18.94 23.52 15.91 23.52 12.29Z" fill="#4285F4" /><path d="M12 24C15.24 24 17.96 22.93 19.9 21.03L16.03 18.04C14.96 18.76 13.59 19.18 12 19.18C8.88 19.18 6.24 17.08 5.29 14.25H1.29V17.34C3.25 21.23 7.31 24 12 24Z" fill="#34A853" /><path d="M5.29 14.25C5.04 13.41 4.9 12.52 4.9 11.61C4.9 10.7 5.04 9.81 5.29 8.97V5.88H1.29C0.47 7.52 0 9.5 0 11.61C0 13.72 0.47 15.7 1.29 17.34L5.29 14.25Z" fill="#FBBC05" /><path d="M12 4.05C13.76 4.05 15.34 4.66 16.59 5.85L19.98 2.46C17.96 0.58 15.24 0 12 0C7.31 0 3.25 2.77 1.29 6.66L5.29 9.75C6.24 6.92 8.88 4.05 12 4.05Z" fill="#EA4335" /></svg>);
const AppleIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="black" xmlns="http://www.w3.org/2000/svg"><path d="M17.05 20.28C16.05 21.72 14.94 23.95 13.25 23.95C11.66 23.95 11.16 23.01 9.33 23.01C7.49 23.01 6.9 23.92 5.38 23.95C3.76 23.98 2.37 21.5 1.34 20.01C-0.75 16.99 -0.62 11.37 2.12 9.77C3.47 8.98 5.61 8.87 6.99 9.68C8.28 10.43 9.07 10.46 9.94 10.46C10.81 10.46 11.85 10.22 13.01 9.6C14.65 8.73 15.9 8.8 16.63 9.15C13.43 11.07 12.65 15.54 15.35 17.15C14.7 18.57 13.88 20.06 17.05 20.28ZM12.03 6.25C12.75 5.37 13.24 4.14 13.1 2.92C12.01 3.03 10.69 3.65 9.91 4.56C9.17 5.41 8.63 6.67 8.81 7.89C10.03 7.98 11.27 7.15 12.03 6.25Z" /></svg>);
