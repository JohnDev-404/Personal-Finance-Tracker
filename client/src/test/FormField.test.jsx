import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormField from '../components/FormField';

describe('FormField', () => {
  it('renders a label and input', () => {
    render(
      <FormField
        label="Email"
        name="email"
        value=""
        onChange={() => {}}
      />
    );
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('calls onChange when the user types', async () => {
    const onChange = vi.fn();
    render(
      <FormField label="Email" name="email" value="" onChange={onChange} />
    );
    await userEvent.type(screen.getByLabelText('Email'), 'a');
    expect(onChange).toHaveBeenCalled();
  });

  it('shows an error message and marks the input invalid', () => {
    render(
      <FormField
        label="Email"
        name="email"
        value=""
        onChange={() => {}}
        error="Email is required"
      />
    );
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });
});