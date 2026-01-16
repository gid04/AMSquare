
import React, { useState, useEffect, useRef } from 'react';
import { createAnalystChat } from '../../services/geminiService';
import { ChatMessage, AutomationRule, UserData, ChatSession, ManagedUser } from '../../types';
import { Send, Share2, Search, Paperclip, Mic, ChevronRight, MessageSquarePlus, MoreHorizontal, X, File as FileIcon, Image as ImageIcon, Zap, Trash2, Loader2, UserPlus, Users, Check, FileText, Download, AlertCircle } from 'lucide-react';
import { Chat, GenerateContentResponse } from '@google/genai';

interface AnalystViewProps {
    onAddRule?: (rule: AutomationRule) => void;
    userData?: UserData;
    staffList?: ManagedUser[]; // Available staff to add to chat
}

const STORAGE_KEY = 'amsquare_chat_history';

// Helper to construct app-wide data context
const getAppContext = (userData?: UserData, staffList?: ManagedUser[]) => {
    if (!userData) return "No user data available.";
    
    // Simulate aggregating data from other views
    const isFresh = userData.isFreshSignup;
    const revenue = isFresh ? "$0" : "$1.8M";
    const expenses = isFresh ? "$0" : "$1.0M";
    const profit = isFresh ? "$0" : "$560k";
    
    // Build Team Context string
    const teamContext = staffList?.map(m => `- ${m.name} (${m.role}) [Status: ${m.status}, Residency: ${m.residency}]`).join('\n') || "No staff data.";

    return `
    CURRENT USER: ${userData.firstName} ${userData.lastName} (${userData.email})
    BUSINESS: ${userData.businessName}
    NICHE: ${userData.niche}
    LOCATION: ${userData.location}
    LEGAL STRUCTURE: ${userData.legalStructure}
    
    FINANCIAL SNAPSHOT (Live):
    - Total Revenue (YTD): ${revenue}
    - Total Expenses (YTD): ${expenses}
    - Net Profit: ${profit}
    
    KPI ENFORCEMENT FRAMEWORK STATUS (MOCK DATA):
    1. SURVIVAL LAYER: Score 72%
       - Cash Runway: 142 Days (Warning). Action: Hiring locked.
       - Net Burn: -$12.5k/mo (Safe).
       - Cash Conversion Cycle: 45 Days (Warning).
    2. ECONOMIC REALITY: Score 88%
       - Gross Margin: 71% (Safe).
       - Operating Leverage: 1.4x (Safe).
    3. REGULATORY: Score 65%
       - Tax Exposure: 8% (Warning). Action: Dividends locked.
       - Compliance Coverage: 90%. Action: Expansion blocked.
    4. CAPITAL: Score 92% (Safe)
    5. SCALE READINESS: 45/100 (CRITICAL). Action: Fundraising features locked.

    RECENT TRANSACTIONS (Mock):
    - AWS Infrastructure: -$2,450 (Infrastructure)
    - Stripe Payout: +$15,420 (Revenue)
    - WeWork Rent: -$4,500 (Operations)
    - Q3 Tax Provision: -$12,000 (Tax)
    
    TEAM ROSTER:
    ${teamContext}
    
    REGULATIONS:
    - Active Frameworks based on location: GDPR (if EU), CCPA/SOX (if USA).
    `;
};

