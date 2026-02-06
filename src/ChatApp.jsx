import React, { useState } from "react";

// --- 1. CodeBlock Component (Unchanged) ---

const CodeBlock = ({ code }) => {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); 
        });
    };

    return (
        <div style={{
            background: '#1f2937',
            color: '#e5e7eb',
            padding: '12px',
            borderRadius: '8px',
            marginTop: '8px',
            marginBottom: '8px',
            position: 'relative',
            fontSize: '14px',
            overflowX: 'auto',
            fontFamily: 'monospace',
        }}>
            <button
                onClick={copyToClipboard}
                style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    padding: '4px 10px',
                    background: copied ? '#10B981' : '#374151',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    transition: 'background-color 0.2s',
                    zIndex: 10,
                }}
            >
                {copied ? 'Copied! ✅' : 'Copy'}
            </button>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {code}
            </pre>
        </div>
    );
};

// --- 2. NEW: TypingIndicator Component ---

const TypingIndicator = () => (
    <div style={{ display: 'flex', alignItems: 'center' }}>
        <div className="dot" style={{ background: '#059669', marginRight: '4px' }} />
        <div className="dot" style={{ background: '#059669', marginRight: '4px', animationDelay: '0.2s' }} />
        <div className="dot" style={{ background: '#059669', animationDelay: '0.4s' }} />
    </div>
);

// --- 3. Enhanced App Component ---

