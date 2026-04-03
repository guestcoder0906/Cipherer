/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Copy, Info, Check, PenTool, BookOpen } from 'lucide-react';

const SHAPES = ['□', '└', '├', '┼'];
// Using highly supported combining dots: 
// \u0307 (dot above), \u0308 (two dots above), \u0323 (dot below), \u0324 (two dots below)
// Adding ZWJ (\u200D) as requested to ensure proper rendering across all fonts
const DOTS = [
  '', 
  '\u200D\u0307', 
  '\u200D\u0308', 
  '\u200D\u0308\u200D\u0323', 
  '\u200D\u0308\u200D\u0324'
];

// Simple mapping for paper math: Space=0, A=1, B=2 ... Z=26
const CHAR_MAP = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,?!'-";

export default function App() {
  const [plaintext, setPlaintext] = useState('');
  const [ciphertext, setCiphertext] = useState('');
  const [copiedPlain, setCopiedPlain] = useState(false);
  const [copiedCipher, setCopiedCipher] = useState(false);

  const getSymbol = (value: number) => {
    const shapeIdx = Math.floor(value / 5);
    const dotIdx = value % 5;
    return SHAPES[shapeIdx] + DOTS[dotIdx];
  };

  const parseSymbol = (seg: string) => {
    const normalized = seg.normalize('NFD');
    const shape = normalized[0];
    const shapeIdx = SHAPES.indexOf(shape);
    if (shapeIdx === -1) return -1;

    let dotCount = 0;
    for (const char of normalized) {
      if (char === '\u0307') dotCount += 1;
      if (char === '\u0308') dotCount += 2;
      if (char === '\u0323') dotCount += 1;
      if (char === '\u0324') dotCount += 2;
    }
    
    // Cap at 4 dots just in case
    return shapeIdx * 5 + Math.min(dotCount, 4);
  };

  const encode = (text: string) => {
    if (!text) return '';
    const upperText = text.toUpperCase();
    const cipher: string[] = [];
    
    for (const char of upperText) {
      if (char === ' ') {
        cipher.push('\u2003');
        continue;
      }
      let val = CHAR_MAP.indexOf(char);
      if (val === -1) continue; 
      
      const d1 = Math.floor(val / 20);
      const d2 = val % 20;
      cipher.push(getSymbol(d1) + getSymbol(d2));
    }
    return cipher.join(' ');
  };

  const decode = (cipher: string) => {
    if (!cipher) return '';
    try {
      const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
      const blocks = cipher.split(' ');
      let text = '';

      for (const block of blocks) {
        if (block === '\u2003') {
          text += ' ';
          continue;
        }
        if (!block.trim()) continue;

        const segments = Array.from(segmenter.segment(block)).map(s => s.segment);
        if (segments.length !== 2) continue;

        const val1 = parseSymbol(segments[0]);
        const val2 = parseSymbol(segments[1]);
        if (val1 === -1 || val2 === -1) continue;

        const total = val1 * 20 + val2;
        if (total >= 0 && total < CHAR_MAP.length) {
          text += CHAR_MAP[total];
        }
      }

      return text;
    } catch (e) {
      return '';
    }
  };

  const handlePlaintextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setPlaintext(text);
    setCiphertext(encode(text));
  };

  const handleCiphertextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setCiphertext(text);
    setPlaintext(decode(text));
  };

  const copyToClipboard = (text: string, type: 'plain' | 'cipher') => {
    navigator.clipboard.writeText(text);
    if (type === 'plain') {
      setCopiedPlain(true);
      setTimeout(() => setCopiedPlain(false), 2000);
    } else {
      setCopiedCipher(true);
      setTimeout(() => setCopiedCipher(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 p-4 md:p-8 font-sans selection:bg-cyan-900 selection:text-cyan-100">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="text-center space-y-4 py-12">
          <div className="inline-flex items-center justify-center p-3 bg-zinc-900/80 rounded-2xl border border-zinc-800/80 mb-4 shadow-lg shadow-cyan-900/20">
            <span className="text-3xl tracking-widest text-cyan-400 font-mono">□‍̇└‍̇</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-cyan-400">
            Maya-Pigpen Cipher
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
            A writable, base-20 cipher combining Pigpen geometry with Maya mathematics. Short, efficient, and pasteable anywhere.
          </p>
        </header>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Plaintext */}
          <div className="space-y-3 flex flex-col">
            <div className="flex justify-between items-center px-2">
              <label className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <PenTool className="w-4 h-4 text-amber-500" /> Plaintext
              </label>
              <button 
                onClick={() => copyToClipboard(plaintext, 'plain')} 
                className="flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-amber-400 transition-colors bg-zinc-900 px-3 py-1.5 rounded-md border border-zinc-800"
              >
                {copiedPlain ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedPlain ? 'Copied' : 'Copy'}
              </button>
            </div>
            <textarea
              value={plaintext}
              onChange={handlePlaintextChange}
              placeholder="Enter text to encrypt..."
              className="flex-1 min-h-[250px] w-full bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-none text-lg leading-relaxed shadow-inner"
            />
          </div>

          {/* Ciphertext */}
          <div className="space-y-3 flex flex-col">
            <div className="flex justify-between items-center px-2">
              <label className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-500" /> Ciphertext
              </label>
              <button 
                onClick={() => copyToClipboard(ciphertext, 'cipher')} 
                className="flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-cyan-400 transition-colors bg-zinc-900 px-3 py-1.5 rounded-md border border-zinc-800"
              >
                {copiedCipher ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCipher ? 'Copied' : 'Copy'}
              </button>
            </div>
            <textarea
              value={ciphertext}
              onChange={handleCiphertextChange}
              placeholder="Enter cipher to decrypt..."
              className="flex-1 min-h-[250px] w-full bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 text-cyan-400 placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 resize-none transition-all duration-300 shadow-inner text-3xl tracking-widest leading-relaxed"
              style={{ 
                fontFamily: 'var(--font-mono)',
                textShadow: ciphertext ? '0 0 20px rgba(34, 211, 238, 0.2)' : 'none'
              }}
            />
          </div>
        </div>

        {/* Legend */}
        <div className="p-8 bg-zinc-900/30 rounded-3xl border border-zinc-800/50 backdrop-blur-sm">
          <h2 className="text-2xl font-semibold text-amber-500 mb-6 flex items-center gap-3">
            <Info className="w-6 h-6" />
            Base-20 Symbol Legend
          </h2>
          <div className="grid grid-cols-5 gap-4">
            <div className="col-span-1"></div>
            {[0, 1, 2, 3, 4].map(dots => (
              <div key={dots} className="text-center text-sm font-semibold text-zinc-500 pb-2 border-b border-zinc-800">
                +{dots} Dot{dots !== 1 ? 's' : ''}
                <div className="text-xs text-zinc-600 mt-1 font-normal">
                  {dots === 0 && '(None)'}
                  {dots === 1 && '(1 Above)'}
                  {dots === 2 && '(2 Above)'}
                  {dots === 3 && '(2 Above, 1 Below)'}
                  {dots === 4 && '(2 Above, 2 Below)'}
                </div>
              </div>
            ))}
            
            {SHAPES.map((shape, shapeIdx) => (
              <React.Fragment key={shapeIdx}>
                <div className="flex items-center justify-end pr-4 text-sm font-semibold text-zinc-500 border-r border-zinc-800">
                  {shapeIdx * 5} (Shape)
                </div>
                {[0, 1, 2, 3, 4].map(dotIdx => {
                  const val = shapeIdx * 5 + dotIdx;
                  return (
                    <div key={dotIdx} className="flex flex-col items-center justify-center p-4 bg-zinc-950/50 rounded-xl border border-zinc-800/50 hover:border-cyan-500/50 transition-colors group">
                      <span className="text-4xl text-cyan-400 font-mono group-hover:scale-110 transition-transform">{shape + DOTS[dotIdx]}</span>
                      <span className="text-xs text-zinc-500 mt-3 font-mono bg-zinc-900 px-2 py-1 rounded">Val: {val}</span>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Paper Tutorial */}
        <div className="p-8 bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 rounded-3xl border border-zinc-800/80 shadow-2xl">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-8 flex items-center gap-3">
            <PenTool className="w-8 h-8 text-cyan-400" />
            How to Write on Paper
          </h2>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-zinc-200 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-sm">1</span>
                  The Math (Base 20)
                </h3>
                <p className="text-zinc-400 leading-relaxed">
                  Every letter is assigned a simple number (A=1, B=2, C=3... Z=26). We split this number into two Base-20 digits.
                  Divide the number by 20. The <strong className="text-amber-400">quotient</strong> is your first symbol, and the <strong className="text-amber-400">remainder</strong> is your second symbol.
                  <br/><br/>
                  <strong className="text-cyan-400">Note:</strong> Spaces are written as a wide gap (Em Space) instead of symbols.
                </p>
                <div className="bg-black/50 p-4 rounded-xl border border-zinc-800 font-mono text-sm text-zinc-300">
                  Z = 26<br/>
                  26 ÷ 20 = 1 remainder 6<br/>
                  First Symbol = 1<br/>
                  Second Symbol = 6
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-zinc-200 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-sm">2</span>
                  Drawing the Symbols
                </h3>
                <p className="text-zinc-400 leading-relaxed">
                  A symbol is made of a <strong>Shape</strong> (worth 0, 5, 10, or 15) and <strong>Dots</strong> (worth 1 each).
                </p>
                <ul className="space-y-2 text-zinc-300 bg-black/50 p-4 rounded-xl border border-zinc-800">
                  <li><span className="text-cyan-400 font-mono text-lg mr-2">□</span> = 0</li>
                  <li><span className="text-cyan-400 font-mono text-lg mr-2">└</span> = 5</li>
                  <li><span className="text-cyan-400 font-mono text-lg mr-2">├</span> = 10</li>
                  <li><span className="text-cyan-400 font-mono text-lg mr-2">┼</span> = 15</li>
                </ul>
                <p className="text-zinc-400 leading-relaxed">
                  To draw a <strong>7</strong>, draw a └ (5) and add 2 dots above it (5 + 2 = 7).
                </p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-cyan-950/20 p-6 rounded-2xl border border-cyan-900/30">
                <h3 className="text-lg font-semibold text-cyan-400 mb-4">Example: Writing "Z"</h3>
                <ol className="space-y-4 text-zinc-300">
                  <li className="flex items-start gap-3">
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" />
                    <p>The number for 'Z' is <strong>26</strong>.</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" />
                    <p>26 ÷ 20 = <strong>1</strong>, remainder <strong>6</strong>.</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" />
                    <p>Symbol 1 (Value 1): Shape □ (0) + 1 dot = <span className="text-2xl font-mono text-amber-400 ml-2">□‍̇</span></p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" />
                    <p>Symbol 2 (Value 6): Shape └ (5) + 1 dot = <span className="text-2xl font-mono text-amber-400 ml-2">└‍̇</span></p>
                  </li>
                  <li className="flex items-start gap-3 pt-2 border-t border-cyan-900/50">
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <p>Final encoded 'Z': <span className="text-3xl font-mono text-cyan-400 ml-2 tracking-widest">□‍̇ └‍̇</span></p>
                  </li>
                </ol>
              </div>

              <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Letter to Number Map</h3>
                <div className="grid grid-cols-4 gap-x-4 gap-y-2 text-sm font-mono text-zinc-300">
                  <div>A = 1</div><div>H = 8</div><div>O = 15</div><div>V = 22</div>
                  <div>B = 2</div><div>I = 9</div><div>P = 16</div><div>W = 23</div>
                  <div>C = 3</div><div>J = 10</div><div>Q = 17</div><div>X = 24</div>
                  <div>D = 4</div><div>K = 11</div><div>R = 18</div><div>Y = 25</div>
                  <div>E = 5</div><div>L = 12</div><div>S = 19</div><div>Z = 26</div>
                  <div>F = 6</div><div>M = 13</div><div>T = 20</div><div className="text-amber-500">Space = Gap ( )</div>
                  <div>G = 7</div><div>N = 14</div><div>U = 21</div><div className="text-amber-500">. = 37</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
