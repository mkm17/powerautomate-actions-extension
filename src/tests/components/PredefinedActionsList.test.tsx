import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PredefinedActionsList from '../../components/PredefinedActionsList';
import { IActionModel } from '../../models';

describe('PredefinedActionsList', () => {
  const mockActions: IActionModel[] = [
    {
      id: 'action-1',
      title: 'Get User Profile',
      url: 'https://graph.microsoft.com/v1.0/me',
      method: 'GET',
      body: null,
      icon: 'https://example.com/icon.png',
      actionJson: '{"method":"GET","url":"https://graph.microsoft.com/v1.0/me"}',
      isSelected: false
    },
    {
      id: 'action-2',
      title: 'Send Email',
      url: 'https://graph.microsoft.com/v1.0/me/sendMail',
      method: 'POST',
      body: '{"message":{}}',
      icon: 'https://example.com/icon.png',
      actionJson: '{"method":"POST","url":"https://graph.microsoft.com/v1.0/me/sendMail"}',
      isSelected: false
    }
  ];

  it('should render loading spinner when isLoading is true', () => {
    render(
      <PredefinedActionsList
        actions={[]}
        isLoading={true}
        onRefresh={() => {}}
      />
    );
    expect(screen.getByText('Loading predefined actions...')).toBeInTheDocument();
  });

  it('should render empty state when no actions available', () => {
    render(
      <PredefinedActionsList
        actions={[]}
        isLoading={false}
        onRefresh={() => {}}
      />
    );
    expect(screen.getByText('No predefined actions available')).toBeInTheDocument();
    expect(screen.getByText('Configure the GitHub JSON URL in Settings')).toBeInTheDocument();
  });

  it('should render list of actions', () => {
    render(
      <PredefinedActionsList
        actions={mockActions}
        isLoading={false}
        onRefresh={() => {}}
      />
    );
    expect(screen.getByText('Get User Profile')).toBeInTheDocument();
    expect(screen.getByText('Send Email')).toBeInTheDocument();
    expect(screen.getByText('Predefined Actions (2)')).toBeInTheDocument();
  });

  it('should display action method and URL', () => {
    render(
      <PredefinedActionsList
        actions={mockActions}
        isLoading={false}
        onRefresh={() => {}}
      />
    );
    expect(screen.getByText('GET')).toBeInTheDocument();
    expect(screen.getByText('POST')).toBeInTheDocument();
  });

  it('should call onRefresh when refresh button is clicked', () => {
    const mockRefresh = jest.fn();
    render(
      <PredefinedActionsList
        actions={mockActions}
        isLoading={false}
        onRefresh={mockRefresh}
      />
    );
    
    const refreshButton = screen.getByTitle('Refresh predefined actions');
    fireEvent.click(refreshButton);
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('should not render refresh button when onRefresh is not provided', () => {
    render(
      <PredefinedActionsList
        actions={mockActions}
        isLoading={false}
        onRefresh={undefined}
      />
    );
    expect(screen.queryByTitle('Refresh predefined actions')).not.toBeInTheDocument();
  });

  it('should open details panel when info icon is clicked', async () => {
    render(
      <PredefinedActionsList
        actions={mockActions}
        isLoading={false}
        onRefresh={() => {}}
      />
    );
    
    const infoButtons = screen.getAllByTitle('View details');
    fireEvent.click(infoButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText('Predefined Action: Get User Profile')).toBeInTheDocument();
    });
  });

  it('should copy action JSON to clipboard when copy icon is clicked', () => {
    const mockClipboard = {
      writeText: jest.fn()
    };
    Object.assign(navigator, { clipboard: mockClipboard });

    render(
      <PredefinedActionsList
        actions={mockActions}
        isLoading={false}
        onRefresh={() => {}}
      />
    );
    
    const copyButtons = screen.getAllByTitle('Copy to clipboard');
    fireEvent.click(copyButtons[0]);
    
    expect(mockClipboard.writeText).toHaveBeenCalledWith(mockActions[0].actionJson);
  });

  it('should display action count correctly', () => {
    const { rerender } = render(
      <PredefinedActionsList
        actions={mockActions}
        isLoading={false}
        onRefresh={() => {}}
      />
    );
    expect(screen.getByText('Predefined Actions (2)')).toBeInTheDocument();

    rerender(
      <PredefinedActionsList
        actions={[mockActions[0]]}
        isLoading={false}
        onRefresh={() => {}}
      />
    );
    expect(screen.getByText('Predefined Actions (1)')).toBeInTheDocument();
  });
});
