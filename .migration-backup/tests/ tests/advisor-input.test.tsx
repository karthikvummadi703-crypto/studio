import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AdvisorInput } from '@/components/advisor/advisor-input';

describe('AdvisorInput', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    onSend: vi.fn(),
    isLoading: false,
  };

  it('renders the textarea and send button', () => {
    render(<AdvisorInput {...defaultProps} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('calls onChange when typing', () => {
    const onChange = vi.fn();
    render(<AdvisorInput {...defaultProps} onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hello' } });
    expect(onChange).toHaveBeenCalledWith('hello');
  });

  it('calls onSend when send button is clicked', () => {
    const onSend = vi.fn();
    render(<AdvisorInput {...defaultProps} value="reduce my footprint" onSend={onSend} />);
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    expect(onSend).toHaveBeenCalled();
  });

  it('disables send button when isLoading is true', () => {
    render(<AdvisorInput {...defaultProps} isLoading={true} />);
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
  });

  it('calls onSend when Enter is pressed without Shift', () => {
    const onSend = vi.fn();
    render(<AdvisorInput {...defaultProps} value="hello" onSend={onSend} />);
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter', shiftKey: false });
    expect(onSend).toHaveBeenCalled();
  });

  it('does NOT call onSend when Shift+Enter is pressed (newline)', () => {
    const onSend = vi.fn();
    render(<AdvisorInput {...defaultProps} value="hello" onSend={onSend} />);
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter', shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();
  });
});
