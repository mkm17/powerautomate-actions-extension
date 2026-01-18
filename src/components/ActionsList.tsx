import { useCallback, useState } from "react";
import { Checkbox, Icon, TextField, Panel, PanelType } from "@fluentui/react";
import { IActionModel, Mode } from "../models";

export interface IActionsListProps {
    actions: IActionModel[];
    mode: Mode;
    changeSelectionFunc: (action: IActionModel) => void;
    deleteActionFunc: (action: IActionModel) => void;
    showButton: boolean;
    toggleFavoriteFunc?: (action: IActionModel) => void;
    searchTerm: string;
    onSearchChange: (searchTerm: string) => void;
}

const ActionsList: React.FC<IActionsListProps> = (props) => {
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
                headerText={`Action Details: ${selectedActionForDetails.title}`}
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
                                overflowY: 'auto'
                            }}>
                                {typeof parsedBody === 'string' ? parsedBody : JSON.stringify(parsedBody, null, 2)}
                            </div>
                        </div>
                    )}

                    <div style={{ marginBottom: '15px' }}>
                        <strong>Raw Action JSON:</strong>
                        <div style={{ 
                            backgroundColor: '#f5f5f5', 
                            padding: '8px', 
                            marginTop: '5px', 
                            borderRadius: '4px',
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            whiteSpace: 'pre-wrap',
                            maxHeight: '200px',
                            overflowY: 'auto'
                        }}>
                            {parsedActionData ? JSON.stringify(parsedActionData, null, 2) : selectedActionForDetails.actionJson}
                        </div>
                    </div>
                </div>
            </Panel>
        );
    }, [selectedActionForDetails, isPanelOpen, hideActionDetails]);
    const renderAction = useCallback((action: IActionModel) => {
        return <div className='App-Action-Row' title={action.url}>
            {props.showButton ?
                <Icon className='App-Action-Select' iconName='SingleBookmark' onClick={() => { props.changeSelectionFunc(action) }} title="Select Action To Copy"></Icon>
                :
                <Checkbox className='App-Action-Checkbox' checked={action.isSelected} defaultChecked={action.isSelected} onChange={() => { props.changeSelectionFunc(action) }}></Checkbox>}
            <img src={action.icon} className='App-Action-Icon' alt={action.title}></img>
            <span className='App-Action-Element'>{action.title}</span>
            <span className='App-Action-Element'>{action.method}</span>
            <Icon 
                className='App-Action-Info' 
                iconName='Info' 
                onClick={() => { showActionDetails(action) }} 
                title="Show Action Details"
            ></Icon>
            {props.toggleFavoriteFunc && (
                <Icon 
                    className='App-Action-Favorite' 
                    iconName={action.isFavorite ? 'FavoriteStarFill' : 'FavoriteStar'} 
                    onClick={() => { props.toggleFavoriteFunc!(action) }} 
                    title={action.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                ></Icon>
            )}
            <Icon className='App-Action-Delete' iconName='Delete' onClick={() => { props.deleteActionFunc(action) }}></Icon>
        </div>;
    }, [props, showActionDetails])

    const renderActions = useCallback(() => {
        return props.actions && props.actions.length > 0 && props.actions.map((action, index) => 
            <div key={action.id || index}>
                {renderAction(action)}
            </div>
        )
    }, [props.actions, renderAction])

    const renderHeader = useCallback(() => {
        const headerClassName = `App-Action-Header ${props.toggleFavoriteFunc ? 'App-Action-Header--with-favorite' : 'App-Action-Header--without-favorite'}`;
        return (
            <div className={headerClassName}>
            <span>Select</span>
            <span></span>
            <span>Title</span>
            <span>Method</span>
            <span>Info</span>
            {props.toggleFavoriteFunc && <span>Fav</span>}
            <span></span>
        </div>);
    }, [props.toggleFavoriteFunc])

    const renderSearch = useCallback(() => {
        return <div style={{ padding: '10px 20px', backgroundColor: '#f3f2f1' }}>
            <TextField
                placeholder="Search actions by title..."
                value={props.searchTerm}
                onChange={(event, newValue) => props.onSearchChange(newValue || '')}
                styles={{
                    root: { width: '100%' },
                    field: { fontSize: '14px' }
                }}
                iconProps={{ iconName: 'Search' }}
            />
        </div>;
    }, [props.searchTerm, props.onSearchChange])

    return <>
        <div>{renderHeader()}</div>
        <div>{renderSearch()}</div>
        <div className="App-Actions">{renderActions()}</div>
        {renderActionDetails()}
    </>;
}

export default ActionsList;