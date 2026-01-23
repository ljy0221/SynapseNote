import React from 'react';
import CodeBlock from '../codeBlock/CodeBlock';
import './NoteMain.css';

const NoteMain: React.FC = () => {
    const sampleCode = `function factorial(n) {\n  if (n <= 1) return 1;\n  return n * factorial(n - 1);\n}`;

    return (
        <div className="note-main-layout">
            <header className="note-main-header">
                <div className="note-title-info">
                </div>
            </header>

            <div className="note-content-area">
                <CodeBlock 
                    language="javascript" 
                    code={sampleCode} 
                />
            </div>
        </div>
    );
};

export default NoteMain;