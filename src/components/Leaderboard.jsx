import React from 'react';

function Leaderboard() {
  const players = [
    { name: 'Player 1', score: 0, isSmiling: false },
    { name: 'Player 2', score: 0, isSmiling: false },
    { name: 'Player 3', score: 0, isSmiling: false },
    { name: 'Player 4', score: 0, isSmiling: false }
  ];

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4 text-center">Leaderboard</h2>
      <ul className="space-y-2">
        {players.map((player, index) => (
          <li key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded">
            <span className="font-medium">{player.name}</span>
            <div className="flex items-center space-x-2">
              <span className="text-green-400 font-bold">{player.score}</span>
              {player.isSmiling && (
                <span className="text-yellow-400">😀</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Leaderboard;