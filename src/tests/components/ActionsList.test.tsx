import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ActionsList from '../../components/ActionsList';
import { IActionModel, Mode } from '../../models';

// Mock Fluent UI components
jest.mock('@fluentui/react', () => ({
  Checkbox: ({ checked, onChange, className, defaultChecked }: any) => (
    <input 
      type="checkbox" 
      checked={checked || defaultChecked} 
      onChange={onChange} 
      className={className}
      data-testid="mock-checkbox"
    />
  ),
  Icon: ({ iconName, onClick, className, title }: any) => (
    <button 
      onClick={onClick} 
      className={className}
      title={title}
      data-testid={`mock-icon-${iconName}`}
    >
      {iconName}
    </button>
  ),
}));

describe('ActionsList', () => {
  const mockActions: IActionModel[] = [
    {
      id: 'action-1',
      url: 'https://example.com/api/test1',
      icon: 'https://example.com/icon1.png',
      title: 'Test Action 1',
      method: 'GET',
      actionJson: '{"test": "json1"}',
      isSelected: false,
      body: null
    },
    {
      id: 'action-2',
      url: 'https://example.com/api/test2',
      icon: 'https://example.com/icon2.png',
      title: 'Test Action 2',
      method: 'POST',
      actionJson: '{"test": "json2"}',
      isSelected: true,
      body: { data: 'test' }
    }
  ];

  const defaultProps = {
    actions: mockActions,
    mode: Mode.CopiedActionsV3,
    changeSelectionFunc: jest.fn(),
    deleteActionFunc: jest.fn(),
    showButton: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('should render header correctly', () => {
      render(<ActionsList {...defaultProps} />);
      
      expect(screen.getByText('Select')).toBeInTheDocument();
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Method')).toBeInTheDocument();
    });

    test('should render actions when showButton is false', () => {
      render(<ActionsList {...defaultProps} showButton={false} />);
      
      expect(screen.getByText('Test Action 1')).toBeInTheDocument();
      expect(screen.getByText('Test Action 2')).toBeInTheDocument();
      expect(screen.getByText('GET')).toBeInTheDocument();
      expect(screen.getByText('POST')).toBeInTheDocument();
      
      // Should show checkboxes, not buttons
      expect(screen.getAllByTestId('mock-checkbox')).toHaveLength(2);
      expect(screen.queryAllByTestId('mock-icon-SingleBookmark')).toHaveLength(0);
    });

    test('should render actions when showButton is true', () => {
      render(<ActionsList {...defaultProps} showButton={true} />);
      
      expect(screen.getByText('Test Action 1')).toBeInTheDocument();
      expect(screen.getByText('Test Action 2')).toBeInTheDocument();
      
      // Should show buttons, not checkboxes
      expect(screen.queryAllByTestId('mock-checkbox')).toHaveLength(0);
      expect(screen.getAllByTestId('mock-icon-SingleBookmark')).toHaveLength(2);
    });

    test('should render action icons correctly', () => {
      render(<ActionsList {...defaultProps} />);
      
      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(2);
      expect(images[0]).toHaveAttribute('src', 'https://example.com/icon1.png');
      expect(images[0]).toHaveAttribute('alt', 'Test Action 1');
      expect(images[1]).toHaveAttribute('src', 'https://example.com/icon2.png');
      expect(images[1]).toHaveAttribute('alt', 'Test Action 2');
    });

    test('should render delete buttons for all actions', () => {
      render(<ActionsList {...defaultProps} />);
      
      expect(screen.getAllByTestId('mock-icon-Delete')).toHaveLength(2);
    });

    test('should render with correct checkbox states', () => {
      render(<ActionsList {...defaultProps} showButton={false} />);
      
      const checkboxes = screen.getAllByTestId('mock-checkbox') as HTMLInputElement[];
      expect(checkboxes[0].checked).toBe(false);
      expect(checkboxes[1].checked).toBe(true);
    });
  });

  describe('Interactions', () => {
    test('should call changeSelectionFunc when checkbox is clicked', () => {
      const changeSelectionFunc = jest.fn();
      render(<ActionsList {...defaultProps} changeSelectionFunc={changeSelectionFunc} showButton={false} />);
      
      const checkboxes = screen.getAllByTestId('mock-checkbox');
      fireEvent.click(checkboxes[0]);
      
      expect(changeSelectionFunc).toHaveBeenCalledWith(mockActions[0]);
    });

    test('should call changeSelectionFunc when select button is clicked', () => {
      const changeSelectionFunc = jest.fn();
      render(<ActionsList {...defaultProps} changeSelectionFunc={changeSelectionFunc} showButton={true} />);
      
      const selectButtons = screen.getAllByTestId('mock-icon-SingleBookmark');
      fireEvent.click(selectButtons[0]);
      
      expect(changeSelectionFunc).toHaveBeenCalledWith(mockActions[0]);
    });

    test('should call deleteActionFunc when delete button is clicked', () => {
      const deleteActionFunc = jest.fn();
      render(<ActionsList {...defaultProps} deleteActionFunc={deleteActionFunc} />);
      
      const deleteButtons = screen.getAllByTestId('mock-icon-Delete');
      fireEvent.click(deleteButtons[0]);
      
      expect(deleteActionFunc).toHaveBeenCalledWith(mockActions[0]);
    });

    test('should call functions with correct action for second item', () => {
      const changeSelectionFunc = jest.fn();
      const deleteActionFunc = jest.fn();
      render(<ActionsList 
        {...defaultProps} 
        changeSelectionFunc={changeSelectionFunc}
        deleteActionFunc={deleteActionFunc}
        showButton={false}
      />);
      
      const checkboxes = screen.getAllByTestId('mock-checkbox');
      const deleteButtons = screen.getAllByTestId('mock-icon-Delete');
      
      fireEvent.click(checkboxes[1]);
      fireEvent.click(deleteButtons[1]);
      
      expect(changeSelectionFunc).toHaveBeenCalledWith(mockActions[1]);
      expect(deleteActionFunc).toHaveBeenCalledWith(mockActions[1]);
    });
  });

  describe('Edge Cases', () => {
    test('should render empty when no actions provided', () => {
      render(<ActionsList {...defaultProps} actions={[]} />);
      
      // Header should still be present
      expect(screen.getByText('Select')).toBeInTheDocument();
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Method')).toBeInTheDocument();
      
      // No action items should be present
      expect(screen.queryByText('Test Action 1')).not.toBeInTheDocument();
      expect(screen.queryAllByTestId('mock-checkbox')).toHaveLength(0);
      expect(screen.queryAllByTestId('mock-icon-Delete')).toHaveLength(0);
    });

    test('should handle undefined actions array', () => {
      render(<ActionsList {...defaultProps} actions={undefined as any} />);
      
      // Should not crash and header should still render
      expect(screen.getByText('Select')).toBeInTheDocument();
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Method')).toBeInTheDocument();
    });

    test('should render action row with correct title attribute for URL', () => {
      render(<ActionsList {...defaultProps} />);
      
      const actionRows = document.querySelectorAll('.App-Action-Row');
      expect(actionRows[0]).toHaveAttribute('title', 'https://example.com/api/test1');
      expect(actionRows[1]).toHaveAttribute('title', 'https://example.com/api/test2');
    });

    test('should render select button with correct title', () => {
      render(<ActionsList {...defaultProps} showButton={true} />);
      
      const selectButtons = screen.getAllByTestId('mock-icon-SingleBookmark');
      expect(selectButtons[0]).toHaveAttribute('title', 'Select Action To Copy');
      expect(selectButtons[1]).toHaveAttribute('title', 'Select Action To Copy');
    });
  });

  describe('Different Modes', () => {
    test('should work with Requests mode', () => {
      render(<ActionsList {...defaultProps} mode={Mode.Requests} />);
      
      expect(screen.getByText('Test Action 1')).toBeInTheDocument();
      expect(screen.getByText('Test Action 2')).toBeInTheDocument();
    });

    test('should work with CopiedActions mode', () => {
      render(<ActionsList {...defaultProps} mode={Mode.CopiedActions} />);
      
      expect(screen.getByText('Test Action 1')).toBeInTheDocument();
      expect(screen.getByText('Test Action 2')).toBeInTheDocument();
    });
  });
});
