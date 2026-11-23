
import React, { useState, useEffect, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { User, UserData, ManagedUser } from '../../types';
import { MoreHorizontal, Mail, Phone, Search, Plus, Shield, Filter, X, Calendar, UserPlus, Check, Trash2, Ban, RefreshCw, Edit2, Send, Globe, ChevronDown, DollarSign, Clock, Hash } from 'lucide-react';

interface TeamViewProps {
    userData?: UserData;
    onUpdateUserData?: (updates: Partial<UserData>) => void;
    staff: ManagedUser[];
    setStaff: React.Dispatch<React.SetStateAction<ManagedUser[]>>;
    hasPermission: (permission: any) => boolean;
}

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

const FREQUENCIES = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'];

// Generate 8-char AMSID (Uppercase Alphanumeric)
const generateAMSID = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

export const TeamView: React.FC<TeamViewProps> = ({ userData, onUpdateUserData, staff, setStaff, hasPermission }) => {
    const isFresh = userData?.isFreshSignup;

    // Convex Mutations
    const inviteStaff = useMutation(api.staff.inviteStaffMember);
    const updateStaff = useMutation(api.staff.updateStaffMember);
    const deleteStaff = useMutation(api.staff.deleteStaffMember);
    const addStaffDirect = useMutation(api.staff.addStaffMemberDirect);

    // State
    const [searchQuery, setSearchQuery] = useState('');
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Editing state
    const [editingUserId, setEditingUserId] = useState<string | null>(null);

    // Form State
    const [newStaff, setNewStaff] = useState({
        fullName: '',
        email: '',
        role: '',
        accessLevel: 'Viewer',
        deadline: '',
        residency: '',
        salary: '',
        paymentFrequency: 'Monthly',
        paymentDate: ''
    });

    // Click outside to close menu
    useEffect(() => {
        const handleClickOutside = () => setActiveMenuId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const resetForm = () => {
        setNewStaff({ fullName: '', email: '', role: '', accessLevel: 'Viewer', deadline: '', residency: '', salary: '', paymentFrequency: 'Monthly', paymentDate: '' });
        setEditingUserId(null);
    };

    const openAddModal = () => {
        resetForm();
        setIsAddModalOpen(true);
    };

    const openEditModal = (user: ManagedUser) => {
        setEditingUserId(user.id);
        setNewStaff({
            fullName: user.name,
            email: user.email || '',
            role: user.role,
            accessLevel: user.accessLevel || 'Viewer',
            deadline: user.invitationDeadline || '',
            residency: user.residency || '',
            salary: user.salary?.toString() || '',
            paymentFrequency: user.paymentFrequency || 'Monthly',
            paymentDate: user.paymentDate || ''
        });
        setIsAddModalOpen(true);
        setActiveMenuId(null);
    };

    const handleSaveStaff = async () => {
        if (!newStaff.fullName || !newStaff.email || !newStaff.role || !newStaff.residency || !userData?._id) return;

        try {
            const [firstName, ...lastNameParts] = newStaff.fullName.split(' ');
            const lastName = lastNameParts.join(' ') || 'User';

            if (editingUserId) {
                // Update Existing
                await updateStaff({
                    staffId: editingUserId as any,
                    updates: {
                        firstName,
                        lastName,
                        email: newStaff.email,
                        accessLevel: newStaff.accessLevel as any,
                        residency: newStaff.residency,
                        salary: Number(newStaff.salary) || 0,
                        paymentFrequency: newStaff.paymentFrequency,
                        paymentDate: newStaff.paymentDate
                    }
                });
            } else {
                // Create New - If admin level, use invite flow, if viewer use direct
                if (newStaff.accessLevel === 'Viewer') {
                    await addStaffDirect({
                        mainUserId: userData._id as any,
                        email: newStaff.email,
                        firstName,
                        lastName,
                        residency: newStaff.residency
                    });
                } else {
                    await inviteStaff({
                        mainUserId: userData._id as any,
                        email: newStaff.email,
                        firstName,
                        lastName,
                        accessLevel: newStaff.accessLevel as any,
                        residency: newStaff.residency,
                        salary: Number(newStaff.salary) || 0,
                        paymentFrequency: newStaff.paymentFrequency,
                        paymentDate: newStaff.paymentDate
                    });
                }
            }

            // Update global state for Regulations view
            if (onUpdateUserData && userData) {
                const currentResidencies = userData.staffResidencies || [];
                if (!currentResidencies.includes(newStaff.residency)) {
                    onUpdateUserData({
                        staffResidencies: [...currentResidencies, newStaff.residency]
                    });
                }
            }

            setIsAddModalOpen(false);
            resetForm();
        } catch (err) {
            console.error("Failed to save staff:", err);
            // In a real app, show a toast here
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (!userData?._id) return;
        try {
            await deleteStaff({
                staffId: id as any,
                mainUserId: userData._id as any
            });
            setActiveMenuId(null);
        } catch (err) {
            console.error("Failed to delete staff:", err);
        }
    };

    const handleToggleStatus = (id: string) => {
        setStaff(prev => prev.map(u =>
            u.id === id ? { ...u, status: u.status === 'active' ? 'busy' : 'active' } : u
        ));
    };

    const filteredUsers = staff.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in relative pb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Staff</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage personnel, roles, and automated payroll.</p>
                </div>
                {hasPermission('manage_staff') && (
                    <button
                        onClick={openAddModal}
                        className="bg-[#50C913] hover:bg-[#44ab10] text-black px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-[#50C913]/20 hover:shadow-[#50C913]/30 active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Add Staff Member
                    </button>
                )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                {/* Toolbar */}
                <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name or role..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-300 bg-white shadow-sm transition-all text-slate-900 placeholder:text-slate-400"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
                            <Filter className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                            <Shield className="w-4 h-4 text-black" />
                            <span className="font-bold text-black">{staff.filter(u => u.accessLevel === 'Admin').length} Admins</span>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-visible">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider">Employee</th>
                                <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider">AMSID</th>
                                <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider">Position</th>
                                <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider">Residency</th>
                                <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider">Compensation</th>
                                <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right font-medium uppercase text-[10px] tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-sm" />
                                                {user.joinedDate === 'Pending' && (
                                                    <div className="absolute -top-1 -right-1 bg-amber-500 text-white p-0.5 rounded-full border border-white" title="Invitation Pending">
                                                        <Mail className="w-2 h-2" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-slate-900">{user.name}</div>
                                                <div className="text-xs text-slate-400 font-mono mt-0.5">{user.email || 'No email'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-1 rounded border border-slate-200 text-slate-600">
                                            {user.amsid || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-slate-700 font-medium">{user.role}</span>
                                        <div className="text-[10px] text-slate-400 mt-0.5">{user.accessLevel}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-slate-500 text-xs">{user.residency || 'Unknown'}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.salary !== undefined ? (
                                            <div>
                                                <span className="text-slate-900 font-bold">${user.salary.toLocaleString()}</span>
                                                <span className="text-xs text-slate-500"> / {user.paymentFrequency}</span>
                                                {user.paymentDate && <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1"><Clock className="w-3 h-3" /> {user.paymentDate}</div>}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400">Not set</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2.5">
                                            <span className={`w-2 h-2 rounded-full ring-2 ring-white shadow-sm ${user.status === 'active' ? 'bg-[#50C913]' :
                                                user.status === 'busy' ? 'bg-amber-400' : 'bg-slate-300'
                                                }`} />
                                            <span className="capitalize text-slate-700 font-medium">
                                                {user.joinedDate === 'Pending' ? 'Invited' : user.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right relative">
                                        {hasPermission('manage_staff') && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === user.id ? null : user.id); }}
                                                className={`p-2 rounded-lg transition-all ${activeMenuId === user.id ? 'bg-slate-100 text-black' : 'text-slate-400 hover:text-black hover:bg-slate-100'}`}
                                            >
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                        )}
                                        {/* Actions Menu */}
                                        {activeMenuId === user.id && (
                                            <div className="absolute right-8 top-10 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 py-1 animate-fade-in text-left">
                                                <div className="px-4 py-2 border-b border-slate-50">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Manage {user.name.split(' ')[0]}</p>
                                                </div>

                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="w-full px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" /> Edit Details
                                                </button>

                                                {user.joinedDate === 'Pending' ? (
                                                    <button className="w-full px-4 py-2.5 text-xs font-bold text-blue-600 hover:bg-blue-50 flex items-center gap-2 transition-colors">
                                                        <Send className="w-3.5 h-3.5" /> Resend Invite
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleToggleStatus(user.id)}
                                                        className="w-full px-4 py-2.5 text-xs font-bold text-amber-600 hover:bg-amber-50 flex items-center gap-2 transition-colors"
                                                    >
                                                        <Ban className="w-3.5 h-3.5" /> {user.status === 'active' ? 'Suspend Access' : 'Activate User'}
                                                    </button>
                                                )}

                                                <div className="h-px bg-slate-100 my-1"></div>

                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="w-full px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" /> Remove User
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredUsers.length === 0 && (
                        <div className="p-12 text-center text-slate-400 text-sm">No staff members found.</div>
                    )}
                </div>
            </div>

            {/* Add/Edit Staff Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">{editingUserId ? 'Edit Staff Member' : 'Add Team Member'}</h2>
                                <p className="text-xs text-slate-500 mt-0.5">{editingUserId ? 'Update personnel details.' : 'Add a new member to your workspace.'}</p>
                            </div>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500 hover:text-black"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5 overflow-y-auto">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                                    <div className="relative">
                                        <UserPlus className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Jane Doe"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 shadow-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all placeholder:text-slate-400"
                                            value={newStaff.fullName}
                                            onChange={(e) => setNewStaff({ ...newStaff, fullName: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="email"
                                                placeholder="jane@company.com"
                                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 shadow-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all placeholder:text-slate-400"
                                                value={newStaff.email}
                                                onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Role / Position</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Accountant"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 shadow-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all placeholder:text-slate-400"
                                            value={newStaff.role}
                                            onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Country of Residency <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <select
                                            className="w-full pl-10 pr-8 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 shadow-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all appearance-none cursor-pointer"
                                            value={newStaff.residency}
                                            onChange={(e) => setNewStaff({ ...newStaff, residency: e.target.value })}
                                        >
                                            <option value="" disabled>Select Residency</option>
                                            {CONTINENTS_AND_COUNTRIES.map((loc, i) => (
                                                <option key={i} value={loc} disabled={loc.startsWith('---')}>{loc}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    </div>
                                    <p className="text-[10px] text-slate-400">Required for payroll & tax compliance.</p>
                                </div>

                                <div className="h-px bg-slate-100 my-1"></div>

                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-slate-900 uppercase">Compensation & Payroll</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Salary Amount</label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                                <input
                                                    type="number"
                                                    placeholder="5000"
                                                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 shadow-sm focus:outline-none focus:border-black transition-all"
                                                    value={newStaff.salary}
                                                    onChange={(e) => setNewStaff({ ...newStaff, salary: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Frequency</label>
                                            <div className="relative">
                                                <select
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 shadow-sm focus:outline-none focus:border-black appearance-none cursor-pointer"
                                                    value={newStaff.paymentFrequency}
                                                    onChange={(e) => setNewStaff({ ...newStaff, paymentFrequency: e.target.value })}
                                                >
                                                    {FREQUENCIES.map(freq => (
                                                        <option key={freq} value={freq}>{freq}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Payment Date</label>
                                        <input
                                            type="text"
                                            placeholder={newStaff.paymentFrequency === 'Weekly' ? 'e.g. Every Friday' : 'e.g. 28th of the month'}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 shadow-sm focus:outline-none focus:border-black transition-all"
                                            value={newStaff.paymentDate}
                                            onChange={(e) => setNewStaff({ ...newStaff, paymentDate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="h-px bg-slate-100 my-1"></div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Access Level</label>
                                        <div className="relative">
                                            <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <select
                                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 shadow-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all appearance-none cursor-pointer"
                                                value={newStaff.accessLevel}
                                                onChange={(e) => setNewStaff({ ...newStaff, accessLevel: e.target.value })}
                                            >
                                                <option value="Viewer">Viewer (Read Only)</option>
                                                <option value="Editor">Editor (Limited)</option>
                                                <option value="Manager">Manager (Standard)</option>
                                                <option value="Admin">Admin (Full Access)</option>
                                                <option value="Investor">Investor (Financials Only)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Invitation Deadline</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="date"
                                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 shadow-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all placeholder:text-slate-400"
                                                value={newStaff.deadline}
                                                onChange={(e) => setNewStaff({ ...newStaff, deadline: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 items-start">
                                <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-blue-800">Security Check</p>
                                    <p className="text-[11px] text-blue-600 mt-1 leading-relaxed">
                                        New members must enable 2FA upon their first login. Admins will be notified when they join.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    onClick={handleSaveStaff}
                                    disabled={!newStaff.fullName || !newStaff.email || !newStaff.residency}
                                    className="w-full py-3.5 bg-black text-white font-bold rounded-xl hover:bg-slate-900 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/20"
                                >
                                    {editingUserId ? (
                                        <>
                                            Save Changes <Check className="w-4 h-4" />
                                        </>
                                    ) : (
                                        <>
                                            Add Member <Plus className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
