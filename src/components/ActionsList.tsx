import { useCallback } from "react";
import { Checkbox, Icon, TextField } from "@fluentui/react";
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
    const renderAction = useCallback((action: IActionModel) => {
        return <div className='App-Action-Row' title={action.url}>
            {props.showButton ?
                <Icon className='App-Action-Select' iconName='SingleBookmark' onClick={() => { props.changeSelectionFunc(action) }} title="Select Action To Copy"></Icon>
                :
                <Checkbox className='App-Action-Checkbox' checked={action.isSelected} defaultChecked={action.isSelected} onChange={() => { props.changeSelectionFunc(action) }}></Checkbox>}
            <img src={action.icon} className='App-Action-Icon' alt={action.title}></img>
            <span className='App-Action-Element'>{action.title}</span>
            <span className='App-Action-Element'>{action.method}</span>
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
    }, [props])

    const renderActions = useCallback(() => {
        return props.actions && props.actions.length > 0 && props.actions.map((action, index) => 
            <div key={action.id || index}>
                {renderAction(action)}
            </div>
        )
    }, [props.actions, renderAction])

    const renderHeader = useCallback(() => {
        return <div className='App-Action-Header' style={{ gridTemplateColumns: props.toggleFavoriteFunc ? '80px 30px 200px 60px 75px 75px' : '80px 30px 200px 60px 75px 75px' }}>
            <span>Select</span>
            <span></span>
            <span>Title</span>
            <span>Method</span>
            {props.toggleFavoriteFunc && <span>Favorite</span>}
            <span></span>
        </div>;
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
    </>;
}

export default ActionsList;