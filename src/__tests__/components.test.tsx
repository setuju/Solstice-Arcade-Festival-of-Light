import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Hub } from '../components/Hub';
import { GameProvider } from '../context/GameContext';

// Basic mock to ensure Vitest / RTL environment works
describe('Game Components', () => {

  it('renders Hub component canvas', () => {
    // Note: detailed canvas mocks would be needed for a real test.
    // This is a skeleton test verifying component structure.
    const { container } = render(
      <GameProvider>
        <Hub />
      </GameProvider>
    );
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

});
