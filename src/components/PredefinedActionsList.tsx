import { useCallback, useMemo, useState } from "react";
import { Icon, TextField, Panel, PanelType, Spinner, SpinnerSize, Checkbox, Dropdown, IDropdownOption } from "@fluentui/react";
import { IActionModel } from "../models";

export interface IPredefinedActionsListProps {
    actions: IActionModel[];
    isLoading: boolean;
    onRefresh?: () => void;
    changeSelectionFunc?: (action: IActionModel) => void;
    toggleFavoriteFunc?: (action: IActionModel) => void;
    searchTerm: string;
    onSearchChange: (searchTerm: string) => void;
}

const PredefinedActionsList: React.FC<IPredefinedActionsListProps> = (props) => {
    const [selectedActionForDetails, setSelectedActionForDetails] = useState<IActionModel | null>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    const categoryOptions: IDropdownOption[] = useMemo(() => {
        const categories = Array.from(new Set((props.actions || []).map(a => a.category || 'Unknown'))).sort((a, b) => a.localeCompare(b));
        const opts: IDropdownOption[] = [{ key: 'All', text: 'All' }, ...categories.map(c => ({ key: c, text: c }))];
        return opts;
    }, [props.actions]);

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
        return (
            <div className='App-Action-Row' key={action.id} title={action.url}>
                <Checkbox className='App-Action-Checkbox' checked={action.isSelected} defaultChecked={action.isSelected} onChange={() => { props.changeSelectionFunc?.(action) }}></Checkbox>
                <img src={action.icon} className='App-Action-Icon' alt={action.title}></img>
                <span className='App-Action-Element'>{action.title}</span>
                <span className='App-Action-Element'>{action.method}</span>
                <Icon 
                    className='App-Action-Info' 
                    iconName='Info' 
                    onClick={() => showActionDetails(action)}
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
                <div style={{ width: '30px' }}></div>
            </div>
        );
    }, [props, showActionDetails]);

    const filteredActions = useCallback(() => {
        let list = props.actions;
        if (selectedCategory && selectedCategory !== 'All') {
            list = list.filter(a => (a.category || 'Unknown') === selectedCategory);
        }
        if (!props.searchTerm || props.searchTerm.trim() === '') {
            return list;
        }
        return list.filter(action => action.title.toLowerCase().includes(props.searchTerm.toLowerCase()));
    }, [props.actions, props.searchTerm, selectedCategory])();

    const renderHeader = useCallback(() => {
        return (
            <div className='App-Action-Header' style={{ gridTemplateColumns: props.toggleFavoriteFunc ? '80px 30px 200px 60px 30px 30px 30px' : '80px 30px 200px 60px 30px 30px' }}>
                <span>Select</span>
                <span></span>
                <span>Title</span>
                <span>Method</span>
                <span>Info</span>
                {props.toggleFavoriteFunc && <span>Fav</span>}
                <span></span>
            </div>
        );
    }, [props.toggleFavoriteFunc]);

    const renderSearch = useCallback(() => {
        return (
            <div style={{ padding: '10px 20px', backgroundColor: '#f3f2f1', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <TextField
                    placeholder="Search actions by title..."
                    value={props.searchTerm}
                    onChange={(event, newValue) => props.onSearchChange(newValue || '')}
                    styles={{
                        root: { flex: 1 },
                        field: { fontSize: '14px' }
                    }}
                    iconProps={{ iconName: 'Search' }}
                />
                <Dropdown
                    selectedKey={selectedCategory}
                    options={categoryOptions}
                    onChange={(e, option) => setSelectedCategory((option?.key as string) || 'All')}
                    styles={{ dropdown: { width: 220 } }}
                    ariaLabel="Filter by category"
                />
                {props.onRefresh && (
                    <Icon
                        iconName="Refresh"
                        onClick={props.onRefresh}
                        title="Refresh predefined actions"
                        style={{ cursor: 'pointer', fontSize: '16px', color: '#107c10' }}
                    />
                )}
            </div>
        );
    }, [props.searchTerm, props.onSearchChange, props.onRefresh, selectedCategory, categoryOptions]);

    if (props.isLoading) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <Spinner size={SpinnerSize.medium} label="Loading predefined actions..." />
            </div>
        );
    }

    return (
        <>
            <div>{renderHeader()}</div>
            <div>{renderSearch()}</div>
            <div className="App-Actions">
                {filteredActions.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#605e5c' }}>
                        <Icon iconName="Info" style={{ fontSize: '24px', marginBottom: '10px' }} />
                        <div>No predefined actions available</div>
                    </div>
                ) : (
                    filteredActions.map((action) => renderAction(action))
                )}
            </div>
            {renderActionDetails()}
        </>
    );
};

export default PredefinedActionsList;
