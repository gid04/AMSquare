
import React, { useState, useEffect, useRef } from 'react';
import { createAnalystChat } from '../services/geminiService';
import { ChatMessage, Service, UserData, ManagedUser } from '../types';
import { Send, Paperclip, Mic, X, MessageSquarePlus, Share2, Check, UserPlus, Users, FileText, Download } from 'lucide-react';
import { Chat, GenerateContentResponse } from '@google/genai';

interface FloatingAgentChatProps {
  isOpen: boolean;
  onClose: () => void;
  onAutoFill?: (services: Service[]) => void;
  userData?: UserData;
  initialQuery?: string;
  staffList?: ManagedUser[];
}

// Reusable Markdown Render
const renderMessageText = (text: string) => {
    const lines = text.split('\n');
    let inTable = false;
    let tableRows: string[][] = [];
    const elements: React.ReactNode[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim().startsWith('|')) {
            inTable = true;
            const cols = line.split('|').filter(c => c.trim() !== '').map(c => c.trim());
            if (!line.includes('---')) tableRows.push(cols);
        } else {
            if (inTable) {
                elements.push(
                    <div key={`table-${i}`} className="overflow-x-auto border border-slate-200 rounded-xl my-2 bg-white/50">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                                <tr>{tableRows[0]?.map((h, idx) => <th key={idx} className="px-3 py-2">{h.replace(/\*\*/g, '')}</th>)}</tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {tableRows.slice(1).map((row, rIdx) => (
                                    <tr key={rIdx} className="hover:bg-slate-50">
                                        {row.map((c, cIdx) => <td key={cIdx} className="px-3 py-2 text-slate-600 border-r border-slate-100 last:border-0">{c.replace(/\*\*/g, '')}</td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
                tableRows = [];
                inTable = false;
            }
            if (line.trim().length > 0) {
                elements.push(
                    <p key={i} className="mb-2 whitespace-pre-wrap">
                        {line.split('**').map((part, idx) => idx % 2 === 1 ? <strong key={idx}>{part}</strong> : part)}
                    </p>
                );
            }
        }
    }
    return <div className="text-sm">{elements}</div>;
};

// Thinking Bubble Component
const ThinkingBubble = ({ text }: { text: string }) => (
    <div className="flex flex-col gap-1.5 max-w-[85%] animate-fade-in my-2">
        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl rounded-tl-none p-3 flex items-center gap-2 w-fit">
            <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-[#50C913] rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-[#50C913] rounded-full animate-bounce delay-100"></div>
                <div className="w-1.5 h-1.5 bg-[#50C913] rounded-full animate-bounce delay-200"></div>
            </div>
        </div>
        <span className="text-[10px] font-semibold text-slate-400 ml-1 animate-pulse">{text}</span>
    </div>
);

// Artifact Component (Invoice/Report)
const ArtifactCard = ({ type, title }: { type: 'invoice' | 'report', title: string }) => (
    <div className="bg-white border border-slate-200 rounded-xl p-4 my-2 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${type === 'invoice' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                {type === 'invoice' ? <FileText className="w-5 h-5" /> : <Download className="w-5 h-5" />}
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
            <button className="flex-1 bg-white border border-slate-200 text-slate-700 text-xs font-bold py-2 rounded-lg hover:bg-slate-50 transition-colors">
                Download PDF
            </button>
        </div>
    </div>
);

// Helper to construct app-wide data context
const getAppContext = (userData?: UserData, staffList?: ManagedUser[]) => {
    if (!userData) return "No user data available.";
    const isFresh = userData.isFreshSignup;
    
    // Build Team Context string
    const teamContext = staffList?.map(m => `- ${m.name} (${m.role}) [Status: ${m.status}, Residency: ${m.residency}]`).join('\n') || "No staff data.";

    return `
    CURRENT USER: ${userData.firstName} ${userData.lastName}
    BUSINESS: ${userData.businessName} (${userData.niche})
    LOCATION: ${userData.location}
    FINANCIALS: Revenue ${isFresh ? '$0' : '$1.8M'}, Profit ${isFresh ? '$0' : '$560k'}
    
    TEAM ROSTER:
    ${teamContext}
    
    KPI FRAMEWORK STATUS: 
    - Survival (Layer 1): Warning (Cash Runway < 180 Days)
    - Scale Readiness (Layer 5): Critical (Expansion Locked)
    `;
};

export const FloatingAgentChat: React.FC<FloatingAgentChatProps> = ({ isOpen, onClose, onAutoFill, userData, initialQuery, staffList }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Hello${userData ? ', ' + userData.firstName : ''}!\nI am ${userData?.agentName || 'Ralph'}, your acting Chief Financial Officer.`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingText, setThinkingText] = useState('Thinking...');
  
  // Participants State
  const [participants, setParticipants] = useState<ManagedUser[]>([]);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  // Conversation State Machine
  const [conversationStage, setConversationStage] = useState<'idle' | 'interview' | 'confirming'>('idle');
  
  const chatSession = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle Initial Query Logic (Triggered from outside)
  useEffect(() => {
      if (initialQuery && isOpen && !isLoading) {
          setInput(initialQuery);
          // Auto-send after a brief delay to ensure UI is ready
          const timer = setTimeout(() => {
              handleSend(initialQuery);
          }, 500);
          return () => clearTimeout(timer);
      }
  }, [initialQuery, isOpen]);

  // Auto-start interview if fresh signup AND no specific query
  useEffect(() => {
    if (isOpen && userData?.isFreshSignup && conversationStage === 'idle' && messages.length === 1 && !initialQuery) {
        setConversationStage('interview');
        setTimeout(() => {
            const nextMsg: ChatMessage = {
                id: 'init-interview',
                role: 'model',
                text: "I see you're setting up your business configuration. To help me populate your services and tax frameworks accurately, could you tell me a bit more about what your business does?",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, nextMsg]);
        }, 1000);
    }
  }, [isOpen, userData, conversationStage, initialQuery]);

  useEffect(() => {
    if (isOpen && !chatSession.current) {
        const appContext = getAppContext(userData, staffList);
        chatSession.current = createAnalystChat({
            name: userData?.agentName,
            personality: userData?.agentPersonality,
            model: userData?.agentModel,
            context: appContext
        });
    }
  }, [isOpen, userData, staffList]);

  useEffect(() => {
    if (isOpen) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  const handleAddParticipant = (user: ManagedUser) => {
      setParticipants(prev => {
          if (prev.find(p => p.id === user.id)) return prev;
          
          setMessages(currentMessages => [...currentMessages, {
              id: Date.now().toString(),
              role: 'model',
              text: `*${user.name} (${user.role}) has been added to the chat.*`,
              timestamp: new Date(),
              senderName: 'System',
              senderRole: 'System'
          }]);
          
          return [...prev, user];
      });
      setIsAddMemberOpen(false);
  };

  const handleApproveStaffAdd = (msgId: string, staff: ManagedUser) => {
      // Update message status
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, requestStatus: 'approved' } : m));
      handleAddParticipant(staff);
  };

  const handleDenyStaffAdd = (msgId: string) => {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, requestStatus: 'denied' } : m));
  };

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || input;
    if ((!textToSend.trim() && !isLoading) || !chatSession.current) return;

    // Detect if addressing a specific staff member
    const textLower = textToSend.toLowerCase();
    
    // Check for Broadcast
    const isBroadcast = textLower.includes('everyone') || textLower.includes('team') || textLower.includes('all') || textLower.includes('guys');

    let targetStaff: ManagedUser | undefined;
    
    if (!isBroadcast && participants.length > 0) {
        // Simple heuristic: Check if message contains First Name or @Name
        targetStaff = participants.find(p => {
            const firstName = p.name.split(' ')[0].toLowerCase();
            return textLower.includes(firstName) || textLower.includes('@' + firstName);
        });
    }

    const agentName = userData?.agentName || 'Ralph';
    const isAgentAddressed = textToSend.toLowerCase().includes('@' + agentName.toLowerCase());

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setThinkingText(targetStaff ? `Consulting ${targetStaff.name.split(' ')[0]}...` : (isBroadcast ? "Notifying team..." : "Analysing request..."));

    // Cycle thinking text
    const thinkingInterval = setInterval(() => {
        const thoughts = ["Checking your data...", "Reviewing financials...", "Formulating response...", "Accessing tools..."];
        setThinkingText(thoughts[Math.floor(Math.random() * thoughts.length)]);
    }, 2000);

    // Financial Action Interception (Invoice / Report)
    const isFinancialAction = textLower.includes('invoice') || textLower.includes('report') || textLower.includes('pay') || textLower.includes('transfer');
    
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
        // Intercept for Interview Logic (Only if not a direct query)
        if (conversationStage === 'interview' && !initialQuery) {
            const prompt = `The user has described their business: "${textToSend}". 
            Based on this, suggest 3-4 plausible services or products they might sell with pricing, and mention 1 relevant tax regulation. 
            Format the services in a Markdown table with columns: Name, Price, Frequency.
            Ask if they want to auto-add these to their configuration.`;
            
            const result = await chatSession.current.sendMessageStream({ message: prompt });
            clearInterval(thinkingInterval);
            setIsLoading(false);
            await processStream(result);
            setConversationStage('confirming');
            return;
        }

        if (conversationStage === 'confirming' && !initialQuery) {
            if (textToSend.toLowerCase().includes('yes') || textToSend.toLowerCase().includes('ok') || textToSend.toLowerCase().includes('sure')) {
                const completionMsg: ChatMessage = {
                    id: Date.now().toString(),
                    role: 'model',
                    text: "Great! I've added those services to your Business Configuration as 'Draft' items and enabled the relevant tax tracking policies. You can review and activate them whenever you're ready.",
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, completionMsg]);
                
                if (onAutoFill) {
                    onAutoFill([
                        { id: Date.now().toString() + '1', type: 'Service', name: 'Standard Service Package', description: 'Core offering based on your description.', price: 1500, frequency: 'Monthly', status: 'Draft' },
                        { id: Date.now().toString() + '2', type: 'Service', name: 'Premium Consultation', description: 'Advanced support tier.', price: 3000, frequency: 'Monthly', status: 'Draft' },
                        { id: Date.now().toString() + '3', type: 'Service', name: 'Onboarding Fee', description: 'One-time setup.', price: 500, frequency: 'One-time', status: 'Draft' }
                    ]);
                }
                setConversationStage('idle'); // Done
            } else {
                const result = await chatSession.current.sendMessageStream({ message: textToSend });
                clearInterval(thinkingInterval);
                setIsLoading(false);
                await processStream(result);
                setConversationStage('idle');
            }
            clearInterval(thinkingInterval);
            setIsLoading(false);
            return;
        }

      // --- LOGIC FOR MULTI-PERSONA CHAT ---
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
              - Your response should be direct to the user's query.
              `;
              
              const result = await chatSession.current.sendMessage({ message: staffPrompt });
              
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

      let finalPrompt = textToSend;
      if (isAgentAddressed) {
          // Direct addressing of agent
          finalPrompt += `\n
          [SYSTEM INSTRUCTION: CASUAL MODE]
          The user is addressing you directly ("@${agentName}").
          Respond logically to the message. 
          If the message is casual (e.g. "Hi", "How are you"), respond casually and briefly. 
          Do not force financial data if it's not relevant to the user's greeting or question.
          `;
      }

      // Standard Chat
      const result = await chatSession.current.sendMessageStream({ message: finalPrompt });
      clearInterval(thinkingInterval);
      setIsLoading(false);
      
      const modelMsgId = (Date.now() + 1).toString();
      let fullText = "";
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
        text: "I apologize, but I encountered an error. Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
      clearInterval(thinkingInterval);
    }
  };

  const processStream = async (result: any) => {
      const modelMsgId = (Date.now() + 1).toString();
      let fullText = "";

      setMessages(prev => [...prev, {
        id: modelMsgId,
        role: 'model',
        text: '',
        timestamp: new Date(),
        isStreaming: true
      }]);

      for await (const chunk of result) {
        const chunkText = (chunk as GenerateContentResponse).text;
        if (chunkText) {
          fullText += chunkText;
          setMessages(prev => prev.map(msg => 
            msg.id === modelMsgId ? { ...msg, text: fullText } : msg
          ));
        }
      }
      
      setMessages(prev => prev.map(msg => 
        msg.id === modelMsgId ? { ...msg, isStreaming: false } : msg
      ));
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Available staff to add (exclude already added)
  const availableStaff = staffList?.filter(s => !participants.find(p => p.id === s.id)) || [];

  if (!isOpen) return null;

  return (
    <div className="fixed top-4 bottom-4 right-4 w-[400px] bg-[#f5f5f5] rounded-3xl shadow-2xl z-50 flex flex-col border border-slate-200 overflow-hidden animate-fade-in font-sans">
       <div className="bg-white px-6 py-5 flex items-center justify-between border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 flex items-center justify-center text-[#50C913]">
                <Share2 className="w-6 h-6" />
             </div>
             <div>
                <h2 className="text-lg font-bold text-slate-900 leading-none flex items-center gap-2">
                    {userData?.agentName || 'Ralph'}
                    {participants.length > 0 && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-full text-slate-500">+{participants.length}</span>}
                </h2>
                <div className="flex items-center gap-1 mt-1">
                    <p className="text-xs font-semibold text-slate-500">CFO agent</p>
                    {participants.length > 0 && (
                        <div className="flex -space-x-1.5 ml-2">
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
                    className="p-2 text-slate-500 hover:text-black hover:bg-slate-50 rounded-lg transition-colors"
                    title="Add Member"
                >
                    <UserPlus className="w-5 h-5" />
                </button>
                {/* Add Member Dropdown */}
                {isAddMemberOpen && (
                    <div className="absolute right-0 top-12 w-64 bg-white rounded-xl shadow-xl border border-slate-100 z-50 animate-fade-in p-2">
                        <div className="px-3 py-2 border-b border-slate-50 mb-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Add to Chat</span>
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
                                    <div className="w-6 h-6 flex items-center justify-center rounded-full border border-slate-200 text-slate-300 group-hover:border-[#50C913] group-hover:text-[#50C913]">
                                        <UserPlus className="w-3 h-3" />
                                    </div>
                                </button>
                            )) : (
                                <div className="p-4 text-center text-slate-400 text-xs">No active staff available.</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <button 
                onClick={() => {
                    setMessages([{
                        id: Date.now().toString(),
                        role: 'model',
                        text: `Hello! I am ${userData?.agentName || 'Ralph'}, your acting Chief Financial Officer.\nHow can I assist you today?`,
                        timestamp: new Date()
                    }]);
                    setParticipants([]); // Clear participants on reset
                    setConversationStage('idle');
                }}
                className="p-2 text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                title="Reset Chat"
            >
                <MessageSquarePlus className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-black hover:bg-slate-50 rounded-lg transition-colors">
                <X className="w-5 h-5" />
            </button>
          </div>
       </div>

       <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none bg-[#f5f5f5]">
          {messages.map((msg) => (
             <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`${
                   msg.role === 'user' 
                   ? 'bg-black text-white shadow-sm' 
                   : 'bg-white border border-slate-100 shadow-sm'
                } rounded-2xl p-4 max-w-[85%] text-sm font-medium leading-relaxed`}>
                   
                   {/* Sender Label for Room Chat */}
                   {msg.role === 'model' && (msg.senderName || msg.senderRole) && (
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100/80">
                            {msg.senderAvatar ? (
                                <img src={msg.senderAvatar} className="w-4 h-4 rounded-full" />
                            ) : (
                                <div className="w-4 h-4 flex items-center justify-center text-[#50C913] bg-black/5 rounded-full"><Share2 className="w-2.5 h-2.5" /></div>
                            )}
                            <span className="text-[10px] font-bold text-slate-900">{msg.senderName || userData?.agentName}</span>
                            <span className="text-[9px] text-slate-400 bg-slate-50 border border-slate-100 px-1 rounded">{msg.senderRole || 'Agent'}</span>
                        </div>
                   )}

                   {/* Standard Message Content or Action Request */}
                   {msg.requestType ? (
                       <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
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
                                       className="flex-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold py-2 rounded-lg transition-colors"
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
                       <>
                           {renderMessageText(msg.text || (msg.isStreaming ? '...' : ''))}
                           
                           {/* Artifact Injection in Floating Chat */}
                           {msg.text.includes('prepared the invoice') && (
                               <div className="mt-3">
                                   <ArtifactCard type="invoice" title={`Invoice for ${userData?.businessName || 'Client'}`} />
                               </div>
                           )}
                           {msg.text.includes('generated report') && (
                               <div className="mt-3">
                                   <ArtifactCard type="report" title="Financial Report" />
                               </div>
                           )}
                       </>
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

       <div className="p-6 bg-[#f5f5f5]">
          <div className="bg-white rounded-full px-4 py-2 flex items-center gap-2 shadow-sm border border-slate-200">
             <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <Paperclip className="w-4 h-4" />
             </button>
             <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                 <Mic className="w-4 h-4" />
             </button>
             <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={participants.length > 0 ? `@${participants[0]?.name.split(' ')[0]}... or @${userData?.agentName || 'Ralph'}` : "Ask about anything.."}
                className="flex-1 bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none"
             />
             <button 
                onClick={() => handleSend()}
                disabled={(!input.trim() && !isLoading)}
                className="p-2 text-slate-900 hover:text-[#50C913] disabled:opacity-30 transition-colors"
             >
                <Send className="w-4 h-4" />
             </button>
          </div>
       </div>
    </div>
  );
};