function ChatApp() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const formatMessage = (text) => {
        if (!text) return "";

        const parts = text.split("```");
        return parts.map((part, index) => {
            if (index % 2 === 0) {
                return <span key={index} dangerouslySetInnerHTML={{ __html: part.replace(/\n/g, "<br>") }} />;
            } else {
                return <CodeBlock key={index} code={part.trim()} />;
            }
        });
    };
    
    const streamText = (fullText, callback) => {
        let index = 0;

        const interval = setInterval(() => {
            callback(fullText.slice(0, index));
            index++;

            if (index > fullText.length) {
                clearInterval(interval);
            }
        }, 10);
    };

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input;
        setMessages((prev) => [...prev, { from: "user", text: userMessage }]);
        setInput("");
        setIsLoading(true);
        
        // Use the length AFTER adding the user message
        const aiIndex = messages.length + 1; 

        try {
            const res = await fetch("https://ai-e4er.onrender.com/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMessage }),
            });

            const data = await res.json();
            const aiReply = data.reply || "No response from AI.";

            // Add placeholder message
            setMessages((prev) => [...prev, { from: "ai", text: "" }]);

            streamText(aiReply, (partialText) => {
                setMessages((prev) => {
                    const updated = [...prev];
                    
                    // Safely update the placeholder message
                    // We look for the last message if the index is right, or just the last message if we are streaming
                    const targetIndex = updated.length - 1; 
                    if (targetIndex >= 0 && updated[targetIndex].from === "ai") {
                        updated[targetIndex].text = partialText;
                    }
                    return updated;
                });
            });
        } catch (err) {
            setMessages((prev) => [
                ...prev,
                { from: "ai", text: "⚠️ Server Error. Try again later." },
            ]);
        }

        setIsLoading(false); 
    };

    return (
        <div
            style={{
                width: "100%",
                minHeight: "100vh",
                background: "#f3f4f6",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "20px",
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    width: "100%", 
                    maxWidth: "550px", 
                    height: "90vh", 
                    background: "white",
                    borderRadius: "20px", 
                    boxShadow: "0 10px 25px rgba(0,0,0,0.15)", 
                    display: "flex",
                    flexDirection: "column",
                    padding: "20px", 
                    boxSizing: "border-box",
                }}
            >
                {/* Header */}
                <h2 style={{ 
                    textAlign: "center", 
                    margin: 0, 
                    marginBottom: 15,
                    color: '#1f2937',
                }}>
                    ✨ Nexa AI
                </h2>
                
                <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', marginBottom: '15px' }} />

                {/* Messages Container */}
                <div
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        padding: "10px",
                    }}
                >
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            style={{
                                display: "flex",
                                flexDirection: msg.from === "user" ? "row-reverse" : "row",
                                marginBottom: "16px",
                                alignItems: "flex-start",
                            }}
                        >
                            {/* Avatar */}
                            <div
                                style={{
                                    flexShrink: 0,
                                    width: 38,
                                    height: 38,
                                    borderRadius: "50%",
                                    background: msg.from === "user" ? "#4F46E5" : "#059669",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    color: "white",
                                    fontWeight: "bold",
                                    fontSize: 17,
                                    marginLeft: msg.from === "user" ? "12px" : "0",
                                    marginRight: msg.from === "ai" ? "12px" : "0",
                                }}
                            >
                                {msg.from === "user" ? "U" : "🤖"}
                            </div>

                            {/* Message Bubble */}
                            <div
                                style={{
                                    maxWidth: "75%",
                                    padding: "12px 16px",
                                    borderRadius:
                                        msg.from === "user"
                                            ? "16px 16px 0 16px"
                                            : "16px 16px 16px 0",
                                    background: msg.from === "user" ? "#EEF2FF" : "#F0FDF4",
                                    border: msg.from === "user" ? '1px solid #C7D2FE' : '1px solid #D1FAE5',
                                    color: "#1f2937",
                                    fontSize: 16,
                                    lineHeight: "24px",
                                    wordWrap: "break-word",
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                }}
                            >
                                {formatMessage(msg.text)} 
                            </div>
                        </div>
                    ))}

                    {/* 💡 UPDATED LOADING INDICATOR: Now aligns left */}
                    {isLoading && (
                        <div
                            // This structure mirrors the AI message structure for correct alignment
                            style={{
                                display: "flex",
                                flexDirection: "row", // Always left for AI/Loading
                                marginBottom: "16px",
                                alignItems: "center", // Center vertically with the avatar
                            }}
                        >
                             {/* Avatar Placeholder (or actual avatar) */}
                            <div
                                style={{
                                    flexShrink: 0,
                                    width: 38,
                                    height: 38,
                                    borderRadius: "50%",
                                    background: "#059669",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    color: "white",
                                    fontWeight: "bold",
                                    fontSize: 17,
                                    marginRight: "12px",
                                    opacity: 0.6,
                                }}
                            >
                                🤖
                            </div>
                            
                            {/* Typing Indicator Bubble */}
                            <div
                                style={{
                                    maxWidth: "75%",
                                    padding: "12px 16px",
                                    borderRadius: "16px 16px 16px 0",
                                    background: "#F0FDF4",
                                    border: '1px solid #D1FAE5',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                }}
                            >
                                <TypingIndicator />
                            </div>
                            
                            <span style={{ marginLeft: 8, color: '#6b7280', fontSize: 14 }}>
                                AI is thinking...
                            </span>
                        </div>
                    )}
                </div>

                {/* Input Area (Unchanged) */}
                <div
                    style={{
                        display: "flex",
                        paddingTop: 15,
                        borderTop: '1px solid #e5e7eb',
                    }}
                >
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                sendMessage();
                            }
                        }}
                        placeholder={isLoading ? "Please wait for the response..." : "Ask anything..."}
                        disabled={isLoading}
                        style={{
                            flex: 1,
                            padding: "14px",
                            border: "1px solid #d1d5db",
                            borderRadius: "12px",
                            outline: "none",
                            fontSize: 16,
                            transition: "border-color 0.2s, box-shadow 0.2s",
                        }}
                    />

                    <button
                        onClick={sendMessage}
                        disabled={!input.trim() || isLoading}
                        style={{
                            marginLeft: 12,
                            padding: "14px 20px", 
                            background: !input.trim() || isLoading ? "#9ca3af" : "#4F46E5",
                            border: "none",
                            borderRadius: "12px",
                            color: "white",
                            fontWeight: "bold",
                            cursor: (!input.trim() || isLoading) ? "not-allowed" : "pointer",
                            transition: "background-color 0.2s",
                        }}
                    >
                        {isLoading ? 'Wait' : 'Send'}
                    </button>
                </div>
            </div>
            
            {/* Custom CSS for the Typing Indicator animation */}
            <style>
            {`
                .dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    animation: pulse-dot 1s infinite ease-in-out;
                }

                @keyframes pulse-dot {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(0.5); opacity: 0.5; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}
            </style>
        </div>
    );
}

export default ChatApp;