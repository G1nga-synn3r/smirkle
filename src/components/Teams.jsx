import { useState, useEffect, useRef } from 'react';

// Mock data for demonstration
const mockTeams = [
  {
    id: 'team-1',
    name: 'Alpha Squad',
    code: 'ALPHA2024',
    members: [
      { id: 'user-1', name: 'Alex', avatar: '👤', score: 1250 },
      { id: 'user-2', name: 'Sam', avatar: '👤', score: 980 },
      { id: 'user-3', name: 'Jordan', avatar: '👤', score: 1100 },
    ],
    totalScore: 3330,
  },
  {
    id: 'team-2',
    name: 'Beta Squad',
    code: 'BETA2024',
    members: [
      { id: 'user-4', name: 'Casey', avatar: '👤', score: 850 },
      { id: 'user-5', name: 'Riley', avatar: '👤', score: 720 },
    ],
    totalScore: 1570,
  },
];

const mockChatMessages = [
  { id: 1, userId: 'user-2', userName: 'Sam', avatar: '👤', text: 'Great game everyone! 🎮', timestamp: '10:30 AM' },
  { id: 2, userId: 'user-3', userName: 'Jordan', avatar: '👤', text: 'Who wants to do another round?', timestamp: '10:32 AM' },
  { id: 3, userId: 'user-1', userName: 'Alex', avatar: '👤', text: 'I\'m in! Let me finish this level first.', timestamp: '10:35 AM' },
];

// Toast Notification Component
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    invite: '👥',
    message: '💬',
    success: '✅',
    error: '❌',
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 animate-slide-up`}>
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
        type === 'invite' ? 'bg-purple-600' :
        type === 'message' ? 'bg-blue-600' :
        type === 'success' ? 'bg-green-600' :
        'bg-red-600'
      } text-white min-w-[280px]`}>
        <span className="text-xl">{icons[type]}</span>
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button onClick={onClose} className="text-white/80 hover:text-white">×</button>
      </div>
    </div>
  );
}

