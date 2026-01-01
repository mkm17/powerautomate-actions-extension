import { useCallback, useState } from "react";
import { Icon, Panel, PanelType, Spinner, SpinnerSize, DefaultButton } from "@fluentui/react";
import { IActionModel } from "../models";

export interface IPredefinedActionsListProps {
    actions: IActionModel[];
    isLoading: boolean;
    onRefresh?: () => void;
}

const PredefinedActionsList: React.FC<IPredefinedActionsListProps> = (props) => {
    const [selectedActionForDetails, setSelectedActionForDetails] = useState<IActionModel | null>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    const showActionDetails = useCallback((action: IActionModel) => {
        setSelectedActionForDetails(action);
        setIsPanelOpen(true);
    }, []);

    const hideActionDetails = useCallback(() => {
        setIsPanelOpen(false);
        setSelectedActionForDetails(null);
    }, []);

    const copyActionToClipboard = useCallback((action: IActionModel) => {
        try {
            navigator.clipboard.writeText(action.actionJson);
        } catch (error) {
            console.error('Failed to copy action to clipboard:', error);
        }
    }, []);

    const renderActionDetails = useCallback(() => {
        if (!selectedActionForDetails) return null;

        let parsedBody: any = null;
        let parsedHeaders: any = null;
        let parsedActionData: any = null;
        
        try {
            parsedActionData = JSON.parse(selectedActionForDetails.actionJson);
            parsedBody = parsedActionData.body || selectedActionForDetails.body;
            parsedHeaders = parsedActionData.headers;
        } catch (e) {
            parsedBody = selectedActionForDetails.body;
        }

        return (
            <Panel
                isOpen={isPanelOpen}
                onDismiss={hideActionDetails}
                type={PanelType.custom}
                customWidth="450px"
                headerText={`Predefined Action: ${selectedActionForDetails.title}`}
                closeButtonAriaLabel="Close"
                styles={{
                    content: { padding: '20px' }
                }}
            >
                <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                    <div style={{ marginBottom: '15px' }}>
                        <strong>URL:</strong>
                        <div style={{ 
                            backgroundColor: '#f5f5f5', 
                            padding: '8px', 
                            marginTop: '5px', 
                            borderRadius: '4px',
                            wordBreak: 'break-all',
                            fontFamily: 'monospace',
                            fontSize: '12px'
                        }}>
                            {selectedActionForDetails.url}
                        </div>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <strong>Method:</strong>
                        <div style={{ 
                            backgroundColor: '#f5f5f5', 
                            padding: '8px', 
                            marginTop: '5px', 
                            borderRadius: '4px',
                            fontFamily: 'monospace',
                            fontSize: '12px'
                        }}>
                            {selectedActionForDetails.method}
                        </div>
                    </div>

                    {parsedHeaders && (
                        <div style={{ marginBottom: '15px' }}>
                            <strong>Headers:</strong>
                            <div style={{ 
                                backgroundColor: '#f5f5f5', 
                                padding: '8px', 
                                marginTop: '5px', 
                                borderRadius: '4px',
                                fontFamily: 'monospace',
                                fontSize: '12px',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {JSON.stringify(parsedHeaders, null, 2)}
                            </div>
                        </div>
                    )}

                    {parsedBody && (
                        <div style={{ marginBottom: '15px' }}>
                            <strong>Body:</strong>
                            <div style={{ 
                                backgroundColor: '#f5f5f5', 
                                padding: '8px', 
                                marginTop: '5px', 
                                borderRadius: '4px',
                                fontFamily: 'monospace',
                                fontSize: '12px',
                                whiteSpace: 'pre-wrap',
                                maxHeight: '300px',
                                overflow: 'auto'
                            }}>
                                {typeof parsedBody === 'string' ? parsedBody : JSON.stringify(parsedBody, null, 2)}
                            </div>
                        </div>
                    )}

                    <div style={{ marginTop: '20px' }}>
                        <DefaultButton
                            text="Copy Action JSON"
                            onClick={() => copyActionToClipboard(selectedActionForDetails)}
                            iconProps={{ iconName: 'Copy' }}
                            styles={{ root: { width: '100%' } }}
                        />
                    </div>
                </div>
            </Panel>
        );
    }, [selectedActionForDetails, isPanelOpen, hideActionDetails, copyActionToClipboard]);

    if (props.isLoading) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <Spinner size={SpinnerSize.medium} label="Loading predefined actions..." />
            </div>
        );
    }

    if (props.actions.length === 0) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: '#605e5c' }}>
                <Icon iconName="Info" style={{ fontSize: '24px', marginBottom: '10px' }} />
                <div>No predefined actions available</div>
                <div style={{ fontSize: '12px', marginTop: '5px' }}>
                    Configure the GitHub JSON URL in Settings
                </div>
            </div>
        );
    }

    return (
        <>
            <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 10px' }}>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>
                    Predefined Actions ({props.actions.length})
                </span>
                {props.onRefresh && (
                    <DefaultButton
                        iconProps={{ iconName: 'Refresh' }}
                        onClick={props.onRefresh}
                        title="Refresh predefined actions"
                        styles={{ root: { minWidth: '32px', padding: '4px 8px' } }}
                    />
                )}
            </div>
            <div className="actions-list">
                {props.actions.map((action) => (
                    <div 
                        key={action.id} 
                        className="action-item"
                        style={{ 
                            borderLeft: '3px solid #0078d4',
                            backgroundColor: '#f3f2f1'
                        }}
                    >
                        <div className="action-content">
                            <div className="action-header">
                                <span className="action-title">{action.title}</span>
                                <div className="action-buttons">
                                    <Icon 
                                        iconName="Info" 
                                        className="action-icon" 
                                        onClick={() => showActionDetails(action)}
                                        title="View details"
                                    />
                                    <Icon 
                                        iconName="Copy" 
                                        className="action-icon" 
                                        onClick={() => copyActionToClipboard(action)}
                                        title="Copy to clipboard"
                                    />
                                </div>
                            </div>
                            <div className="action-details">
                                <span className="method-badge">{action.method}</span>
                                <span className="url-text">{action.url}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {renderActionDetails()}
        </>
    );
};

export default PredefinedActionsList;
