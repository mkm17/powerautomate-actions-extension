export interface IActionModel {
    id: string;
    url: string;
    icon: string;
    title: string;
    actionJson: string;
    method: string;
    isSelected?: boolean;
    body?: any;
    isFavorite?: boolean;
    category?: string;
}