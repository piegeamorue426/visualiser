import React from 'react';

const App: React.FC = () => {
  return (
    <div className="flex h-screen w-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-cyber-surface border-r border-cyber-border flex flex-col">
        <div className="p-4 border-b border-cyber-border">
          <h1 className="text-lg font-mono text-cyber-primary font-bold">
            Visualiser
          </h1>
        </div>
        <nav className="flex-1 p-4">
          <p className="text-cyber-muted text-sm">Audio Visualizer</p>
        </nav>
      </aside>

      {/* Main Canvas Area */}
      <main className="flex-1 relative bg-cyber-bg">
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-cyber-muted font-mono text-sm">
            Canvas will render here
          </p>
        </div>
      </main>
    </div>
  );
};

export default App;