// Internal component for rich text rendering
const MessageContent = ({ text, isUser }: { text: string, isUser?: boolean }) => {
    // Basic Markdown Parser for Tables, Headers, Bold, and Lists
    const parseMarkdown = (input: string) => {
        const lines = input.split('\n');
        let inTable = false;
        let tableRows: string[][] = [];
        const elements: React.ReactNode[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Tables
            if (line.trim().startsWith('|')) {
                inTable = true;
                const cols = line.split('|').filter(c => c.trim() !== '').map(c => c.trim());
                if (!line.includes('---')) { // Skip separator
                    tableRows.push(cols);
                }
            } else {
                if (inTable) {
                    // Flush Table
                    elements.push(
                        <div key={`table-${i}`} className={`overflow-x-auto border rounded-xl my-2 ${isUser ? 'border-white/20 bg-white/10' : 'border-slate-200 bg-white/50'}`}>
                            <table className="w-full text-xs text-left">
                                <thead className={`border-b font-bold ${isUser ? 'bg-white/10 border-white/20 text-white' : 'bg-slate-100/50 border-slate-200 text-slate-800'}`}>
                                    <tr>
                                        {tableRows[0]?.map((h, idx) => <th key={idx} className="px-3 py-1.5">{h.replace(/\*\*/g, '')}</th>)}
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${isUser ? 'divide-white/10' : 'divide-slate-100'}`}>
                                    {tableRows.slice(1).map((row, rIdx) => (
                                        <tr key={rIdx} className={isUser ? 'hover:bg-white/5' : 'hover:bg-slate-50/50'}>
                                            {row.map((c, cIdx) => <td key={cIdx} className={`px-3 py-1.5 ${isUser ? 'text-slate-200' : 'text-slate-700'}`}>{c.replace(/\*\*/g, '')}</td>)}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    );
                    tableRows = [];
                    inTable = false;
                }

                // Headers
                if (line.startsWith('### ')) {
                    elements.push(<h3 key={i} className={`text-sm font-bold mt-3 mb-1 ${isUser ? 'text-white' : 'text-slate-900'}`}>{line.replace('### ', '')}</h3>);
                } else if (line.startsWith('## ')) {
                    elements.push(<h2 key={i} className={`text-base font-bold mt-4 mb-2 border-b pb-1 ${isUser ? 'text-white border-white/20' : 'text-slate-900 border-slate-200'}`}>{line.replace('## ', '')}</h2>);
                }
                // Lists
                else if (line.trim().startsWith('- ')) {
                    elements.push(
                        <li key={i} className={`ml-4 list-disc pl-1 py-0.5 text-xs leading-relaxed ${isUser ? 'text-slate-200' : 'text-slate-700'}`}>
                            {line.replace('- ', '').split('**').map((part, idx) => 
                                idx % 2 === 1 ? <strong key={idx} className={isUser ? 'text-white' : 'text-slate-900'}>{part}</strong> : part
                            )}
                        </li>
                    );
                }
                // Standard Text with Bold
                else if (line.trim().length > 0) {
                    elements.push(
                        <p key={i} className={`mb-1.5 leading-relaxed ${isUser ? 'text-slate-200' : 'text-slate-700'}`}>
                            {line.split('**').map((part, idx) => 
                                idx % 2 === 1 ? <strong key={idx} className={isUser ? 'text-white' : 'text-slate-900'}>{part}</strong> : part
                            )}
                        </p>
                    );
                }
            }
        }
        
        // Flush remaining table if ends on table
        if (inTable && tableRows.length > 0) {
             elements.push(
                <div key="table-end" className={`overflow-x-auto border rounded-xl my-2 ${isUser ? 'border-white/20 bg-white/10' : 'border-slate-200 bg-white/50'}`}>
                    <table className="w-full text-xs text-left">
                        <thead className={`border-b font-bold ${isUser ? 'bg-white/10 border-white/20 text-white' : 'bg-slate-100/50 border-slate-200 text-slate-800'}`}>
                            <tr>{tableRows[0]?.map((h, idx) => <th key={idx} className="px-3 py-1.5">{h.replace(/\*\*/g, '')}</th>)}</tr>
                        </thead>
                        <tbody className={`divide-y ${isUser ? 'divide-white/10' : 'divide-slate-100'}`}>
                            {tableRows.slice(1).map((row, rIdx) => (
                                <tr key={rIdx} className={isUser ? 'hover:bg-white/5' : 'hover:bg-slate-50/50'}>
                                    {row.map((c, cIdx) => <td key={cIdx} className={`px-3 py-1.5 ${isUser ? 'text-slate-200' : 'text-slate-700'}`}>{c.replace(/\*\*/g, '')}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }

        return elements;
    };

    return <div className="text-sm">{parseMarkdown(text)}</div>;
};

// Thinking Bubble Component
const ThinkingBubble = ({ text }: { text: string }) => (
    <div className="flex flex-col gap-2 max-w-[55%] animate-fade-in">
        <div className="bg-[#fafafa] border border-slate-100 shadow-sm rounded-2xl rounded-tl-none p-3 flex items-center gap-3 w-fit">
            <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 bg-[#50C913] rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-[#50C913] rounded-full animate-bounce delay-100"></div>
                <div className="w-1.5 h-1.5 bg-[#50C913] rounded-full animate-bounce delay-200"></div>
            </div>
        </div>
        <span className="text-[10px] font-semibold text-slate-400 ml-2 animate-pulse">{text}</span>
    </div>
);

// Artifact Component (Invoice/Report)
const ArtifactCard = ({ type, title }: { type: 'invoice' | 'report', title: string }) => (
    <div className="bg-white border border-slate-200 rounded-xl p-4 my-2 shadow-sm max-w-sm">
        <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${type === 'invoice' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                {type === 'invoice' ? <FileIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
                <h4 className="font-bold text-slate-900 text-sm">{title}</h4>
                <p className="text-xs text-slate-500">{type === 'invoice' ? 'Ready for Review' : 'Generated Successfully'}</p>
            </div>
        </div>
        <div className="flex gap-2">
            <button className="flex-1 bg-black text-white text-xs font-bold py-2 rounded-lg hover:bg-slate-800 transition-colors">
                {type === 'invoice' ? 'Send Now' : 'View Report'}
            </button>
            <button className="flex-1 bg-white border border-slate-200 text-slate-700 text-xs font-bold py-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                <Download className="w-3.5 h-3.5" /> PDF
            </button>
        </div>
    </div>
);

export const AnalystView: React.FC<AnalystViewProps> = ({ onAddRule, userData, staffList }) => {
  // Chat State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Current Session State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<ManagedUser[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingText, setThinkingText] = useState('Thinking...');
  const [attachments, setAttachments] = useState<{file: File, preview: string, type: 'image' | 'file'}[]>([]);
  
  // UI State
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  const chatSession = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load History on Mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            setSessions(parsed);
            if (parsed.length > 0) {
                loadSession(parsed[0]);
            } else {
                createNewSession();
            }
        } catch (e) {
            console.error("Failed to load chat history", e);
            createNewSession();
        }
    } else {
        if (!userData?.isFreshSignup) {
             const mocks: ChatSession[] = [
                { id: 'mock1', title: 'Monthly financial summary', preview: `Hey ${userData?.agentName || 'Ralph'}, I need a summary...`, updatedAt: Date.now(), messages: [], participants: [] },
                { id: 'mock2', title: 'Tax Estimation', preview: 'What is my liability?', updatedAt: Date.now() - 100000, messages: [], participants: [] }
             ];
             setSessions(mocks);
             createNewSession();
        } else {
            createNewSession();
        }
    }
  }, []); 

  useEffect(() => {
    if (!activeSessionId) return;
    setSessions(prev => {
        const updated = prev.map(s => {
            if (s.id === activeSessionId) {
                const lastMsg = messages[messages.length - 1];
                return {
                    ...s,
                    messages: messages,
                    participants: participants, // Save participants
                    preview: lastMsg ? (lastMsg.text.slice(0, 50) + (lastMsg.text.length > 50 ? '...' : '')) : 'New Conversation',
                    updatedAt: Date.now()
                };
            }
            return s;
        });
        const sorted = updated.sort((a, b) => b.updatedAt - a.updatedAt);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
        return sorted;
    });
  }, [messages, activeSessionId, participants]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, attachments, isLoading]);

  // Re-initialize Gemini Chat when switching sessions or user config changes
  useEffect(() => {
    const appContext = getAppContext(userData, staffList);
    chatSession.current = createAnalystChat({
        name: userData?.agentName,
        personality: userData?.agentPersonality,
        model: userData?.agentModel,
        context: appContext
    }); 
  }, [activeSessionId, userData, staffList]);

  const createNewSession = () => {
      const newId = Date.now().toString();
      const agentName = userData?.agentName || 'Ralph';
      const welcomeMsg: ChatMessage = {
        id: 'welcome',
        role: 'model',
        senderName: agentName,
        senderRole: 'CFO Agent',
        text: `Hello, ${userData?.firstName || 'Gideon'}!\nI am ${agentName}, your acting Chief Financial Officer.\nI have access to your live dashboard, transactions, and team data.\n\nHow can I assist you today?`,
        timestamp: new Date()
      };
      
      const newSession: ChatSession = {
          id: newId,
          title: 'New Conversation',
          preview: 'Start chatting...',
          updatedAt: Date.now(),
          messages: [welcomeMsg],
          participants: []
      };

      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newId);
      setMessages([welcomeMsg]);
      setParticipants([]);
      setInput('');
      setAttachments([]);
  };

  const loadSession = (session: ChatSession) => {
      setActiveSessionId(session.id);
      setMessages(session.messages);
      setParticipants(session.participants || []);
      setInput('');
      setAttachments([]);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      const newSessions = sessions.filter(s => s.id !== id);
      setSessions(newSessions);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions));
      
      if (activeSessionId === id) {
          if (newSessions.length > 0) {
              loadSession(newSessions[0]);
          } else {
              createNewSession();
          }
      }
  };

  const handleAddParticipant = (user: ManagedUser) => {
      if (!participants.find(p => p.id === user.id)) {
          setParticipants(prev => [...prev, user]);
          setIsAddMemberOpen(false);
          // System message indicating user was added
          setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'model',
              text: `*${user.name} (${user.role}) has been added to the chat room.*`,
              timestamp: new Date(),
              senderName: 'System',
              senderRole: 'System'
          }]);
      }
  };

  const handleRemoveParticipant = (id: string) => {
      setParticipants(prev => prev.filter(p => p.id !== id));
  };

  const handleApproveStaffAdd = (msgId: string, staff: ManagedUser) => {
      // Update message status
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, requestStatus: 'approved' } : m));
      handleAddParticipant(staff);
  };

  const handleDenyStaffAdd = (msgId: string) => {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, requestStatus: 'denied' } : m));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newAttachments = Array.from(e.target.files).map((file: File) => ({
        file,
        preview: URL.createObjectURL(file),
        type: file.type.startsWith('image/') ? 'image' as const : 'file' as const
      }));
      setAttachments(prev => [...prev, ...newAttachments]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => {
      const newAtts = [...prev];
      URL.revokeObjectURL(newAtts[index].preview);
      newAtts.splice(index, 1);
      return newAtts;
    });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    
    if ((!textToSend.trim() && attachments.length === 0) || isLoading || !chatSession.current) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date(),
      attachments: attachments.map(a => a.preview)
    };

    setMessages(prev => [...prev, userMsg]);
    
    setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId && s.messages.length <= 1) {
            return { ...s, title: textToSend.slice(0, 30) };
        }
        return s;
    }));

    setInput('');
    const currentAttachments = [...attachments];
    setAttachments([]);
    
    // Check for explicit financial actions that require approval
    const textLower = textToSend.toLowerCase();
    const isFinancialAction = textLower.includes('invoice') || textLower.includes('report') || textLower.includes('pay') || textLower.includes('transfer');
    
    // Start Thinking Process
    setIsLoading(true);
    setThinkingText("Analysing request...");
    
    // Cycle thinking text
    const thinkingInterval = setInterval(() => {
        const thoughts = ["Checking transaction ledger...", "Reviewing compliance frameworks...", "Drafting financial strategy...", "Summarising data points..."];
        setThinkingText(thoughts[Math.floor(Math.random() * thoughts.length)]);
    }, 2000);

    // Hardcoded Rule Creation (Demo Feature)
    if (onAddRule && (textLower.includes('create rule') || textLower.includes('automate'))) {
        setTimeout(() => {
            clearInterval(thinkingInterval);
            const newRule: AutomationRule = {
                id: Date.now(),
                name: 'Agent Generated Rule ' + Math.floor(Math.random() * 100),
                active: true,
                condition: 'IF Revenue > $5000',
                action: 'Save 10% to Reserves',
                lastRun: 'Just now',
                source: 'agent'
            };
            onAddRule(newRule);
            
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'model',
                text: "I've created that automation rule for you. It's now active in your Automations tab.",
                senderName: userData?.agentName || 'Ralph',
                senderRole: 'CFO Agent',
                timestamp: new Date()
            }]);
            setIsLoading(false);
        }, 1500);
        return; 
    }

    // Financial Action Interception (Invoice / Report)
    if (isFinancialAction) {
        setTimeout(async () => {
            clearInterval(thinkingInterval);
            // 1. Notify approval needed
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'model',
                senderName: 'System',
                senderRole: 'Security Protocol',
                text: "*Financial action detected. Requesting Admin approval...*",
                timestamp: new Date()
            }]);

            // 2. Simulate delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 3. Approval Granted
            setMessages(prev => [...prev, {
                id: Date.now().toString() + 'app',
                role: 'model',
                senderName: 'System',
                senderRole: 'Security Protocol',
                text: "*Approval Granted.*",
                timestamp: new Date()
            }]);

            // 4. Generate Artifact
            if (textLower.includes('invoice')) {
                // Simulate invoice card
                setMessages(prev => [...prev, {
                    id: Date.now().toString() + 'inv',
                    role: 'model',
                    senderName: userData?.agentName || 'Ralph',
                    senderRole: 'CFO Agent',
                    text: `I have prepared the invoice as requested.`,
                    timestamp: new Date()
                }]);
            } else if (textLower.includes('report')) {
                 setMessages(prev => [...prev, {
                    id: Date.now().toString() + 'rep',
                    role: 'model',
                    senderName: userData?.agentName || 'Ralph',
                    senderRole: 'CFO Agent',
                    text: `Here is the generated report based on current ledger data.`,
                    timestamp: new Date()
                }]);
            } else {
                 setMessages(prev => [...prev, {
                    id: Date.now().toString() + 'fin',
                    role: 'model',
                    senderName: userData?.agentName || 'Ralph',
                    senderRole: 'CFO Agent',
                    text: `Financial action processed successfully.`,
                    timestamp: new Date()
                }]);
            }
            
            setIsLoading(false);
        }, 1000);
        return;
    }

    try {
      let messageContent: any = textToSend;

      if (currentAttachments.length > 0) {
        const parts = [];
        for (const att of currentAttachments) {
            const base64Data = await fileToBase64(att.file);
            parts.push({
                inlineData: {
                    mimeType: att.file.type,
                    data: base64Data
                }
            });
        }
        if (textToSend.trim()) {
            parts.push({ text: textToSend });
        }
        messageContent = parts;
      }

      // --- LOGIC FOR MULTI-PERSONA CHAT ROOM ---
      // Detect targets
      let targetStaff: ManagedUser | undefined;
      const isBroadcast = textLower.includes('everyone') || textLower.includes('team') || textLower.includes('all') || textLower.includes('guys');
      
      if (!isBroadcast && participants.length > 0) {
          targetStaff = participants.find(p => {
              const firstName = p.name.split(' ')[0].toLowerCase();
              return textLower.includes(firstName) || textLower.includes('@' + firstName);
          });
      }

      let targetsToRespond: ManagedUser[] = [];
      
      if (isBroadcast) {
          targetsToRespond = participants;
      } else if (targetStaff) {
          targetsToRespond = [targetStaff];
      }

      if (targetsToRespond.length > 0) {
          // Process responses sequentially
          for (const staff of targetsToRespond) {
              setThinkingText(`Wait for ${staff.name}...`);
              const staffPrompt = `
              [SYSTEM INSTRUCTION: ROLEPLAY MODE]
              The user said: "${textToSend}"
              You MUST respond AS ${staff.name}, who is the ${staff.role} located in ${staff.residency}.
              - Adopt a professional persona suitable for a ${staff.role}.
              - Do not mention you are an AI.
              - Your response should be short and direct.
              `;
              
              let finalPrompt = messageContent;
              if (typeof messageContent === 'string') {
                  finalPrompt = staffPrompt;
              } else {
                  // It's an array of parts
                  const textPart = messageContent.find((p: any) => p.text);
                  if (textPart) {
                      textPart.text += "\n" + staffPrompt;
                  } else {
                      if (Array.isArray(finalPrompt)) {
                          finalPrompt.push({ text: staffPrompt });
                      } else {
                          finalPrompt = [{ text: staffPrompt }];
                      }
                  }
              }

              const result = await chatSession.current.sendMessage({ message: finalPrompt });
              
              setMessages(prev => [...prev, {
                  id: Date.now().toString() + Math.random(),
                  role: 'model',
                  senderName: staff.name,
                  senderRole: staff.role,
                  senderAvatar: staff.avatar,
                  text: result.text || "...",
                  timestamp: new Date()
              }]);
              
              if (isBroadcast) await new Promise(r => setTimeout(r, 1000));
          }
          
          setIsLoading(false);
          clearInterval(thinkingInterval);
          return;
      }

      // Standard Agent Response
      const result = await chatSession.current.sendMessageStream({ message: messageContent });
      
      clearInterval(thinkingInterval);
      setIsLoading(false);

      const modelMsgId = (Date.now() + 1).toString();
      let fullText = "";
      
      // Temporary state for staff addition request
      let staffAddRequest: ManagedUser | null = null;

      setMessages(prev => [...prev, {
        id: modelMsgId,
        role: 'model',
        senderName: userData?.agentName || 'Ralph',
        senderRole: 'CFO Agent',
        senderAvatar: undefined, 
        text: '',
        timestamp: new Date(),
        isStreaming: true
      }]);

      for await (const chunk of result) {
        const chunkText = (chunk as GenerateContentResponse).text;
        if (chunkText) {
          fullText += chunkText;
          
          // Check specifically in the *entire* text for the tag
          const match = fullText.match(/\[ADD_STAFF: (.*?)\]/);
          if (match) {
              const nameOrRole = match[1];
              // Case insensitive partial match
              const staff = staffList?.find(s => 
                  s.name.toLowerCase().includes(nameOrRole.toLowerCase()) || 
                  s.role.toLowerCase().includes(nameOrRole.toLowerCase())
              );
              
              if (staff) {
                  staffAddRequest = staff;
              }
              // Remove tag from the text we display
              fullText = fullText.replace(match[0], ''); 
          }

          setMessages(prev => prev.map(msg => 
            msg.id === modelMsgId ? { ...msg, text: fullText } : msg
          ));
        }
      }
      
      setMessages(prev => prev.map(msg => 
        msg.id === modelMsgId ? { ...msg, isStreaming: false } : msg
      ));

      // Append Staff Request Card if detected
      if (staffAddRequest) {
          setMessages(prev => [...prev, {
              id: Date.now().toString() + '_req',
              role: 'model',
              senderName: 'System',
              senderRole: 'Assistant',
              text: '',
              timestamp: new Date(),
              requestType: 'add_staff',
              requestData: staffAddRequest,
              requestStatus: 'pending'
          }]);
      }

      // --- AUTONOMOUS AGENT FOLLOW-UP ---
      if (targetStaff && (textToSend.toLowerCase().includes('budget') || textToSend.toLowerCase().includes('tax') || textToSend.toLowerCase().includes('cost'))) {
          setTimeout(async () => {
              // Simulate agent thinking/reading
              setMessages(prev => [...prev, {
                  id: 'thinking-followup',
                  role: 'model',
                  senderName: userData?.agentName || 'Ralph',
                  senderRole: 'CFO Agent',
                  text: '...',
                  timestamp: new Date(),
                  isStreaming: true
              }]);
              
              const agentPrompt = `
              [SYSTEM INSTRUCTION: AGENT INTERVENTION]
              The user just spoke to ${targetStaff?.name} about "${textToSend}".
              As the CFO Agent, provide a brief, short, precise financial insight or correction regarding this topic.
              Do not repeat what ${targetStaff?.name} said. Add value from a treasury/compliance perspective.
              `;
              
              if (!chatSession.current) return;
              const followUpResult = await chatSession.current.sendMessage({ message: agentPrompt });
              
              setMessages(prev => prev.filter(m => m.id !== 'thinking-followup')); // Remove thinking placeholder
              setMessages(prev => [...prev, {
                  id: (Date.now() + 2).toString(),
                  role: 'model',
                  senderName: userData?.agentName || 'Ralph',
                  senderRole: 'CFO Agent',
                  text: followUpResult.text || "I have noted this in the ledger.",
                  timestamp: new Date()
              }]);

          }, 1500);
      }

    } catch (error) {
      console.error(error);
      clearInterval(thinkingInterval);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "I apologize, but I encountered an error processing your request. Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
      clearInterval(thinkingInterval);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    "Forecast next quarter revenue",
    "Create rule: Save 5% of all income",
    "2026 tax liability estimation"
  ];

  const filteredSessions = sessions.filter(session => 
    (session.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
    (session.preview?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const availableStaff = staffList?.filter(s => !participants.find(p => p.id === s.id)) || [];

  return (
    <div className="h-full flex gap-5 pb-5">
      {/* Main Chat Panel - 2/3 Width */}
      <div className="w-2/3 flex flex-col bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden relative">
        <div className="px-8 py-6 flex items-center justify-between border-b border-slate-50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 flex items-center justify-center text-[#50C913]">
              <Share2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-none flex items-center gap-2">
                  {participants.length > 0 ? 'Financial Room' : (userData?.agentName || 'Ralph')}
                  {participants.length > 0 && <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-500">{participants.length + 2} Members</span>}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs font-semibold text-slate-500">CFO agent</p>
                  {participants.length > 0 && (
                      <div className="flex -space-x-1.5">
                          {participants.map(p => (
                              <img key={p.id} src={p.avatar} alt={p.name} className="w-4 h-4 rounded-full border border-white" title={p.name} />
                          ))}
                      </div>
                  )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
                <button 
                    onClick={() => setIsAddMemberOpen(!isAddMemberOpen)}
                    className="p-2 text-slate-500 hover:text-black hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2"
                    title="Add Staff to Chat"
                >
                    <UserPlus className="w-5 h-5" />
                </button>
                {isAddMemberOpen && (
                    <div className="absolute right-0 top-12 w-64 bg-white rounded-xl shadow-xl border border-slate-100 z-50 animate-fade-in p-2">
                        <div className="px-3 py-2 border-b border-slate-50 mb-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Add to Room</span>
                        </div>
                        <div className="max-h-60 overflow-y-auto space-y-1">
                            {availableStaff.length > 0 ? availableStaff.map(staff => (
                                <button 
                                    key={staff.id}
                                    onClick={() => handleAddParticipant(staff)}
                                    className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors text-left group"
                                >
                                    <img src={staff.avatar} className="w-8 h-8 rounded-full border border-slate-100" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-800 truncate">{staff.name}</p>
                                        <p className="text-[10px] text-slate-500 truncate">{staff.role}</p>
                                    </div>
                                    <PlusIcon />
                                </button>
                            )) : (
                                <div className="p-4 text-center text-slate-400 text-xs">No active staff available.</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <button 
                onClick={createNewSession}
                className="p-2 text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                title="New Chat"
            >
                <MessageSquarePlus className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 pt-8 pb-4 space-y-8 scrollbar-none">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`${
                msg.role === 'user' 
                ? 'bg-black text-white shadow-md rounded-br-none max-w-[48%]' 
                : 'bg-[#fafafa] border border-slate-100 shadow-sm rounded-tl-none max-w-[55%]'
              } rounded-2xl p-4 relative group`}>
                
                {/* Sender Label */}
                {msg.role === 'model' && (
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200/50">
                        {msg.senderAvatar ? (
                            <img src={msg.senderAvatar} className="w-5 h-5 rounded-full" />
                        ) : (
                            <div className="w-5 h-5 flex items-center justify-center text-[#50C913] bg-black/5 rounded-full"><Share2 className="w-3 h-3" /></div>
                        )}
                        <span className="text-xs font-bold text-slate-900">{msg.senderName || userData?.agentName}</span>
                        <span className="text-[10px] text-slate-400 bg-white border border-slate-200 px-1.5 rounded">{msg.senderRole || 'Agent'}</span>
                    </div>
                )}

                {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex gap-2 mb-3 flex-wrap">
                        {msg.attachments.map((src, i) => (
                            <div key={i} className="relative rounded-xl overflow-hidden border border-black/10">
                                <img src={src} alt="attachment" className="h-40 w-auto object-cover" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Standard Message Content */}
                {msg.requestType ? (
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-start gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                <UserPlus className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900">Add Staff Member?</p>
                                <p className="text-xs text-slate-500">Ralph suggests adding {msg.requestData.name} ({msg.requestData.role}) to this chat.</p>
                            </div>
                        </div>
                        {msg.requestStatus === 'pending' ? (
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleApproveStaffAdd(msg.id, msg.requestData)}
                                    className="flex-1 bg-[#50C913] hover:bg-[#44ab10] text-black text-xs font-bold py-2 rounded-lg transition-colors"
                                >
                                    Approve
                                </button>
                                <button 
                                    onClick={() => handleDenyStaffAdd(msg.id)}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 rounded-lg transition-colors"
                                >
                                    Deny
                                </button>
                            </div>
                        ) : (
                            <div className={`text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-2 ${msg.requestStatus === 'approved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {msg.requestStatus === 'approved' ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                Request {msg.requestStatus}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={`${msg.role === 'user' ? 'text-white font-medium' : 'text-slate-700'}`}>
                    {msg.text ? (
                        msg.text.includes('have prepared the invoice') ? (
                            <ArtifactCard type="invoice" title={`Invoice for ${userData?.businessName || 'Client'}`} />
                        ) : msg.text.includes('generated report') ? (
                            <ArtifactCard type="report" title="Financial Report" />
                        ) : (
                            <MessageContent text={msg.text} isUser={msg.role === 'user'} />
                        )
                    ) : (
                        (msg.role === 'model' && msg.isStreaming) ? (
                            <span className="flex gap-1 py-1">
                                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-100" />
                                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-200" />
                            </span>
                        ) : null
                    )}
                    </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
              <div className="flex justify-start">
                  <ThinkingBubble text={thinkingText} />
              </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input Area (Similar to previous, abbreviated for brevity) */}
        <div className="px-8 pb-8 shrink-0 bg-white relative z-10">
            {messages.length < 2 && attachments.length === 0 && !isLoading && (
                <div className="flex gap-3 pb-3 overflow-x-auto scrollbar-none">
                    {quickActions.map((action, i) => (
                    <button 
                        key={i}
                        onClick={() => handleSend(action)}
                        className="flex items-center justify-between gap-3 bg-white border border-slate-100 px-5 py-3 rounded-[18px] hover:border-[#50C913] hover:shadow-md transition-all group whitespace-nowrap min-w-[220px]"
                    >
                         {action.includes('Create rule') && <Zap className="w-3.5 h-3.5 text-[#50C913]" />}
                        <span className="text-[13px] font-bold text-slate-800 truncate">{action}</span>
                        <div className="w-5 h-5 flex items-center justify-center shrink-0">
                        <ChevronRight className="w-4 h-4 text-[#50C913] group-hover:translate-x-1 transition-transform" />
                        </div>
                    </button>
                    ))}
                </div>
            )}

            {attachments.length > 0 && (
                <div className="flex gap-3 pb-3 overflow-x-auto scrollbar-none">
                    {attachments.map((att, i) => (
                        <div key={i} className="relative group shrink-0">
                            <div className="w-24 h-24 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center relative">
                                {att.type === 'image' ? (
                                    <img src={att.preview} alt="preview" className="w-full h-full object-cover" />
                                ) : (
                                    <FileIcon className="w-8 h-8 text-slate-400" />
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button 
                                        onClick={() => removeAttachment(i)}
                                        className="p-1.5 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 hover:border-[#50C913] hover:bg-[#50C913]/5 flex flex-col items-center justify-center gap-1 transition-all shrink-0"
                    >
                        <PlusIcon />
                        <span className="text-[10px] font-bold text-slate-400">Add</span>
                    </button>
                </div>
            )}

            <input 
                type="file" 
                multiple 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileSelect}
                accept="image/*,application/pdf,text/*"
            />

            <div className="flex gap-3 items-center">
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-12 h-12 flex items-center justify-center rounded-xl transition-colors shrink-0 ${
                        attachments.length > 0 ? 'bg-[#50C913] text-black shadow-md' : 'bg-white border border-slate-200 shadow-sm hover:bg-slate-50 text-slate-900'
                    }`}
                >
                    <Paperclip className="w-5 h-5" />
                </button>
                <div className="flex-1 relative">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={participants.length > 0 ? `Message the room (@${participants[0]?.name.split(' ')[0]}...)` : (attachments.length > 0 ? "Ask questions about these files..." : "Ask for expense analysis, tax prediction or automations..")}
                        className="w-full bg-white border border-slate-200 shadow-sm rounded-full pl-12 pr-14 py-3.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all placeholder:text-slate-400"
                    />
                    <Mic className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-900 cursor-pointer" />
                    <button 
                        onClick={() => handleSend()}
                        disabled={(!input.trim() && attachments.length === 0) || isLoading}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-900 hover:text-[#50C913] disabled:opacity-30 transition-colors"
                    >
                    <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* Right Panels (Chat History & Suggestions) - 1/3 Width */}
      <div className="w-1/3 flex flex-col gap-[10px] h-full overflow-hidden">
        <div className="flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4 px-1">
             <h3 className="text-xl font-bold text-slate-900 tracking-tight">Chat History</h3>
             <button onClick={createNewSession} className="text-xs font-bold text-[#50C913] hover:text-black transition-colors">
                 New Chat
             </button>
          </div>
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search chats..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium shadow-sm focus:ring-1 focus:ring-slate-300 transition-all focus:outline-none"
            />
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-none space-y-3 pr-1 pb-2">
            {filteredSessions.length > 0 ? filteredSessions.map(chat => (
              <div 
                key={chat.id} 
                onClick={() => loadSession(chat)}
                className={`p-5 rounded-[20px] relative transition-all cursor-pointer group ${
                  chat.id === activeSessionId 
                  ? 'bg-white ring-1 ring-[#50C913]/10 shadow-sm' 
                  : 'bg-white/40 hover:bg-white border border-transparent hover:shadow-sm'
                }`}
              >
                {chat.id === activeSessionId && <div className="absolute left-0 top-5 bottom-5 w-1 bg-[#50C913] rounded-r-full" />}
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-slate-900 text-[14px] truncate pr-4 max-w-[180px]">{chat.title || 'New Chat'}</h4>
                  <button 
                    onClick={(e) => deleteSession(e, chat.id)}
                    className="text-slate-400 hover:text-red-500 shrink-0 opacity-0 group-hover:opacity-100 transition-all"
                  >
                      <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-[12px] text-slate-500 font-medium truncate max-w-[160px]">{chat.preview}</p>
                  <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">
                      {new Date(chat.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                {/* Participant Icons in History Card */}
                {chat.participants && chat.participants.length > 0 && (
                    <div className="flex -space-x-1 mt-3">
                        {chat.participants.slice(0,3).map(p => (
                            <img key={p.id} src={p.avatar} className="w-4 h-4 rounded-full border border-white" />
                        ))}
                        {chat.participants.length > 3 && (
                            <div className="w-4 h-4 rounded-full bg-slate-100 border border-white text-[8px] flex items-center justify-center text-slate-500">+{chat.participants.length - 3}</div>
                        )}
                    </div>
                )}
              </div>
            )) : (
                <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white/40">
                    <p className="text-sm">No chats found.</p>
                </div>
            )}
          </div>
        </div>

        <div className="shrink-0">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-4 px-1">{userData?.agentName || 'Ralph'}'s key suggestions</h3>
          <div className="space-y-3">
            {[
              "Quarterly net revenue analysis",
              "2026 tax liability estimation"
            ].map((sug, i) => (
              <button 
                key={i}
                onClick={() => handleSend(sug)}
                className="w-full flex items-center justify-between p-5 bg-white rounded-[20px] shadow-sm hover:shadow-md transition-all group border border-slate-50"
              >
                <span className="text-sm font-bold text-slate-800 text-left">{sug}</span>
                <ChevronRight className="w-4 h-4 text-[#50C913] group-hover:translate-x-1 transition-transform shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const PlusIcon = () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 1V13M1 7H13" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
