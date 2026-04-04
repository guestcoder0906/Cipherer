/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Copy, Info, Check, PenTool, BookOpen } from 'lucide-react';

// 10 Diverse Base Shapes (Values 0-9)
const SHAPES = ['◊', '𖥔', '☆', '⟢', '✧', '┌', '┐', '└', '┘', '⊹'];
const ZWJ = '\u200D';

// Combining Marks (Values 0, 10, 20, 30, 40)
// Each dot represents 10.
const MARKS = [
  '', 
  ZWJ + '\u0307', // 1 dot above (10)
  ZWJ + '\u0308', // 2 dots above (20)
  ZWJ + '\u0308' + ZWJ + '\u0323', // 2 above, 1 below (30)
  ZWJ + '\u0308' + ZWJ + '\u0324'  // 2 above, 2 below (40)
];

// Simple mapping for paper math: Space=0, A=1, B=2 ... Z=26
const CHAR_MAP = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,?!'-";

export default function App() {
  const [plaintext, setPlaintext] = useState('');
  const [ciphertext, setCiphertext] = useState('');
  const [copiedPlain, setCopiedPlain] = useState(false);
  const [copiedCipher, setCopiedCipher] = useState(false);

  const getSymbol = (value: number) => {
    const tens = Math.floor(value / 10);
    const ones = value % 10;
    return SHAPES[ones] + MARKS[tens];
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
    
    // Each dot is worth 10, shape is worth 0-9
    return (Math.min(dotCount, 4) * 10) + shapeIdx;
  };

  const encode = (text: string) => {
    if (!text) return '';
    const upperText = text.toUpperCase();
    const cipher: string[] = [];
    
    for (const char of upperText) {
      if (char === ' ') {
        cipher.push('\u2003'); // Em space for visual gap
        continue;
      }
      let val = CHAR_MAP.indexOf(char);
      if (val === -1) continue; 
      
      cipher.push(getSymbol(val));
    }
    return cipher.join(''); // No spaces between symbols for maximum condensation
  };

  const decode = (cipher: string) => {
    if (!cipher) return '';
    try {
      const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
      const segments = Array.from(segmenter.segment(cipher)).map(s => s.segment);
      let text = '';

      for (const seg of segments) {
        if (seg === '\u2003' || seg === ' ') {
          text += ' ';
          continue;
        }

        const val = parseSymbol(seg);
        if (val === -1) continue;

        if (val >= 0 && val < CHAR_MAP.length) {
          text += CHAR_MAP[val];
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
            <span className="text-3xl tracking-widest text-cyan-400 font-mono">△‍̇┐‍̈</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-cyan-400">
            Astral Cipher
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
            Ultra-condensed 1:1 cipher. Every letter is a single symbol. Uses a celestial Base-10 system with 10 diverse shapes and combining dots.
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
              className="flex-1 min-h-[250px] w-full bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 text-cyan-400 placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 resize-none transition-all duration-300 shadow-inner text-4xl tracking-widest leading-relaxed"
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
            Base-10 Symbol Logic
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-2">1. Shapes (Ones Digit: 0-9)</h3>
              <div className="grid grid-cols-5 gap-2">
                {SHAPES.map((s, i) => (
                  <div key={i} className="flex flex-col items-center justify-center bg-zinc-950 p-3 rounded-xl border border-zinc-800 hover:border-cyan-500/50 transition-colors">
                    <span className="text-2xl text-cyan-400 font-mono">{s}</span>
                    <span className="text-xs text-zinc-500 mt-2 font-mono">+{i}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-2">2. Dots (Tens Digit: 10-40)</h3>
              <div className="grid grid-cols-5 gap-2">
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} className="flex flex-col items-center justify-center bg-zinc-950 p-3 rounded-xl border border-zinc-800 hover:border-amber-500/50 transition-colors">
                    <span className="text-2xl text-cyan-400 font-mono">◊{MARKS[i]}</span>
                    <span className="text-xs text-zinc-500 mt-2 font-mono">+{i * 10}</span>
                  </div>
                ))}
              </div>
            </div>
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
                  The Math (Base 10)
                </h3>
                <p className="text-zinc-400 leading-relaxed">
                  Every letter is a single symbol. The math is incredibly simple because it uses standard Base-10 (Tens and Ones).
                  <br/><br/>
                  <strong className="text-amber-400">Tens Digit = Number of Dots</strong> (Each dot is worth 10)
                  <br/>
                  <strong className="text-cyan-400">Ones Digit = The Shape</strong> (Worth 0 to 9)
                  <br/><br/>
                  <strong className="text-zinc-300">Note:</strong> Spaces are written as a wide gap (Em Space).
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-zinc-200 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-sm">2</span>
                  Drawing Components
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-black/50 p-4 rounded-xl border border-zinc-800">
                    <div className="text-cyan-400 font-bold mb-2">Shapes (Ones)</div>
                    0=◊, 1=𖥔, 2=☆, 3=⟢, 4=✧<br/>
                    5=┌, 6=┐, 7=└, 8=┘, 9=⊹
                  </div>
                  <div className="bg-black/50 p-4 rounded-xl border border-zinc-800">
                    <div className="text-amber-400 font-bold mb-2">Dots (Tens)</div>
                    1 Dot = 10<br/>
                    2 Dots = 20<br/>
                    3 Dots = 30<br/>
                    4 Dots = 40
                  </div>
                </div>
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
                    <p>The <strong>Tens digit is 2</strong>. Draw 2 dots (worth 20).</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" />
                    <p>The <strong>Ones digit is 6</strong>. The 6th shape is ┐.</p>
                  </li>
                  <li className="flex items-start gap-3 pt-2 border-t border-cyan-900/50">
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <p>Final encoded 'Z': <span className="text-4xl font-mono text-cyan-400 ml-2">┐‍̈</span></p>
                  </li>
                </ol>
              </div>

              <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Letter to Number Map</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-x-2 gap-y-2 text-[10px] font-mono text-zinc-300">
                  {CHAR_MAP.split('').map((char, index) => (
                    <div key={index} className={`flex items-center gap-1 p-1 rounded ${char === ' ' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-zinc-950/50 border border-zinc-800'}`}>
                      <span className="w-4 text-center bg-zinc-800 rounded text-zinc-400">{char === ' ' ? '␣' : char}</span>
                      <span>=</span>
                      <span className="font-bold">{index}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
