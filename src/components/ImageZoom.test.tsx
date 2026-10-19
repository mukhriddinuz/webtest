import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ImageZoom } from './ImageZoom';

describe('ImageZoom', () => {
  it('fits the picture to the screen by default and closes on any tap', () => {
    const onClose = vi.fn();
    render(<ImageZoom src="data:image/png;base64,AAAA" alt="wide" onClose={onClose} />);
    fireEvent.click(screen.getByAltText('wide'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows a wide picture at its own width and keeps it open when it is tapped', () => {
    const onClose = vi.fn();
    render(
      <ImageZoom src="data:image/png;base64,AAAA" alt="wide" panWidth={1100} onClose={onClose} />,
    );

    const image = screen.getByAltText('wide');
    expect(image.style.width).toBe('1100px');
    fireEvent.click(image);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes a wide picture from the backdrop beside it and from the close button', () => {
    const onClose = vi.fn();
    render(
      <ImageZoom src="data:image/png;base64,AAAA" alt="wide" panWidth={1100} onClose={onClose} />,
    );

    fireEvent.click(screen.getByAltText('wide').parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
