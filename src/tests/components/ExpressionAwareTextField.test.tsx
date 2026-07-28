import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExpressionAwareTextField from '../../components/ExpressionAwareTextField';
import { PlaceholderService } from '../../services/PlaceholderService';

const placeholderService = new PlaceholderService();

const setContentEditableValue = (element: HTMLElement, value: string) => {
  // eslint-disable-next-line testing-library/no-node-access
  element.textContent = value;
  fireEvent.input(element);
  fireEvent.blur(element);
};

describe('ExpressionAwareTextField', () => {
  it('renders plain text with no tokens as-is', () => {
    render(<ExpressionAwareTextField value="plain text" placeholderService={placeholderService} />);
    expect(screen.getByRole('textbox')).toHaveTextContent('plain text');
  });

  it('renders a placeholder token as a chip with the raw {{KEY}} text', () => {
    render(<ExpressionAwareTextField value="url {{SITE_NAME}} here" placeholderService={placeholderService} />);
    const chip = screen.getByTitle('{{SITE_NAME}}');
    expect(chip).toHaveTextContent('{{SITE_NAME}}');
    expect(chip).toHaveAttribute('contenteditable', 'false');
  });

  it('renders an expression token as a chip with a friendly label, not the raw text', () => {
    render(<ExpressionAwareTextField value="@{outputs('Compose')}" placeholderService={placeholderService} />);
    const chip = screen.getByTitle("@{outputs('Compose')}");
    expect(chip.textContent).toContain('Compose');
    expect(chip).toHaveAttribute('contenteditable', 'false');
  });

  it('is read-only (not contenteditable) when no onChange is provided', () => {
    render(<ExpressionAwareTextField value="hello" placeholderService={placeholderService} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('contenteditable', 'false');
  });

  it('is editable (contenteditable) when onChange is provided', () => {
    render(<ExpressionAwareTextField value="hello" placeholderService={placeholderService} onChange={jest.fn()} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('contenteditable', 'true');
  });

  it('is read-only when readOnly is explicitly true, even with onChange', () => {
    render(<ExpressionAwareTextField value="hello" placeholderService={placeholderService} onChange={jest.fn()} readOnly />);
    expect(screen.getByRole('textbox')).toHaveAttribute('contenteditable', 'false');
  });

  it('calls onChange with the new raw value on blur after editing', () => {
    const onChange = jest.fn();
    render(<ExpressionAwareTextField value="hello" placeholderService={placeholderService} onChange={onChange} />);

    const field = screen.getByRole('textbox');
    setContentEditableValue(field, 'https://edited.example.com');

    expect(onChange).toHaveBeenCalledWith('https://edited.example.com');
  });

  it('does not call onChange on blur when the value is unchanged', () => {
    const onChange = jest.fn();
    render(<ExpressionAwareTextField value="hello" placeholderService={placeholderService} onChange={onChange} />);

    const field = screen.getByRole('textbox');
    fireEvent.blur(field);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('sets aria-multiline based on the multiline prop', () => {
    render(<ExpressionAwareTextField value="hello" placeholderService={placeholderService} multiline />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-multiline', 'true');
  });

  describe('click-to-edit-inline on chips', () => {
    it('renders a chip as a focusable button with an aria-label', () => {
      render(<ExpressionAwareTextField value="@{outputs('Compose')}" placeholderService={placeholderService} onChange={jest.fn()} />);
      const chip = screen.getByTitle("@{outputs('Compose')}");
      expect(chip).toHaveAttribute('role', 'button');
      expect(chip).toHaveAttribute('tabIndex', '0');
      expect(chip).toHaveAttribute('aria-label', expect.stringContaining("@{outputs('Compose')}"));
    });

    it('clicking a chip replaces it with an editable input showing the raw expression, plus accept/cancel buttons', () => {
      render(<ExpressionAwareTextField value="@{outputs('Compose')}" placeholderService={placeholderService} onChange={jest.fn()} />);
      const chip = screen.getByTitle("@{outputs('Compose')}");

      fireEvent.click(chip);

      const input = document.querySelector('.expr-aware-chip-edit-input') as HTMLElement;
      expect(input).toHaveAttribute('contenteditable', 'true');
      expect(input).toHaveTextContent("@{outputs('Compose')}");
      expect(screen.getByTitle('Accept change')).toBeInTheDocument();
      expect(screen.getByTitle('Cancel change')).toBeInTheDocument();
    });

    it('clicking Accept commits the edited expression and re-chips it', () => {
      const onChange = jest.fn();
      render(<ExpressionAwareTextField value="@{outputs('Compose')}" placeholderService={placeholderService} onChange={onChange} />);
      const chip = screen.getByTitle("@{outputs('Compose')}");

      fireEvent.click(chip);
      const input = document.querySelector('.expr-aware-chip-edit-input') as HTMLElement;
      // eslint-disable-next-line testing-library/no-node-access
      input.textContent = "@{outputs('Get_item')}";
      fireEvent.mouseDown(screen.getByTitle('Accept change'));

      expect(onChange).toHaveBeenCalledWith("@{outputs('Get_item')}");
      const newChip = screen.getByTitle("@{outputs('Get_item')}");
      expect(newChip).toHaveAttribute('contenteditable', 'false');
      expect(newChip.textContent).toContain('Get_item');
      expect(document.querySelector('.expr-aware-chip-edit-input')).not.toBeInTheDocument();
    });

    it('clicking Cancel reverts to the original raw value without committing the edit', () => {
      const onChange = jest.fn();
      render(<ExpressionAwareTextField value="@{outputs('Compose')}" placeholderService={placeholderService} onChange={onChange} />);
      const chip = screen.getByTitle("@{outputs('Compose')}");

      fireEvent.click(chip);
      const input = document.querySelector('.expr-aware-chip-edit-input') as HTMLElement;
      // eslint-disable-next-line testing-library/no-node-access
      input.textContent = 'garbage';
      fireEvent.mouseDown(screen.getByTitle('Cancel change'));

      const restoredChip = screen.getByTitle("@{outputs('Compose')}");
      expect(restoredChip.textContent).toContain('Compose');
      expect(document.querySelector('.expr-aware-chip-edit-input')).not.toBeInTheDocument();
    });

    it('blurring or pressing Enter/Escape while editing does nothing — only Accept/Cancel buttons end editing', () => {
      const onChange = jest.fn();
      render(<ExpressionAwareTextField value="@{outputs('Compose')}" placeholderService={placeholderService} onChange={onChange} />);
      const chip = screen.getByTitle("@{outputs('Compose')}");

      fireEvent.click(chip);
      const input = document.querySelector('.expr-aware-chip-edit-input') as HTMLElement;
      // eslint-disable-next-line testing-library/no-node-access
      input.textContent = "@{outputs('Get_item')}";
      fireEvent.blur(input);
      fireEvent.keyDown(input, { key: 'Enter' });
      fireEvent.keyDown(input, { key: 'Escape' });

      expect(document.querySelector('.expr-aware-chip-edit-input')).toBeInTheDocument();
      expect(onChange).not.toHaveBeenCalled();
    });

    const setChipEditInputText = async (input: HTMLElement, text: string) => {
      // MutationObserver callbacks flush as a microtask, so tests that mutate
      // textContent directly (jsdom doesn't fire input/keyup for that) must
      // await a tick for validate() to have run before asserting.
      // eslint-disable-next-line testing-library/no-node-access
      input.textContent = text;
      await Promise.resolve();
    };

    it('disables Accept and shows a red border when the edited text breaks the token structure, e.g. removing @{ }', async () => {
      render(<ExpressionAwareTextField value="@{outputs('Compose')}" placeholderService={placeholderService} onChange={jest.fn()} />);
      const chip = screen.getByTitle("@{outputs('Compose')}");

      fireEvent.click(chip);
      const input = document.querySelector('.expr-aware-chip-edit-input') as HTMLElement;
      await setChipEditInputText(input, "outputs('Compose')");

      expect(input).toHaveStyle({ backgroundColor: '#fdf3f4' });
      const acceptBtn = screen.getByTitle(/Cannot accept/);
      expect(acceptBtn).toBeInTheDocument();
    });

    it('clicking Accept while the text is invalid does nothing (stays in edit mode, no commit)', async () => {
      const onChange = jest.fn();
      render(<ExpressionAwareTextField value="@{outputs('Compose')}" placeholderService={placeholderService} onChange={onChange} />);
      const chip = screen.getByTitle("@{outputs('Compose')}");

      fireEvent.click(chip);
      const input = document.querySelector('.expr-aware-chip-edit-input') as HTMLElement;
      await setChipEditInputText(input, "outputs('Compose')");
      fireEvent.mouseDown(screen.getByTitle(/Cannot accept/));

      expect(onChange).not.toHaveBeenCalled();
      expect(document.querySelector('.expr-aware-chip-edit-input')).toBeInTheDocument();
    });

    it('clears the warning and re-enables Accept once the text is edited back into a valid token', async () => {
      render(<ExpressionAwareTextField value="@{outputs('Compose')}" placeholderService={placeholderService} onChange={jest.fn()} />);
      const chip = screen.getByTitle("@{outputs('Compose')}");

      fireEvent.click(chip);
      const input = document.querySelector('.expr-aware-chip-edit-input') as HTMLElement;
      await setChipEditInputText(input, 'broken');
      expect(screen.getByTitle(/Cannot accept/)).toBeInTheDocument();

      await setChipEditInputText(input, "@{outputs('Compose')}");

      expect(screen.getByTitle('Accept change')).toBeInTheDocument();
      expect(input).toHaveStyle({ backgroundColor: 'transparent' });
    });

    it('Cancel still works even while the text is invalid, discarding the broken edit', async () => {
      const onChange = jest.fn();
      render(<ExpressionAwareTextField value="@{outputs('Compose')}" placeholderService={placeholderService} onChange={onChange} />);
      const chip = screen.getByTitle("@{outputs('Compose')}");

      fireEvent.click(chip);
      const input = document.querySelector('.expr-aware-chip-edit-input') as HTMLElement;
      await setChipEditInputText(input, 'broken');
      fireEvent.mouseDown(screen.getByTitle('Cancel change'));

      expect(onChange).not.toHaveBeenCalled();
      expect(screen.getByTitle("@{outputs('Compose')}")).toBeInTheDocument();
    });

    it('does not enter edit mode on chip click when the field is read-only', () => {
      render(<ExpressionAwareTextField value="@{outputs('Compose')}" placeholderService={placeholderService} />);
      const chip = screen.getByTitle("@{outputs('Compose')}");

      fireEvent.click(chip);

      expect(chip).toHaveAttribute('contenteditable', 'false');
      expect(document.querySelector('.expr-aware-chip-edit-input')).not.toBeInTheDocument();
    });

    it('closes an in-progress chip edit (as a cancel) when the whole field is switched to read-only from outside, e.g. the parent cancelling the whole action edit', () => {
      const onChange = jest.fn();
      const { rerender } = render(
        <ExpressionAwareTextField value="@{outputs('Compose')}" placeholderService={placeholderService} onChange={onChange} />
      );
      const chip = screen.getByTitle("@{outputs('Compose')}");

      fireEvent.click(chip);
      const input = document.querySelector('.expr-aware-chip-edit-input') as HTMLElement;
      // eslint-disable-next-line testing-library/no-node-access
      input.textContent = "@{outputs('Get_item')}";
      expect(document.querySelector('.expr-aware-chip-edit-wrapper')).toBeInTheDocument();

      // Parent aborts the whole edit: onChange goes away and value reverts to the original.
      rerender(
        <ExpressionAwareTextField value="@{outputs('Compose')}" placeholderService={placeholderService} onChange={undefined} />
      );

      expect(document.querySelector('.expr-aware-chip-edit-wrapper')).not.toBeInTheDocument();
      expect(screen.getByTitle("@{outputs('Compose')}")).toHaveAttribute('contenteditable', 'false');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('closes an in-progress chip edit when readOnly is flipped to true from outside', () => {
      const onChange = jest.fn();
      const { rerender } = render(
        <ExpressionAwareTextField value="@{outputs('Compose')}" placeholderService={placeholderService} onChange={onChange} />
      );
      const chip = screen.getByTitle("@{outputs('Compose')}");

      fireEvent.click(chip);
      const input = document.querySelector('.expr-aware-chip-edit-input') as HTMLElement;
      // eslint-disable-next-line testing-library/no-node-access
      input.textContent = 'garbage';

      rerender(
        <ExpressionAwareTextField value="@{outputs('Compose')}" placeholderService={placeholderService} onChange={onChange} readOnly />
      );

      expect(document.querySelector('.expr-aware-chip-edit-wrapper')).not.toBeInTheDocument();
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