// Create Team Modal
function CreateTeamModal({ isOpen, onClose, onCreate }) {
  const [teamName, setTeamName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (teamName.trim().length < 3) {
      setError('Team name must be at least 3 characters');
      return;
    }
    onCreate(teamName.trim());
    setTeamName('');
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">Create a Team</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter team name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            autoFocus
          />
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <div className="flex gap-3 mt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Join Team Modal
function JoinTeamModal({ isOpen, onClose, onJoin }) {
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (joinCode.trim().length < 4) {
      setError('Please enter a valid team code');
      return;
    }
    onJoin(joinCode.trim().toUpperCase());
    setJoinCode('');
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">Join a Team</h2>
        <p className="text-gray-600 text-sm mb-4">Enter the team code shared by your friend</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter team code (e.g., ALPHA2024)"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase tracking-wider"
            autoFocus
          />
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <div className="flex gap-3 mt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Join</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Team Leaderboard Component
function TeamLeaderboard({ teams }) {
  const sortedTeams = [...teams].sort((a, b) => b.totalScore - a.totalScore);

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
        🏆 Team Leaderboard
      </h3>
      <div className="space-y-3">
        {sortedTeams.map((team, index) => (
          <div key={team.id} className={`p-3 rounded-lg ${
            index === 0 ? 'bg-yellow-50 border border-yellow-200' :
            index === 1 ? 'bg-gray-50 border border-gray-200' :
            index === 2 ? 'bg-orange-50 border border-orange-200' :
            'bg-gray-50'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${
                  index === 0 ? 'bg-yellow-400 text-yellow-900' :
                  index === 1 ? 'bg-gray-400 text-gray-900' :
                  index === 2 ? 'bg-orange-400 text-orange-900' :
                  'bg-gray-300 text-gray-700'
                }`}>
                  {index + 1}
                </span>
                <div>
                  <p className="font-semibold">{team.name}</p>
                  <p className="text-sm text-gray-500">{team.members.length} members</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{team.totalScore.toLocaleString()}</p>
                <p className="text-xs text-gray-500">points</p>
              </div>
            </div>
            {/* Member preview */}
            <div className="mt-2 flex -space-x-2">
              {team.members.slice(0, 4).map((member) => (
                <div key={member.id} className="w-6 h-6 rounded-full bg-purple-100 border-2 border-white flex items-center justify-center text-xs" title={member.name}>
                  {member.avatar}
                </div>
              ))}
              {team.members.length > 4 && (
                <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs text-gray-600">
                  +{team.members.length - 4}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Team Chat Component
function TeamChat({ messages, onSendMessage, currentUser }) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm flex flex-col h-[400px]">
      <div className="p-4 border-b">
        <h3 className="font-bold text-lg flex items-center gap-2">
          💬 Team Chat
        </h3>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.userId === currentUser ? 'flex-row-reverse' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-sm shrink-0">
              {msg.avatar}
            </div>
            <div className={`max-w-[70%] ${msg.userId === currentUser ? 'text-right' : ''}`}>
              <div className={`inline-block px-3 py-2 rounded-xl ${
                msg.userId === currentUser 
                  ? 'bg-purple-600 text-white rounded-tr-sm' 
                  : 'bg-gray-100 text-gray-800 rounded-tl-sm'
              }`}>
                <p className="text-sm">{msg.text}</p>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {msg.userName} • {msg.timestamp}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
        />
        <button 
          type="submit"
          disabled={!newMessage.trim()}
          className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          ➤
        </button>
      </form>
    </div>
  );
}

// My Team Card
function MyTeamCard({ team, onLeave, onShowInviteCode }) {
  return (
    <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-4 text-white">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-xl">{team.name}</h3>
          <p className="text-purple-200 text-sm">Code: <span className="font-mono bg-white/20 px-2 py-0.5 rounded cursor-pointer hover:bg-white/30" onClick={onShowInviteCode}>{team.code}</span></p>
        </div>
        <button onClick={onLeave} className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors">
          Leave
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white/10 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{team.totalScore.toLocaleString()}</p>
          <p className="text-xs text-purple-200">Team Score</p>
        </div>
        <div className="bg-white/10 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{team.members.length}</p>
          <p className="text-xs text-purple-200">Members</p>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Members</p>
        <div className="space-y-2">
          {team.members.map((member) => (
            <div key={member.id} className="flex items-center justify-between bg-white/10 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <span>{member.avatar}</span>
                <span className="text-sm">{member.name}</span>
              </div>
              <span className="text-sm text-purple-200">{member.score.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Main Teams Component
export default function Teams() {
  const [activeTab, setActiveTab] = useState('my-team');
  const [teams, setTeams] = useState(mockTeams);
  const [myTeam, setMyTeam] = useState(mockTeams[0]);
  const [chatMessages, setChatMessages] = useState(mockChatMessages);
  const [toasts, setToasts] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [showInviteCode, setShowInviteCode] = useState(false);
  const currentUser = 'user-1';

  const addToast = (message, type) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleCreateTeam = (name) => {
    const newTeam = {
      id: `team-${Date.now()}`,
      name,
      code: name.substring(0, 4).toUpperCase() + Date.now().toString().slice(-4),
      members: [{ id: currentUser, name: 'You', avatar: '👤', score: 0 }],
      totalScore: 0,
    };
    setMyTeam(newTeam);
    setShowCreateModal(false);
    addToast(`Team "${name}" created successfully!`, 'success');
    addToast('Share this code with friends: ' + newTeam.code, 'invite');
  };

  const handleJoinTeam = (code) => {
    const team = teams.find(t => t.code === code);
    if (team) {
      const updatedTeam = {
        ...team,
        members: [...team.members, { id: currentUser, name: 'You', avatar: '👤', score: 0 }],
        totalScore: team.totalScore,
      };
      setMyTeam(updatedTeam);
      setShowJoinModal(false);
      addToast(`Welcome to ${team.name}!`, 'success');
    } else {
      addToast('Team not found. Check the code and try again.', 'error');
    }
  };

  const handleLeaveTeam = () => {
    setMyTeam(null);
    addToast('You have left the team', 'message');
  };

  const handleSendMessage = (text) => {
    const newMsg = {
      id: Date.now(),
      userId: currentUser,
      userName: 'You',
      avatar: '👤',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages(prev => [...prev, newMsg]);
    // Simulate teammate response
    setTimeout(() => {
      addToast('New message from Sam', 'message');
    }, 2000);
  };

  const copyInviteCode = () => {
    if (myTeam) {
      navigator.clipboard.writeText(myTeam.code);
      addToast('Invite code copied!', 'success');
    }
    setShowInviteCode(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">⚔️ Squads</h1>
          {myTeam && (
            <div className="flex gap-2">
              <button 
                onClick={() => setShowJoinModal(true)}
                className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
              >
                Join Team
              </button>
              <button 
                onClick={() => setShowInviteCode(true)}
                className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Invite
              </button>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mt-4 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('my-team')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'my-team' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            My Team
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'leaderboard' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Leaderboard
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'chat' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Chat
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-4xl mx-auto">
        {!myTeam ? (
          // No team state
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <h2 className="text-2xl font-bold mb-2">Join a Squad!</h2>
            <p className="text-gray-600 mb-6">Create a team or join your friends using their invite code</p>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                Create a Team
              </button>
              <button 
                onClick={() => setShowJoinModal(true)}
                className="px-6 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors"
              >
                Join with Code
              </button>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'my-team' && (
              <div className="space-y-4">
                <MyTeamCard 
                  team={myTeam} 
                  onLeave={handleLeaveTeam}
                  onShowInviteCode={() => setShowInviteCode(true)}
                />
                <div className="bg-white rounded-xl shadow-sm p-4">
                  <h3 className="font-bold text-lg mb-4">🏆 Team Progress</h3>
                  <div className="space-y-3">
                    {myTeam.members.sort((a, b) => b.score - a.score).map((member, index) => (
                      <div key={member.id} className="flex items-center gap-3">
                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-sm font-bold ${
                          index === 0 ? 'bg-yellow-400 text-yellow-900' :
                          index === 1 ? 'bg-gray-400 text-gray-900' :
                          index === 2 ? 'bg-orange-400 text-orange-900' :
                          'bg-gray-200 text-gray-700'
                        }`}>
                          {index + 1}
                        </span>
                        <span>{member.avatar}</span>
                        <span className="flex-1">{member.name}</span>
                        <span className="font-medium">{member.score.toLocaleString()} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <TeamLeaderboard teams={teams} />
            )}

            {activeTab === 'chat' && (
              <TeamChat 
                messages={chatMessages}
                onSendMessage={handleSendMessage}
                currentUser={currentUser}
              />
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <CreateTeamModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateTeam}
      />
      <JoinTeamModal 
        isOpen={showJoinModal} 
        onClose={() => setShowJoinModal(false)}
        onJoin={handleJoinTeam}
      />

      {/* Invite Code Popup */}
      {showInviteCode && myTeam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowInviteCode(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4 text-center" onClick={e => e.stopPropagation()}>
            <div className="text-4xl mb-2">📱</div>
            <h3 className="font-bold text-lg mb-2">Share Your Team</h3>
            <p className="text-gray-600 text-sm mb-4">Share this code with friends to invite them</p>
            <div className="bg-gray-100 rounded-lg p-4 mb-4">
              <p className="text-3xl font-mono font-bold tracking-wider text-purple-600">{myTeam.code}</p>
            </div>
            <button 
              onClick={copyInviteCode}
              className="w-full py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors mb-2"
            >
              Copy Code
            </button>
            <button 
              onClick={() => setShowInviteCode(false)}
              className="text-gray-500 text-sm hover:text-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {toasts.map(toast => (
        <Toast 
          key={toast.id} 
          message={toast.message} 
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}
