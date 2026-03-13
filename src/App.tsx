/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Timer, Trophy, ChevronRight } from 'lucide-react';

const GRID_SIZE = 20;
const CELL_SIZE = 25; // pixels

type Cell = {
  r: number;
  c: number;
  walls: {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
  };
  visited: boolean;
};

export default function App() {
  const [maze, setMaze] = useState<Cell[][]>([]);
  const [playerPos, setPlayerPos] = useState({ r: 0, c: 0 });
  const [gameStatus, setGameStatus] = useState<'playing' | 'won'>('playing');
  const [time, setTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const generateMaze = useCallback(() => {
    // Initialize grid
    const newMaze: Cell[][] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        row.push({
          r,
          c,
          walls: { top: true, right: true, bottom: true, left: true },
          visited: false,
        });
      }
      newMaze.push(row);
    }

    // Recursive Backtracker
    const stack: Cell[] = [];
    const startCell = newMaze[0][0];
    startCell.visited = true;
    stack.push(startCell);

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const neighbors = getUnvisitedNeighbors(current, newMaze);

      if (neighbors.length > 0) {
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        removeWalls(current, next);
        next.visited = true;
        stack.push(next);
      } else {
        stack.pop();
      }
    }

    setMaze(newMaze);
    setPlayerPos({ r: 0, c: 0 });
    setGameStatus('playing');
    setTime(0);
  }, []);

  function getUnvisitedNeighbors(cell: Cell, grid: Cell[][]) {
    const { r, c } = cell;
    const neighbors: Cell[] = [];

    if (r > 0 && !grid[r - 1][c].visited) neighbors.push(grid[r - 1][c]);
    if (r < GRID_SIZE - 1 && !grid[r + 1][c].visited) neighbors.push(grid[r + 1][c]);
    if (c > 0 && !grid[r][c - 1].visited) neighbors.push(grid[r][c - 1]);
    if (c < GRID_SIZE - 1 && !grid[r][c + 1].visited) neighbors.push(grid[r][c + 1]);

    return neighbors;
  }

  function removeWalls(a: Cell, b: Cell) {
    const dr = a.r - b.r;
    const dc = a.c - b.c;

    if (dr === 1) {
      a.walls.top = false;
      b.walls.bottom = false;
    } else if (dr === -1) {
      a.walls.bottom = false;
      b.walls.top = false;
    }

    if (dc === 1) {
      a.walls.left = false;
      b.walls.right = false;
    } else if (dc === -1) {
      a.walls.right = false;
      b.walls.left = false;
    }
  }

  useEffect(() => {
    generateMaze();
  }, [generateMaze]);

  useEffect(() => {
    if (gameStatus === 'playing') {
      timerRef.current = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStatus]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (gameStatus !== 'playing') return;

      const { r, c } = playerPos;
      const currentCell = maze[r][c];

      let nextR = r;
      let nextC = c;

      if (e.key === 'ArrowUp' && !currentCell.walls.top) nextR--;
      else if (e.key === 'ArrowDown' && !currentCell.walls.bottom) nextR++;
      else if (e.key === 'ArrowLeft' && !currentCell.walls.left) nextC--;
      else if (e.key === 'ArrowRight' && !currentCell.walls.right) nextC++;
      else return;

      e.preventDefault();
      setPlayerPos({ r: nextR, c: nextC });

      if (nextR === GRID_SIZE - 1 && nextC === GRID_SIZE - 1) {
        setGameStatus('won');
      }
    },
    [maze, playerPos, gameStatus]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h1 className="text-5xl font-black tracking-tighter uppercase mb-2 bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
          Neon Maze
        </h1>
        <div className="flex items-center justify-center gap-6 text-sm font-mono text-zinc-500 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <Timer size={16} className="text-cyan-400" />
            <span>{formatTime(time)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-emerald-400" />
            <span>Goal: 20x20</span>
          </div>
        </div>
      </motion.div>

      <div className="relative p-1 bg-zinc-800 rounded-lg shadow-2xl shadow-cyan-500/10">
        <div 
          className="grid bg-black overflow-hidden rounded"
          style={{ 
            gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
          }}
        >
          {maze.map((row, r) =>
            row.map((cell, c) => (
              <div
                key={`${r}-${c}`}
                className="relative"
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  borderTop: cell.walls.top ? '2px solid #06b6d4' : 'none',
                  borderRight: cell.walls.right ? '2px solid #06b6d4' : 'none',
                  borderBottom: cell.walls.bottom ? '2px solid #06b6d4' : 'none',
                  borderLeft: cell.walls.left ? '2px solid #06b6d4' : 'none',
                  boxShadow: 'inset 0 0 2px rgba(6, 182, 212, 0.2)',
                }}
              >
                {/* Goal */}
                {r === GRID_SIZE - 1 && c === GRID_SIZE - 1 && (
                  <div className="absolute inset-1 bg-emerald-500 rounded-sm animate-pulse shadow-[0_0_10px_#10b981]" />
                )}
                
                {/* Player */}
                {playerPos.r === r && playerPos.c === c && (
                  <motion.div 
                    layoutId="player"
                    className="absolute inset-1 bg-cyan-400 rounded-sm z-10 shadow-[0_0_15px_#22d3ee]"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </div>
            ))
          )}
        </div>

        <AnimatePresence>
          {gameStatus === 'won' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm rounded-lg"
            >
              <Trophy size={64} className="text-emerald-400 mb-4 animate-bounce" />
              <h2 className="text-3xl font-bold mb-2">Maze Cleared!</h2>
              <p className="text-zinc-400 mb-6 font-mono">Time: {formatTime(time)}</p>
              <button
                onClick={generateMaze}
                className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-full transition-all transform hover:scale-105 active:scale-95"
              >
                <RefreshCw size={20} />
                Play Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-8 flex flex-col items-center gap-4">
        <button
          onClick={generateMaze}
          className="flex items-center gap-2 px-4 py-2 border border-zinc-700 hover:border-cyan-500/50 hover:bg-cyan-500/10 text-zinc-400 hover:text-cyan-400 rounded-md transition-all text-sm uppercase tracking-widest font-bold"
        >
          <RefreshCw size={16} />
          Restart Maze
        </button>

        <div className="text-zinc-600 text-[10px] uppercase tracking-[0.2em] mt-4 flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-cyan-400 rounded-full" />
            <span>Player</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            <span>Goal</span>
          </div>
          <div className="flex items-center gap-1">
            <ChevronRight size={12} />
            <span>Use Arrow Keys</span>
          </div>
        </div>
      </div>
    </div>
  );
}
