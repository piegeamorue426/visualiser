/**
 * Root application component wiring all UI systems together.
 */

import React from 'react';
import { MainLayout } from '@ui/layouts/MainLayout';

const App: React.FC = () => {
  return <MainLayout />;
};

export default App;
